package com.esprit.microservice.projetconsultation.Consultation.repository;

import com.esprit.microservice.projetconsultation.Consultation.entity.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserApp, Long> {
    Optional<UserApp> findByKeycloakSubject(String keycloakSubject);
    Optional<UserApp> findByUsername(String username);
}
