package com.esprit.microservice.projetparametrevital.Parametrevital.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ParametreVital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    // ✅ FIX : affiche la constanteVitale liée SANS ses parametresVitaux
    // Casse la boucle : ParametreVital → ConstanteVitale → ParametreVital → ...
    @ManyToOne
    @JsonIgnoreProperties("parametresVitaux")
    private ConstanteVitale constanteVitale;
}