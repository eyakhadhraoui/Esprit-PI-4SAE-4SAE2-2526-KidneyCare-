package com.example.Nutrition_Service.service;

import com.example.Nutrition_Service.dto.AlerteNutritionDTO;
import com.example.Nutrition_Service.entity.AlerteNutrition;
import com.example.Nutrition_Service.repository.AlerteNutritionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AlerteNutritionService {

    private final AlerteNutritionRepository alerteRepository;

    public AlerteNutritionDTO createAlerte(AlerteNutritionDTO dto) {
        AlerteNutrition alerte = toEntity(dto);
        AlerteNutrition saved = alerteRepository.save(alerte);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<AlerteNutritionDTO> getAllAlertes() {
        return alerteRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AlerteNutritionDTO getAlerteById(Long id) {
        AlerteNutrition alerte = alerteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerte non trouvée"));
        return toDTO(alerte);
    }

    @Transactional(readOnly = true)
    public List<AlerteNutritionDTO> getAlertesForPatient(Long patientId) {
        return alerteRepository.findByPatientIdOrderByDateAlerteDesc(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlerteNutritionDTO> getUnreadAlertesForPatient(Long patientId) {
        return alerteRepository.findByPatientIdAndLueFalseOrderByDateAlerteDesc(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Long countUnreadAlertes(Long patientId) {
        return alerteRepository.countByPatientIdAndLueFalse(patientId);
    }

    @Transactional(readOnly = true)
    public List<AlerteNutritionDTO> getRecentAlertes(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return alerteRepository.findByDateAlerteAfterOrderByDateAlerteDesc(since).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void createAutomaticAlerte(Long patientId, String type, String message, Long alimentId, Long restrictionId) {
        AlerteNutrition alerte = new AlerteNutrition();
        alerte.setPatientId(patientId);
        alerte.setType(AlerteNutrition.TypeAlerte.valueOf(type));
        alerte.setMessage(message);
        alerte.setDateAlerte(LocalDateTime.now());
        alerte.setLue(false);
        alerte.setAlimentId(alimentId);
        alerte.setRestrictionId(restrictionId);
        alerteRepository.save(alerte);
    }

    public void markAsRead(Long id) {
        AlerteNutrition alerte = alerteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerte non trouvée"));
        alerte.setLue(true);
        alerteRepository.save(alerte);
    }

    public void markAllAsReadForPatient(Long patientId) {
        List<AlerteNutrition> alertes = alerteRepository.findByPatientIdAndLueFalseOrderByDateAlerteDesc(patientId);
        for (AlerteNutrition alerte : alertes) {
            alerte.setLue(true);
            alerteRepository.save(alerte);
        }
    }

    private AlerteNutritionDTO toDTO(AlerteNutrition entity) {
        AlerteNutritionDTO dto = new AlerteNutritionDTO();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatientId());
        dto.setType(entity.getType().name());
        dto.setMessage(entity.getMessage());
        dto.setDateAlerte(entity.getDateAlerte());
        dto.setLue(entity.getLue());
        dto.setAlimentId(entity.getAlimentId());
        dto.setRestrictionId(entity.getRestrictionId());
        dto.setDetailsTechniques(entity.getDetailsTechniques());
        return dto;
    }

    private AlerteNutrition toEntity(AlerteNutritionDTO dto) {
        AlerteNutrition entity = new AlerteNutrition();
        entity.setPatientId(dto.getPatientId());
        entity.setType(AlerteNutrition.TypeAlerte.valueOf(dto.getType()));
        entity.setMessage(dto.getMessage());
        entity.setDateAlerte(dto.getDateAlerte());
        entity.setLue(dto.getLue());
        entity.setAlimentId(dto.getAlimentId());
        entity.setRestrictionId(dto.getRestrictionId());
        entity.setDetailsTechniques(dto.getDetailsTechniques());
        return entity;
    }
}