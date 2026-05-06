package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "dossier_medical")
public class DossierMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_dossier_medical")
    private Long id;

    @Column(name = "id_patient")
    private Long patientId;

    @Column(name = "poids")
    private BigDecimal poids;

    @Column(name = "taille")
    private BigDecimal taille;

    @Column(name = "diagnostic")
    private String diagnostic;

    @Column(name = "date_creation")
    private LocalDate dateCreation;

    // ── Getters ──
    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public BigDecimal getPoids() { return poids; }
    public BigDecimal getTaille() { return taille; }
    public String getDiagnostic() { return diagnostic; }
    public LocalDate getDateCreation() { return dateCreation; }

    // ── Setters ──
    public void setId(Long id) { this.id = id; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public void setPoids(BigDecimal poids) { this.poids = poids; }
    public void setTaille(BigDecimal taille) { this.taille = taille; }
    public void setDiagnostic(String diagnostic) { this.diagnostic = diagnostic; }
    public void setDateCreation(LocalDate dateCreation) { this.dateCreation = dateCreation; }
}