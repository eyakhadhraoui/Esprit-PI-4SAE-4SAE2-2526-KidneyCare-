package com.example.NEPHRO.Repository;

import com.example.NEPHRO.Entities.PrescriptionBilan;
import com.example.NEPHRO.Enum.StatutPrescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface PrescriptionBilanRepository extends JpaRepository<PrescriptionBilan, Long> {

    List<PrescriptionBilan> findByDossierIdIn(Collection<Long> dossierIds);

    List<PrescriptionBilan> findByDossierIdOrderByDatePrescriptionDesc(Long dossierId);
    List<PrescriptionBilan> findByMedecinIdOrderByDatePrescriptionDesc(Long medecinId);
    List<PrescriptionBilan> findByDossierIdAndStatut(Long dossierId, StatutPrescription statut);

    List<PrescriptionBilan> findByStatut(StatutPrescription statut);
}
