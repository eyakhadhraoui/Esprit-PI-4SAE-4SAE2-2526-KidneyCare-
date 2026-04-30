package com.esprit.microservice.projetparametrevital.Parametrevital.dto;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ParametreVitalDTO {
    private Integer idParametreVital;
    private Integer idResultatLaboratoire;
    private String nomParametre;
    private Float valeurMesuree;
    private String unite;
    private Float referenceMin;
    private Float referenceMax;
    private String etat;
    private Float poids;
    private Float taille;
    private Integer age;
    private Float imc;

    private Integer constanteVitaleId;
}

