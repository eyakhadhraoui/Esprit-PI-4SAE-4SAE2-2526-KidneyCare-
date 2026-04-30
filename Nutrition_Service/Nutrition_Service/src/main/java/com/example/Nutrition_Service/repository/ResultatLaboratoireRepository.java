package com.example.Nutrition_Service.repository;

import com.example.Nutrition_Service.entity.ResultatLaboratoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultatLaboratoireRepository extends JpaRepository<ResultatLaboratoire, Long> {

    // Dernier bilan du dossier (date_resultat la plus récente)
    @Query("SELECT r FROM ResultatLaboratoire r " +
            "WHERE r.dossierMedicalId = :dossierId " +
            "AND r.dateResultat = (" +
            "  SELECT MAX(r2.dateResultat) FROM ResultatLaboratoire r2 " +
            "  WHERE r2.dossierMedicalId = :dossierId" +
            ")")
    List<ResultatLaboratoire> findDernierBilanByDossierId(@Param("dossierId") Long dossierId);
}
