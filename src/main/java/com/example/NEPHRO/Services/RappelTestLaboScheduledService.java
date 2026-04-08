package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Entities.PrescriptionBilan;
import com.example.NEPHRO.Enum.StatutPrescription;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.Repository.PrescriptionBilanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Rappels patient (WebSocket) lorsque des examens restent en attente au-delà d’un délai (défaut 7 jours).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RappelTestLaboScheduledService {

    private final PrescriptionBilanRepository prescriptionBilanRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    @Value("${lab.rappel.jours-delai:7}")
    private int joursDelai;

    @Scheduled(cron = "${lab.rappel.cron:0 0 7 * * ?}")
    public void envoyerRappelsTestsNonRealises() {
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime seuil = maintenant.minusDays(joursDelai);
        List<PrescriptionBilan> attentes = prescriptionBilanRepository.findByStatut(StatutPrescription.EN_ATTENTE);
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
            String msg = String.format(
                    "Des analyses prescrites le %s ne sont pas encore réalisées. Pensez à effectuer le prélèvement au laboratoire.",
                    p.getDatePrescription().toLocalDate());
            notificationWebSocketService.notifyPatientRappelTestNonFait(
                    dm.getIdPatient(), msg, dm.getIdDossierMedical(), p.getId());
            p.setDernierRappelTestEnvoye(maintenant);
            prescriptionBilanRepository.save(p);
            envois++;
        }
        if (envois > 0) {
            log.info("Rappels tests non réalisés : {} notification(s) patient WebSocket", envois);
        }
    }
}
