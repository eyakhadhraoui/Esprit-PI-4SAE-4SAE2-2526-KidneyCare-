package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.DossierMedical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DossierMedicalRepository extends JpaRepository<DossierMedical, Long> {

    // Trouve le dossier médical du patient
    Optional<DossierMedical> findByPatientId(Long patientId);
}