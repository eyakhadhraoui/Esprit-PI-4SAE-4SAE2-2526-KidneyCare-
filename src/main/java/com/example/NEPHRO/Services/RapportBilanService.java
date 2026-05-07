package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.DossierMedical;
import com.example.NEPHRO.Entities.Patient;
import com.example.NEPHRO.Entities.RapportBilan;
import com.example.NEPHRO.Repository.DossierMedicalRepository;
import com.example.NEPHRO.Repository.PatientRepository;
import com.example.NEPHRO.Repository.RapportBilanRepository;
import com.example.NEPHRO.dto.RapportBilanDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RapportBilanService {

    private final RapportBilanRepository rapportBilanRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    private final NotificationService notificationService;
    private final NotificationWebSocketService notificationWebSocketService;

    private RapportBilanDTO toDTO(RapportBilan e) {
        RapportBilanDTO dto = new RapportBilanDTO();
        dto.setId(e.getId());
        dto.setDossierId(e.getDossierId());
        dto.setPeriodeDebut(e.getPeriodeDebut());
        dto.setPeriodeFin(e.getPeriodeFin());
        dto.setResultatsIds(e.getResultatsIds() != null ? List.copyOf(e.getResultatsIds()) : List.of());
        dto.setCommentaireMedecin(e.getCommentaireMedecin());
        dto.setPdfUrl(e.getPdfUrl());
        dto.setPartageFamille(e.getPartageFamille());
        dto.setDateGeneration(e.getDateGeneration());
        dto.setGenerePar(e.getGenerePar());
        dto.setPrescriptionId(e.getPrescriptionId());
        dto.setSignatureDataUrl(e.getSignatureDataUrl());
        return dto;
    }

    private RapportBilan toEntity(RapportBilanDTO dto) {
        return RapportBilan.builder()
                .dossierId(dto.getDossierId())
                .periodeDebut(dto.getPeriodeDebut())
                .periodeFin(dto.getPeriodeFin())
                .resultatsIds(dto.getResultatsIds() != null ? new java.util.ArrayList<>(dto.getResultatsIds()) : new java.util.ArrayList<>())
                .commentaireMedecin(dto.getCommentaireMedecin())
                .pdfUrl(dto.getPdfUrl())
                .partageFamille(dto.getPartageFamille() != null ? dto.getPartageFamille() : false)
                .dateGeneration(dto.getDateGeneration() != null ? dto.getDateGeneration() : LocalDateTime.now())
                .generePar(dto.getGenerePar())
                .prescriptionId(dto.getPrescriptionId())
                .signatureDataUrl(dto.getSignatureDataUrl())
                .build();
    }

    public RapportBilanDTO create(RapportBilanDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Rapport invalide.");
        }
        if (dto.getDossierId() == null) {
            throw new IllegalArgumentException("Le dossier est obligatoire.");
        }
        String comment = dto.getCommentaireMedecin() != null ? dto.getCommentaireMedecin().trim() : "";
        if (comment.isBlank()) {
            throw new IllegalArgumentException("Le commentaire du rapport est obligatoire.");
        }
        dto.setCommentaireMedecin(comment);
        if (Boolean.TRUE.equals(dto.getNotifyPatient())) {
            String sig = dto.getSignatureDataUrl() != null ? dto.getSignatureDataUrl().trim() : "";
            if (sig.isBlank()) {
                throw new IllegalArgumentException("La signature est obligatoire pour notifier le patient.");
            }
        }
        boolean notifyPatient = Boolean.TRUE.equals(dto.getNotifyPatient());
        if (dto.getDateGeneration() == null) dto.setDateGeneration(LocalDateTime.now());
        RapportBilan saved = rapportBilanRepository.save(toEntity(dto));
        if (notifyPatient) {
            envoyerEmailPatientSiPossible(saved);
        }
        return toDTO(saved);
    }

    private void envoyerEmailPatientSiPossible(RapportBilan rapport) {
        try {
            DossierMedical dm = dossierMedicalRepository.findById(rapport.getDossierId()).orElse(null);
            if (dm == null) {
                log.warn("Rapport {} : dossier {} introuvable — email non envoyé", rapport.getId(), rapport.getDossierId());
                return;
            }
            Patient patient = patientRepository.findById(dm.getIdPatient()).orElse(null);
            if (patient == null || patient.getEmail() == null || patient.getEmail().isBlank()) {
                log.warn("Rapport {} : patient sans email — notification ignorée", rapport.getId());
                return;
            }
            String nom = (patient.getFirstName() + " " + patient.getLastName()).trim();
            notificationService.envoyerRapportBilanAuPatient(
                    patient.getEmail(),
                    nom.isEmpty() ? "Patient" : nom,
                    rapport.getDossierId(),
                    rapport.getId(),
                    rapport.getPeriodeDebut(),
                    rapport.getPeriodeFin(),
                    rapport.getCommentaireMedecin(),
                    rapport.getSignatureDataUrl()
            );
            // Toast temps réel côté patient : "Rapport envoyé — check your email"
            notificationWebSocketService.notifyPatientRapportBilanEnvoye(
                    patient.getIdPatient(),
                    rapport.getDossierId(),
                    rapport.getId()
            );
        } catch (Exception e) {
            log.error("Échec notification rapport bilan {} : {}", rapport.getId(), e.getMessage());
        }
    }

    public RapportBilanDTO update(Long id, RapportBilanDTO dto) {
        RapportBilan e = rapportBilanRepository.findById(id).orElseThrow(() -> new RuntimeException("Rapport non trouvé: " + id));
        e.setCommentaireMedecin(dto.getCommentaireMedecin());
        e.setPartageFamille(dto.getPartageFamille() != null ? dto.getPartageFamille() : e.getPartageFamille());
        e.setResultatsIds(dto.getResultatsIds() != null ? new java.util.ArrayList<>(dto.getResultatsIds()) : e.getResultatsIds());
        if (dto.getPdfUrl() != null) e.setPdfUrl(dto.getPdfUrl());
        if (dto.getPrescriptionId() != null) e.setPrescriptionId(dto.getPrescriptionId());
        if (dto.getSignatureDataUrl() != null) e.setSignatureDataUrl(dto.getSignatureDataUrl());
        return toDTO(rapportBilanRepository.save(e));
    }

    @Transactional(readOnly = true)
    public RapportBilanDTO getById(Long id) {
        return toDTO(rapportBilanRepository.findById(id).orElseThrow(() -> new RuntimeException("Rapport non trouvé: " + id)));
    }

    @Transactional(readOnly = true)
    public List<RapportBilanDTO> getByDossier(Long dossierId) {
        return rapportBilanRepository.findByDossierIdOrderByDateGenerationDesc(dossierId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    /** Rapports partagés à la famille (vue patient). */
    @Transactional(readOnly = true)
    public List<RapportBilanDTO> getByDossierPartageFamille(Long dossierId) {
        return rapportBilanRepository.findByDossierIdAndPartageFamilleTrueOrderByDateGenerationDesc(dossierId).stream().map(this::toDTO).collect(Collectors.toList());
    }
}
