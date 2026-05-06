package com.example.Nutrition_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepasDTO {
    private String type; // PETIT_DEJEUNER, DEJEUNER, DINER
    private List<AlimentPortionDTO> aliments;
    private double totalCalories;
    private double totalPotassium;
    private double totalSodium;
    private double totalPhosphore;
    private double totalProteines;
    private double totalSucre;
}
