package com.esprit.microservice.projetconsultation.Consultation.Services;

import com.esprit.microservice.projetconsultation.Consultation.dto.RendezvousDTO;
import com.esprit.microservice.projetconsultation.Consultation.entity.Rendezvous;

import java.util.List;
import java.util.Optional;

public interface IRendezvousInterface {
    List<Rendezvous> retrieveRendezvous();

    Rendezvous addRendezvous(RendezvousDTO dto);

    Rendezvous updateRendezvous(RendezvousDTO rendezvousDTO);
    Optional<Rendezvous> retrieveRendezvousById(Integer idRendezvous);

    void removeRendezvous(Integer idRendezvous);
    List<Rendezvous> findByConsultationIsNull();
}
