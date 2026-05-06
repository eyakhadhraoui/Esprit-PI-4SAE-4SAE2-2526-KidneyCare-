package com.example.prescription_Service.controller;

import com.example.prescription_Service.client.NephroPatientClient;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Point d’entrée attendu par le front Angular ({@code GET /api/bilan/patient/{id}/dernier}).
 * Enrichit la réponse avec les métadonnées patient via OpenFeign vers NEPHRO (inter-service).
 */
@RestController
@RequestMapping("/api/bilan")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class DernierBilanController {

    private final NephroPatientClient nephroPatientClient;

    @GetMapping("/patient/{patientId}/dernier")
    public ResponseEntity<Map<String, Object>> getDernierBilan(@PathVariable Long patientId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id_patient", patientId);
        try {
            Map<String, Object> patient = nephroPatientClient.getPatientById(patientId);
            body.put("patient", patient);
            body.put("source_nephro", true);
        } catch (FeignException.NotFound e) {
            body.put("patient", null);
            body.put("source_nephro", false);
            body.put("message", "Patient inconnu dans NEPHRO pour cet identifiant.");
        } catch (FeignException e) {
            body.put("patient", null);
            body.put("source_nephro", false);
            body.put("message", "NEPHRO indisponible ou erreur HTTP " + e.status());
        }
        return ResponseEntity.ok(body);
    }
}
