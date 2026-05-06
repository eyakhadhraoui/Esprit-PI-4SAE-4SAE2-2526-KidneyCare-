package com.example.nutrition_service.repository;

import com.example.nutrition_service.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    // findById est déjà inclus dans JpaRepository
    // rien à ajouter
}
