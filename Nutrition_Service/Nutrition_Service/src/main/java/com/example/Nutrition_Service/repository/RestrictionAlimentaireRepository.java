package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.RestrictionAlimentaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RestrictionAlimentaireRepository extends JpaRepository<RestrictionAlimentaire, Long> {

    // Restrictions actives pour un patient (dateFin = NULL)
    @Query("SELECT r FROM RestrictionAlimentaire r WHERE r.patientId = ?1 AND r.dateFin IS NULL")
    List<RestrictionAlimentaire> findActiveByPatientId(Long patientId);

    // Toutes les restrictions d'un patient (historique)
    List<RestrictionAlimentaire> findByPatientIdOrderByDateDebutDesc(Long patientId);

    // Restrictions pour un aliment spécifique
    List<RestrictionAlimentaire> findByAlimentIdAndDateFinIsNull(Long alimentId);

    // Restrictions par raison
    List<RestrictionAlimentaire> findByRaison(RestrictionAlimentaire.RaisonRestriction raison);

    // Restrictions créées automatiquement
    List<RestrictionAlimentaire> findByCreeAutomatiquementTrue();

    // Vérifier si restriction existe déjà pour patient + aliment
    @Query("SELECT COUNT(r) > 0 FROM RestrictionAlimentaire r WHERE r.patientId = ?1 AND r.alimentId = ?2 AND r.dateFin IS NULL")
    boolean existsActiveRestriction(Long patientId, Long alimentId);
}