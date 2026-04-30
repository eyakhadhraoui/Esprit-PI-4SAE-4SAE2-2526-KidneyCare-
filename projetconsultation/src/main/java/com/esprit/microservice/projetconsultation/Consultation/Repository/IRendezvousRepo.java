package com.esprit.microservice.projetconsultation.Consultation.Repository;

import com.esprit.microservice.projetconsultation.Consultation.entity.Rendezvous;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IRendezvousRepo extends JpaRepository<Rendezvous,Integer> {
    List<Rendezvous> findByConsultationIsNull();
}
