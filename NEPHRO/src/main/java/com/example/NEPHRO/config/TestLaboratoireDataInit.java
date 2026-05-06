package com.example.NEPHRO.config;

import com.example.NEPHRO.Entities.TestLaboratoire;
import com.example.NEPHRO.Repository.TestLaboratoireRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Initialise le catalogue des examens labo au démarrage si la table est vide.
 * Contient les tests néphrologiques pédiatriques + standards.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TestLaboratoireDataInit implements ApplicationRunner {

    private final TestLaboratoireRepository repo;

    @Override
    public void run(ApplicationArguments args) {
        if (repo.count() > 0) return;

        log.info("Initialisation du catalogue tests_laboratoire…");

        List<TestLaboratoire> tests = List.of(
            // ── Fonction rénale ───────────────────────────────────────────
            build("CREATININEMIE",   "2160-0",   "Créatininémie",               "Biochimie",   "Sang",        "µmol/L",  4,  false),
            build("DFG_ESTIME",      "48642-3",  "DFG estimé (Schwartz/CKD-EPI)","Biochimie",  "Calculé",     "mL/min/1.73m²", 4, false),
            build("UREE",            "3094-0",   "Urée sanguine",               "Biochimie",   "Sang",        "mg/dL",   4,  false),
            build("ACIDE_URIQUE",    "3084-1",   "Acide urique",                "Biochimie",   "Sang",        "mg/dL",   4,  false),
            build("CYSTATINE_C",     "33914-3",  "Cystatine C",                 "Biochimie",   "Sang",        "mg/L",    8,  false),

            // ── Ionogramme ───────────────────────────────────────────────
            build("NATREMIE",        "2951-2",   "Natrémie (Na+)",              "Ionogramme",  "Sang",        "mEq/L",   4,  false),
            build("KALIEMIE",        "2823-3",   "Kaliémie (K+)",               "Ionogramme",  "Sang",        "mEq/L",   4,  false),
            build("CHLOREMIE",       "2075-0",   "Chlorémie (Cl-)",             "Ionogramme",  "Sang",        "mEq/L",   4,  false),
            build("BICARBONATES",    "1963-8",   "Bicarbonates (HCO3-)",        "Ionogramme",  "Sang",        "mEq/L",   4,  false),
            build("CALCEMIE",        "2000-8",   "Calcémie totale (Ca)",        "Ionogramme",  "Sang",        "mg/dL",   4,  false),
            build("MAGNESEMIE",      "2601-3",   "Magnésémie (Mg)",             "Ionogramme",  "Sang",        "mg/dL",   4,  false),
            build("PHOSPHOREMIE",    "2777-1",   "Phosphorémie (PO4)",          "Ionogramme",  "Sang",        "mg/dL",   4,  false),

            // ── Protéines / inflammation ───────────────────────────────
            build("PROTEINURIE",     "2888-6",   "Protéinurie (urine 24h)",     "Urines",      "Urine 24h",   "g/24h",   8,  false),
            build("MICROALBUMINURIE","14957-5",  "Microalbuminurie",            "Urines",      "Urine spot",  "mg/L",    8,  false),
            build("ALBUMINE",        "1751-7",   "Albuminémie",                 "Biochimie",   "Sang",        "g/L",     4,  false),
            build("PROTEINES_TOT",   "2885-2",   "Protéines totales",           "Biochimie",   "Sang",        "g/L",     4,  false),
            build("CRP",             "1988-5",   "CRP (Protéine C-réactive)",   "Inflammation","Sang",        "mg/L",    4,  false),

            // ── NFS / Hématologie ──────────────────────────────────────
            build("HEMOGLOBINE",     "718-7",    "Hémoglobine",                 "NFS",         "Sang",        "g/dL",    4,  false),
            build("HEMATOCRITE",     "20570-8",  "Hématocrite",                 "NFS",         "Sang",        "%",       4,  false),
            build("LEUCOCYTES",      "6690-2",   "Globules blancs (GB)",        "NFS",         "Sang",        "G/L",     4,  false),
            build("PLAQUETTES",      "777-3",    "Plaquettes",                  "NFS",         "Sang",        "G/L",     4,  false),
            build("CREATININE_URN",  "2161-8",   "Créatinine urinaire",         "Urines",      "Urine spot",  "µmol/L",  8,  false),

            // ── Bilan hépatique ────────────────────────────────────────
            build("ASAT",            "1920-8",   "ASAT (TGO)",                  "Bilan hépatique","Sang",     "U/L",     8,  false),
            build("ALAT",            "1742-6",   "ALAT (TGP)",                  "Bilan hépatique","Sang",     "U/L",     8,  false),
            build("GGT",             "2324-2",   "Gamma-GT",                    "Bilan hépatique","Sang",     "U/L",     8,  false),
            build("BILIRUBINE",      "1975-2",   "Bilirubine totale",           "Bilan hépatique","Sang",     "mg/dL",   8,  false),

            // ── Immunosuppresseurs / Greffe ───────────────────────────
            build("TACROLIMUS",      "35674-1",  "Tacrolimus (taux résiduel)",  "Greffe",      "Sang",        "ng/mL",   24, false),
            build("CYCLOSPORINE",    "3539-4",   "Ciclosporine (taux résiduel)","Greffe",      "Sang",        "ng/mL",   24, false),
            build("MMF",             "55723-4",  "Mycophénolate résiduel",      "Greffe",      "Sang",        "µg/mL",   24, false),

            // ── Glycémie / Lipides ────────────────────────────────────
            build("GLYCEMIE",        "2345-7",   "Glycémie à jeun",             "Métabolisme", "Sang",        "g/L",     4,  true),
            build("HBA1C",           "4548-4",   "HbA1c",                       "Métabolisme", "Sang",        "%",       24, false),
            build("CHOLESTEROL",     "2093-3",   "Cholestérol total",           "Lipides",     "Sang",        "g/L",     8,  true),
            build("LDL",             "2089-1",   "LDL-cholestérol",             "Lipides",     "Sang",        "g/L",     8,  true),
            build("HDL",             "2085-9",   "HDL-cholestérol",             "Lipides",     "Sang",        "g/L",     8,  true),
            build("TRIGLYCERIDES",   "2571-8",   "Triglycérides",               "Lipides",     "Sang",        "g/L",     8,  true),

            // ── Sérologies / Infectieux ───────────────────────────────
            build("CMV_IgG",         "22239-8",  "CMV IgG",                     "Sérologie",   "Sang",        "UI/mL",   48, false),
            build("CMV_IgM",         "24119-0",  "CMV IgM",                     "Sérologie",   "Sang",        "ratio",   48, false),
            build("BKV_PCR",         "72493-0",  "BK Virus (PCR urine)",        "Virologie",   "Urine",       "copies/mL",48,false),
            build("EBV_PCR",         "29300-3",  "EBV (PCR sang)",              "Virologie",   "Sang",        "copies/mL",48,false)
        );

        repo.saveAll(tests);
        log.info("{} tests labo initialisés.", tests.size());
    }

    private static TestLaboratoire build(
            String codeTest, String codeLoinc, String nomTest,
            String categorie, String typeEchantillon, String unite,
            int delaiH, boolean jeune) {
        return TestLaboratoire.builder()
                .codeTest(codeTest)
                .codeLoinc(codeLoinc)
                .nomTest(nomTest)
                .categorie(categorie)
                .typeEchantillon(typeEchantillon)
                .unite(unite)
                .delaiRenduHeures(delaiH)
                .necessiteJeune(jeune)
                .build();
    }
}
