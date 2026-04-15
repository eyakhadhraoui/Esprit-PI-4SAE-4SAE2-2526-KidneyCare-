package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.Aliment;
import com.example.Nutrition_Service.entity.AlerteNutrition;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface Nutritionstatsrepository extends JpaRepository<BesoinNutritionnel, Long> {

    // ══════════════════════════════════════════════════════════════════════
    // F9 — TABLEAU DE BORD
    // JPQL : COUNT DISTINCT, AVG, COALESCE, IS NULL, NOT EXISTS
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT COUNT(DISTINCT b.patientId) FROM BesoinNutritionnel b " +
            "WHERE b.dateFin IS NULL OR b.dateFin >= CURRENT_DATE")
    Long countPatientsWithActiveRegime();

    @Query("SELECT COUNT(a) FROM AlerteNutrition a WHERE a.lue = false")
    Long countAllUnreadAlertes();

    @Query("SELECT COALESCE(AVG(b.caloriesJour), 0) FROM BesoinNutritionnel b " +
            "WHERE b.dateFin IS NULL OR b.dateFin >= CURRENT_DATE")
    Double avgCaloriesAllPatients();

    @Query("SELECT COUNT(r) FROM RestrictionAlimentaire r WHERE r.dateFin IS NULL")
    Long countActiveRestrictions();

    @Query("SELECT COUNT(DISTINCT r.patientId) FROM RestrictionAlimentaire r " +
            "WHERE NOT EXISTS (" +
            "  SELECT b FROM BesoinNutritionnel b " +
            "  WHERE b.patientId = r.patientId " +
            "  AND (b.dateFin IS NULL OR b.dateFin >= CURRENT_DATE)" +
            ")")
    Long countPatientsWithoutActiveRegime();

    @Query("SELECT COUNT(r) FROM RestrictionAlimentaire r " +
            "WHERE r.creeAutomatiquement = true AND r.dateFin IS NULL")
    Long countAutoRestrictions();

    // ══════════════════════════════════════════════════════════════════════
    // F10 — RECHERCHE MULTICRITÈRES
    // JPQL : EXISTS, NOT EXISTS, @Param dynamiques, DISTINCT
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT DISTINCT b FROM BesoinNutritionnel b " +
            "WHERE (:tacrolimus IS NULL OR b.traitementTacrolimus = :tacrolimus) " +
            "AND (:prednisone IS NULL OR b.traitementPrednisone = :prednisone) " +
            "AND (:potassiumMax IS NULL OR b.potassiumMaxMg < :potassiumMax) " +
            "AND (:caloriesMin IS NULL OR b.caloriesJour >= :caloriesMin) " +
            "AND (:avecAlertes IS NULL OR :avecAlertes = false OR EXISTS (" +
            "  SELECT a FROM AlerteNutrition a " +
            "  WHERE a.patientId = b.patientId AND a.lue = false" +
            ")) " +
            "AND (:avecRestrictions IS NULL OR :avecRestrictions = false OR EXISTS (" +
            "  SELECT r FROM RestrictionAlimentaire r " +
            "  WHERE r.patientId = b.patientId AND r.dateFin IS NULL" +
            ")) " +
            "AND (b.dateFin IS NULL OR b.dateFin >= CURRENT_DATE) " +
            "ORDER BY b.dateDebut DESC")
    List<BesoinNutritionnel> rechercheMulticriteres(
            @Param("tacrolimus")       Boolean tacrolimus,
            @Param("prednisone")       Boolean prednisone,
            @Param("potassiumMax")     Double  potassiumMax,
            @Param("caloriesMin")      Integer caloriesMin,
            @Param("avecAlertes")      Boolean avecAlertes,
            @Param("avecRestrictions") Boolean avecRestrictions);

    // ══════════════════════════════════════════════════════════════════════
    // F11 — DÉTECTION ANOMALIES
    // JPQL : NOT EXISTS, comparaison dates, ORDER BY ASC
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT b FROM BesoinNutritionnel b " +
            "WHERE (b.dateFin IS NULL OR b.dateFin >= CURRENT_DATE) " +
            "AND b.dateDebut < :dateLimite " +
            "AND NOT EXISTS (" +
            "  SELECT b2 FROM BesoinNutritionnel b2 " +
            "  WHERE b2.patientId = b.patientId " +
            "  AND b2.dateDebut > b.dateDebut" +
            ")")
    List<BesoinNutritionnel> findRegimesNonMisAJour(@Param("dateLimite") LocalDate dateLimite);

    @Query("SELECT a FROM AlerteNutrition a " +
            "WHERE a.lue = false " +
            "AND a.dateAlerte < :datelimite " +
            "ORDER BY a.dateAlerte ASC")
    List<AlerteNutrition> findAlertesIgnorees(@Param("datelimite") LocalDateTime datelimite);

    @Query("SELECT DISTINCT r.patientId FROM RestrictionAlimentaire r " +
            "WHERE r.dateFin IS NULL " +
            "AND NOT EXISTS (" +
            "  SELECT b FROM BesoinNutritionnel b " +
            "  WHERE b.patientId = r.patientId " +
            "  AND (b.dateFin IS NULL OR b.dateFin >= CURRENT_DATE)" +
            ")")
    List<Long> findPatientsSansRegimeMaisAvecRestrictions();

    // ══════════════════════════════════════════════════════════════════════
    // F12 — RAPPORT STATS ALIMENTS
    // JPQL : GROUP BY, HAVING, COUNT, ORDER BY DESC
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT r.alimentId, COUNT(r) AS nbRestrictions, r.raison " +
            "FROM RestrictionAlimentaire r " +
            "WHERE r.dateFin IS NULL " +
            "GROUP BY r.alimentId, r.raison " +
            "HAVING COUNT(r) >= 1 " +
            "ORDER BY COUNT(r) DESC")
    List<Object[]> findTopAlimentsRestreints();

    @Query("SELECT r.raison, COUNT(r) AS total " +
            "FROM RestrictionAlimentaire r " +
            "WHERE r.dateFin IS NULL " +
            "GROUP BY r.raison " +
            "ORDER BY total DESC")
    List<Object[]> countRestrictionsByRaison();

    @Query("SELECT r.patientId, COUNT(r) AS nbRestrictions " +
            "FROM RestrictionAlimentaire r " +
            "WHERE r.dateFin IS NULL " +
            "GROUP BY r.patientId " +
            "HAVING COUNT(r) > 0 " +
            "ORDER BY COUNT(r) DESC")
    List<Object[]> findPatientsLesPlusRestreints();

    // ══════════════════════════════════════════════════════════════════════
    // F13 — SCORE DE RISQUE
    // JPQL : CASE WHEN, SUM, COALESCE, GROUP BY, ORDER BY DESC
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT b.patientId, " +
            "  SUM(CASE WHEN b.potassiumMaxMg < 800 THEN 2 ELSE 0 END) + " +
            "  SUM(CASE WHEN b.traitementTacrolimus = true THEN 1 ELSE 0 END) + " +
            "  SUM(CASE WHEN b.traitementPrednisone = true THEN 1 ELSE 0 END) " +
            "  AS scoreRisque " +
            "FROM BesoinNutritionnel b " +
            "WHERE b.dateFin IS NULL OR b.dateFin >= CURRENT_DATE " +
            "GROUP BY b.patientId " +
            "ORDER BY scoreRisque DESC")
    List<Object[]> calculateRiskScores();

    // ══════════════════════════════════════════════════════════════════════
    // F14 — ÉVOLUTION NUTRITIONNELLE
    // JPQL : ORDER BY ASC, MAX sous-requête
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT b FROM BesoinNutritionnel b " +
            "WHERE b.patientId = :patientId " +
            "ORDER BY b.dateDebut ASC")
    List<BesoinNutritionnel> findHistoriquePatient(@Param("patientId") Long patientId);

    @Query("SELECT b FROM BesoinNutritionnel b " +
            "WHERE b.patientId = :patientId " +
            "AND b.dateDebut = (" +
            "  SELECT MAX(b2.dateDebut) FROM BesoinNutritionnel b2 " +
            "  WHERE b2.patientId = :patientId " +
            "  AND b2.dateDebut < :dateActuelle" +
            ")")
    List<BesoinNutritionnel> findRegimePrecedent(
            @Param("patientId")    Long      patientId,
            @Param("dateActuelle") LocalDate dateActuelle);

    // ══════════════════════════════════════════════════════════════════════
    // F15 — SUGGESTIONS ALIMENTS AUTORISÉS
    // JPQL : NOT IN sous-requête, multi-filtres conditionnels, ORDER BY
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT a FROM Aliment a " +
            "WHERE a.id NOT IN (" +
            "  SELECT r.alimentId FROM RestrictionAlimentaire r " +
            "  WHERE r.patientId = :patientId AND r.dateFin IS NULL" +
            ") " +
            "AND (:hasTacrolimus = false OR a.interactionTacrolimus = false) " +
            "AND (:hasCyclosporine = false OR a.interactionCyclosporine = false) " +
            "AND (a.ageMinimumMois IS NULL OR a.ageMinimumMois <= :ageMois) " +
            "AND (:potassiumMax IS NULL OR a.potassiumMg <= :potassiumMax) " +
            "AND (:sodiumMax IS NULL OR a.sodiumMg <= :sodiumMax) " +
            "AND (:phosphoreMax IS NULL OR a.phosphoreMg <= :phosphoreMax) " +
            "AND (:sucreMax IS NULL OR a.sucreG <= :sucreMax) " +
            "ORDER BY a.caloriesKcal ASC")
    List<Aliment> findAlimentsAutorisesForPatient(
            @Param("patientId")      Long    patientId,
            @Param("hasTacrolimus")  boolean hasTacrolimus,
            @Param("hasCyclosporine") boolean hasCyclosporine,
            @Param("ageMois")        Integer ageMois,
            @Param("potassiumMax")   Double  potassiumMax,
            @Param("sodiumMax")      Double  sodiumMax,
            @Param("phosphoreMax")   Double  phosphoreMax,
            @Param("sucreMax")       Double  sucreMax);

    // ══════════════════════════════════════════════════════════════════════
    // F16 — RAPPORT CONFORMITÉ
    // JPQL : SUM CASE WHEN, MIN, MAX, BETWEEN, GROUP BY, HAVING, ORDER BY
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT a.patientId, " +
            "  COUNT(a) AS totalAlertes, " +
            "  SUM(CASE WHEN a.lue = true  THEN 1 ELSE 0 END) AS alertesTraitees, " +
            "  SUM(CASE WHEN a.lue = false THEN 1 ELSE 0 END) AS alertesIgnorees, " +
            "  MIN(a.dateAlerte) AS premiereAlerte, " +
            "  MAX(a.dateAlerte) AS derniereAlerte " +
            "FROM AlerteNutrition a " +
            "WHERE a.dateAlerte BETWEEN :debut AND :fin " +
            "GROUP BY a.patientId " +
            "HAVING COUNT(a) > 0 " +
            "ORDER BY SUM(CASE WHEN a.lue = false THEN 1 ELSE 0 END) DESC")
    List<Object[]> getRapportConformite(
            @Param("debut") LocalDateTime debut,
            @Param("fin")   LocalDateTime fin);

    // ══════════════════════════════════════════════════════════════════════
    // F17 — CORRÉLATION ALIMENT-ALERTE
    // JPQL : JOIN métier, GROUP BY multi-colonnes, HAVING COUNT, MAX
    // ══════════════════════════════════════════════════════════════════════

    @Query("SELECT r.alimentId, " +
            "  COUNT(a) AS nbAlertesLiees, " +
            "  MAX(a.dateAlerte) AS derniereAlerte, " +
            "  a.type AS typeAlerte " +
            "FROM RestrictionAlimentaire r, AlerteNutrition a " +
            "WHERE a.patientId = r.patientId " +
            "AND r.patientId = :patientId " +
            "AND r.dateFin IS NULL " +
            "AND a.type = 'INTERACTION_MEDICAMENT' " +
            "AND a.dateAlerte >= r.dateDebut " +
            "GROUP BY r.alimentId, a.type " +
            "HAVING COUNT(a) > 0 " +
            "ORDER BY COUNT(a) DESC")
    List<Object[]> findCorrelationAlimentAlerte(@Param("patientId") Long patientId);
}