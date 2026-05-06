package com.example.nutrition_service.repository;

import com.example.nutrition_service.entity.Aliment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlimentRepository extends JpaRepository<Aliment, Long> {

    record AlimentsDisponiblesCriteria(
            Long patientId,
            double kMax,
            double naMax,
            double pMax,
            double protMax,
            double sucreMax,
            int ageMois,
            boolean exclureTacrolimus) {
    }

    // Recherche par nom
    List<Aliment> findByNomContainingIgnoreCase(String nom);

    // Recherche par catégorie
    List<Aliment> findByCategorie(String categorie);

    // Aliments avec interaction Tacrolimus
    List<Aliment> findByInteractionTacrolimusTrue();

    // Aliments avec interaction Cyclosporine
    List<Aliment> findByInteractionCyclosporineTrue();

    // Aliments avec potassium élevé (> seuil)
    List<Aliment> findByPotassiumMgGreaterThan(Integer seuil);

    // Aliments avec restriction d'âge
    List<Aliment> findByAgeMinimumMoisGreaterThan(Integer ageMois);

    // Vérifier unicité du nom
    boolean existsByNomIgnoreCase(String nom);
    boolean existsByNomIgnoreCaseAndIdNot(String nom, Long id);
    @Query("SELECT a FROM Aliment a " +
            "WHERE a.id NOT IN (" +
            "  SELECT r.alimentId FROM RestrictionAlimentaire r " +
            "  WHERE r.patientId = :#{#criteria.patientId()} " +
            "  AND r.dateFin IS NULL" +
            ") " +
            "AND (a.potassiumMg IS NULL OR a.potassiumMg <= :#{#criteria.kMax()}) " +
            "AND (a.sodiumMg IS NULL OR a.sodiumMg <= :#{#criteria.naMax()}) " +
            "AND (a.phosphoreMg IS NULL OR a.phosphoreMg <= :#{#criteria.pMax()}) " +
            "AND (a.proteinesG IS NULL OR a.proteinesG <= :#{#criteria.protMax()}) " +
            "AND (a.sucreG IS NULL OR a.sucreG <= :#{#criteria.sucreMax()}) " +
            "AND (a.ageMinimumMois IS NULL OR a.ageMinimumMois <= :#{#criteria.ageMois()}) " +
            "AND (:#{#criteria.exclureTacrolimus()} = false OR a.interactionTacrolimus = false) " +
            "ORDER BY a.categorie, a.nom")
    List<Aliment> findAlimentsDisponibles(@Param("criteria") AlimentsDisponiblesCriteria criteria);
}
