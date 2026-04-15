package org.example.infectionetvaccination.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GraftFunctionEntry {

    private Long id;

    private String patientId;
    private LocalDate measurementDate;

    private Double creatinine;
    private Double eGFR;
    private Double urineOutput;
    private Double tacrolimusLevel;
    private Double systolicBP;
    private Double diastolicBP;
    private Double weight;
    private Double temperature;

    private String collectionType;
    private String notes;
    private LocalDateTime createdAt;

    public GraftFunctionEntry() {}

    public GraftFunctionEntry(Long id, String patientId, LocalDate measurementDate,
                              Double creatinine, Double eGFR, Double urineOutput,
                              Double tacrolimusLevel, Double systolicBP, Double diastolicBP,
                              Double weight, Double temperature, String collectionType,
                              String notes, LocalDateTime createdAt) {
        this.id = id;
        this.patientId = patientId;
        this.measurementDate = measurementDate;
        this.creatinine = creatinine;
        this.eGFR = eGFR;
        this.urineOutput = urineOutput;
        this.tacrolimusLevel = tacrolimusLevel;
        this.systolicBP = systolicBP;
        this.diastolicBP = diastolicBP;
        this.weight = weight;
        this.temperature = temperature;
        this.collectionType = collectionType;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    // ✅ GETTERS & SETTERS

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public LocalDate getMeasurementDate() { return measurementDate; }
    public void setMeasurementDate(LocalDate measurementDate) { this.measurementDate = measurementDate; }

    public Double getCreatinine() { return creatinine; }
    public void setCreatinine(Double creatinine) { this.creatinine = creatinine; }

    public Double geteGFR() { return eGFR; }
    public void seteGFR(Double eGFR) { this.eGFR = eGFR; }

    public Double getUrineOutput() { return urineOutput; }
    public void setUrineOutput(Double urineOutput) { this.urineOutput = urineOutput; }

    public Double getTacrolimusLevel() { return tacrolimusLevel; }
    public void setTacrolimusLevel(Double tacrolimusLevel) { this.tacrolimusLevel = tacrolimusLevel; }

    public Double getSystolicBP() { return systolicBP; }
    public void setSystolicBP(Double systolicBP) { this.systolicBP = systolicBP; }

    public Double getDiastolicBP() { return diastolicBP; }
    public void setDiastolicBP(Double diastolicBP) { this.diastolicBP = diastolicBP; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public String getCollectionType() { return collectionType; }
    public void setCollectionType(String collectionType) { this.collectionType = collectionType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}