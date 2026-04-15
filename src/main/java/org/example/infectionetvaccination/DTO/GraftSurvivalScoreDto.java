package org.example.infectionetvaccination.DTO;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GraftSurvivalScoreDto {

    private Long id;
    private String patientId;
    private LocalDateTime calculatedAt;

    private Double survivalProbability1Year;
    private Double survivalProbability3Year;
    private Double survivalProbability5Year;

    private String riskLevel;            // LOW / MODERATE / HIGH / CRITICAL (or use enum if shared)

    private Double eGFRSlope;
    private Double creatinineSlope;
    private Integer rejectionEpisodeCount;
    private Boolean hasChronicDecline;
    private Boolean hasAcuteDecline;
    private Double tacrolimusVariability;

    private String calculationModel;
    private String notes;

    // constructors, getters, setters ...
    // (generate them – I'll show the most important ones)

    public GraftSurvivalScoreDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public LocalDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(LocalDateTime calculatedAt) { this.calculatedAt = calculatedAt; }

    public Double getSurvivalProbability1Year() { return survivalProbability1Year; }
    public void setSurvivalProbability1Year(Double survivalProbability1Year) { this.survivalProbability1Year = survivalProbability1Year; }

    public Double getSurvivalProbability3Year() { return survivalProbability3Year; }
    public void setSurvivalProbability3Year(Double survivalProbability3Year) { this.survivalProbability3Year = survivalProbability3Year; }

    public Double getSurvivalProbability5Year() { return survivalProbability5Year; }
    public void setSurvivalProbability5Year(Double survivalProbability5Year) { this.survivalProbability5Year = survivalProbability5Year; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public Double geteGFRSlope() { return eGFRSlope; }
    public void seteGFRSlope(Double eGFRSlope) { this.eGFRSlope = eGFRSlope; }

    public Double getCreatinineSlope() { return creatinineSlope; }
    public void setCreatinineSlope(Double creatinineSlope) { this.creatinineSlope = creatinineSlope; }

    public Integer getRejectionEpisodeCount() { return rejectionEpisodeCount; }
    public void setRejectionEpisodeCount(Integer rejectionEpisodeCount) { this.rejectionEpisodeCount = rejectionEpisodeCount; }

    public Boolean getHasChronicDecline() { return hasChronicDecline; }
    public void setHasChronicDecline(Boolean hasChronicDecline) { this.hasChronicDecline = hasChronicDecline; }

    public Boolean getHasAcuteDecline() { return hasAcuteDecline; }
    public void setHasAcuteDecline(Boolean hasAcuteDecline) { this.hasAcuteDecline = hasAcuteDecline; }

    public Double getTacrolimusVariability() { return tacrolimusVariability; }
    public void setTacrolimusVariability(Double tacrolimusVariability) { this.tacrolimusVariability = tacrolimusVariability; }

    public String getCalculationModel() { return calculationModel; }
    public void setCalculationModel(String calculationModel) { this.calculationModel = calculationModel; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}