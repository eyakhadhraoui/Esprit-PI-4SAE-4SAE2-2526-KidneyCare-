package com.esprit.microservice.projetconsultation.Consultation.Repository;

import com.esprit.microservice.projetconsultation.Consultation.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IConsultatonRepo extends JpaRepository<Consultation,Integer> {
    List<Consultation> findByMedecin_Username(String username);
    List<Consultation> findByRendezvousIsNull();
    List<Consultation> findByPatient_IdPatientOrderByDateConsultationDesc(Long idPatient);
}
