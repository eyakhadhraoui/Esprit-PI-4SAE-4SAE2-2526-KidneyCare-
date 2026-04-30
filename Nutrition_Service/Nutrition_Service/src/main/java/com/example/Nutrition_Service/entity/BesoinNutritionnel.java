package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "besoins_nutritionnels")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BesoinNutritionnel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;  // ID du patient

    // Apports maximums calculés automatiquement
    @Column(nullable = false)
    private Integer potassiumMaxMg;  // Ex: 1800 mg/jour

    @Column(nullable = false)
    private Integer sodiumMaxMg;  // Ex: 1200 mg/jour

    @Column(nullable = false)
    private Integer phosphoreMaxMg;  // Ex: 800 mg/jour

    @Column(nullable = false)
    private Double proteinesMaxG;  // Ex: 40 g/jour

    @Column(nullable = false)
    private Double sucreMaxG;  // Ex: 35 g/jour (si Prednisone)

    @Column(nullable = false)
    private Integer caloriesJour;  // Apport calorique total

    // Données de calcul (statiques pour l'instant)
    @Column
    private Double poidsKg;  // Ex: 22 kg

    @Column
    private Integer ageMois;  // Ex: 24 mois (2 ans)

    @Column
    private Boolean traitementTacrolimus = false;

    @Column
    private Boolean traitementPrednisone = false;

    @Column(length = 500)
    private String raisonCalcul;  // Ex: "Calculé selon poids + traitement Tacrolimus"

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column
    private LocalDate dateFin;  // NULL = actif

    @Column(length = 1000)
    private String notes;
}