package com.esprit.microservice.projetconsultation.Consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

/**
 * DTO pour l'ajout d'une consultation : idPatient et idMedecin
 * sont pris des entités Patient et Medecin.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddConsultationRequest {
    private Date dateConsultation;
    private String diagnostic;
    private String notes;
    private Integer idDossiermedical;
    private Long idPatient;
    private Long idMedecin;
    private RendezvousRef rendezvous;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RendezvousRef {
        private Integer idRendezvous;
    }
}
