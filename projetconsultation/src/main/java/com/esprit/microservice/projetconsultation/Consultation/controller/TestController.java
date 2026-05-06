package com.esprit.microservice.projetconsultation.Consultation.controller;

import com.esprit.microservice.projetconsultation.Consultation.dto.MedecinDTO;
import com.esprit.microservice.projetconsultation.Consultation.dto.PatientDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Endpoints de test pour vérifier que le backend répond.
 * Ouvre dans le navigateur : http://localhost:8081/projet/test/ping
 * Puis : http://localhost:8081/projet/test/patients et .../medecins
 */
@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of("ok", true, "message", "Backend 8081 OK");
    }

    @GetMapping("/patients")
    public List<PatientDTO> testPatients() {
        return List.of(new PatientDTO(1L, "EYA", "test@test.com", "nour", "Jeddi", null, null));
    }

    @GetMapping("/medecins")
    public List<MedecinDTO> testMedecins() {
        return List.of(new MedecinDTO(1L, "nour", "jeddi", "nour"));
    }
}
