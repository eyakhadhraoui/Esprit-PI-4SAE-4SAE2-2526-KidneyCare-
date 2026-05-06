package com.example.NEPHRO.Controllers;

import com.example.NEPHRO.Entities.Patient;
import com.example.NEPHRO.mapper.PatientApiMapper;
import com.example.NEPHRO.Services.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class PatientController {

    private final PatientService patientService;

    /** Liste tous les patients (back office : médecin choisit le n° patient pour créer un dossier). */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listAll() {
        List<Patient> patients = patientService.findAll();
        List<Map<String, Object>> list = patients.stream()
                .map(PatientApiMapper::toListItem)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    /**
     * Détail synthétique par id (même forme que la liste) — utilisé par les appels inter-services (ex. OpenFeign).
     */
    @GetMapping("/by-id/{idPatient}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long idPatient) {
        return patientService.findByIdPatient(idPatient)
                .map(p -> ResponseEntity.ok(PatientApiMapper.toListItem(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Profil du patient connecté (JWT → preferred_username). */
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Non authentifié"));
        }
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) username = jwt.getSubject();
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("message", "Username absent du token"));
        }
        try {
            Patient patient = patientService.getByUsername(username);
            Map<String, Object> body = new HashMap<>();
            body.put("idPatient", patient.getIdPatient());
            body.put("username", patient.getUsername() != null ? patient.getUsername() : "");
            body.put("email", patient.getEmail() != null ? patient.getEmail() : "");
            body.put("firstName", patient.getFirstName() != null ? patient.getFirstName() : "");
            body.put("lastName", patient.getLastName() != null ? patient.getLastName() : "");
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }
}
