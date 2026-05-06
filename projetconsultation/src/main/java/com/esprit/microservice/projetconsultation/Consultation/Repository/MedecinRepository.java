package com.esprit.microservice.projetconsultation.Consultation.repository;

import com.esprit.microservice.projetconsultation.Consultation.entity.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedecinRepository extends JpaRepository<Medecin, Long> {
    Optional<Medecin> findByUsername(String username);
}
