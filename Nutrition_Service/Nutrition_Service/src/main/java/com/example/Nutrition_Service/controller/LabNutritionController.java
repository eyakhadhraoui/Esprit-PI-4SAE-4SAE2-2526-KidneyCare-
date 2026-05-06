package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.ResultatLaboratoireDTO;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import com.example.Nutrition_Service.service.LabNutritionAdaptationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints exposant la relation OpenFeign entre TestLaboratoire (NEPHRO)
 * et Nutrition_Service.
 */
@RestController
@RequestMapping("/api/nutrition/lab")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class LabNutritionController {

    private final LabNutritionAdaptationService adaptationService;

    /**
     * Récupère les résultats de labo d'un dossier médical depuis NEPHRO.
     * GET /api/nutrition/lab/dossier/{idDossierMedical}
     */
    @GetMapping("/dossier/{idDossierMedical}")
    public ResponseEntity<List<ResultatLaboratoireDTO>> getLabResults(
            @PathVariable Long idDossierMedical) {
        List<ResultatLaboratoireDTO> results = adaptationService.getLabResultsForDossier(idDossierMedical);
        return ResponseEntity.ok(results);
    }

    /**
     * Adapte les besoins nutritionnels d'un patient selon ses résultats de labo.
     * POST /api/nutrition/lab/adapt?patientId=1&idDossierMedical=5
     */
    @PostMapping("/adapt")
    public ResponseEntity<BesoinNutritionnel> adaptNutrition(
            @RequestParam Long patientId,
            @RequestParam Long idDossierMedical) {
        return adaptationService.adaptFromLabResults(patientId, idDossierMedical)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
