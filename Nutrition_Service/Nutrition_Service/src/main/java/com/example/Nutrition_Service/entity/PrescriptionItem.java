package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "prescription_item")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prescription_id")
    private Long prescriptionId;

    @Column(name = "medication_id")
    private Long medicationId;

    // getters
    public Long getId() { return id; }
    public Long getPrescriptionId() { return prescriptionId; }
    public Long getMedicationId() { return medicationId; }
}
