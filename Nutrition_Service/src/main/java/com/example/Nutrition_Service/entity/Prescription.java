package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "prescription")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "statut")
    private String statut;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    // getters
    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public String getStatut() { return statut; }
    public LocalDate getDateDebut() { return dateDebut; }
    public LocalDate getDateFin() { return dateFin; }
}