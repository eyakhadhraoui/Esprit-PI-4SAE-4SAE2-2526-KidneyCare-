package com.example.Nutrition_Service.dto;

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

    public Long getAlimentId() { return alimentId; }
    public void setAlimentId(Long alimentId) { this.alimentId = alimentId; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public double getPortionG() { return portionG; }
    public void setPortionG(double portionG) { this.portionG = portionG; }
    public double getCalories() { return calories; }
    public void setCalories(double calories) { this.calories = calories; }
    public double getPotassium() { return potassium; }
    public void setPotassium(double potassium) { this.potassium = potassium; }
    public double getSodium() { return sodium; }
    public void setSodium(double sodium) { this.sodium = sodium; }
    public double getPhosphore() { return phosphore; }
    public void setPhosphore(double phosphore) { this.phosphore = phosphore; }
    public double getProteines() { return proteines; }
    public void setProteines(double proteines) { this.proteines = proteines; }
    public double getSucre() { return sucre; }
    public void setSucre(double sucre) { this.sucre = sucre; }
}