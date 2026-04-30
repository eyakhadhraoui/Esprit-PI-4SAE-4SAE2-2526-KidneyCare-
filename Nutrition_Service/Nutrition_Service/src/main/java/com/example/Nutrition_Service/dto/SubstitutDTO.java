package com.example.Nutrition_Service.dto;
// package com.tonpackage.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubstitutDTO {
    private Long id;
    private String nom;
    private double calories;    // caloriesKcal
    private double proteines;   // proteinesG
    private double glucides;    // sucreG
    private double potassium;   // potassiumMg
    private double sodium;      // sodiumMg
    private double phosphore;   // phosphoreMg
    private int scoreCompatibilite;
}
