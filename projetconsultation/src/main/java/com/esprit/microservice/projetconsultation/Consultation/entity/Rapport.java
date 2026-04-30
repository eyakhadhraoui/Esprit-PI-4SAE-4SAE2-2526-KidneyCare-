package com.esprit.microservice.projetconsultation.Consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Rapport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRapport;
    private Date dateRapport;
    private String contenu;
    private String recommendations;
    private Long idMedecin;

    @ManyToOne
    private Consultation consultation;

}
