package com.example.NEPHRO.Controllers;

import com.example.NEPHRO.Services.KeycloakLoginService;
import com.example.NEPHRO.Services.PatientService;
import com.example.NEPHRO.dto.LoginRequest;
import com.example.NEPHRO.dto.LoginResponse;
import com.example.NEPHRO.dto.RegisterRequest;
import com.example.NEPHRO.Entities.Patient;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Connexion et inscription : login (Keycloak), register (Keycloak + MySQL Patient).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final KeycloakLoginService keycloakLoginService;
    private final PatientService patientService;

    /** Test : vérifier que le proxy et la chaîne /api/auth/** fonctionnent (sans auth). */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        log.info("GET /api/auth/ping reçu — proxy et backend OK");
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Backend NEPHRO joignable"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/auth/login reçu pour utilisateur: {}", request.getUsername());
        try {
            LoginResponse response = keycloakLoginService.login(request);
            log.info("Login réussi pour: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            boolean unauthorized = e.getMessage() != null
                    && (e.getMessage().contains("incorrect") || e.getMessage().contains("invalid_grant")
                    || e.getMessage().contains("Direct access") || e.getMessage().contains("Resource owner"));
            HttpStatus status = unauthorized ? HttpStatus.UNAUTHORIZED : HttpStatus.BAD_GATEWAY;
            String msg = e.getMessage() != null ? e.getMessage() : "Erreur de connexion";
            log.warn("Login échoué pour {}: {}", request.getUsername(), msg);
            return ResponseEntity.status(status).body(Map.of("message", msg));
        } catch (Exception e) {
            // Dernier filet de sécurité : éviter un 500 “opaque”
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            log.error("Login erreur inattendue pour {}: {}", request.getUsername(), msg, e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", "Erreur backend login: " + msg));
        }
    }

    /** Inscription patient : crée l'utilisateur dans Keycloak (rôle patient) et le patient en base MySQL. */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        log.info("RegisterRequest reçu: username={}, email={}, firstName={}, lastName={}",
                request.getUsername(), request.getEmail(), request.getFirstName(), request.getLastName());
        try {
            Patient patient = patientService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Compte créé. Vous pouvez vous connecter.",
                    "idPatient", patient.getIdPatient(),
                    "username", patient.getUsername()
            ));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Erreur lors de l'inscription";
            log.warn("Register échoué: {}", msg);
            HttpStatus status = msg.contains("déjà") ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("message", msg));
        }
    }
}
