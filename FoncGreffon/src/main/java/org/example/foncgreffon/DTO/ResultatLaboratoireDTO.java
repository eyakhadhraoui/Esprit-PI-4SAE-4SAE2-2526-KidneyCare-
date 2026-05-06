package org.example.foncgreffon.DTO;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO simplifié pour les résultats de laboratoire reçus de NEPHRO (DossierMedical).
 * Utilisé par le Feign client NephroLaboClient.
 */
public class ResultatLaboratoireDTO {

    private Long idResultatLaboratoire;
    private Long idDossierMedical;
    private Long idTestLaboratoire;

    private LocalDateTime datePrelevement;
    private LocalDate dateResultat;

    private Double valeurNumerique;
    private String valeurTexte;
    private String unite;
    private String conclusion;
    private String interpretation;

    private String nomTest;
    private String codeTest;

    public ResultatLaboratoireDTO() {}

    public Long getIdResultatLaboratoire() { return idResultatLaboratoire; }
    public void setIdResultatLaboratoire(Long idResultatLaboratoire) { this.idResultatLaboratoire = idResultatLaboratoire; }

    public Long getIdDossierMedical() { return idDossierMedical; }
    public void setIdDossierMedical(Long idDossierMedical) { this.idDossierMedical = idDossierMedical; }

    public Long getIdTestLaboratoire() { return idTestLaboratoire; }
    public void setIdTestLaboratoire(Long idTestLaboratoire) { this.idTestLaboratoire = idTestLaboratoire; }

    public LocalDateTime getDatePrelevement() { return datePrelevement; }
    public void setDatePrelevement(LocalDateTime datePrelevement) { this.datePrelevement = datePrelevement; }

    public LocalDate getDateResultat() { return dateResultat; }
    public void setDateResultat(LocalDate dateResultat) { this.dateResultat = dateResultat; }

    public Double getValeurNumerique() { return valeurNumerique; }
    public void setValeurNumerique(Double valeurNumerique) { this.valeurNumerique = valeurNumerique; }

    public String getValeurTexte() { return valeurTexte; }
    public void setValeurTexte(String valeurTexte) { this.valeurTexte = valeurTexte; }

    public String getUnite() { return unite; }
    public void setUnite(String unite) { this.unite = unite; }

    public String getConclusion() { return conclusion; }
    public void setConclusion(String conclusion) { this.conclusion = conclusion; }

    public String getInterpretation() { return interpretation; }
    public void setInterpretation(String interpretation) { this.interpretation = interpretation; }

    public String getNomTest() { return nomTest; }
    public void setNomTest(String nomTest) { this.nomTest = nomTest; }

    public String getCodeTest() { return codeTest; }
    public void setCodeTest(String codeTest) { this.codeTest = codeTest; }
}
