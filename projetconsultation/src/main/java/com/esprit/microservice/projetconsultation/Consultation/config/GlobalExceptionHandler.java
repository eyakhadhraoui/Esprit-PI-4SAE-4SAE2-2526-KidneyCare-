package com.esprit.microservice.projetconsultation.Consultation.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Convertit les exceptions en réponses HTTP avec message clair (évite 500).
 * - RuntimeException (ex: Patient/Medecin non trouvé) → 400 ou 404
 * - AuthenticationException (JWT invalide ou Keycloak indisponible) → 401
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Erreur serveur";
        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (message.contains("non trouvé") || message.contains("introuvable")) {
            status = HttpStatus.NOT_FOUND;
        }
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthenticationException(AuthenticationException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Non authentifié ou token invalide (vérifiez Keycloak).";
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", message));
    }
}
