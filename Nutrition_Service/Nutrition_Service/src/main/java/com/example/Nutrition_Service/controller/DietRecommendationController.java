package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.DietRecommendationDTO;
import com.example.Nutrition_Service.repository.AlimentRepository;
import com.example.Nutrition_Service.service.DietCalculatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class DietRecommendationController {

    private final DietCalculatorService dietCalculatorService;
    private final AlimentRepository alimentRepository;

    @GetMapping("/diet-recommendation/{patientId}")
    public ResponseEntity<DietRecommendationDTO> getRecommendation(@PathVariable Long patientId) {
        return dietCalculatorService.calculate(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Suggestions (auto-complétion) pour le champ "nom aliment".
     * Source : base locale {@code aliments.nom}.
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> suggestions(@RequestParam("q") String q) {
        String query = q != null ? q.trim() : "";
        if (query.isBlank()) return ResponseEntity.ok(List.of());
        List<String> names = alimentRepository.findByNomContainingIgnoreCase(query).stream()
                .map(a -> a.getNom() != null ? a.getNom().trim() : "")
                .filter(s -> !s.isBlank())
                .distinct()
                .limit(7)
                .toList();
        return ResponseEntity.ok(names);
    }
}
