package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.RestrictionAlimentaireDTO;
import com.example.Nutrition_Service.entity.RestrictionAlimentaire;
import com.example.Nutrition_Service.repository.RestrictionAlimentaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RestrictionAlimentaireService {

    private final RestrictionAlimentaireRepository restrictionRepository;

    public RestrictionAlimentaireDTO createRestriction(RestrictionAlimentaireDTO dto) {
        if (restrictionRepository.existsActiveRestriction(dto.getPatientId(), dto.getAlimentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une restriction active existe déjà pour cet aliment");
        }
        RestrictionAlimentaire restriction = toEntity(dto);
        RestrictionAlimentaire saved = restrictionRepository.save(restriction);
        return toDTO(saved);
    }

    public RestrictionAlimentaireDTO updateRestriction(Long id, RestrictionAlimentaireDTO dto) {
        RestrictionAlimentaire restriction = restrictionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restriction non trouvée"));
        updateEntityFromDTO(restriction, dto);
        RestrictionAlimentaire updated = restrictionRepository.save(restriction);
        return toDTO(updated);
    }

    @Transactional(readOnly = true)
    public List<RestrictionAlimentaireDTO> getAllRestrictions() {
        return restrictionRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RestrictionAlimentaireDTO getRestrictionById(Long id) {
        RestrictionAlimentaire restriction = restrictionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restriction non trouvée"));
        return toDTO(restriction);
    }

    @Transactional(readOnly = true)
    public List<RestrictionAlimentaireDTO> getActiveRestrictionsForPatient(Long patientId) {
        return restrictionRepository.findActiveByPatientId(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RestrictionAlimentaireDTO> getHistoryForPatient(Long patientId) {
        return restrictionRepository.findByPatientIdOrderByDateDebutDesc(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void createAutomaticRestrictions(Long patientId, String raison, Double valeurBilan, List<Long> alimentIds) {
        for (Long alimentId : alimentIds) {
            if (!restrictionRepository.existsActiveRestriction(patientId, alimentId)) {
                RestrictionAlimentaire restriction = new RestrictionAlimentaire();
                restriction.setPatientId(patientId);
                restriction.setAlimentId(alimentId);
                restriction.setRaison(RestrictionAlimentaire.RaisonRestriction.valueOf(raison));
                restriction.setValeurBilanDeclencheur(valeurBilan);
                restriction.setCreeAutomatiquement(true);
                restriction.setDateDebut(LocalDate.now());
                restriction.setDateFin(null);
                restriction.setNotes("Créé automatiquement suite au bilan anormal");
                restrictionRepository.save(restriction);
            }
        }
    }

    public void liftAutomaticRestrictions(Long patientId, String raison) {
        List<RestrictionAlimentaire> restrictions = restrictionRepository.findActiveByPatientId(patientId);
        for (RestrictionAlimentaire r : restrictions) {
            if (r.getRaison().name().equals(raison) && r.getCreeAutomatiquement()) {
                r.setDateFin(LocalDate.now());
                restrictionRepository.save(r);
            }
        }
    }

    public void deleteRestriction(Long id) {
        if (!restrictionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Restriction non trouvée");
        }
        restrictionRepository.deleteById(id);
    }

    private RestrictionAlimentaireDTO toDTO(RestrictionAlimentaire entity) {
        RestrictionAlimentaireDTO dto = new RestrictionAlimentaireDTO();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatientId());
        dto.setAlimentId(entity.getAlimentId());
        dto.setRaison(entity.getRaison().name());
        dto.setValeurBilanDeclencheur(entity.getValeurBilanDeclencheur());
        dto.setCreeAutomatiquement(entity.getCreeAutomatiquement());
        dto.setDateDebut(entity.getDateDebut());
        dto.setDateFin(entity.getDateFin());
        dto.setNotes(entity.getNotes());
        return dto;
    }

    private RestrictionAlimentaire toEntity(RestrictionAlimentaireDTO dto) {
        RestrictionAlimentaire entity = new RestrictionAlimentaire();
        updateEntityFromDTO(entity, dto);
        return entity;
    }

    private void updateEntityFromDTO(RestrictionAlimentaire entity, RestrictionAlimentaireDTO dto) {
        entity.setPatientId(dto.getPatientId());
        entity.setAlimentId(dto.getAlimentId());
        entity.setRaison(RestrictionAlimentaire.RaisonRestriction.valueOf(dto.getRaison()));
        entity.setValeurBilanDeclencheur(dto.getValeurBilanDeclencheur());
        entity.setCreeAutomatiquement(dto.getCreeAutomatiquement());
        entity.setDateDebut(dto.getDateDebut());
        entity.setDateFin(dto.getDateFin());
        entity.setNotes(dto.getNotes());
    }
}