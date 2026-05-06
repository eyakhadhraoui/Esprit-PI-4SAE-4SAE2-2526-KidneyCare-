package com.example.Nutrition_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Recommandation dérivée du besoin nutritionnel actif du patient.
 * Les champs « bilan brut » (créatinine, DFG, etc.) restent optionnels tant qu’aucun client labo n’est branché.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DietRecommendationDTO {

    private Long patientId;
    private LocalDate dateBilan;
    private Integer calories;
    private Integer potassiumMax;
    private Integer sodiumMax;
    private Integer phosphoreMax;
    private Double proteinesMax;
    private Integer sucreMax;
    private List<String> medicamentsActifs = new ArrayList<>();
    private String notes;

    private Double poids;
    private Double taille;
    private Double potassium;
    private Double sodium;
    private Double phosphore;
    private Double dfg;
    private Double creatinine;
    private Double albumine;
    private Double glycemie;
}
