package com.esprit.microservice.projetparametrevital.Parametrevital.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ConstanteVitaleDTO {
    private Integer idConstanteVitale;
    private String nomParametre;
    private Float valeurMinNormale;
    private Float valeurMaxNormale;
    private String unite;
    private Float poidsMin;
    private Float poidsMax;
    private Float tailleMin;
    private Float tailleMax;
    private Integer idIndicateurVital;
}
