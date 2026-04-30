package com.esprit.microservice.projetconsultation.Consultation.auth;

import com.esprit.microservice.projetconsultation.Consultation.auth.dto.LoginRequest;
import com.esprit.microservice.projetconsultation.Consultation.auth.dto.RegisterRequest;
import com.esprit.microservice.projetconsultation.Consultation.auth.dto.TokenResponse;
import com.esprit.microservice.projetconsultation.Consultation.entity.Patient;
import com.esprit.microservice.projetconsultation.Consultation.entity.UserApp;
import com.esprit.microservice.projetconsultation.Consultation.repository.PatientRepository;
import com.esprit.microservice.projetconsultation.Consultation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Service d'authentification : appelle Keycloak (Resource Owner Password)
 * et enregistre l'utilisateur en MySQL.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final KeycloakAdminService keycloakAdminService;

    @Value("${keycloak.auth-server-url:http://localhost:8080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:kidneyCare-realm}")
    private String realm;

    @Value("${keycloak.resource:kidneyCare-app}")
    private String clientId;

    @Value("${keycloak.credentials.secret:}")
    private String clientSecret;

    /**
     * Authentifie l'utilisateur via Keycloak (Resource Owner Password Grant)
     * et stocke/synchronise l'utilisateur en MySQL.
     */
    public TokenResponse login(LoginRequest request) {
        String tokenUrl = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("username", request.getUsername());
        body.add("password", request.getPassword());
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            body.add("client_secret", clientSecret);
        }

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, entity, Map.class);

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new RuntimeException("Échec de l'authentification Keycloak");
        }

        Map<String, Object> tokenData = response.getBody();
        String accessToken = (String) tokenData.get("access_token");
        String refreshToken = (String) tokenData.get("refresh_token");
        Integer expiresIn = (Integer) tokenData.getOrDefault("expires_in", 300);

        // Extraire les infos du JWT pour stocker en MySQL
        Map<String, Object> payload = extractPayloadFromJwt(accessToken);
        String keycloakSubject = (String) payload.get("sub");
        String username = (String) payload.getOrDefault("preferred_username", request.getUsername());
        String email = (String) payload.getOrDefault("email", "");

        // Stocker ou mettre à jour l'utilisateur en MySQL
        saveOrUpdateUser(keycloakSubject, username, email);

        return TokenResponse.builder()
                .access_token(accessToken)
                .refresh_token(refreshToken)
                .expires_in(expiresIn)
                .build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractPayloadFromJwt(String jwt) {
        try {
            String payload = jwt.split("\\.")[1];
            String decoded = new String(java.util.Base64.getUrlDecoder().decode(payload));
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(decoded, Map.class);
        } catch (Exception e) {
            log.warn("Impossible d'extraire le payload JWT", e);
            return Map.of("sub", "unknown", "preferred_username", "unknown");
        }
    }

    private void saveOrUpdateUser(String keycloakSubject, String username, String email) {
        UserApp user = userRepository.findByKeycloakSubject(keycloakSubject)
                .orElseGet(() -> {
                    UserApp u = new UserApp();
                    u.setKeycloakSubject(keycloakSubject);
                    u.setUsername(username);
                    u.setEmail(email);
                    return u;
                });
        user.setUsername(username);
        user.setEmail(email);
        userRepository.save(user);
    }

    /**
     * Inscription d'un patient : crée l'utilisateur dans Keycloak et le Patient en MySQL.
     */
    public TokenResponse registerPatient(RegisterRequest request) {
        if (patientRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Ce nom d'utilisateur existe déjà.");
        }
        if (request.getEmail() != null && !request.getEmail().isBlank() && patientRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé.");
        }

        keycloakAdminService.createPatientUser(request);

        Patient patient = Patient.builder()
                .username(request.getUsername())
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail() : request.getUsername() + "@kidneycare.local")
                .firstName(request.getFirstName() != null ? request.getFirstName() : "")
                .lastName(request.getLastName() != null ? request.getLastName() : "")
                .telephone(request.getTelephone())
                .dateNaissance(request.getDateNaissance())
                .build();
        patientRepository.save(patient);

        return login(new LoginRequest(request.getUsername(), request.getPassword()));
    }
}
