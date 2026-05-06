package com.example.NEPHRO.feign.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO miroir minimal du prescription-Service.
 */
public class PrescriptionDTO {
    private Long id;
    private Long patientId;
    private LocalDate prescriptionDate;
    private String notes;
    private List<PrescriptionItemDTO> prescriptionItems;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public LocalDate getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(LocalDate prescriptionDate) { this.prescriptionDate = prescriptionDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<PrescriptionItemDTO> getPrescriptionItems() { return prescriptionItems; }
    public void setPrescriptionItems(List<PrescriptionItemDTO> prescriptionItems) { this.prescriptionItems = prescriptionItems; }
}

