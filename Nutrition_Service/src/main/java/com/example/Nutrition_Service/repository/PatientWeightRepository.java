package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.PatientWeight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientWeightRepository
        extends JpaRepository<PatientWeight, Long> {

    // Dernier poids mesuré du patient
    @Query("SELECT pw FROM PatientWeight pw " +
            "WHERE pw.patientId = :patientId " +
            "ORDER BY pw.measuredAt DESC " +
            "LIMIT 1")
    Optional<PatientWeight> findDernierPoidsByPatientId(
            @Param("patientId") Long patientId);
}