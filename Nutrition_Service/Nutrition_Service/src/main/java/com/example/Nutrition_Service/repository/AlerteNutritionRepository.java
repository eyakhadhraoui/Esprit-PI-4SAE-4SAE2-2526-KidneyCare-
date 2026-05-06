package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.AlerteNutrition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlerteNutritionRepository extends JpaRepository<AlerteNutrition, Long> {

    // ─── Basiques ───────────────────────────────────────────────────────────────

    List<AlerteNutrition> findByPatientId(Long patientId);

    List<AlerteNutrition> findByPatientIdAndLueFalse(Long patientId);

    // ─── Manquantes — utilisées dans AlerteNutritionService ─────────────────────

    // Utilisée dans getUnreadAlertesForPatient() et markAllAsReadForPatient()
    List<AlerteNutrition> findByPatientIdAndLueFalseOrderByDateAlerteDesc(Long patientId);

    // Utilisée dans countUnreadAlertes()
    Long countByPatientIdAndLueFalse(Long patientId);

    // Utilisée dans getRecentAlertes()
    List<AlerteNutrition> findByDateAlerteAfterOrderByDateAlerteDesc(LocalDateTime since);

    // ─── Avec @Query ────────────────────────────────────────────────────────────

    @Query("SELECT COUNT(a) FROM AlerteNutrition a WHERE a.patientId = :patientId AND a.lue = false")
    Long countUnreadByPatientId(@Param("patientId") Long patientId);

    // Utilisée dans NutritionStatsService
    Long countByPatientIdAndLue(Long patientId, Boolean lue);

    @Query("SELECT a FROM AlerteNutrition a WHERE a.patientId = :patientId ORDER BY a.dateAlerte DESC")
    List<AlerteNutrition> findByPatientIdOrderByDateAlerteDesc(@Param("patientId") Long patientId);

    @Query("SELECT a FROM AlerteNutrition a ORDER BY a.dateAlerte DESC")
    List<AlerteNutrition> findAllOrderByDateDesc();
}