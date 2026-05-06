package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BesoinNutritionnelRepository extends JpaRepository<BesoinNutritionnel, Long> {

    // Besoin actif pour un patient (dateFin = NULL).
    // Use the most recent active besoin when duplicates exist, instead of failing on non-unique results.
    Optional<BesoinNutritionnel> findFirstByPatientIdAndDateFinIsNullOrderByDateDebutDesc(Long patientId);

    // Tous les besoins d'un patient (historique)
    List<BesoinNutritionnel> findByPatientIdOrderByDateDebutDesc(Long patientId);

    // Besoins avec Tacrolimus
    List<BesoinNutritionnel> findByTraitementTacrolimusTrue();

    // Besoins avec Prednisone
    List<BesoinNutritionnel> findByTraitementPrednisoneTrue();
}