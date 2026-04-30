package com.esprit.microservice.projetconsultation.Consultation.auth;

import com.esprit.microservice.projetconsultation.Consultation.auth.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Service pour créer des utilisateurs dans Keycloak via l'Admin API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${keycloak.auth-server-url:http://localhost:8080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:kidneyCare-realm}")
    private String realm;

    @Value("${keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin.password:admin}")
    private String adminPassword;

    private static final String MASTER_REALM = "master";
    private static final String ADMIN_CLI = "admin-cli";

    /**
     * Crée un utilisateur patient dans Keycloak et lui attribue le rôle patient.
     */
    public void createPatientUser(RegisterRequest request) {
        String adminToken = getAdminToken();
        String userId = createUser(adminToken, request);
        if (userId != null) {
            assignPatientRole(adminToken, userId);
        }
    }

    private String getAdminToken() {
        String tokenUrl = keycloakUrl + "/realms/" + MASTER_REALM + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", ADMIN_CLI);
        body.add("username", adminUsername);
        body.add("password", adminPassword);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, entity, Map.class);

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new RuntimeException("Impossible d'obtenir le token admin Keycloak. Vérifiez keycloak.admin.username et keycloak.admin.password.");
        }

        return (String) response.getBody().get("access_token");
    }

    private String createUser(String adminToken, RegisterRequest req) {
        String createUrl = keycloakUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> user = Map.of(
                "username", req.getUsername(),
                "email", req.getEmail() != null && !req.getEmail().isBlank() ? req.getEmail() : req.getUsername() + "@kidneycare.local",
                "firstName", req.getFirstName() != null ? req.getFirstName() : "",
                "lastName", req.getLastName() != null ? req.getLastName() : "",
                "enabled", true,
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", req.getPassword(),
                        "temporary", false
                ))
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(user, headers);
        ResponseEntity<Void> response = restTemplate.exchange(createUrl, HttpMethod.POST, entity, Void.class);

        if (response.getStatusCode() != HttpStatus.CREATED) {
            throw new RuntimeException("Échec de création de l'utilisateur Keycloak. Vérifiez que le username n'existe pas déjà.");
        }

        String location = response.getHeaders().getFirst(HttpHeaders.LOCATION);
        if (location == null) return null;

        String[] parts = location.split("/");
        return parts[parts.length - 1];
    }

    @SuppressWarnings("unchecked")
    private void assignPatientRole(String adminToken, String userId) {
        if (userId == null) return;

        String roleUrl = keycloakUrl + "/admin/realms/" + realm + "/roles/patient";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        ResponseEntity<Map> roleResponse = restTemplate.exchange(roleUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        if (roleResponse.getStatusCode() != HttpStatus.OK || roleResponse.getBody() == null) {
            log.warn("Rôle 'patient' non trouvé dans Keycloak. Créez-le manuellement.");
            return;
        }

        Map<String, Object> role = roleResponse.getBody();
        String assignUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<List<Map<String, Object>>> assignEntity = new HttpEntity<>(List.of(role), headers);
        restTemplate.exchange(assignUrl, HttpMethod.POST, assignEntity, Void.class);
    }
}
