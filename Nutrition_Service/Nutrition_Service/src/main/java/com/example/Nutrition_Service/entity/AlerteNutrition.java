package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertes_nutrition")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlerteNutrition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAlerte type;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    private LocalDateTime dateAlerte;

    @Column(nullable = false)
    private Boolean lue = false;  // Pour marquer comme lue

    @Column
    private Long alimentId;  // Si alerte liée à un aliment

    @Column
    private Long restrictionId;  // Si alerte liée à une restriction

    @Column(length = 1000)
    private String detailsTechniques;  // JSON ou texte libre

    // Enum Type Alerte
    public enum TypeAlerte {
        BILAN_ANORMAL,              // Bilan hors normes
        RESTRICTION_ACTIVEE,        // Nouvelle restriction
        RESTRICTION_LEVEE,          // Restriction levée
        ALIMENT_INTERDIT_CLIQUE,    // Parent a cliqué sur aliment interdit
        INTERACTION_MEDICAMENT,     // Interaction détectée
        AGE_INADEQUAT,              // Aliment non adapté à l'âge
        APPORT_EXCESSIF,            // Dépassement apport quotidien
        AUTRE
    }
}
