package com.example.NEPHRO.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestLaboratoireDTO {

    private Long idTestLaboratoire;

    @NotBlank(message = "Le code du test est obligatoire")
    private String codeTest;

    @NotBlank(message = "Le nom du test est obligatoire")
    private String nomTest;

    private String categorie;
    private String codeLoinc;
    private String typeEchantillon;
    private String unite;
    private String valeursNormales;
    private String methodeAnalyse;
    private Double prix;
    /** Délai de rendu habituel en heures. */
    private Integer delaiRenduHeures;
    /** Jeûne requis avant prélèvement. */
    private Boolean necessiteJeune;
}
