package com.example.NEPHRO.Repository;

import com.example.NEPHRO.Entities.ResultatLabtest;
import com.example.NEPHRO.Enum.StatutInterpretation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ResultatLabtestRepository extends JpaRepository<ResultatLabtest, Long> {

    List<ResultatLabtest> findByDossierIdIn(Collection<Long> dossierIds);

    List<ResultatLabtest> findByPrescriptionIdOrderByDateRenduDesc(Long prescriptionId);
    List<ResultatLabtest> findByDossierIdOrderByDateRenduDesc(Long dossierId);
    List<ResultatLabtest> findByDossierIdOrderByDateRenduAsc(Long dossierId);
    List<ResultatLabtest> findByDossierIdAndPrescriptionIdIsNullOrderByDateRenduDesc(Long dossierId);
    List<ResultatLabtest> findByDossierIdAndStatutInterpretation(Long dossierId, StatutInterpretation statut);

    boolean existsByPrescriptionIdAndDossierIdAndCodeLoinc(Long prescriptionId, Long dossierId, String codeLoinc);
}
