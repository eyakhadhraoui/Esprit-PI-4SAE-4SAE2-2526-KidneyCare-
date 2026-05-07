package com.example.NEPHRO.feign.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO miroir minimal du prescription-Service.
 */
public class PrescriptionItemDTO {
    private Long id;
    private Long prescriptionId;
    private Long medicationId;
    private String dosageInstructions;
    private String frequency;
    private Integer duration;
    private String administrationRoute;
    private LocalDate startDate;
    private LocalDate endDate;
    private String specialInstructions;
    private Boolean isPriority;
    private Boolean isImmunosuppressor;
    private List<LocalTime> scheduledTimes;
    private String medicationName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }

    public Long getMedicationId() { return medicationId; }
    public void setMedicationId(Long medicationId) { this.medicationId = medicationId; }

    public String getDosageInstructions() { return dosageInstructions; }
    public void setDosageInstructions(String dosageInstructions) { this.dosageInstructions = dosageInstructions; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getAdministrationRoute() { return administrationRoute; }
    public void setAdministrationRoute(String administrationRoute) { this.administrationRoute = administrationRoute; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public Boolean getIsPriority() { return isPriority; }
    public void setIsPriority(Boolean isPriority) { this.isPriority = isPriority; }

    public Boolean getIsImmunosuppressor() { return isImmunosuppressor; }
    public void setIsImmunosuppressor(Boolean isImmunosuppressor) { this.isImmunosuppressor = isImmunosuppressor; }

    public List<LocalTime> getScheduledTimes() { return scheduledTimes; }
    public void setScheduledTimes(List<LocalTime> scheduledTimes) { this.scheduledTimes = scheduledTimes; }

    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }
}

