package com.esprit.microservice.projetconsultation.Consultation.controller;

import com.esprit.microservice.projetconsultation.Consultation.dto.MedecinDTO;
import com.esprit.microservice.projetconsultation.Consultation.entity.Medecin;
import com.esprit.microservice.projetconsultation.Consultation.repository.MedecinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/medecin")
@RequiredArgsConstructor
public class MedecinController {

    private final MedecinRepository medecinRepository;

    /** Médecin connecté (JWT → preferred_username). Crée le médecin en base si absent. */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Non authentifié"));
        }
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) username = jwt.getSubject();
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(400).body(Map.of("message", "Username absent du token"));
        }
        final String resolvedUsername = username;
        Medecin medecin = medecinRepository.findByUsername(resolvedUsername)
                .orElseGet(() -> {
                    String email = jwt.getClaimAsString("email");
                    String givenName = jwt.getClaimAsString("given_name");
                    String familyName = jwt.getClaimAsString("family_name");
                    Medecin m = Medecin.builder()
                            .username(resolvedUsername)
                            .nom(familyName != null && !familyName.isBlank() ? familyName : resolvedUsername)
                            .prenom(givenName != null && !givenName.isBlank() ? givenName : "")
                            .email(email != null ? email : resolvedUsername + "@kidneycare.local")
                            .build();
                    return medecinRepository.save(m);
                });
        return ResponseEntity.ok(toDTO(medecin));
    }

    @GetMapping("/retrieveMedecins")
    public List<MedecinDTO> retrieveMedecins() {
        try {
            List<MedecinDTO> list = medecinRepository.findAll().stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
            if (!list.isEmpty()) return list;
        } catch (Exception e) {
            e.printStackTrace();
        }
        // Fallback si base vide ou erreur (données de test)
        return List.of(
                new MedecinDTO(1L, "nour", "jeddi", "nour"),
                new MedecinDTO(2L, "olfa", "fendi", "olfa")
        );
    }

    private MedecinDTO toDTO(Medecin m) {
        MedecinDTO dto = new MedecinDTO();
        dto.setIdMedecin(m != null ? m.getIdMedecin() : null);
        dto.setUsername(m != null ? m.getUsername() : null);
        dto.setNom(m != null ? m.getNom() : "");
        dto.setPrenom(m != null && m.getPrenom() != null ? m.getPrenom() : "");
        return dto;
    }
}
