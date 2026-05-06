package com.example.Nutrition_Service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Miroir léger du DTO NEPHRO — seuls les champs utiles à la nutrition sont conservés.
 * Reçu via OpenFeign depuis le service DossierMedical (port 8089).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResultatLaboratoireDTO {

    private Long idResultatLaboratoire;
    private Long idDossierMedical;
    private Long idTestLaboratoire;

    private LocalDateTime datePrelevement;
    private LocalDate dateResultat;

    /** Valeur numérique (créatinine, potassium, phosphore, etc.). */
    private Double valeurNumerique;
    /** Résultat qualitatif (Positif/Négatif). */
    private String valeurTexte;

    private String unite;
    private String conclusion;

    /** NORMAL / ELEVE / BAS / CRITIQUE_HAUT / CRITIQUE_BAS. */
    private String interpretation;
    /** EN_ATTENTE / RECU / VALIDE. */
    private String statutResultat;

    /** Nom du test (ex: Créatinine, Potassium, Phosphore). */
    private String nomTest;
    /** Code du test (ex: CREAT, K, PHOS). */
    private String codeTest;
}
