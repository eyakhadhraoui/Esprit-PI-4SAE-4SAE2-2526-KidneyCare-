package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.Aliment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlimentRepository extends JpaRepository<Aliment, Long> {

    List<Aliment> findByNomContainingIgnoreCase(String nom);
    List<Aliment> findByCategorie(String categorie);
    List<Aliment> findByInteractionTacrolimusTrue();
    List<Aliment> findByInteractionCyclosporineTrue();
    List<Aliment> findByPotassiumMgGreaterThan(Integer seuil);
    List<Aliment> findByAgeMinimumMoisGreaterThan(Integer ageMois);
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

    @Query("""
        SELECT a FROM Aliment a
        WHERE a.id != :alimentRefuseId
        AND a.id NOT IN (
            SELECT ra.alimentId FROM RestrictionAlimentaire ra
            WHERE ra.patientId = :patientId
            AND ra.dateFin IS NULL
        )
        AND ABS(a.caloriesKcal  - :calories)  <= 100
        AND ABS(a.proteinesG    - :proteines) <= 8
        ORDER BY ABS(a.caloriesKcal - :calories) ASC
        """)
    List<Aliment> findSubstitutsDansAliments(
            @Param("patientId")       Long   patientId,
            @Param("alimentRefuseId") Long   alimentRefuseId,
            @Param("calories")        double calories,
            @Param("proteines")       double proteines
    );
}