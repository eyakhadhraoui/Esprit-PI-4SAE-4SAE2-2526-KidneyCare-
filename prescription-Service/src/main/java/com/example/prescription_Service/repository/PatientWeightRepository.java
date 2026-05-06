package com.example.prescription_Service.repository;

import com.example.prescription_Service.entity.PatientWeight;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientWeightRepository extends JpaRepository<PatientWeight, Long> {

    // Dernier poids d'un patient
    Optional<PatientWeight> findTopByPatientIdOrderByMeasuredAtDesc(Long patientId);

    // Historique complet
    List<PatientWeight> findByPatientIdOrderByMeasuredAtDesc(Long patientId);

    /** Les N derniers poids (ex. PageRequest.of(0, 2) pour comparer les 2 derniers). */
    List<PatientWeight> findByPatientIdOrderByMeasuredAtDesc(Long patientId, Pageable pageable);

    // Tous les patients qui ont au moins un poids enregistré
    @Query("""
        SELECT DISTINCT pw.patientId FROM PatientWeight pw
    """)
    List<Long> findAllPatientsWithWeightHistory();
}