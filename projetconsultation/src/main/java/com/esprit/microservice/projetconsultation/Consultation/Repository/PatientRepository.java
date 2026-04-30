package com.esprit.microservice.projetconsultation.Consultation.repository;

import com.esprit.microservice.projetconsultation.Consultation.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
