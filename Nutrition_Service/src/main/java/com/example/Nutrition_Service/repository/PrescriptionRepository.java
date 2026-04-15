package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.Medication;
import com.example.Nutrition_Service.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    // Récupère tous les médicaments actifs du patient
    // depuis prescription → prescription_item → medication
    @Query("SELECT m FROM Prescription p " +
            "JOIN PrescriptionItem pi ON pi.prescriptionId = p.id " +
            "JOIN Medication m ON m.id = pi.medicationId " +
            "WHERE p.patientId = :patientId " +
            "AND p.statut = 'ACTIVE' " +
            "AND (p.dateFin IS NULL OR p.dateFin >= CURRENT_DATE)")
    List<Medication> findMedicamentsActifs(@Param("patientId") Long patientId);
}
