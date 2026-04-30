package com.esprit.microservice.projetparametrevital.Parametrevital.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Corps JSON pour mise à jour d’un indicateur (sans relations OneToMany). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IndicateurVitalDTO {
    private String nomIndicateur;
    private String unite;
    private String description;
    private Boolean actif;
}
