package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "restrictions_alimentaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestrictionAlimentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long alimentId;  // Référence vers Aliment

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RaisonRestriction raison;

    @Column
    private Double valeurBilanDeclencheur;  // Ex: 5.9 (potassium mmol/L)

    @Column(nullable = false)
    private Boolean creeAutomatiquement = false;  // TRUE si créé par système

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column
    private LocalDate dateFin;  // NULL = restriction active

    @Column(length = 1000)
    private String notes;

    // Enum Raison
    public enum RaisonRestriction {
        HYPERKALIEMIE,           // Potassium élevé
        HYPERNATREMIE,           // Sodium élevé
        HYPERPHOSPHOREMIE,       // Phosphore élevé
        DIABETE_CORTICOIDE,      // Sucre élevé (Prednisone)
        TACROLIMUS,              // Interaction Tacrolimus
        CYCLOSPORINE,            // Interaction Cyclosporine
        AGE_INADEQUAT,           // Aliment non adapté à l'âge
        ALLERGIE,                // Allergie connue
        AUTRE                    // Autre raison
    }
}