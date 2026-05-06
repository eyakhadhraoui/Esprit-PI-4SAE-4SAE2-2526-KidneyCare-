package com.example.Nutrition_Service.dto;

import java.time.LocalDateTime;

// ✅ Classe PUBLIC + nom exact NutritionStatsDTO
public class NutritionStatsDTO {

    public static class DashboardStatsDTO {
        private Long   patientsAvecRegime;
        private Long   patientsAucunRegime;
        private Long   alertesNonLues;
        private Double moyenneCalories;
        private Long   restrictionsActives;
        private Long   restrictionsAuto;

        public DashboardStatsDTO() {}
        public DashboardStatsDTO(Long patientsAvecRegime, Long patientsAucunRegime,
                                 Long alertesNonLues, Double moyenneCalories,
                                 Long restrictionsActives, Long restrictionsAuto) {
            this.patientsAvecRegime  = patientsAvecRegime;
            this.patientsAucunRegime = patientsAucunRegime;
            this.alertesNonLues      = alertesNonLues;
            this.moyenneCalories     = moyenneCalories != null ? Math.round(moyenneCalories * 10.0) / 10.0 : 0.0;
            this.restrictionsActives = restrictionsActives;
            this.restrictionsAuto    = restrictionsAuto;
        }
        public Long   getPatientsAvecRegime()  { return patientsAvecRegime; }
        public Long   getPatientsAucunRegime() { return patientsAucunRegime; }
        public Long   getAlertesNonLues()      { return alertesNonLues; }
        public Double getMoyenneCalories()     { return moyenneCalories; }
        public Long   getRestrictionsActives() { return restrictionsActives; }
        public Long   getRestrictionsAuto()    { return restrictionsAuto; }
    }

    public static class AnomalieDTO {
        private String type;
        private Long   patientId;
        private String message;
        private String severite;
        private String dateDetection;

        public AnomalieDTO() {}
        public AnomalieDTO(String type, Long patientId, String message, String severite) {
            this.type          = type;
            this.patientId     = patientId;
            this.message       = message;
            this.severite      = severite;
            this.dateDetection = LocalDateTime.now().toString();
        }
        public String getType()          { return type; }
        public Long   getPatientId()     { return patientId; }
        public String getMessage()       { return message; }
        public String getSeverite()      { return severite; }
        public String getDateDetection() { return dateDetection; }
    }

    public static class AlimentStatDTO {
        private Long   alimentId;
        private String alimentNom;
        private Long   nbRestrictions;
        private String raison;

        public AlimentStatDTO() {}
        public AlimentStatDTO(Long alimentId, Long nbRestrictions, String raison) {
            this.alimentId      = alimentId;
            this.nbRestrictions = nbRestrictions;
            this.raison         = raison;
        }
        public Long   getAlimentId()      { return alimentId; }
        public String getAlimentNom()     { return alimentNom; }
        public Long   getNbRestrictions() { return nbRestrictions; }
        public String getRaison()         { return raison; }
        public void   setAlimentNom(String n) { this.alimentNom = n; }
    }

    public static class RisquePatientDTO {
        private Long    patientId;
        private Integer scoreRisque;
        private String  niveauRisque;
        private String  couleur;

        public RisquePatientDTO() {}
        public RisquePatientDTO(Long patientId, Long score) {
            this.patientId   = patientId;
            this.scoreRisque = score != null ? score.intValue() : 0;
            if      (this.scoreRisque >= 6) { this.niveauRisque = "CRITIQUE"; this.couleur = "#c53030"; }
            else if (this.scoreRisque >= 4) { this.niveauRisque = "ELEVE";    this.couleur = "#dd6b20"; }
            else if (this.scoreRisque >= 2) { this.niveauRisque = "MODERE";   this.couleur = "#d69e2e"; }
            else                            { this.niveauRisque = "FAIBLE";   this.couleur = "#276749"; }
        }
        public Long    getPatientId()    { return patientId; }
        public Integer getScoreRisque()  { return scoreRisque; }
        public String  getNiveauRisque() { return niveauRisque; }
        public String  getCouleur()      { return couleur; }
    }

    public static class EvolutionPointDTO {
        private String  dateDebut;
        private Integer caloriesJour;
        private Double  potassiumMaxMg;
        private Double  poidsKg;
        private Double  proteinesMaxG;
        private Integer deltaCalories;
        private Double  deltaPotassium;

        public EvolutionPointDTO() {}
        public String  getDateDebut()      { return dateDebut; }
        public Integer getCaloriesJour()   { return caloriesJour; }
        public Double  getPotassiumMaxMg() { return potassiumMaxMg; }
        public Double  getPoidsKg()        { return poidsKg; }
        public Double  getProteinesMaxG()  { return proteinesMaxG; }
        public Integer getDeltaCalories()  { return deltaCalories; }
        public Double  getDeltaPotassium() { return deltaPotassium; }
        public void setDateDebut(String d)      { this.dateDebut = d; }
        public void setCaloriesJour(Integer c)  { this.caloriesJour = c; }
        public void setPotassiumMaxMg(Double p) { this.potassiumMaxMg = p; }
        public void setPoidsKg(Double p)        { this.poidsKg = p; }
        public void setProteinesMaxG(Double p)  { this.proteinesMaxG = p; }
        public void setDeltaCalories(Integer d) { this.deltaCalories = d; }
        public void setDeltaPotassium(Double d) { this.deltaPotassium = d; }
    }

    public static class ConformitePatientDTO {
        private Long          patientId;
        private Long          totalAlertes;
        private Long          alertesTraitees;
        private Long          alertesIgnorees;
        private Double        tauxConformite;
        private LocalDateTime premiereAlerte;
        private LocalDateTime derniereAlerte;

        public ConformitePatientDTO() {}
        public ConformitePatientDTO(Long patientId, Long total, Long traitees,
                                    Long ignorees, LocalDateTime premiere, LocalDateTime derniere) {
            this.patientId       = patientId;
            this.totalAlertes    = total;
            this.alertesTraitees = traitees;
            this.alertesIgnorees = ignorees;
            this.tauxConformite  = total > 0 ? Math.round((double) traitees / total * 1000.0) / 10.0 : 100.0;
            this.premiereAlerte  = premiere;
            this.derniereAlerte  = derniere;
        }
        public Long          getPatientId()       { return patientId; }
        public Long          getTotalAlertes()    { return totalAlertes; }
        public Long          getAlertesTraitees() { return alertesTraitees; }
        public Long          getAlertesIgnorees() { return alertesIgnorees; }
        public Double        getTauxConformite()  { return tauxConformite; }
        public LocalDateTime getPremiereAlerte()  { return premiereAlerte; }
        public LocalDateTime getDerniereAlerte()  { return derniereAlerte; }
    }

    public static class CorrelationDTO {
        private Long          alimentId;
        private String        alimentNom;
        private Long          nbAlertesLiees;
        private LocalDateTime derniereAlerte;
        private String        typeAlerte;

        public CorrelationDTO() {}
        public CorrelationDTO(Long alimentId, Long nb, LocalDateTime derniere, String type) {
            this.alimentId      = alimentId;
            this.nbAlertesLiees = nb;
            this.derniereAlerte = derniere;
            this.typeAlerte     = type;
        }
        public Long          getAlimentId()      { return alimentId; }
        public String        getAlimentNom()     { return alimentNom; }
        public Long          getNbAlertesLiees() { return nbAlertesLiees; }
        public LocalDateTime getDerniereAlerte() { return derniereAlerte; }
        public String        getTypeAlerte()     { return typeAlerte; }
        public void          setAlimentNom(String n) { this.alimentNom = n; }
    }
}