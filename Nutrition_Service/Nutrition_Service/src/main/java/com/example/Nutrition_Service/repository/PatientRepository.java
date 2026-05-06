package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    // findById est déjà inclus dans JpaRepository
    // rien à ajouter
}
