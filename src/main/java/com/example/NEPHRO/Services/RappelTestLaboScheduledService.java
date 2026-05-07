package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Entities.Patient;
import com.example.NEPHRO.Entities.PrescriptionBilan;
import com.example.NEPHRO.Entities.ResultatLabtest;
import com.example.NEPHRO.Enum.StatutPrescription;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.Repository.PatientRepository;
import com.example.NEPHRO.Repository.PrescriptionBilanRepository;
import com.example.NEPHRO.Repository.ResultatLabtestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Rappels patient + médecin lorsque des examens restent en attente au-delà d’un délai (défaut 7 jours).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RappelTestLaboScheduledService {

    private final PrescriptionBilanRepository prescriptionBilanRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    private final ResultatLabtestRepository resultatLabtestRepository;
    private final NotificationWebSocketService notificationWebSocketService;
    private final NotificationMedecinService notificationMedecinService;

    @Value("${lab.rappel.jours-delai:7}")
    private int joursDelai;

    @Scheduled(cron = "${lab.rappel.cron:0 0 7 * * ?}")
    public void envoyerRappelsTestsNonRealises() {
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime seuil = maintenant.minusDays(joursDelai);
        // EN_ATTENTE ou PARTIEL : il reste des tests à réaliser
        List<PrescriptionBilan> attentes = prescriptionBilanRepository.findByStatut(StatutPrescription.EN_ATTENTE);
        attentes.addAll(prescriptionBilanRepository.findByStatut(StatutPrescription.PARTIEL));
        int envois = 0;
        for (PrescriptionBilan p : attentes) {
            if (p.getDatePrescription() == null) continue;
            if (p.getDatePrescription().isAfter(seuil)) continue;
            if (p.getDernierRappelTestEnvoye() != null
                    && p.getDernierRappelTestEnvoye().isAfter(maintenant.minusDays(6))) {
                continue;
            }
            Optional<DossierMedical> dmOpt = dossierMedicalRepository.findById(p.getDossierId());
            if (dmOpt.isEmpty() || dmOpt.get().getIdPatient() == null) continue;
            DossierMedical dm = dmOpt.get();
            Long idPatient = dm.getIdPatient();
            Long idMedecin = p.getMedecinId();

            // Déterminer quels examens manquent réellement (évite rappel si tout est déjà saisi mais statut pas encore recalculé).
            Set<String> demandes = new HashSet<>();
            if (p.getExamens() != null) {
                for (String x : p.getExamens()) {
                    if (x != null && !x.trim().isEmpty()) demandes.add(x.trim());
                }
            }
            if (demandes.isEmpty()) continue;

            List<ResultatLabtest> resultats = resultatLabtestRepository.findByPrescriptionIdOrderByDateRenduDesc(p.getId());
            Set<String> dejaFaits = resultats.stream()
                    .map(ResultatLabtest::getCodeLoinc)
                    .filter(s -> s != null && !s.trim().isEmpty())
                    .map(String::trim)
                    .collect(Collectors.toSet());
            Set<String> manquants = demandes.stream().filter(x -> !dejaFaits.contains(x)).collect(Collectors.toSet());
            if (manquants.isEmpty()) {
                continue;
            }

            String listeManquants = String.join(", ", manquants.stream().limit(8).collect(Collectors.toList()));
            String suffix = manquants.size() > 8 ? "…" : "";
            String msg = String.format(
                    "Des analyses prescrites le %s ne sont pas encore toutes réalisées (%d manquant(s): %s%s). Pensez à effectuer le prélèvement au laboratoire.",
                    p.getDatePrescription().toLocalDate(),
                    manquants.size(),
                    listeManquants,
                    suffix);

            notificationWebSocketService.notifyPatientRappelTestNonFait(
                    idPatient, msg, dm.getIdDossierMedical(), p.getId());

            // Notifier aussi le médecin (push temps réel + persistance)
            if (idMedecin != null) {
                String patientNom = patientRepository.findById(idPatient)
                        .map(pt -> displayName(pt))
                        .orElse("Patient #" + idPatient);
                notificationMedecinService.creerPourRappelTestsNonFaits(
                        idMedecin,
                        dm.getIdDossierMedical(),
                        idPatient,
                        patientNom,
                        p.getId(),
                        "Rappel : " + patientNom + " n’a pas encore réalisé tous les tests prescrits ("
                                + manquants.size() + " manquant(s))."
                );
            }

            p.setDernierRappelTestEnvoye(maintenant);
            prescriptionBilanRepository.save(p);
            envois++;
        }
        if (envois > 0) {
            log.info("Rappels tests non réalisés : {} prescription(s) notifiée(s) (patient + médecin)", envois);
        }
    }

    private static String displayName(Patient p) {
        if (p == null) return "";
        String fn = p.getFirstName() != null ? p.getFirstName().trim() : "";
        String ln = p.getLastName() != null ? p.getLastName().trim() : "";
        String full = (fn + " " + ln).trim();
        if (!full.isBlank()) return full;
        return p.getUsername() != null ? p.getUsername().trim() : "";
    }
}
