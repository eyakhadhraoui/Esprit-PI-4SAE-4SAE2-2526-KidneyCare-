package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.AlerteLabo;
import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Entities.Patient;
import com.example.NEPHRO.Entities.ResultatLabtest;
import com.example.NEPHRO.Repository.AlerteLaboRepository;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.Repository.PatientRepository;
import com.example.NEPHRO.Repository.PrescriptionBilanRepository;
import com.example.NEPHRO.Repository.ResultatLabtestRepository;
import com.example.NEPHRO.dto.AlerteLaboDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AlerteLaboService {

    private final AlerteLaboRepository alerteLaboRepository;
    private final ModuleLaboService moduleLaboService;
    private final ResultatLabtestRepository resultatLabtestRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    private final PrescriptionBilanRepository prescriptionBilanRepository;

    private AlerteLaboDTO toDTO(AlerteLabo e) {
        AlerteLaboDTO dto = new AlerteLaboDTO();
        dto.setId(e.getId());
        dto.setResultatId(e.getResultatId());
        dto.setPrescriptionId(e.getPrescriptionId());
        dto.setTypeAlerte(e.getTypeAlerte());
        dto.setMessage(e.getMessage());
        dto.setAcquitteePar(e.getAcquitteePar());
        dto.setDateAcquittement(e.getDateAcquittement());
        dto.setActionRealisee(e.getActionRealisee());
        return dto;
    }

    private void enricherPatients(List<AlerteLaboDTO> list) {
        if (list == null || list.isEmpty()) return;
        for (AlerteLaboDTO dto : list) {
            if (dto.getResultatId() == null && dto.getPrescriptionId() != null) {
                prescriptionBilanRepository.findById(dto.getPrescriptionId()).ifPresent(p -> dto.setDossierId(p.getDossierId()));
            }
        }
        Set<Long> resultatIds = list.stream().map(AlerteLaboDTO::getResultatId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (!resultatIds.isEmpty()) {
            Map<Long, ResultatLabtest> resultats = resultatLabtestRepository.findAllById(resultatIds).stream()
                    .collect(Collectors.toMap(ResultatLabtest::getId, Function.identity()));
            Set<Long> dossierIds = resultats.values().stream().map(ResultatLabtest::getDossierId).filter(Objects::nonNull).collect(Collectors.toSet());
            Map<Long, DossierMedical> dossiers = dossierMedicalRepository.findAllById(dossierIds).stream()
                    .collect(Collectors.toMap(DossierMedical::getIdDossierMedical, Function.identity()));
            Set<Long> patientIds = dossiers.values().stream().map(DossierMedical::getIdPatient).filter(Objects::nonNull).collect(Collectors.toSet());
            Map<Long, Patient> patients = patientRepository.findAllById(patientIds).stream()
                    .collect(Collectors.toMap(Patient::getIdPatient, Function.identity()));
            for (AlerteLaboDTO dto : list) {
                ResultatLabtest r = resultats.get(dto.getResultatId());
                if (r == null) continue;
                dto.setDossierId(r.getDossierId());
                DossierMedical dm = dossiers.get(r.getDossierId());
                if (dm == null) continue;
                Patient p = patients.get(dm.getIdPatient());
                if (p == null) continue;
                String nom = ((p.getFirstName() != null ? p.getFirstName() : "") + " "
                        + (p.getLastName() != null ? p.getLastName() : "")).trim();
                if (!nom.isEmpty()) dto.setPatientNom(nom);
            }
        }
        for (AlerteLaboDTO dto : list) {
            if (dto.getPatientNom() != null && !dto.getPatientNom().isBlank()) continue;
            if (dto.getDossierId() == null) continue;
            Optional<DossierMedical> dmOpt = dossierMedicalRepository.findById(dto.getDossierId());
            if (dmOpt.isEmpty() || dmOpt.get().getIdPatient() == null) continue;
            patientRepository.findById(dmOpt.get().getIdPatient()).ifPresent(p -> {
                String nom = ((p.getFirstName() != null ? p.getFirstName() : "") + " "
                        + (p.getLastName() != null ? p.getLastName() : "")).trim();
                if (!nom.isEmpty()) dto.setPatientNom(nom);
            });
        }
    }

    public void acquitter(Long alerteId, Long medecinId, String actionRealisee) {
        moduleLaboService.acquitterAlerte(alerteId, medecinId, actionRealisee);
    }

    @Transactional(readOnly = true)
    public List<AlerteLaboDTO> getByResultat(Long resultatId) {
        List<AlerteLaboDTO> list = alerteLaboRepository.findByResultatIdOrderByIdDesc(resultatId).stream().map(this::toDTO).collect(Collectors.toList());
        enricherPatients(list);
        return list;
    }

    @Transactional(readOnly = true)
    public List<AlerteLaboDTO> getNonAcquittees() {
        List<AlerteLaboDTO> list = alerteLaboRepository.findByAcquitteeParIsNull().stream().map(this::toDTO).collect(Collectors.toList());
        enricherPatients(list);
        return list;
    }
}
