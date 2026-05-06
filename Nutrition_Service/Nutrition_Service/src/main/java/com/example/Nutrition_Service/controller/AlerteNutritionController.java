package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.AlerteNutritionDTO;
import com.example.Nutrition_Service.service.AlerteNutritionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertes-nutrition")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AlerteNutritionController {

    private final AlerteNutritionService alerteService;

    @PostMapping
    public ResponseEntity<AlerteNutritionDTO> createAlerte(@Valid @RequestBody AlerteNutritionDTO dto) {
        AlerteNutritionDTO created = alerteService.createAlerte(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<AlerteNutritionDTO>> getAllAlertes() {
        List<AlerteNutritionDTO> alertes = alerteService.getAllAlertes();
        return ResponseEntity.ok(alertes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlerteNutritionDTO> getAlerteById(@PathVariable Long id) {
        AlerteNutritionDTO alerte = alerteService.getAlerteById(id);
        return ResponseEntity.ok(alerte);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AlerteNutritionDTO>> getAlertesForPatient(@PathVariable Long patientId) {
        List<AlerteNutritionDTO> alertes = alerteService.getAlertesForPatient(patientId);
        return ResponseEntity.ok(alertes);
    }

    @GetMapping("/patient/{patientId}/non-lues")
    public ResponseEntity<List<AlerteNutritionDTO>> getUnreadAlertesForPatient(@PathVariable Long patientId) {
        List<AlerteNutritionDTO> alertes = alerteService.getUnreadAlertesForPatient(patientId);
        return ResponseEntity.ok(alertes);
    }

    @GetMapping("/patient/{patientId}/count-non-lues")
    public ResponseEntity<Long> countUnreadAlertes(@PathVariable Long patientId) {
        Long count = alerteService.countUnreadAlertes(patientId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/recentes")
    public ResponseEntity<List<AlerteNutritionDTO>> getRecentAlertes(@RequestParam(defaultValue = "24") int hours) {
        List<AlerteNutritionDTO> alertes = alerteService.getRecentAlertes(hours);
        return ResponseEntity.ok(alertes);
    }

    @PatchMapping("/{id}/marquer-lue")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        alerteService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/patient/{patientId}/marquer-toutes-lues")
    public ResponseEntity<Void> markAllAsReadForPatient(@PathVariable Long patientId) {
        alerteService.markAllAsReadForPatient(patientId);
        return ResponseEntity.ok().build();
    }
}