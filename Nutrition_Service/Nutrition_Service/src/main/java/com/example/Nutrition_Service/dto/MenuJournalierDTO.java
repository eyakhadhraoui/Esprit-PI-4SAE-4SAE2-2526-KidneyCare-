package com.example.Nutrition_Service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuJournalierDTO {
    private int numero;
    private String jour;
    private List<RepasDTO> repas;
    private double totalCalories;
    private double totalPotassium;
    private double totalSodium;
    private double totalPhosphore;
    private double totalProteines;
    private double totalSucre;
    private double pctCalories;
    private double pctPotassium;
    private double pctSodium;
    private double pctPhosphore;
    private double pctProteines;
    private double pctSucre;
}
