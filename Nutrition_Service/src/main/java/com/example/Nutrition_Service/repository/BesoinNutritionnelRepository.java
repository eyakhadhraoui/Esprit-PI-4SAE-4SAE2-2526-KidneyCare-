package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BesoinNutritionnelRepository extends JpaRepository<BesoinNutritionnel, Long> {

    // Besoin actif pour un patient (dateFin = NULL)
    @Query("SELECT b FROM BesoinNutritionnel b WHERE b.patientId = ?1 AND b.dateFin IS NULL")
    Optional<BesoinNutritionnel> findActiveByPatientId(Long patientId);

    // Tous les besoins d'un patient (historique)
    List<BesoinNutritionnel> findByPatientIdOrderByDateDebutDesc(Long patientId);

    // Besoins avec Tacrolimus
    List<BesoinNutritionnel> findByTraitementTacrolimusTrue();

    // Besoins avec Prednisone
    List<BesoinNutritionnel> findByTraitementPrednisoneTrue();



        @Query("SELECT b FROM BesoinNutritionnel b " +
                "WHERE b.patientId = :patientId " +
                "AND b.dateDebut <= CURRENT_DATE " +
                "AND (b.dateFin IS NULL OR b.dateFin >= CURRENT_DATE) " +
                "ORDER BY b.dateDebut DESC " +
                "LIMIT 1")
        Optional<BesoinNutritionnel> findActiveBesoinForPatient(
                @Param("patientId") Long patientId);
    }