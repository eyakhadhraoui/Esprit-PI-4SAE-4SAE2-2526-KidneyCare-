package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.NutritionStatsDTO;
import com.example.Nutrition_Service.entity.Aliment;
import com.example.Nutrition_Service.entity.BesoinNutritionnel;
import com.example.Nutrition_Service.service.Nutritionstatsservice;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/nutrition/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class NutritionStatsController {   // ✅ Nom exact = nom du fichier

    private final Nutritionstatsservice statsService;

    @GetMapping("/dashboard")
    public ResponseEntity<NutritionStatsDTO.DashboardStatsDTO> getDashboard() {
        return ResponseEntity.ok(statsService.getDashboardStats());
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<BesoinNutritionnel>> rechercheAvancee(
            @RequestParam(required = false) Boolean  tacrolimus,
            @RequestParam(required = false) Boolean  prednisone,
            @RequestParam(required = false) Double   potassiumMax,
            @RequestParam(required = false) Integer  caloriesMin,
            @RequestParam(required = false) Boolean  avecAlertes,
            @RequestParam(required = false) Boolean  avecRestrictions) {
        return ResponseEntity.ok(statsService.rechercheMulticriteres(
                tacrolimus, prednisone, potassiumMax, caloriesMin, avecAlertes, avecRestrictions));
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<NutritionStatsDTO.AnomalieDTO>> getAnomalies() {
        return ResponseEntity.ok(statsService.getAnomaliesActuelles());
    }

    @GetMapping("/rapport-aliments")
    public ResponseEntity<List<NutritionStatsDTO.AlimentStatDTO>> getRapportAliments() {
        return ResponseEntity.ok(statsService.getRapportAliments());
    }

    @GetMapping("/rapport-raisons")
    public ResponseEntity<List<Object[]>> getRapportRaisons() {
        return ResponseEntity.ok(statsService.getRapportParRaison());
    }

    @GetMapping("/risques")
    public ResponseEntity<List<NutritionStatsDTO.RisquePatientDTO>> getRisques() {
        return ResponseEntity.ok(statsService.getRiskScores());
    }

    @GetMapping("/evolution/{patientId}")
    public ResponseEntity<List<NutritionStatsDTO.EvolutionPointDTO>> getEvolution(@PathVariable Long patientId) {
        return ResponseEntity.ok(statsService.getEvolutionPatient(patientId));
    }

    @GetMapping("/suggestions/{patientId}")
    public ResponseEntity<List<Aliment>> getSuggestions(
            @PathVariable Long patientId,
            @RequestParam(defaultValue = "false") boolean hasTacrolimus,
            @RequestParam(defaultValue = "false") boolean hasCyclosporine,
            @RequestParam(defaultValue = "0")     Integer ageMois,
            @RequestParam(required = false)       Double  potassiumMax,
            @RequestParam(required = false)       Double  sodiumMax,
            @RequestParam(required = false)       Double  phosphoreMax,
            @RequestParam(required = false)       Double  sucreMax) {
        return ResponseEntity.ok(statsService.getSuggestionsAliments(
                patientId, hasTacrolimus, hasCyclosporine,
                ageMois, potassiumMax, sodiumMax, phosphoreMax, sucreMax));
    }

    @GetMapping("/conformite")
    public ResponseEntity<List<NutritionStatsDTO.ConformitePatientDTO>> getConformite(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(statsService.getRapportConformite(debut, fin));
    }

    @GetMapping("/conformite/semaine")
    public ResponseEntity<List<NutritionStatsDTO.ConformitePatientDTO>> getConformiteSemaine() {
        return ResponseEntity.ok(statsService.getRapportConformite(
                LocalDateTime.now().minusDays(7), LocalDateTime.now()));
    }

    @GetMapping("/correlation/{patientId}")
    public ResponseEntity<List<NutritionStatsDTO.CorrelationDTO>> getCorrelation(@PathVariable Long patientId) {
        return ResponseEntity.ok(statsService.getCorrelationAlimentAlerte(patientId));
    }
}