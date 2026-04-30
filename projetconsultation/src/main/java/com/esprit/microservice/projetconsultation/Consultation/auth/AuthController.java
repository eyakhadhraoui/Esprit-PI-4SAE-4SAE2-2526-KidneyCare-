package com.esprit.microservice.projetconsultation.Consultation.auth;

import com.esprit.microservice.projetconsultation.Consultation.auth.dto.LoginRequest;
import com.esprit.microservice.projetconsultation.Consultation.auth.dto.RegisterRequest;
import com.esprit.microservice.projetconsultation.Consultation.auth.dto.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur d'authentification.
 * POST /api/auth/login : envoie username/password à Keycloak et retourne le token.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank() ||
            request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username et password requis"));
        }
        try {
            TokenResponse token = authService.login(request);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Identifiants invalides"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank() ||
            request.getPassword() == null || request.getPassword().isBlank() ||
            request.getFirstName() == null || request.getFirstName().isBlank() ||
            request.getLastName() == null || request.getLastName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username, password, prénom et nom sont requis"));
        }
        try {
            TokenResponse token = authService.registerPatient(request);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Erreur lors de l'inscription";
            return ResponseEntity.status(400).body(Map.of("message", msg));
        }
    }
}
