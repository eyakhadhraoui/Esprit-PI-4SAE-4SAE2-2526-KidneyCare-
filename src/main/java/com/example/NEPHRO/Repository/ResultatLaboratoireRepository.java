package com.example.NEPHRO.Repository;

import com.example.NEPHRO.Entities.ResultatLaboratoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ResultatLaboratoireRepository extends JpaRepository<ResultatLaboratoire, Long> {

    List<ResultatLaboratoire> findByDossierMedicalIdDossierMedicalOrderByDateResultatDesc(Long idDossierMedical);

    List<ResultatLaboratoire> findByTestLaboratoireIdTestLaboratoireOrderByDateResultatDesc(Long idTestLaboratoire);

    List<ResultatLaboratoire> findByDateResultatBetween(LocalDate dateDebut, LocalDate dateFin);

    List<ResultatLaboratoire> findByDossierMedicalIdDossierMedicalAndDateResultatBetween(
            Long idDossierMedical, LocalDate dateDebut, LocalDate dateFin);

    long countByDossierMedicalIdDossierMedical(Long idDossierMedical);

    /** Au moins un résultat patient pour ce dossier avec ce code LOINC (catalogue test). */
    boolean existsByDossierMedical_IdDossierMedicalAndTestLaboratoire_CodeLoinc(Long idDossierMedical, String codeLoinc);

    /** Tous les résultats dossier × LOINC (pour filtrer par date par rapport à une prescription). */
    List<ResultatLaboratoire> findByDossierMedical_IdDossierMedicalAndTestLaboratoire_CodeLoinc(
            Long idDossierMedical, String codeLoinc);
}
