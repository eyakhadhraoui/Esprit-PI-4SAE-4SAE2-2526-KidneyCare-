package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.*;
import com.example.NEPHRO.Enum.*;
import com.example.NEPHRO.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Module 4 : Prescription → Résultats labo → Interprétation automatique → Validation → Rapport → Famille.
 * - interpreterAutomatique : compare aux normes pédiatriques (âge, sexe) → NORMAL / ÉLEVÉ / BAS / CRITIQUE.
 * - calculerDFGEstime : formule de Schwartz (néphro pédiatrique).
 * - declencherAlertesCritiques : hyperkaliémie, DFG &lt; 30, protéinurie, hyponatrémie.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ModuleLaboService {

    private final PrescriptionBilanRepository prescriptionBilanRepository;
    private final ResultatLabtestRepository resultatLabtestRepository;
    private final NormePediatriqueLaboRepository normePediatriqueLaboRepository;
    private final RapportBilanRepository rapportBilanRepository;
    private final AlerteLaboRepository alerteLaboRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    private final NotificationMedecinService notificationMedecinService;
    private final NotificationWebSocketService notificationWebSocketService;

    // ——— Constantes formule de Schwartz (k selon âge) ———
    private static final double K_PREMATURE = 0.33;
    private static final double K_NOURRISSON = 0.45;
    private static final double K_ENFANT = 0.55;
    private static final double K_ADO_GARCON = 0.70;
    private static final double K_ADO_FILLE = 0.55;

    // ——— Seuils alertes critiques (si pas de norme en base) ———
    private static final double SEUIL_KALIEMIE_HAUT = 6.5;   // mmol/L
    /** Au-dessus : alerte préventive (patient + médecin) si ≤ seuil critique. */
    private static final double SEUIL_K_PREVENTIF = 5.5;
    private static final double SEUIL_DFG_BAS = 30;          // mL/min/1.73m²
    private static final double SEUIL_PROTEINURIE_HAUT = 3;   // g/g
    private static final double SEUIL_NATREMIE_BAS = 125;    // mmol/L

    private static final String LOINC_CREATININE_TENDANCE = "2160-0";
    private static final String LOINC_UREE_TENDANCE = "3094-0";
    private static final Set<String> LOINC_DFG_TENDANCE = Set.of(
            "48642-3", "33914-3", "62238-1", "77147-7", "50044-7", "76633-7"
    );

    /**
     * Interprétation automatique d'un résultat : recherche des normes (âge en mois, sexe), classe en NORMAL / ELEVE / BAS / CRITIQUE_HAUT / CRITIQUE_BAS.
     */
    @Transactional
    public ResultatLabtest interpreterAutomatique(Long resultatId, int ageMois, SexeNorme sexe) {
        ResultatLabtest r = resultatLabtestRepository.findById(resultatId)
                .orElseThrow(() -> new RuntimeException("Résultat labtest non trouvé: " + resultatId));
        if (r.getValeur() == null) return r;

        List<NormePediatriqueLabo> normes = normePediatriqueLaboRepository.findApplicable(r.getCodeLoinc(), ageMois, sexe);
        if (normes.isEmpty()) {
            r.setStatutInterpretation(StatutInterpretation.NORMAL);
            return resultatLabtestRepository.save(r);
        }
        NormePediatriqueLabo norme = normes.get(0);
        BigDecimal v = r.getValeur();
        StatutInterpretation statut = StatutInterpretation.NORMAL;

        if (norme.getSeuilCritiqueBas() != null && v.compareTo(norme.getSeuilCritiqueBas()) < 0) {
            statut = StatutInterpretation.CRITIQUE_BAS;
        } else if (norme.getSeuilCritiqueHaut() != null && v.compareTo(norme.getSeuilCritiqueHaut()) > 0) {
            statut = StatutInterpretation.CRITIQUE_HAUT;
        } else if (norme.getValeurMinNormale() != null && v.compareTo(norme.getValeurMinNormale()) < 0) {
            statut = StatutInterpretation.BAS;
        } else if (norme.getValeurMaxNormale() != null && v.compareTo(norme.getValeurMaxNormale()) > 0) {
            statut = StatutInterpretation.ELEVE;
        }
        r.setStatutInterpretation(statut);
        return resultatLabtestRepository.save(r);
    }

    /**
     * Formule de Schwartz : DFG (mL/min/1.73m²) = (k × taille cm) / créatinine µmol/L.
     * k : 0.33 prématuré, 0.45 nourrisson, 0.55 enfant, 0.70 ado garçon, 0.55 ado fille.
     */
    public BigDecimal calculerDFGEstime(BigDecimal tailleCm, BigDecimal creatinineUmolL, int ageMois, boolean garcon) {
        if (tailleCm == null || creatinineUmolL == null || creatinineUmolL.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        double k;
        if (ageMois < 12) k = ageMois < 3 ? K_PREMATURE : K_NOURRISSON;
        else if (ageMois < 180) k = K_ENFANT; // < 15 ans
        else k = garcon ? K_ADO_GARCON : K_ADO_FILLE;
        BigDecimal dfg = tailleCm.multiply(BigDecimal.valueOf(k)).divide(creatinineUmolL, 2, RoundingMode.HALF_UP);
        return dfg;
    }

    /**
     * Déclenche les alertes : K+ &gt; 6,5 (critique) ou 5,5–6,5 (préventif), DFG &lt; 30, protéinurie, hyponatrémie.
     * Notifie le patient en WebSocket (STOMP) et le médecin.
     */
    @Transactional
    public void declencherAlertesCritiques(ResultatLabtest resultat) {
        if (resultat == null || resultat.getValeur() == null) return;
        String codeRaw = resultat.getCodeLoinc() != null ? resultat.getCodeLoinc() : "";
        String code = codeRaw.toUpperCase(Locale.ROOT);
        BigDecimal v = resultat.getValeur();
        String msg = null;
        TypeAlerteLabo type = TypeAlerteLabo.CRITIQUE;
        String titreMedecin = null;

        if (estExamenPotassium(code, resultat)) {
            double vd = v.doubleValue();
            if (vd > SEUIL_KALIEMIE_HAUT) {
                msg = "Kaliémie critique : " + v + " mmol/L — risque arythmie";
                type = TypeAlerteLabo.CRITIQUE;
            } else if (vd > SEUIL_K_PREVENTIF) {
                msg = "Kaliémie élevée : " + v + " mmol/L — surveillance (hyperkaliémie modérée)";
                type = TypeAlerteLabo.AVERTISSEMENT;
                titreMedecin = "Surveillance — kaliémie";
            }
        } else if (code.contains("DFG") || "33914-3".equalsIgnoreCase(codeRaw) || "DFG".equalsIgnoreCase(resultat.getLibelleExamen())) {
            if (v.doubleValue() < SEUIL_DFG_BAS) {
                msg = "DFG critique : " + v + " mL/min/1.73m² — insuffisance rénale sévère";
            }
        } else if (code.contains("PROTEIN") || "2888-6".equalsIgnoreCase(codeRaw) || "PROTEINURIE".equalsIgnoreCase(resultat.getLibelleExamen())) {
            if (v.doubleValue() > SEUIL_PROTEINURIE_HAUT) {
                msg = "Protéinurie critique : " + v + " g/g";
            }
        } else if (code.contains("NA") || "2951-2".equalsIgnoreCase(codeRaw) || "NATREMIE".equalsIgnoreCase(resultat.getLibelleExamen())) {
            if (v.doubleValue() < SEUIL_NATREMIE_BAS) {
                msg = "Hyponatrémie critique : " + v + " mmol/L";
            }
        }

        if (msg != null) {
            AlerteLabo alerte = AlerteLabo.builder()
                    .resultatId(resultat.getId())
                    .typeAlerte(type)
                    .message(msg)
                    .build();
            alerteLaboRepository.save(alerte);
            notifierMedecinAlerteLabo(resultat.getDossierId(), resultat.getId(), msg, titreMedecin);
            notifierPatientAlerteLabo(resultat.getDossierId(), resultat.getId(), type, msg);
        }
    }

    /**
     * Si la saisie patient n’a pas généré de {@link ResultatLabtest} (pas de prescription correspondante),
     * on notifie quand même kaliémie critique / préventive.
     */
    @Transactional
    public void notifierKaliemieDepuisSaisiePatient(double mmolL, Long dossierMedicalId, Long idResultatLaboratoire) {
        if (dossierMedicalId == null || mmolL <= SEUIL_K_PREVENTIF) return;
        String msg;
        TypeAlerteLabo type;
        String titreMedecin = null;
        if (mmolL > SEUIL_KALIEMIE_HAUT) {
            msg = "Kaliémie critique : " + mmolL + " mmol/L — risque arythmie";
            type = TypeAlerteLabo.CRITIQUE;
        } else {
            msg = "Kaliémie élevée : " + mmolL + " mmol/L — surveillance (hyperkaliémie modérée)";
            type = TypeAlerteLabo.AVERTISSEMENT;
            titreMedecin = "Surveillance — kaliémie";
        }
        Optional<DossierMedical> dossierOpt = dossierMedicalRepository.findById(dossierMedicalId);
        if (dossierOpt.isEmpty() || dossierOpt.get().getIdMedecin() == null) return;
        String nomPatient = "";
        if (dossierOpt.get().getIdPatient() != null) {
            Optional<Patient> pOpt = patientRepository.findById(dossierOpt.get().getIdPatient());
            if (pOpt.isPresent()) {
                Patient p = pOpt.get();
                nomPatient = (p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "").trim();
            }
        }
        notificationMedecinService.creerPourAlerteLabo(
                dossierOpt.get().getIdMedecin(), dossierMedicalId, idResultatLaboratoire, nomPatient, titreMedecin, msg);
        notifierPatientAlerteLabo(dossierMedicalId, idResultatLaboratoire, type, msg);
    }

    private static boolean estExamenPotassium(String codeUpper, ResultatLabtest r) {
        String lib = r.getLibelleExamen() != null ? r.getLibelleExamen().toLowerCase(Locale.FRENCH) : "";
        return codeUpper.contains("K")
                || "2823-3".equalsIgnoreCase(r.getCodeLoinc())
                || lib.contains("kali")
                || lib.contains("potassium");
    }

    private void notifierPatientAlerteLabo(Long dossierId, Long idItemPourUi, TypeAlerteLabo type, String msg) {
        Optional<DossierMedical> dOpt = dossierMedicalRepository.findById(dossierId);
        if (dOpt.isEmpty() || dOpt.get().getIdPatient() == null) return;
        Long idPatient = dOpt.get().getIdPatient();
        if (type == TypeAlerteLabo.AVERTISSEMENT && msg != null && msg.contains("Kaliémie")) {
            notificationWebSocketService.notifyPatientAlerteBiologie(
                    idPatient,
                    com.example.NEPHRO.dto.NotificationPayload.TYPE_LAB_PREVENTIF,
                    msg,
                    LocalDate.now(),
                    dossierId,
                    idItemPourUi
            );
        } else if (type == TypeAlerteLabo.CRITIQUE) {
            notificationWebSocketService.notifyPatientAlerteBiologie(
                    idPatient,
                    com.example.NEPHRO.dto.NotificationPayload.TYPE_LAB_CRITIQUE,
                    msg != null ? msg : "Résultat biologique critique",
                    LocalDate.now(),
                    dossierId,
                    idItemPourUi
            );
        }
    }

    private void notifierMedecinAlerteLabo(Long dossierId, Long resultatId, String message, String titreCourt) {
        Optional<DossierMedical> dossierOpt = dossierMedicalRepository.findById(dossierId);
        if (dossierOpt.isEmpty() || dossierOpt.get().getIdMedecin() == null) return;
        String nomPatient = "";
        Optional<Patient> pOpt = patientRepository.findById(dossierOpt.get().getIdPatient());
        if (pOpt.isPresent()) {
            Patient p = pOpt.get();
            nomPatient = (p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "").trim();
        }
        notificationMedecinService.creerPourAlerteLabo(
                dossierOpt.get().getIdMedecin(),
                dossierId,
                resultatId,
                nomPatient,
                titreCourt,
                message
        );
    }

    /** Enregistre un résultat (HL7, OCR, saisie), interprète automatiquement si dossier/patient connus, puis déclenche alertes si critique. */
    @Transactional
    public ResultatLabtest enregistrerResultatEtInterpreter(ResultatLabtest resultat, Integer ageMois, SexeNorme sexe) {
        ResultatLabtest saved = resultatLabtestRepository.save(resultat);
        if (ageMois != null && sexe != null) {
            interpreterAutomatique(saved.getId(), ageMois, sexe);
            saved = resultatLabtestRepository.findById(saved.getId()).orElse(saved);
        }
        declencherAlertesCritiques(saved);
        detecterTendancesRenales(saved);
        return saved;
    }

    /**
     * Tendance dangereuse sur 3 dosages consécutifs : hausse créatinine / urée, baisse DFG.
     * Alerte médecin + entrée {@link AlerteLabo} (type AVERTISSEMENT).
     */
    @Transactional
    public void detecterTendancesRenales(ResultatLabtest latest) {
        if (latest == null || latest.getValeur() == null || latest.getDossierId() == null) return;
        String code = latest.getCodeLoinc() != null ? latest.getCodeLoinc().trim() : "";
        if (LOINC_CREATININE_TENDANCE.equalsIgnoreCase(code)) {
            detecterHausseTriple(latest, LOINC_CREATININE_TENDANCE, "Créatinine", "µmol/L");
        } else if (LOINC_UREE_TENDANCE.equalsIgnoreCase(code)) {
            detecterHausseTriple(latest, LOINC_UREE_TENDANCE, "Urée", "mg/dL");
        } else if (estCodeDfgTendance(code)) {
            detecterBaisseTripleDfg(latest);
        }
    }

    private boolean estCodeDfgTendance(String codeLoinc) {
        if (codeLoinc == null) return false;
        return LOINC_DFG_TENDANCE.contains(codeLoinc.trim());
    }

    private List<ResultatLabtest> triChronologique(List<ResultatLabtest> list) {
        return list.stream()
                .sorted(Comparator
                        .comparing((ResultatLabtest r) -> dateEffectiveTri(r), Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ResultatLabtest::getId))
                .collect(Collectors.toList());
    }

    private java.time.LocalDateTime dateEffectiveTri(ResultatLabtest r) {
        if (r.getDateRendu() != null) return r.getDateRendu();
        return r.getDatePrelevement();
    }

    private List<ResultatLabtest> seriePourLoinc(Long dossierId, String loinc) {
        List<ResultatLabtest> all = resultatLabtestRepository.findByDossierIdOrderByDateRenduAsc(dossierId);
        return triChronologique(all.stream()
                .filter(r -> r.getCodeLoinc() != null && loinc.equalsIgnoreCase(r.getCodeLoinc().trim()))
                .filter(r -> r.getValeur() != null)
                .collect(Collectors.toList()));
    }

    private List<ResultatLabtest> seriePourDfg(Long dossierId) {
        List<ResultatLabtest> all = resultatLabtestRepository.findByDossierIdOrderByDateRenduAsc(dossierId);
        return triChronologique(all.stream()
                .filter(r -> r.getCodeLoinc() != null && estCodeDfgTendance(r.getCodeLoinc().trim()))
                .filter(r -> r.getValeur() != null)
                .collect(Collectors.toList()));
    }

    private void detecterHausseTriple(ResultatLabtest latest, String loinc, String libelle, String unite) {
        List<ResultatLabtest> serie = seriePourLoinc(latest.getDossierId(), loinc);
        if (serie.size() < 3) return;
        ResultatLabtest r0 = serie.get(serie.size() - 3);
        ResultatLabtest r1 = serie.get(serie.size() - 2);
        ResultatLabtest r2 = serie.get(serie.size() - 1);
        if (!r2.getId().equals(latest.getId())) return;
        double v0 = r0.getValeur().doubleValue();
        double v1 = r1.getValeur().doubleValue();
        double v2 = r2.getValeur().doubleValue();
        if (!(v0 < v1 && v1 < v2)) return;
        String prefix = "Tendance : " + libelle;
        if (dejaAlerteTendancePourResultat(r2.getId(), prefix)) return;
        String u = unite != null ? unite : "";
        String msg = String.format(
                "Tendance : %s en hausse sur 3 dosages consécutifs (%s → %s → %s %s). Risque d'aggravation de la fonction rénale.",
                libelle, formatNombreTri(v0), formatNombreTri(v1), formatNombreTri(v2), u);
        enregistrerAlerteTendance(r2, msg, TypeAlerteLabo.AVERTISSEMENT);
    }

    private void detecterBaisseTripleDfg(ResultatLabtest latest) {
        List<ResultatLabtest> serie = seriePourDfg(latest.getDossierId());
        if (serie.size() < 3) return;
        ResultatLabtest r0 = serie.get(serie.size() - 3);
        ResultatLabtest r1 = serie.get(serie.size() - 2);
        ResultatLabtest r2 = serie.get(serie.size() - 1);
        if (!r2.getId().equals(latest.getId())) return;
        double v0 = r0.getValeur().doubleValue();
        double v1 = r1.getValeur().doubleValue();
        double v2 = r2.getValeur().doubleValue();
        if (!(v0 > v1 && v1 > v2)) return;
        String prefix = "Tendance : DFG";
        if (dejaAlerteTendancePourResultat(r2.getId(), prefix)) return;
        String msg = String.format(
                "Tendance : DFG en baisse sur 3 dosages consécutifs (%s → %s → %s mL/min/1.73m²). Insuffisance rénale possible en progression.",
                formatNombreTri(v0), formatNombreTri(v1), formatNombreTri(v2));
        enregistrerAlerteTendance(r2, msg, TypeAlerteLabo.AVERTISSEMENT);
    }

    private boolean dejaAlerteTendancePourResultat(Long resultatId, String prefixMessage) {
        return alerteLaboRepository.findByResultatIdOrderByIdDesc(resultatId).stream()
                .anyMatch(a -> a.getMessage() != null && a.getMessage().startsWith(prefixMessage));
    }

    private void enregistrerAlerteTendance(ResultatLabtest pivot, String messageComplet, TypeAlerteLabo type) {
        AlerteLabo alerte = AlerteLabo.builder()
                .resultatId(pivot.getId())
                .typeAlerte(type)
                .message(messageComplet)
                .build();
        alerteLaboRepository.save(alerte);
        notifierMedecinTendanceLabo(pivot.getDossierId(), pivot.getId(), messageComplet);
    }

    private void notifierMedecinTendanceLabo(Long dossierId, Long resultatId, String message) {
        Optional<DossierMedical> dossierOpt = dossierMedicalRepository.findById(dossierId);
        if (dossierOpt.isEmpty() || dossierOpt.get().getIdMedecin() == null) return;
        String nomPatient = "";
        Optional<Patient> pOpt = patientRepository.findById(dossierOpt.get().getIdPatient());
        if (pOpt.isPresent()) {
            Patient p = pOpt.get();
            nomPatient = ((p.getFirstName() != null ? p.getFirstName() : "") + " "
                    + (p.getLastName() != null ? p.getLastName() : "")).trim();
        }
        notificationMedecinService.creerPourTendanceRenale(
                dossierOpt.get().getIdMedecin(),
                dossierId,
                resultatId,
                nomPatient,
                message
        );
    }

    private static String formatNombreTri(double d) {
        if (Math.abs(d - Math.rint(d)) < 1e-9) return String.valueOf((long) Math.rint(d));
        return String.format(Locale.FRANCE, "%.2f", d);
    }

    /** Calcule l'âge en mois à partir de la date de naissance. */
    public int ageEnMois(LocalDate dateNaissance) {
        if (dateNaissance == null) return 0;
        return (int) ChronoUnit.MONTHS.between(dateNaissance, LocalDate.now());
    }

    /** Acquitter une alerte labo (médecin prend en charge). */
    @Transactional
    public void acquitterAlerte(Long alerteId, Long medecinId, String actionRealisee) {
        AlerteLabo a = alerteLaboRepository.findById(alerteId).orElseThrow(() -> new RuntimeException("Alerte non trouvée: " + alerteId));
        a.setAcquitteePar(medecinId);
        a.setDateAcquittement(LocalDateTime.now());
        a.setActionRealisee(actionRealisee);
        alerteLaboRepository.save(a);
    }
}
