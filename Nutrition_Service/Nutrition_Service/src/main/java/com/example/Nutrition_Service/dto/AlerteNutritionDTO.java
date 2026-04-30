package com.example.Nutrition_Service.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlerteNutritionDTO {

    private Long id;

    @NotNull(message = "L'ID du patient est obligatoire")
    @Positive(message = "L'ID du patient doit être positif")
    private Long patientId;

    @NotBlank(message = "Le type d'alerte est obligatoire")
    private String type;  // BILAN_ANORMAL, RESTRICTION_ACTIVEE, etc.

    @NotBlank(message = "Le message est obligatoire")
    @Size(min = 5, max = 500, message = "Le message doit contenir entre 5 et 500 caractères")
    private String message;

    @NotNull(message = "La date de l'alerte est obligatoire")
    private LocalDateTime dateAlerte;

    @NotNull(message = "Le statut de lecture doit être spécifié")
    private Boolean lue;

    @Positive(message = "L'ID de l'aliment doit être positif")
    private Long alimentId;

    @Positive(message = "L'ID de la restriction doit être positif")
    private Long restrictionId;

    @Size(max = 1000, message = "Les détails techniques ne peuvent pas dépasser 1000 caractères")
    private String detailsTechniques;
}