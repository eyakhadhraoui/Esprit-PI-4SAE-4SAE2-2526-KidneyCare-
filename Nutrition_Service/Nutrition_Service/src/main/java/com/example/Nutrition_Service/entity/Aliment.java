package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "aliments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Aliment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;  // Ex: "Banane", "Pamplemousse"

    @Column(nullable = false)
    private String categorie;  // FRUIT, LEGUME, VIANDE, PRODUIT_LAITIER, CEREALE, AUTRE

    // Valeurs nutritionnelles (pour 100g)
    @Column
    private Integer potassiumMg;  // Potassium en mg

    @Column
    private Integer sodiumMg;  // Sodium en mg

    @Column
    private Integer phosphoreMg;  // Phosphore en mg

    @Column
    private Double proteinesG;  // Protéines en grammes

    @Column
    private Double sucreG;  // Sucre en grammes

    @Column
    private Integer caloriesKcal;  // Calories

    // Interactions médicamenteuses
    @Column(nullable = false)
    private Boolean interactionTacrolimus = false;  // Pamplemousse, orange amère

    @Column(nullable = false)
    private Boolean interactionCyclosporine = false;

    // Restrictions par âge
    @Column
    private Integer ageMinimumMois;  // Ex: 12 mois pour fruits secs

    @Column(length = 500)
    private String raisonRestrictionAge;  // Ex: "Risque d'étouffement"

    @Column(length = 1000)
    private String notes;  // Notes médicales
}