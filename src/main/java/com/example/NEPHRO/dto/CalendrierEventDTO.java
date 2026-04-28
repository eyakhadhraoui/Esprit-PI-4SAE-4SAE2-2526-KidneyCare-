package com.example.NEPHRO.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Événement calendrier pour le patient : suivi, image, demande d'examen (médecin) ou examen réalisé.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendrierEventDTO {

    public enum TypeEvent {
        SUIVI,
        IMAGE_MEDICALE,
        /** Prescription de bilan / demande de tests par le médecin. */
        TEST_DEMANDE,
        /** Résultat d'examen enregistré (patient ou labo). */
        TEST_REALISE,
        /** Rapport de bilan rédigé par le médecin (email / PDF). */
        RAPPORT_BILAN
    }

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;
    private TypeEvent type;
    /** Titre affiché (ex: "Suivi — Amélioration", "Échographie rénale"). */
    private String titre;
    /** ID de l'entité (idSuivi ou idImage). */
    private Long id;
    private Long idDossierMedical;
    /** Optionnel : description courte. */
    private String description;
}
