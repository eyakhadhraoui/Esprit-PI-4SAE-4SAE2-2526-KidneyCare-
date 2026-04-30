package com.esprit.microservice.projetparametrevital.Parametrevital.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class IndicateurVital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idIndicateurVital;

    private String nomIndicateur;
    private String unite;
    private String description;
    private Boolean actif;

    // ✅ FIX : affiche les constantes liées SANS leur indicateurVital
    // Casse la boucle : IndicateurVital → ConstanteVitale → IndicateurVital → ...
    @OneToMany(mappedBy = "indicateurVital", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("indicateurVital")
    private List<ConstanteVitale> constantesVitales;
}