package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.RestrictionAlimentaireDTO;
import com.example.Nutrition_Service.service.RestrictionAlimentaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restrictions-alimentaires")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class RestrictionAlimentaireController {

    private final RestrictionAlimentaireService restrictionService;

    @PostMapping
    public ResponseEntity<RestrictionAlimentaireDTO> createRestriction(@Valid @RequestBody RestrictionAlimentaireDTO dto) {
        RestrictionAlimentaireDTO created = restrictionService.createRestriction(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestrictionAlimentaireDTO> updateRestriction(@PathVariable Long id, @Valid @RequestBody RestrictionAlimentaireDTO dto) {
        RestrictionAlimentaireDTO updated = restrictionService.updateRestriction(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<RestrictionAlimentaireDTO>> getAllRestrictions() {
        List<RestrictionAlimentaireDTO> restrictions = restrictionService.getAllRestrictions();
        return ResponseEntity.ok(restrictions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestrictionAlimentaireDTO> getRestrictionById(@PathVariable Long id) {
        RestrictionAlimentaireDTO restriction = restrictionService.getRestrictionById(id);
        return ResponseEntity.ok(restriction);
    }

    @GetMapping("/patient/{patientId}/actives")
    public ResponseEntity<List<RestrictionAlimentaireDTO>> getActiveRestrictionsForPatient(@PathVariable Long patientId) {
        List<RestrictionAlimentaireDTO> restrictions = restrictionService.getActiveRestrictionsForPatient(patientId);
        return ResponseEntity.ok(restrictions);
    }

    @GetMapping("/patient/{patientId}/historique")
    public ResponseEntity<List<RestrictionAlimentaireDTO>> getHistoryForPatient(@PathVariable Long patientId) {
        List<RestrictionAlimentaireDTO> history = restrictionService.getHistoryForPatient(patientId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestriction(@PathVariable Long id) {
        restrictionService.deleteRestriction(id);
        return ResponseEntity.noContent().build();
    }
}