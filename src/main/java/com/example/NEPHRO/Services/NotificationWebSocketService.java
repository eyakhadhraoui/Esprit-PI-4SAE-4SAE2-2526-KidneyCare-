package com.example.NEPHRO.Services;

import com.example.NEPHRO.dto.MedecinNotificationPayload;
import com.example.NEPHRO.dto.NotificationPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Notifications temps réel via WebSocket (STOMP) : patients {@code /topic/patient/{id}},
 * médecins {@code /topic/medecin/{id}}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    private static final String TOPIC_PATIENT_PREFIX = "/topic/patient/";
    private static final String TOPIC_MEDECIN_PREFIX = "/topic/medecin/";

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

    /**
     * Patient a saisi un nouveau résultat de laboratoire — alerte temps réel pour le médecin du dossier.
     */
    public void notifyMedecinNouveauResultatPatient(Long idMedecin, String titre, String corps,
                                                    Long idDossierMedical, Long idResultatLaboratoire) {
        if (idMedecin == null) return;
        MedecinNotificationPayload payload = new MedecinNotificationPayload(
                MedecinNotificationPayload.TYPE_NOUVEAU_TEST_LABO,
                titre != null ? titre : "Nouveau résultat de test laboratoire",
                corps,
                idDossierMedical,
                idResultatLaboratoire
        );
        sendToMedecin(idMedecin, payload);
    }

    /** Alerte labo critique / tendance (notification médecin déjà persistée). */
    public void notifyMedecinAlerteLabo(Long idMedecin, String titre, String corps,
                                        Long idDossierMedical, Long idResultatLaboratoire) {
        if (idMedecin == null) return;
        MedecinNotificationPayload payload = new MedecinNotificationPayload(
                MedecinNotificationPayload.TYPE_ALERTE_LABO,
                titre != null ? titre : "Alerte laboratoire",
                corps,
                idDossierMedical,
                idResultatLaboratoire
        );
        sendToMedecin(idMedecin, payload);
    }

    /** Rappel : tests prescrits non réalisés après délai (dashboard médecin). */
    public void notifyMedecinRappelTestNonFait(Long idMedecin, String titre, String corps,
                                               Long idDossierMedical, Long prescriptionId) {
        if (idMedecin == null) return;
        MedecinNotificationPayload payload = new MedecinNotificationPayload(
                MedecinNotificationPayload.TYPE_RAPPEL_TEST_NON_FAIT,
                titre != null ? titre : "Tests non réalisés (rappel)",
                corps,
                idDossierMedical,
                prescriptionId
        );
        sendToMedecin(idMedecin, payload);
    }

    private void sendToMedecin(Long idMedecin, MedecinNotificationPayload payload) {
        String destination = TOPIC_MEDECIN_PREFIX + idMedecin;
        try {
            messagingTemplate.convertAndSend(destination, payload);
            log.info("Notification WebSocket médecin {} : type {}", idMedecin, payload.getType());
        } catch (Exception e) {
            log.warn("Échec envoi WebSocket médecin {}: {}", idMedecin, e.getMessage());
        }
    }
}
