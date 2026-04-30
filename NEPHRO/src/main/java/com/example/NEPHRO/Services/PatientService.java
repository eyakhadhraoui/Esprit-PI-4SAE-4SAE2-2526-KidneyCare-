package com.example.NEPHRO.Services;

import com.example.NEPHRO.Entities.Patient;
import com.example.NEPHRO.Repository.PatientRepository;
import com.example.NEPHRO.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Inscription patient : enregistrement dans Keycloak (si configuré) et toujours dans MySQL.
 */
@Service
@RequiredArgsConstructor
public class PatientService {

    private static final Logger log = LoggerFactory.getLogger(PatientService.class);
    private final PatientRepository patientRepository;
    private final KeycloakAdminService keycloakAdminService;

    private static String trim(String s) {
        return s != null ? s.trim() : "";
    }

    @Transactional
    public Patient register(RegisterRequest request) {
        String username = trim(request.getUsername());
        String email = trim(request.getEmail());
        String firstName = trim(request.getFirstName());
        String lastName = trim(request.getLastName());

        if (patientRepository.existsByUsername(username)) {
            throw new RuntimeException("Cet identifiant est déjà utilisé.");
        }
        if (patientRepository.existsByEmail(email)) {
            throw new RuntimeException("Cet email est déjà utilisé.");
        }
        // 1) Créer l'utilisateur dans Keycloak (rôle patient) — INSCRIPTION BLOQUÉE si échec
        String keycloakUserId;
        try {
            keycloakUserId = keycloakAdminService.createUserWithRolePatient(
                    username, email, firstName, lastName, request.getPassword());
        } catch (Exception e) {
            log.error("Échec création utilisateur dans Keycloak pour {}: {}", username, e.getMessage());
            throw new RuntimeException("Inscription impossible : Keycloak indisponible ou mal configuré. Contactez l'administrateur.");
        }
        if (keycloakUserId == null || keycloakUserId.isBlank()) {
            log.error("Utilisateur Keycloak non créé pour {} (userId null ou vide)", username);
            throw new RuntimeException("Inscription impossible : Keycloak non configuré. Contactez l'administrateur.");
        }
        log.info("Patient {} enregistré dans Keycloak (rôle patient), userId={}", username, keycloakUserId);

        // 2) Enregistrer le patient dans MySQL (si MySQL échoue, rollback côté Keycloak)
        Patient patient = Patient.builder()
                .username(username)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .dateCreation(LocalDateTime.now())
                .build();
        try {
            patient = patientRepository.save(patient);
            log.info("Patient {} enregistré dans MySQL (idPatient={})", username, patient.getIdPatient());
        } catch (Exception e) {
            if (keycloakUserId != null) {
                keycloakAdminService.deleteUser(keycloakUserId);
            }
            throw new RuntimeException("Erreur base de données : " + e.getMessage(), e);
        }
        return patient;
    }

    public Patient getByUsername(String username) {
        return patientRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé pour l'utilisateur: " + username));
    }

    public java.util.Optional<Patient> findByIdPatient(Long idPatient) {
        return patientRepository.findById(idPatient);
    }

    public java.util.List<Patient> findAll() {
        return patientRepository.findAll();
    }
}
