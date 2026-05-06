#!/usr/bin/env python3
"""
Simple biological analysis agent (prototype).

Goals:
- Read results entered by the patient
- Evaluate each parameter (Low / Normal / High) with dynamic ranges (age, sex, pregnancy)
- Multi-parameter rules, inter-test consistency, critical alerts, temporal follow-up
- Generate textual analysis + conclusion + recommendations

Usage:
  python agent_analyse_labo.py --input patient_resultats.json

Optional JSON fields:
- patient: pregnancy (bool), antecedents (list of str), date_naissance, sexe
- units: { "glycemie_jeun": "mg/dL" } for automatic conversion to rule units
- history: list of { "date": "YYYY-MM-DD", "values": {...} } for trends
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, replace
from datetime import date
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class MetricRule:
    code: str
    label: str
    unit: str
    ref_min: Optional[float] = None
    ref_max: Optional[float] = None
    ref_text: str = ""


RULES: Dict[str, MetricRule] = {
    # Haematology — CBC
    "hb": MetricRule("hb", "Haemoglobin (Hb)", "g/dL", ref_min=12.0, ref_max=16.0, ref_text="12.0-16.0"),
    "gb": MetricRule("gb", "White blood cells (WBC)", "x10^3/uL", ref_min=4.0, ref_max=10.0, ref_text="4.0-10.0"),
    "neutrophiles": MetricRule(
        "neutrophiles", "Neutrophils", "x10^3/uL", ref_min=1.8, ref_max=7.7, ref_text="1.8-7.7"
    ),
    "lymphocytes": MetricRule(
        "lymphocytes", "Lymphocytes", "x10^3/uL", ref_min=1.0, ref_max=4.8, ref_text="1.0-4.8"
    ),
    "plaquettes": MetricRule("plaquettes", "Platelets", "x10^3/uL", ref_min=150, ref_max=400, ref_text="150-400"),
    "ht": MetricRule("ht", "Haematocrit (Hct)", "%", ref_min=36.0, ref_max=46.0, ref_text="36.0-46.0"),
    "vgm": MetricRule("vgm", "MCV", "fL", ref_min=80.0, ref_max=100.0, ref_text="80-100"),
    "crp": MetricRule("crp", "CRP", "mg/L", ref_max=5.0, ref_text="<5"),
    # Biochemistry
    "glycemie_jeun": MetricRule(
        "glycemie_jeun", "Fasting glucose", "mmol/L", ref_min=3.9, ref_max=6.1, ref_text="3.9-6.1"
    ),
    "hba1c": MetricRule("hba1c", "HbA1c", "%", ref_max=6.5, ref_text="<6.5"),
    "cholesterol_total": MetricRule("cholesterol_total", "Total cholesterol", "mmol/L", ref_max=5.2, ref_text="<5.2"),
    "ldl": MetricRule("ldl", "LDL cholesterol", "mmol/L", ref_max=3.4, ref_text="<3.4"),
    "hdl": MetricRule("hdl", "HDL cholesterol", "mmol/L", ref_min=1.2, ref_text=">1.2"),
    "triglycerides": MetricRule("triglycerides", "Triglycerides", "mmol/L", ref_max=1.7, ref_text="<1.7"),
    "potassium": MetricRule("potassium", "Potassium (K+)", "mmol/L", ref_min=3.5, ref_max=5.1, ref_text="3.5-5.1"),
    "bilirubine_totale": MetricRule(
        "bilirubine_totale", "Total bilirubin", "umol/L", ref_max=21.0, ref_text="<21"
    ),
    "alat": MetricRule("alat", "ALT", "U/L", ref_max=40.0, ref_text="<40"),
    "asat": MetricRule("asat", "AST", "U/L", ref_max=40.0, ref_text="<40"),
    # Thyroid + renal
    "tsh": MetricRule("tsh", "TSH", "mUI/L", ref_min=0.4, ref_max=4.0, ref_text="0.4-4.0"),
    "ft4": MetricRule("ft4", "FT4", "pmol/L", ref_min=12.0, ref_max=22.0, ref_text="12-22"),
    "creatinine": MetricRule("creatinine", "Creatinine", "umol/L", ref_min=53, ref_max=97, ref_text="53-97"),
    "uree": MetricRule("uree", "Urea", "mmol/L", ref_min=2.5, ref_max=7.5, ref_text="2.5-7.5"),
}

# Always display these codes; others (CRP, neutrophils, etc.) only if entered.
DEFAULT_PANEL: frozenset = frozenset(
    {
        "hb",
        "gb",
        "plaquettes",
        "ht",
        "glycemie_jeun",
        "cholesterol_total",
        "ldl",
        "hdl",
        "triglycerides",
        "tsh",
        "creatinine",
        "uree",
    }
)


def raw_has_metric(raw_values: Dict, code: str) -> bool:
    for k in raw_values:
        nk = normalize_test_code(str(k))
        if nk == code or str(k) == code:
            return True
    return False


# Normalise labels / synonyms for multi-lab merging
CODE_ALIASES: Dict[str, str] = {
    "hemoglobine": "hb",
    "hemoglobin": "hb",
    "wbc": "gb",
    "leucocytes": "gb",
    "leucocyte": "gb",
    "neutrophiles_abs": "neutrophiles",
    "crp_us": "crp",
    "glycemie": "glycemie_jeun",
    "glucose": "glycemie_jeun",
    "hba1c_pct": "hba1c",
    "potassium_serique": "potassium",
    "k": "potassium",
    "alt": "alat",
    "gpt": "alat",
    "ast": "asat",
    "got": "asat",
}


def normalize_test_code(raw: str) -> str:
    k = re.sub(r"\s+", "_", raw.strip().lower())
    k = re.sub(r"[^a-z0-9_]", "", k)
    return CODE_ALIASES.get(k, k)


def merge_lab_reports(
    reports: List[Dict[str, Any]],
    prefer_latest_date: bool = True,
) -> Dict[str, Any]:
    """
    Merge several blocks { patient?, date?, values?, source? }.
    On duplicate code, keep the value from the most recent report when dates are present.
    """
    merged_values: Dict[str, Any] = {}
    meta_dates: Dict[str, Optional[str]] = {}

    def parse_d(s: Optional[str]) -> Optional[date]:
        if not s:
            return None
        try:
            parts = str(s)[:10].split("-")
            return date(int(parts[0]), int(parts[1]), int(parts[2]))
        except Exception:
            return None

    indexed: List[Tuple[Optional[date], Dict[str, Any]]] = []
    for r in reports:
        d = parse_d(r.get("date"))
        indexed.append((d, r))

    if prefer_latest_date:
        indexed.sort(key=lambda x: (x[0] is None, x[0] or date.min))

    for _d, r in indexed:
        vals = r.get("values") or {}
        for key, val in vals.items():
            nk = normalize_test_code(str(key))
            code = nk if nk in RULES else (str(key) if str(key) in RULES else nk)
            merged_values[code] = val
            meta_dates[code] = r.get("date")

    return {"values": merged_values, "per_code_date": meta_dates}


def parse_float(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(str(value).replace(",", ".").strip())
    except Exception:
        return None


def patient_age_years(patient: Dict) -> Optional[int]:
    dn = patient.get("date_naissance")
    if not dn:
        return None
    try:
        parts = str(dn)[:10].split("-")
        y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
        today = date.today()
        age = today.year - y - ((today.month, today.day) < (m, d))
        return max(0, age)
    except Exception:
        return None


def effective_rule(rule: MetricRule, patient: Dict) -> MetricRule:
    """Adjust thresholds by sex, pregnancy (simplified rules — validate clinically)."""
    sexe = (patient.get("sexe") or "").strip().upper()
    grossesse = bool(patient.get("grossesse"))
    age_y = patient_age_years(patient)

    r = rule
    if rule.code == "hb":
        if sexe == "M":
            r = replace(r, ref_min=13.0, ref_max=17.0, ref_text="13.0-17.0 (M)")
        elif sexe == "F":
            r = replace(r, ref_min=12.0, ref_max=16.0, ref_text="12.0-16.0 (F)")
        if grossesse:
            r = replace(r, ref_min=11.0, ref_max=r.ref_max, ref_text=f"{r.ref_text}; pregnancy: lower limit relaxed")
    if rule.code == "creatinine" and grossesse:
        r = replace(r, ref_max=110.0, ref_text=f"{r.ref_text}; pregnancy: upper limit widened")
    if rule.code == "tsh" and grossesse:
        r = replace(r, ref_min=0.1, ref_max=2.5, ref_text="0.1-2.5 (pregnancy, 1st trim. approx.)")
    if rule.code == "hba1c" and age_y is not None and age_y >= 75:
        r = replace(r, ref_max=7.5, ref_text="<7.5 (elderly, relaxed target)")

    return r


def classify(rule: MetricRule, value: Optional[float]) -> str:
    if value is None:
        return "Not reported"
    if rule.ref_min is not None and value < rule.ref_min:
        return "Low"
    if rule.ref_max is not None and value > rule.ref_max:
        return "High"
    return "Normal"


def human_line(rule: MetricRule, value: Optional[float], status: str) -> str:
    if value is None:
        return f"- {rule.label}: not reported."
    return f"- {rule.label}: {value:g} {rule.unit} (ref {rule.ref_text}) -> {status}."


def convert_glucose_to_mmol(value: float, unit: str) -> Tuple[float, str]:
    u = unit.strip().lower()
    if u in ("mmol/l", "mmol"):
        return value, "mmol/L"
    if u in ("mg/dl", "mg/dl.", "mg"):
        return round(value / 18.0, 3), "mg/dL->mmol/L"
    return value, "unknown"


def apply_unit_overrides(values: Dict, units: Optional[Dict]) -> Tuple[Dict[str, float], List[str]]:
    """Return numeric values with fasting glucose normalised to mmol/L when indicated."""
    out: Dict[str, float] = {}
    notes: List[str] = []
    units = units or {}
    for k, v in values.items():
        pf = parse_float(v)
        if pf is None:
            continue
        nk = normalize_test_code(str(k))
        code = nk if nk in RULES else (str(k) if str(k) in RULES else nk)

        if code == "glycemie_jeun" or nk == "glycemie_jeun":
            u = units.get(k) or units.get("glycemie_jeun") or ""
            if u:
                conv, note = convert_glucose_to_mmol(pf, u)
                out["glycemie_jeun"] = conv
                if "mg/dL" in note:
                    notes.append(f"glycemie_jeun: {note} ({pf} -> {conv} mmol/L)")
            elif pf > 30:
                conv, note = convert_glucose_to_mmol(pf, "mg/dL")
                out["glycemie_jeun"] = conv
                notes.append(
                    f"glycemie_jeun: high value ({pf}) interpreted as mg/dL -> {conv} mmol/L (confirm)"
                )
            else:
                out["glycemie_jeun"] = pf
            continue

        if code in RULES:
            out[code] = pf
        else:
            out[str(k)] = pf
    return out, notes


def detect_multi_param_patterns(v: Dict[str, float]) -> List[Dict[str, Any]]:
    patterns: List[Dict[str, Any]] = []
    crp = v.get("crp")
    gb = v.get("gb")
    neu = v.get("neutrophiles")
    if crp is not None and crp > 5 and gb is not None and gb > 10 and neu is not None and neu > 7.5:
        patterns.append(
            {
                "id": "likely_infectious_inflammation",
                "gravite": "moderate",
                "message": (
                    "Raised CRP with leucocytosis and neutrophilia: pattern consistent with "
                    "inflammation/infection (correlate clinically)."
                ),
            }
        )
    alat, asat = v.get("alat"), v.get("asat")
    bili = v.get("bilirubine_totale")
    if bili is not None and bili > 21 and (
        (alat is not None and alat > 40) or (asat is not None and asat > 40)
    ):
        patterns.append(
            {
                "id": "cholestasis_or_hepatitis_to_correlate",
                "gravite": "moderate",
                "message": (
                    "Raised bilirubin with hepatic cytolysis (ALT/AST): hepatocellular injury or "
                    "cholestasis to be clarified."
                ),
            }
        )
    elif bili is not None and bili > 21:
        patterns.append(
            {
                "id": "isolated_hyperbilirubinaemia",
                "gravite": "low",
                "message": "Raised bilirubin: correlate with ALT/AST and liver work-up.",
            }
        )
    crea, uree = v.get("creatinine"), v.get("uree")
    if crea is not None and crea > 97 and uree is not None and uree > 7.5:
        patterns.append(
            {
                "id": "possible_renal_impairment",
                "gravite": "high",
                "message": (
                    "Raised creatinine and urea: possible renal impairment; electrolytes and eGFR recommended."
                ),
            }
        )
    return patterns


def preanalytical_flags(v: Dict[str, float]) -> List[Dict[str, Any]]:
    flags: List[Dict[str, Any]] = []
    if v.get("hb") is not None and (v["hb"] < 3 or v["hb"] > 22):
        flags.append(
            {
                "code": "hb_plausible",
                "message": "Haemoglobin outside a biologically plausible range: check unit/entry.",
            }
        )
    if v.get("creatinine") is not None and v["creatinine"] > 2000:
        flags.append(
            {
                "code": "creatinine_extreme",
                "message": "Very high creatinine: check unit (µmol/L vs mg/dL) and sample.",
            }
        )
    if v.get("glycemie_jeun") is not None and v["glycemie_jeun"] > 55:
        flags.append(
            {
                "code": "glycemie_unite",
                "message": "Very high fasting glucose in mmol/L: confirm unit (mg/dL possible).",
            }
        )
    return flags


def inter_test_consistency(v: Dict[str, float]) -> List[Dict[str, Any]]:
    warn: List[Dict[str, Any]] = []
    g = v.get("glycemie_jeun")
    a1c = v.get("hba1c")
    if g is not None and a1c is not None:
        if a1c > 8 and g < 6.1:
            warn.append(
                {
                    "id": "hba1c_glucose_mismatch",
                    "message": (
                        "Very high HbA1c with normal fasting glucose: reconcile results "
                        "(glycaemic variability, error, or timing)."
                    ),
                }
            )
    tsh = v.get("tsh")
    ft4 = v.get("ft4")
    if tsh is not None and ft4 is not None:
        if tsh > 4.5 and ft4 is not None and ft4 > 22:
            warn.append(
                {
                    "id": "tsh_ft4_inconsistent",
                    "message": (
                        "High TSH and high FT4: inconsistency; check drugs, pregnancy, or repeat testing."
                    ),
                }
            )
    return warn


def critical_alerts(v: Dict[str, float]) -> List[Dict[str, Any]]:
    alerts: List[Dict[str, Any]] = []
    k = v.get("potassium")
    if k is not None:
        if k < 2.8:
            alerts.append(
                {"param": "potassium", "niveau": "critical_low", "message": f"Very low K+ ({k}): potential emergency."}
            )
        elif k > 6.5:
            alerts.append(
                {"param": "potassium", "niveau": "critical_high", "message": f"Very high K+ ({k}): potential emergency."}
            )
    g = v.get("glycemie_jeun")
    if g is not None:
        if g < 2.8:
            alerts.append(
                {
                    "param": "glycemie_jeun",
                    "niveau": "critical_low",
                    "message": f"Possible severe hypoglycaemia ({g} mmol/L).",
                }
            )
        if g > 33.0:
            alerts.append(
                {
                    "param": "glycemie_jeun",
                    "niveau": "critical_high",
                    "message": f"Extreme hyperglycaemia ({g} mmol/L): check entry/unit.",
                }
            )
    return alerts


def suggest_complementary_tests(v: Dict[str, float], abnormal_codes: set) -> List[str]:
    sug: List[str] = []
    if "tsh" in abnormal_codes or (v.get("tsh") is not None and (v["tsh"] < 0.4 or v["tsh"] > 4.0)):
        sug.append("Abnormal TSH: add FT4 (and FT3 if indicated).")
    if v.get("vgm") is not None and v["vgm"] < 80 and (v.get("hb") is not None and v["hb"] < 12):
        sug.append("Microcytosis with anaemia: ferritin, transferrin saturation, CRP to explore iron deficiency.")
    if v.get("crp") is not None and v["crp"] > 30:
        sug.append("Very high CRP: blood cultures / infection work-up per clinical context.")
    if "glycemie_jeun" in abnormal_codes and v.get("hba1c") is None:
        sug.append("Altered glucose: HbA1c for overall glycaemic assessment.")
    if "creatinine" in abnormal_codes or "uree" in abnormal_codes:
        sug.append("Impaired renal function: electrolytes (Na, K, Cl), estimated eGFR.")
    return list(dict.fromkeys(sug))


def temporal_analysis(
    current: Dict[str, float],
    history: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    if not history:
        return None
    last = history[-1]
    prev_vals = last.get("values") or {}
    prev_parsed, _ = apply_unit_overrides(prev_vals, None)
    trends: List[Dict[str, Any]] = []
    for code in set(current) & set(prev_parsed):
        a, b = current[code], prev_parsed[code]
        if a is None or b is None:
            continue
        delta = a - b
        rel = abs(delta / b) if b != 0 else 0
        if rel < 0.05:
            t = "stable"
        elif delta > 0:
            t = "increase"
        else:
            t = "decrease"
        flag = None
        if rel > 0.25:
            flag = "rapid_change"
        trends.append(
            {
                "code": code,
                "before": b,
                "after": a,
                "tendance": t,
                "delta": round(delta, 4),
                "alerte": flag,
            }
        )
    return {"date_reference": last.get("date"), "par_parametre": trends}


def clinical_risk_global(
    abnormalities_count: int,
    patterns: List[Dict],
    critical: List[Dict],
    consistency: List[Dict],
) -> Tuple[int, str]:
    score = min(100, abnormalities_count * 12 + len(patterns) * 15 + len(critical) * 35 + len(consistency) * 8)
    if critical:
        score = max(score, 75)
    if score < 30:
        lvl = "low"
    elif score < 60:
        lvl = "moderate"
    else:
        lvl = "high"
    return score, lvl


def build_interpretation_assisted(
    v: Dict[str, float],
    patterns: List[Dict],
    consistency: List[Dict],
) -> str:
    parts: List[str] = []
    for p in patterns[:4]:
        parts.append(p.get("message", ""))
    bili = v.get("bilirubine_totale")
    if bili is not None and bili > 21:
        parts.append(
            "Raised bilirubin: possible liver involvement or haemolysis; correlate with ALT/AST and CBC."
        )
    for c in consistency[:2]:
        parts.append(c.get("message", ""))
    return " ".join(x for x in parts if x).strip() or "No additional automatic summary."


def _statut_fr_pro(status: str) -> str:
    """Libellé statut pour conclusion à l'usage des prescripteurs."""
    s = (status or "").strip().lower()
    if s == "low":
        return "bas"
    if s == "high":
        return "élevé"
    if s == "normal":
        return "dans la norme"
    if s == "not reported":
        return "non renseigné"
    return status or "—"


