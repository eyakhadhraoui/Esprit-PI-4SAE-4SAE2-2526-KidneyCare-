package com.example.Nutrition_Service.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BesoinNutritionnelDTO {

    private Long id;

    @NotNull(message = "L'ID du patient est obligatoire")
    @Positive(message = "L'ID du patient doit être positif")
    private Long patientId;

    @NotNull(message = "Le potassium maximum est obligatoire")
    @Positive(message = "Le potassium maximum doit être positif")
    private Integer potassiumMaxMg;

    @NotNull(message = "Le sodium maximum est obligatoire")
    @Positive(message = "Le sodium maximum doit être positif")
    private Integer sodiumMaxMg;

    @NotNull(message = "Le phosphore maximum est obligatoire")
    @Positive(message = "Le phosphore maximum doit être positif")
    private Integer phosphoreMaxMg;

    @NotNull(message = "Les protéines maximum sont obligatoires")
    @Positive(message = "Les protéines maximum doivent être positives")
    private Double proteinesMaxG;

    @NotNull(message = "Le sucre maximum est obligatoire")
    @Positive(message = "Le sucre maximum doit être positif")
    private Double sucreMaxG;

    @NotNull(message = "Les calories journalières sont obligatoires")
    @Positive(message = "Les calories journalières doivent être positives")
    private Integer caloriesJour;

    @Positive(message = "Le poids doit être positif")
    private Double poidsKg;

    @Positive(message = "L'âge doit être positif")
    private Integer ageMois;

    private Boolean traitementTacrolimus;
    private Boolean traitementPrednisone;

    @Size(max = 500, message = "La raison du calcul ne peut pas dépasser 500 caractères")
    private String raisonCalcul;

    @NotNull(message = "La date de début est obligatoire")
    @PastOrPresent(message = "La date de début ne peut pas être dans le futur")
    private LocalDate dateDebut;

    private LocalDate dateFin;

    @Size(max = 1000, message = "Les notes ne peuvent pas dépasser 1000 caractères")
    private String notes;
}