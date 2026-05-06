package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.RestrictionAlimentaireDTO;
import com.example.Nutrition_Service.entity.RestrictionAlimentaire;
import com.example.Nutrition_Service.repository.RestrictionAlimentaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RestrictionAlimentaireService {

    private final RestrictionAlimentaireRepository restrictionRepository;

    public RestrictionAlimentaireDTO createRestriction(RestrictionAlimentaireDTO dto) {
        // évite doublon actif patient+aliment
        if (dto.getPatientId() != null && dto.getAlimentId() != null
                && restrictionRepository.existsActiveRestriction(dto.getPatientId(), dto.getAlimentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Restriction déjà active pour ce patient et cet aliment.");
        }
        RestrictionAlimentaire saved = restrictionRepository.save(toEntity(dto, new RestrictionAlimentaire()));
        return toDTO(saved);
    }

    public RestrictionAlimentaireDTO updateRestriction(Long id, RestrictionAlimentaireDTO dto) {
        RestrictionAlimentaire existing = restrictionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restriction introuvable."));
        RestrictionAlimentaire saved = restrictionRepository.save(toEntity(dto, existing));
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<RestrictionAlimentaireDTO> getAllRestrictions() {
        return restrictionRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public RestrictionAlimentaireDTO getRestrictionById(Long id) {
        return restrictionRepository.findById(id).map(this::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restriction introuvable."));
    }

    @Transactional(readOnly = true)
    public List<RestrictionAlimentaireDTO> getActiveRestrictionsForPatient(Long patientId) {
        return restrictionRepository.findActiveByPatientId(patientId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<RestrictionAlimentaireDTO> getHistoryForPatient(Long patientId) {
        return restrictionRepository.findByPatientIdOrderByDateDebutDesc(patientId).stream().map(this::toDTO).toList();
    }

    public void deleteRestriction(Long id) {
        if (!restrictionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Restriction introuvable.");
        }
        restrictionRepository.deleteById(id);
    }

    private RestrictionAlimentaireDTO toDTO(RestrictionAlimentaire r) {
        return new RestrictionAlimentaireDTO(
                r.getId(),
                r.getPatientId(),
                r.getAlimentId(),
                r.getRaison() != null ? r.getRaison().name() : null,
                r.getValeurBilanDeclencheur(),
                r.getCreeAutomatiquement(),
                r.getDateDebut(),
                r.getDateFin(),
                r.getNotes()
        );
    }

    private RestrictionAlimentaire toEntity(RestrictionAlimentaireDTO dto, RestrictionAlimentaire r) {
        r.setPatientId(dto.getPatientId());
        r.setAlimentId(dto.getAlimentId());
        try {
            r.setRaison(dto.getRaison() != null ? RestrictionAlimentaire.RaisonRestriction.valueOf(dto.getRaison()) : null);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Raison de restriction invalide.");
        }
        r.setValeurBilanDeclencheur(dto.getValeurBilanDeclencheur());
        r.setCreeAutomatiquement(Boolean.TRUE.equals(dto.getCreeAutomatiquement()));
        r.setDateDebut(dto.getDateDebut());
        r.setDateFin(dto.getDateFin());
        r.setNotes(dto.getNotes());
        return r;
    }
}

