package com.example.Nutrition_Service.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestrictionAlimentaireDTO {

    private Long id;

    @NotNull(message = "L'ID du patient est obligatoire")
    @Positive(message = "L'ID du patient doit être positif")
    private Long patientId;

    @NotNull(message = "L'ID de l'aliment est obligatoire")
    @Positive(message = "L'ID de l'aliment doit être positif")
    private Long alimentId;

    @NotBlank(message = "La raison de la restriction est obligatoire")
    private String raison;  // HYPERKALIEMIE, TACROLIMUS, etc.

    @PositiveOrZero(message = "La valeur du bilan doit être positive ou nulle")
    private Double valeurBilanDeclencheur;

    @NotNull(message = "Le statut de création automatique doit être spécifié")
    private Boolean creeAutomatiquement;

    @NotNull(message = "La date de début est obligatoire")
    @PastOrPresent(message = "La date de début ne peut pas être dans le futur")
    private LocalDate dateDebut;

    private LocalDate dateFin;

    @Size(max = 1000, message = "Les notes ne peuvent pas dépasser 1000 caractères")
    private String notes;
}