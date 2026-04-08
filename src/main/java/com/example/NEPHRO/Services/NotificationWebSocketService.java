package com.example.NEPHRO.Services;

import com.example.NEPHRO.dto.NotificationPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Envoie les notifications temps réel aux patients via WebSocket (STOMP).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    private static final String TOPIC_PATIENT_PREFIX = "/topic/patient/";

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Notifie le patient qu'une nouvelle image médicale a été ajoutée à son dossier.
     */
    public void notifyPatientNewImage(Long idPatient, String typeImageLibelle, java.time.LocalDate dateCapture,
                                      Long idDossierMedical, Long idImage) {
        if (idPatient == null) return;
        NotificationPayload payload = new NotificationPayload(
                NotificationPayload.TYPE_IMAGE_MEDICALE,
                "Nouvelle image médicale : " + (typeImageLibelle != null ? typeImageLibelle : "Image"),
                dateCapture,
                idDossierMedical,
                idImage,
                null
        );
        String destination = TOPIC_PATIENT_PREFIX + idPatient;
        try {
            messagingTemplate.convertAndSend(destination, payload);
            log.info("Notification WebSocket envoyée au patient {} : nouvelle image {}", idPatient, idImage);
        } catch (Exception e) {
            log.warn("Échec envoi notification WebSocket au patient {}: {}", idPatient, e.getMessage());
        }
    }

    /** Résultat biologique critique ou préventif (affichage patient + toast). */
    public void notifyPatientAlerteBiologie(Long idPatient, String typePayload, String titre,
                                            java.time.LocalDate dateJour, Long idDossierMedical, Long idResultatItem) {
        if (idPatient == null) return;
        NotificationPayload payload = new NotificationPayload(
                typePayload,
                titre,
                dateJour != null ? dateJour : java.time.LocalDate.now(),
                idDossierMedical,
                idResultatItem,
                null
        );
        sendToPatient(idPatient, payload);
    }

    /** Rappel : tests prescrits mais toujours non réalisés après le délai. */
    public void notifyPatientRappelTestNonFait(Long idPatient, String message, Long idDossierMedical, Long prescriptionId) {
        if (idPatient == null) return;
        NotificationPayload payload = new NotificationPayload(
                NotificationPayload.TYPE_LAB_RAPPEL_TEST,
                message != null ? message : "Des analyses prescrites ne sont pas encore réalisées.",
                java.time.LocalDate.now(),
                idDossierMedical,
                prescriptionId,
                prescriptionId
        );
        sendToPatient(idPatient, payload);
    }

    private void sendToPatient(Long idPatient, NotificationPayload payload) {
        String destination = TOPIC_PATIENT_PREFIX + idPatient;
        try {
            messagingTemplate.convertAndSend(destination, payload);
            log.info("Notification WebSocket patient {} : type {}", idPatient, payload.getType());
        } catch (Exception e) {
            log.warn("Échec envoi WebSocket patient {}: {}", idPatient, e.getMessage());
        }
    }
}
