package com.esprit.microservice.projetconsultation.Consultation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
public class Consultation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idConsultation;
    private Date dateConsultation; // camelCase
    private String diagnostic;
    private String notes;
    private Integer idDossiermedical;

    @ManyToOne(fetch = FetchType.EAGER)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    private Medecin medecin;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "consultation", orphanRemoval = true)
    @JsonIgnore  // Évite référence circulaire Consultation → Rapport → Consultation
    private List<Rapport> rapports;
    @OneToOne
    @JsonIgnore  // Évite référence circulaire Rendezvous ↔ Consultation lors de la sérialisation JSON
    private Rendezvous rendezvous;
}
