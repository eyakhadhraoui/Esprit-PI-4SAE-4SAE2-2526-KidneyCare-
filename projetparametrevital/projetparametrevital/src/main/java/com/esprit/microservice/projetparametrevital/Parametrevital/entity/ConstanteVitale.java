package com.esprit.microservice.projetparametrevital.Parametrevital.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ConstanteVitale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idConstanteVitale;

    private String nomParametre;
    private Float valeurMinNormale;
    private Float valeurMaxNormale;
    private String unite;
    private Float poidsMin;
    private Float poidsMax;
    private Float tailleMin;
    private Float tailleMax;

    // ✅ FIX : @JsonIgnore — on n'a pas besoin d'afficher les parametresVitaux
    // depuis une ConstanteVitale, et ça cassait la boucle :
    // ConstanteVitale → ParametreVital → ConstanteVitale → ...
    @JsonIgnore
    @OneToMany(mappedBy = "constanteVitale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParametreVital> parametresVitaux;

    // ✅ FIX : affiche l'indicateur lié SANS ses constantesVitales
    // Casse la boucle : ConstanteVitale → IndicateurVital → ConstanteVitale → ...
    @ManyToOne
    @JsonIgnoreProperties("constantesVitales")
    private IndicateurVital indicateurVital;
}