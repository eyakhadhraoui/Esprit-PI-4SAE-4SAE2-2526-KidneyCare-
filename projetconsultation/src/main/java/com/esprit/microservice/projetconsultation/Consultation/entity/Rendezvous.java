package com.esprit.microservice.projetconsultation.Consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Rendezvous {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRendezvous;
    private Date dateRendezvous;
    private String etat;

    @ManyToOne(fetch = FetchType.EAGER)
    private Patient patient;

    @OneToOne(cascade = CascadeType.ALL)
    private Consultation consultation;

}
