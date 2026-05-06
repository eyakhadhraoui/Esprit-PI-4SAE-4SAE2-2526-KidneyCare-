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

@Service
@RequiredArgsConstructor
@Transactional
public class AlerteNutritionService {

    private final AlerteNutritionRepository alerteRepository;

    public AlerteNutritionDTO createAlerte(AlerteNutritionDTO dto) {
        AlerteNutrition a = toEntity(dto, new AlerteNutrition());
        if (a.getDateAlerte() == null) a.setDateAlerte(LocalDateTime.now());
        AlerteNutrition saved = alerteRepository.save(a);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<AlerteNutritionDTO> getAllAlertes() {
        return alerteRepository.findAllOrderByDateDesc().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public AlerteNutritionDTO getAlerteById(Long id) {
        return alerteRepository.findById(id).map(this::toDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerte introuvable."));
    }

    @Transactional(readOnly = true)
    public List<AlerteNutritionDTO> getAlertesForPatient(Long patientId) {
        return alerteRepository.findByPatientIdOrderByDateAlerteDesc(patientId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AlerteNutritionDTO> getUnreadAlertesForPatient(Long patientId) {
        return alerteRepository.findByPatientIdAndLueFalseOrderByDateAlerteDesc(patientId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public Long countUnreadAlertes(Long patientId) {
        return alerteRepository.countByPatientIdAndLueFalse(patientId);
    }

    @Transactional(readOnly = true)
    public List<AlerteNutritionDTO> getRecentAlertes(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(Math.max(hours, 1));
        return alerteRepository.findByDateAlerteAfterOrderByDateAlerteDesc(since).stream().map(this::toDTO).toList();
    }

    public void markAsRead(Long id) {
        AlerteNutrition a = alerteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerte introuvable."));
        a.setLue(true);
        alerteRepository.save(a);
    }

    public void markAllAsReadForPatient(Long patientId) {
        List<AlerteNutrition> list = alerteRepository.findByPatientIdAndLueFalseOrderByDateAlerteDesc(patientId);
        for (AlerteNutrition a : list) a.setLue(true);
        alerteRepository.saveAll(list);
    }

    private AlerteNutritionDTO toDTO(AlerteNutrition a) {
        return new AlerteNutritionDTO(
                a.getId(),
                a.getPatientId(),
                a.getType() != null ? a.getType().name() : null,
                a.getMessage(),
                a.getDateAlerte(),
                a.getLue(),
                a.getAlimentId(),
                a.getRestrictionId(),
                a.getDetailsTechniques()
        );
    }

    private AlerteNutrition toEntity(AlerteNutritionDTO dto, AlerteNutrition a) {
        a.setPatientId(dto.getPatientId());
        try {
            a.setType(dto.getType() != null ? AlerteNutrition.TypeAlerte.valueOf(dto.getType()) : null);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Type d'alerte invalide.");
        }
        a.setMessage(dto.getMessage());
        a.setDateAlerte(dto.getDateAlerte());
        a.setLue(Boolean.TRUE.equals(dto.getLue()));
        a.setAlimentId(dto.getAlimentId());
        a.setRestrictionId(dto.getRestrictionId());
        a.setDetailsTechniques(dto.getDetailsTechniques());
        return a;
    }
}

