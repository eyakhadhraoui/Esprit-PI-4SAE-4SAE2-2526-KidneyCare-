package com.example.Nutrition_Service.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "resultat_laboratoire")
public class ResultatLaboratoire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_resultat_laboratoire")
    private Long id;

    @Column(name = "id_dossier_medical")
    private Long dossierMedicalId;

    @Column(name = "date_resultat")
    private LocalDate dateResultat;

    @Column(name = "valeur_numerique")
    private Double valeurNumerique;

    @Column(name = "valeur_resultat")
    private String valeurResultat;

    @Column(name = "interpretation")
    private String interpretation;

    @Column(name = "statut_resultat")
    private String statutResultat;

    @Column(name = "unite")
    private String unite;

    // ── Getters ──
    public Long getId() { return id; }
    public Long getDossierMedicalId() { return dossierMedicalId; }
    public LocalDate getDateResultat() { return dateResultat; }
    public Double getValeurNumerique() { return valeurNumerique; }
    public String getValeurResultat() { return valeurResultat; }
    public String getInterpretation() { return interpretation; }
    public String getStatutResultat() { return statutResultat; }
    public String getUnite() { return unite; }

    // ── Setters ──
    public void setId(Long id) { this.id = id; }
    public void setDossierMedicalId(Long dossierMedicalId) { this.dossierMedicalId = dossierMedicalId; }
    public void setDateResultat(LocalDate dateResultat) { this.dateResultat = dateResultat; }
    public void setValeurNumerique(Double valeurNumerique) { this.valeurNumerique = valeurNumerique; }
    public void setValeurResultat(String valeurResultat) { this.valeurResultat = valeurResultat; }
    public void setInterpretation(String interpretation) { this.interpretation = interpretation; }
    public void setStatutResultat(String statutResultat) { this.statutResultat = statutResultat; }
    public void setUnite(String unite) { this.unite = unite; }
}