package com.example.Nutrition_Service.dto;

import java.util.List;

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

    public int getNumero() { return numero; }
    public void setNumero(int numero) { this.numero = numero; }
    public String getJour() { return jour; }
    public void setJour(String jour) { this.jour = jour; }
    public List<RepasDTO> getRepas() { return repas; }
    public void setRepas(List<RepasDTO> repas) { this.repas = repas; }
    public double getTotalCalories() { return totalCalories; }
    public void setTotalCalories(double totalCalories) { this.totalCalories = totalCalories; }
    public double getTotalPotassium() { return totalPotassium; }
    public void setTotalPotassium(double v) { this.totalPotassium = v; }
    public double getTotalSodium() { return totalSodium; }
    public void setTotalSodium(double v) { this.totalSodium = v; }
    public double getTotalPhosphore() { return totalPhosphore; }
    public void setTotalPhosphore(double v) { this.totalPhosphore = v; }
    public double getTotalProteines() { return totalProteines; }
    public void setTotalProteines(double v) { this.totalProteines = v; }
    public double getTotalSucre() { return totalSucre; }
    public void setTotalSucre(double v) { this.totalSucre = v; }
    public double getPctCalories() { return pctCalories; }
    public void setPctCalories(double v) { this.pctCalories = v; }
    public double getPctPotassium() { return pctPotassium; }
    public void setPctPotassium(double v) { this.pctPotassium = v; }
    public double getPctSodium() { return pctSodium; }
    public void setPctSodium(double v) { this.pctSodium = v; }
    public double getPctPhosphore() { return pctPhosphore; }
    public void setPctPhosphore(double v) { this.pctPhosphore = v; }
    public double getPctProteines() { return pctProteines; }
    public void setPctProteines(double v) { this.pctProteines = v; }
    public double getPctSucre() { return pctSucre; }
    public void setPctSucre(double v) { this.pctSucre = v; }
}