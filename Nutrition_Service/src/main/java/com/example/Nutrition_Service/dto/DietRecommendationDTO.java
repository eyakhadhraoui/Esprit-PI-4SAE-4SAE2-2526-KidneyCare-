package com.example.Nutrition_Service.dto;

import java.time.LocalDate;
import java.util.List;

public class DietRecommendationDTO {

    private Long patientId;
    private LocalDate dateBilan;
    private Integer calories;
    private Integer potassiumMax;
    private Integer sodiumMax;
    private Integer phosphoreMax;
    private Double proteinesMax;
    private Integer sucreMax;
    private List<String> medicamentsActifs;
    private String notes;

    // ── Valeurs brutes du dernier bilan ──
    private Double poids;
    private Double taille;
    private Double potassium;
    private Double sodium;
    private Double phosphore;
    private Double dfg;
    private Double creatinine;
    private Double albumine;
    private Double glycemie;

    // ── Getters ──
    public Long getPatientId() { return patientId; }
    public LocalDate getDateBilan() { return dateBilan; }
    public Integer getCalories() { return calories; }
    public Integer getPotassiumMax() { return potassiumMax; }
    public Integer getSodiumMax() { return sodiumMax; }
    public Integer getPhosphoreMax() { return phosphoreMax; }
    public Double getProteinesMax() { return proteinesMax; }
    public Integer getSucreMax() { return sucreMax; }
    public List<String> getMedicamentsActifs() { return medicamentsActifs; }
    public String getNotes() { return notes; }
    public Double getPoids() { return poids; }
    public Double getTaille() { return taille; }
    public Double getPotassium() { return potassium; }
    public Double getSodium() { return sodium; }
    public Double getPhosphore() { return phosphore; }
    public Double getDfg() { return dfg; }
    public Double getCreatinine() { return creatinine; }
    public Double getAlbumine() { return albumine; }
    public Double getGlychemie() { return glycemie; }

    // ── Setters ──
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public void setDateBilan(LocalDate dateBilan) { this.dateBilan = dateBilan; }
    public void setCalories(Integer calories) { this.calories = calories; }
    public void setPotassiumMax(Integer potassiumMax) { this.potassiumMax = potassiumMax; }
    public void setSodiumMax(Integer sodiumMax) { this.sodiumMax = sodiumMax; }
    public void setPhosphoreMax(Integer phosphoreMax) { this.phosphoreMax = phosphoreMax; }
    public void setProteinesMax(Double proteinesMax) { this.proteinesMax = proteinesMax; }
    public void setSucreMax(Integer sucreMax) { this.sucreMax = sucreMax; }
    public void setMedicamentsActifs(List<String> medicamentsActifs) { this.medicamentsActifs = medicamentsActifs; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setPoids(Double poids) { this.poids = poids; }
    public void setTaille(Double taille) { this.taille = taille; }
    public void setPotassium(Double potassium) { this.potassium = potassium; }
    public void setSodium(Double sodium) { this.sodium = sodium; }
    public void setPhosphore(Double phosphore) { this.phosphore = phosphore; }
    public void setDfg(Double dfg) { this.dfg = dfg; }
    public void setCreatinine(Double creatinine) { this.creatinine = creatinine; }
    public void setAlbumine(Double albumine) { this.albumine = albumine; }
    public void setGlychemie(Double glycemie) { this.glycemie = glycemie; }
}