class LabAnalysisAgent:
    def analyze(self, payload: Dict) -> Dict:
        patient = payload.get("patient", {})
        raw_values = payload.get("values", {})
        units = payload.get("units")
        history = payload.get("history") or []

        values_parsed, unit_notes = apply_unit_overrides(raw_values, units)

        rows: List[Dict] = []
        abnormalities: List[Tuple[MetricRule, float, str]] = []
        normals: List[MetricRule] = []
        missing: List[MetricRule] = []
        abnormal_codes: set = set()

        for key, rule in RULES.items():
            er = effective_rule(rule, patient)
            val = values_parsed.get(key)
            if val is None:
                val = parse_float(raw_values.get(key))
            if val is None and key not in DEFAULT_PANEL and not raw_has_metric(raw_values, key):
                continue
            status = classify(er, val)
            rows.append(
                {
                    "code": er.code,
                    "analyse": er.label,
                    "resultat": None if val is None else val,
                    "unite": er.unit,
                    "reference": er.ref_text,
                    "statut": status,
                }
            )
            if val is None:
                missing.append(er)
            elif status == "Normal":
                normals.append(er)
            else:
                abnormalities.append((er, val, status))
                abnormal_codes.add(er.code)

        analysis_lines = []
        analysis_lines.append("Summary of laboratory results:")
        for row in rows:
            rule = RULES[row["code"]]
            er = effective_rule(rule, patient)
            analysis_lines.append(human_line(er, row["resultat"], row["statut"]))

        patterns = detect_multi_param_patterns(values_parsed)
        pre_flags = preanalytical_flags(values_parsed)
        consistency = inter_test_consistency(values_parsed)
        crit = critical_alerts(values_parsed)
        suggested = suggest_complementary_tests(values_parsed, abnormal_codes)
        temporal = temporal_analysis(values_parsed, history if isinstance(history, list) else [])
        risk_score, risk_from_advanced = clinical_risk_global(
            len(abnormalities), patterns, crit, consistency
        )
        interpretation = build_interpretation_assisted(values_parsed, patterns, consistency)

        if not abnormalities and not patterns and not crit:
            conclusion = (
                "SYNTHESE — À l'examen des paramètres intégrés au moteur de règles, aucune anomalie "
                "biologique majeure n'est mise en évidence par rapport aux seuils de référence utilisés. "
                "PARAMETRES — Les mesures analysées sont classées dans la norme pour les codes pris en charge. "
                "CLOTURE — Interprétation à corréler au contexte clinique, aux traitements et au suivi habituel du patient."
            )
            recommendations = [
                "Poursuivre le suivi clinique et biologique selon les habitudes du prescripteur.",
                "Renouveler les analyses selon l'indication médicale.",
            ]
            risk_level = "low"
        else:
            risk_level = risk_from_advanced if crit or len(patterns) >= 2 else (
                "moderate" if len(abnormalities) <= 2 and risk_score < 60 else "high"
            )
            if len(abnormalities) <= 2 and not crit and risk_level == "high":
                risk_level = "moderate"
            focus = ", ".join(
                [f"{r.label} ({_statut_fr_pro(s)})" for r, _v, s in abnormalities[:6]]
            )
            if abnormalities:
                conclusion = (
                    f"SYNTHESE — Bilan biologique comportant {len(abnormalities)} anomalie(s) quantitative(s) "
                    f"par rapport aux références intégrées. "
                    f"PARAMETRES — Détails (statut par rapport à la référence) : {focus}. "
                    f"INTERPRETATION — À corréler aux données cliniques et à l'objectif thérapeutique. "
                    f"CLOTURE — Décision médicale et conduite à tenir à adapter en consultation."
                )
            else:
                extras = []
                if patterns:
                    extras.append("cohérence multi-paramètres : " + "; ".join(p["id"] for p in patterns[:4]))
                if crit:
                    extras.append("alertes critiques à vérifier")
                conclusion = (
                    "SYNTHESE — Pas de franchissement isolé des seuils pour les paramètres pris en charge, "
                    "mais éléments à intégrer au jugement clinique. "
                    f"PARAMETRES / COHERENCE — {', '.join(extras) if extras else 'Analyse à corréler cliniquement.'} "
                    "CLOTURE — Interprétation réservée au prescripteur au vu du dossier complet."
                )
            recommendations = [
                "Confirmer les anomalies par un contrôle biologique si indiqué cliniquement.",
                "Interpréter au regard des symptômes, de l'examen clinique et des traitements en cours.",
                "Recommandations générales à valider par le médecin traitant ou spécialiste.",
            ]
            abnormal_codes_set = {r.code for r, _v, _s in abnormalities}
            if "hb" in abnormal_codes_set or "ht" in abnormal_codes_set:
                recommendations.append(
                    "Possible anaemia (low Hb/Hct): request iron panel (iron, ferritin, CRP) and repeat CBC."
                )
                recommendations.append(
                    "If deficiency confirmed, treatment may include iron (and folate/B12 as needed) on medical advice."
                )
                recommendations.append(
                    "Nutrition: iron-rich foods (lean meat, pulses, greens) + vitamin C; limit tea/coffee with meals."
                )
            if "glycemie_jeun" in abnormal_codes_set:
                recommendations.append(
                    "Raised fasting glucose: add HbA1c, repeat fasting sample, and metabolic assessment."
                )
                recommendations.append(
                    "Possible treatment per work-up: lifestyle measures, then antidiabetics (e.g. metformin/insulin) "
                    "only on prescription."
                )
                recommendations.append(
                    "Diet: reduce refined sugars/sweet drinks; favour fibre, vegetables, lean protein, low glycaemic load."
                )
            if "ldl" in abnormal_codes_set or "cholesterol_total" in abnormal_codes_set:
                recommendations.append(
                    "Dyslipidaemia (raised LDL/total cholesterol): cardiovascular review and repeat lipid profile."
                )
                recommendations.append(
                    "Possible treatment by overall risk: lipid-lowering drugs (e.g. statins) only after medical review."
                )
                recommendations.append(
                    "Diet: limit saturated/trans fats and refined sugar; increase fibre, olive oil, oily fish."
                )
            if "creatinine" in abnormal_codes_set or "uree" in abnormal_codes_set:
                recommendations.append(
                    "Possible impaired renal function (creatinine/urea): monitor eGFR, electrolytes, hydration."
                )
                recommendations.append(
                    "Possible actions: adjust nephrotoxic drugs, correct fluid/electrolytes, nephrology follow-up."
                )
                recommendations.append(
                    "Renal diet: adjust salt/protein/potassium per nephrologist instructions."
                )

        for s in suggested:
            if s not in recommendations:
                recommendations.append(s)

        prediction_heuristic = {
            "infection_severe_score": round(
                min(
                    100.0,
                    (values_parsed.get("crp") or 0) / 2 + (values_parsed.get("gb") or 0) * 3,
                ),
                1,
            ),
            "insuffisance_renale_risque": (
                "high"
                if (values_parsed.get("creatinine") or 0) > 150
                else "moderate"
                if (values_parsed.get("creatinine") or 0) > 97
                else "low"
            ),
            "note": "Simple heuristic (not clinical AI); does not replace medical advice.",
        }

        return {
            "patient": {
                "id": patient.get("id"),
                "nom": patient.get("nom"),
                "prenom": patient.get("prenom"),
                "date_naissance": patient.get("date_naissance"),
                "sexe": patient.get("sexe"),
                "age_estime": patient_age_years(patient),
                "grossesse": patient.get("grossesse"),
                "antecedents": patient.get("antecedents"),
            },
            "risk_level": risk_level,
            "risk_score": risk_score,
            "rows": rows,
            "analysis_text": "\n".join(analysis_lines),
            "interpretation_assisted": interpretation,
            "conclusion": conclusion,
            "recommendations": recommendations,
            "stats": {
                "abnormal_count": len(abnormalities),
                "normal_count": len(normals),
                "missing_count": len(missing),
            },
            "advanced": {
                "multi_param_patterns": patterns,
                "preanalytical_flags": pre_flags,
                "consistency_warnings": consistency,
                "critical_alerts": crit,
                "suggested_tests": suggested,
                "unit_notes": unit_notes,
                "temporal": temporal,
                "prediction_heuristic": prediction_heuristic,
                "merge_helper": "Use merge_lab_reports([{date, values}, ...]) to pre-merge multiple lab sources.",
            },
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Automatic laboratory work-up analysis agent.")
    parser.add_argument("--input", required=True, help="Path to input JSON.")
    parser.add_argument("--output", default="", help="Optional output JSON path.")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        payload = json.load(f)

    agent = LabAnalysisAgent()
    result = agent.analyze(payload)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Analysis written: {args.output}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
