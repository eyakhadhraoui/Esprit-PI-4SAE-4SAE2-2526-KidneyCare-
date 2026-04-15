package com.example.Nutrition_Service.controller;

import com.example.Nutrition_Service.dto.BesoinNutritionnelDTO;
import com.example.Nutrition_Service.service.BesoinNutritionnelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/besoins-nutritionnels")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class BesoinNutritionnelController {

    private final BesoinNutritionnelService besoinService;

    @PostMapping
    public ResponseEntity<BesoinNutritionnelDTO> createBesoin(@Valid @RequestBody BesoinNutritionnelDTO dto) {
        BesoinNutritionnelDTO created = besoinService.createBesoin(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BesoinNutritionnelDTO> updateBesoin(@PathVariable Long id, @Valid @RequestBody BesoinNutritionnelDTO dto) {
        BesoinNutritionnelDTO updated = besoinService.updateBesoin(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<BesoinNutritionnelDTO>> getAllBesoins() {
        List<BesoinNutritionnelDTO> besoins = besoinService.getAllBesoins();
        return ResponseEntity.ok(besoins);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BesoinNutritionnelDTO> getBesoinById(@PathVariable Long id) {
        BesoinNutritionnelDTO besoin = besoinService.getBesoinById(id);
        return ResponseEntity.ok(besoin);
    }

    @GetMapping("/patient/{patientId}/actif")
    public ResponseEntity<BesoinNutritionnelDTO> getActiveBesoinForPatient(@PathVariable Long patientId) {
        BesoinNutritionnelDTO besoin = besoinService.getActiveBesoinForPatient(patientId);
        return ResponseEntity.ok(besoin);
    }

    @GetMapping("/patient/{patientId}/historique")
    public ResponseEntity<List<BesoinNutritionnelDTO>> getHistoryForPatient(@PathVariable Long patientId) {
        List<BesoinNutritionnelDTO> history = besoinService.getHistoryForPatient(patientId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBesoin(@PathVariable Long id) {
        besoinService.deleteBesoin(id);
        return ResponseEntity.noContent().build();
    }
}