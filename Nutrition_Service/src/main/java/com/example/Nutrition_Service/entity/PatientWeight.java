package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "patient_weight")
public class PatientWeight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "measured_at")
    private LocalDateTime measuredAt;

    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public Double getWeightKg() { return weightKg; }
    public Double getHeightCm() { return heightCm; }
    public LocalDateTime getMeasuredAt() { return measuredAt; }

}