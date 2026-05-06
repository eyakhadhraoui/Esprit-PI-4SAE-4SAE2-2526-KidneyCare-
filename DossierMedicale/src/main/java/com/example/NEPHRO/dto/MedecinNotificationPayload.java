package com.example.NEPHRO.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Notification temps réel envoyée au médecin via {@code /topic/medecin/{idMedecin}} (STOMP).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedecinNotificationPayload {

    public static final String TYPE_NOUVEAU_TEST_LABO = "MEDECIN_NOUVEAU_TEST_LABO";
    public static final String TYPE_ALERTE_LABO = "MEDECIN_ALERTE_LABO";
    public static final String TYPE_RAPPEL_TEST_NON_FAIT = "MEDECIN_RAPPEL_TEST_NON_FAIT";

    private String type;
    private String titre;
    /** Détail affichable (corps du message). */
    private String corps;
    private Long idDossierMedical;
    private Long idResultatLaboratoire;
}
