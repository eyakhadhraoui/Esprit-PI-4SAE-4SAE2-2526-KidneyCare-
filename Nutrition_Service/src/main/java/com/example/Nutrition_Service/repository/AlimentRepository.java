package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.Aliment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlimentRepository extends JpaRepository<Aliment, Long> {

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
            "  WHERE r.patientId = :patientId " +
            "  AND r.dateFin IS NULL" +
            ") " +
            "AND (a.potassiumMg IS NULL OR a.potassiumMg <= :kMax) " +
            "AND (a.sodiumMg IS NULL OR a.sodiumMg <= :naMax) " +
            "AND (a.phosphoreMg IS NULL OR a.phosphoreMg <= :pMax) " +
            "AND (a.proteinesG IS NULL OR a.proteinesG <= :protMax) " +
            "AND (a.sucreG IS NULL OR a.sucreG <= :sucreMax) " +
            "AND (a.ageMinimumMois IS NULL OR a.ageMinimumMois <= :ageMois) " +
            "AND (:exclureTacrolimus = false OR a.interactionTacrolimus = false) " +
            "ORDER BY a.categorie, a.nom")
    List<Aliment> findAlimentsDisponibles(
            @Param("patientId")         Long patientId,
            @Param("kMax")              double kMax,
            @Param("naMax")             double naMax,
            @Param("pMax")              double pMax,
            @Param("protMax")           double protMax,
            @Param("sucreMax")          double sucreMax,
            @Param("ageMois")           int ageMois,
            @Param("exclureTacrolimus") boolean exclureTacrolimus
    );
}