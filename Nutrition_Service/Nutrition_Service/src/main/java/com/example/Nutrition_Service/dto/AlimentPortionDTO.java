package com.example.Nutrition_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlimentPortionDTO {
    private Long alimentId;
    private String nom;
    private String categorie;
    private double portionG;
    private double calories;
    private double potassium;
    private double sodium;
    private double phosphore;
    private double proteines;
    private double sucre;
}
