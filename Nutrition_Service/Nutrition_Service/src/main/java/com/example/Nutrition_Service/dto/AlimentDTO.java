package com.example.Nutrition_Service.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlimentDTO {

    private Long id;

    @NotBlank(message = "Le nom de l'aliment est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String nom;

    @NotBlank(message = "La catégorie est obligatoire")
    private String categorie;  // FRUIT, LEGUME, VIANDE, etc.

    @PositiveOrZero(message = "Le potassium doit être positif ou nul")
    private Integer potassiumMg;

    @PositiveOrZero(message = "Le sodium doit être positif ou nul")
    private Integer sodiumMg;

    @PositiveOrZero(message = "Le phosphore doit être positif ou nul")
    private Integer phosphoreMg;

    @PositiveOrZero(message = "Les protéines doivent être positives ou nulles")
    private Double proteinesG;

    @PositiveOrZero(message = "Le sucre doit être positif ou nul")
    private Double sucreG;

    @PositiveOrZero(message = "Les calories doivent être positives ou nulles")
    private Integer caloriesKcal;

    @NotNull(message = "L'interaction Tacrolimus doit être spécifiée")
    private Boolean interactionTacrolimus;

    @NotNull(message = "L'interaction Cyclosporine doit être spécifiée")
    private Boolean interactionCyclosporine;

    @PositiveOrZero(message = "L'âge minimum doit être positif ou nul")
    private Integer ageMinimumMois;

    @Size(max = 500, message = "La raison de restriction ne peut pas dépasser 500 caractères")
    private String raisonRestrictionAge;

    @Size(max = 1000, message = "Les notes ne peuvent pas dépasser 1000 caractères")
    private String notes;
}