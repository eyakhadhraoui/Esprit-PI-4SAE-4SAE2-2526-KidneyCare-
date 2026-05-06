package com.example.prescription_Service.controller;

import com.example.prescription_Service.entity.PatientWeight;
import com.example.prescription_Service.repository.PatientWeightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/patient-weight")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PatientWeightController {

    private final PatientWeightRepository patientWeightRepository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PatientWeight>> getByPatient(@PathVariable Long patientId) {
        List<PatientWeight> weights = patientWeightRepository.findByPatientIdOrderByMeasuredAtDesc(patientId);
        return ResponseEntity.ok(weights);
    }

    /** 200 + corps JSON {@code null} si aucun poids (évite un 404 bruyant côté navigateur / front). */
    @GetMapping("/patient/{patientId}/latest")
    public ResponseEntity<PatientWeight> getLatestByPatient(@PathVariable Long patientId) {
        PatientWeight latest = patientWeightRepository.findTopByPatientIdOrderByMeasuredAtDesc(patientId).orElse(null);
        return ResponseEntity.ok(latest);
    }

    @PostMapping
    public ResponseEntity<PatientWeight> addWeight(@RequestBody PatientWeight weight) {
        weight.setMeasuredAt(LocalDateTime.now());
        PatientWeight saved = patientWeightRepository.save(weight);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/height")
    public ResponseEntity<PatientWeight> updateHeight(@PathVariable Long id, @RequestParam Double heightCm) {
        return patientWeightRepository
                .findById(id)
                .map(w -> {
                    w.setHeightCm(heightCm);
                    return ResponseEntity.ok(patientWeightRepository.save(w));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<PatientWeight>> getAll() {
        return ResponseEntity.ok(patientWeightRepository.findAll());
    }
}
