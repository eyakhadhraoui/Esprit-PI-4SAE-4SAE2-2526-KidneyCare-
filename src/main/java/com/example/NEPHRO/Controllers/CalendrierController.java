package com.example.NEPHRO.Controllers;

import com.example.NEPHRO.Services.CalendrierService;
import com.example.NEPHRO.dto.CalendrierEventDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Calendrier du patient : événements (suivis et images médicales) ajoutés par le médecin.
 */
@RestController
@RequestMapping("/api/calendrier")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CalendrierController {

    private static final Logger log = LoggerFactory.getLogger(CalendrierController.class);
    private final CalendrierService calendrierService;

    /** Événements du patient connecté (JWT → preferred_username). */
    @GetMapping("/mes-evenements")
    public ResponseEntity<?> getMesEvenements(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) return ResponseEntity.status(401).build();
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) username = jwt.getSubject();
        if (username == null || username.isBlank()) return ResponseEntity.status(400).build();
        try {
            List<CalendrierEventDTO> events = calendrierService.getEvenementsPourPatient(username);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("Erreur calendrier mes-evenements pour username={}", username, e);
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                msg = msg + " | " + e.getCause().getMessage();
            }
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal Server Error",
                    "message", msg
            ));
        }
    }
}
