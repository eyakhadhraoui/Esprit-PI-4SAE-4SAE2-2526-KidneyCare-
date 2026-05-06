package com.example.prescription_Service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_weight")
public class PatientWeight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private Double weightKg;
    /** Taille en cm — optionnelle */
    private Double heightCm;
    private LocalDateTime measuredAt;

    public PatientWeight() {}

    public PatientWeight(Long patientId, Double weightKg, LocalDateTime measuredAt) {
        this.patientId = patientId;
        this.weightKg = weightKg;
        this.measuredAt = measuredAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long v) {
        this.patientId = v;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Double v) {
        this.weightKg = v;
    }

    public Double getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Double v) {
        this.heightCm = v;
    }

    public LocalDateTime getMeasuredAt() {
        return measuredAt;
    }

    public void setMeasuredAt(LocalDateTime v) {
        this.measuredAt = v;
    }
}
