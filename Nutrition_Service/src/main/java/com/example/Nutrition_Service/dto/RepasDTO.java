package com.example.Nutrition_Service.dto;

import java.util.List;

public class RepasDTO {
    private String type; // PETIT_DEJEUNER, DEJEUNER, DINER
    private List<AlimentPortionDTO> aliments;
    private double totalCalories;
    private double totalPotassium;
    private double totalSodium;
    private double totalPhosphore;
    private double totalProteines;
    private double totalSucre;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public List<AlimentPortionDTO> getAliments() { return aliments; }
    public void setAliments(List<AlimentPortionDTO> aliments) { this.aliments = aliments; }
    public double getTotalCalories() { return totalCalories; }
    public void setTotalCalories(double totalCalories) { this.totalCalories = totalCalories; }
    public double getTotalPotassium() { return totalPotassium; }
    public void setTotalPotassium(double totalPotassium) { this.totalPotassium = totalPotassium; }
    public double getTotalSodium() { return totalSodium; }
    public void setTotalSodium(double totalSodium) { this.totalSodium = totalSodium; }
    public double getTotalPhosphore() { return totalPhosphore; }
    public void setTotalPhosphore(double totalPhosphore) { this.totalPhosphore = totalPhosphore; }
    public double getTotalProteines() { return totalProteines; }
    public void setTotalProteines(double totalProteines) { this.totalProteines = totalProteines; }
    public double getTotalSucre() { return totalSucre; }
    public void setTotalSucre(double totalSucre) { this.totalSucre = totalSucre; }
}