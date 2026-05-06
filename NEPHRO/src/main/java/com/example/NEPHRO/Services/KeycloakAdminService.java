package com.example.NEPHRO.Services;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Création d'utilisateurs dans Keycloak via l'API Admin (pour l'inscription patient).
 * Configurez keycloak.admin.username et keycloak.admin.password (compte admin du realm master).
 */
@Service
@RequiredArgsConstructor
public class KeycloakAdminService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakAdminService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${keycloak.url:http://localhost:8080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:kidneyCare-realm}")
    private String realm;

    @Value("${keycloak.admin.username:}")
    private String adminUsername;

    @Value("${keycloak.admin.password:}")
    private String adminPassword;

    /**
     * Crée un utilisateur dans Keycloak avec le rôle "patient" et définit son mot de passe.
     * @return l'id Keycloak du user créé, ou null si admin non configuré
     */
    public String createUserWithRolePatient(String username, String email, String firstName, String lastName, String password) {
        if (adminUsername == null || adminUsername.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.warn("Keycloak Admin non configuré (keycloak.admin.username/password). Impossible de créer l'utilisateur dans Keycloak.");
            return null;
        }
        String adminToken = getMasterRealmAdminToken();
        if (adminToken == null) return null;

        String userId = createUser(adminToken, username, email, firstName, lastName);
        if (userId == null) return null;

        setPassword(adminToken, userId, password);
        assignRealmRole(adminToken, userId, "patient");
        log.info("Utilisateur Keycloak créé: {} (rôle patient)", username);
        return userId;
    }

    /** Supprime un utilisateur Keycloak (pour annulation si MySQL échoue après). */
    public void deleteUser(String keycloakUserId) {
        if (keycloakUserId == null || keycloakUserId.isBlank()) return;
        if (adminUsername == null || adminUsername.isBlank() || adminPassword == null || adminPassword.isBlank()) return;
        try {
            String adminToken = getMasterRealmAdminToken();
            if (adminToken == null) return;
            String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + keycloakUserId;
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(adminToken);
            restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
            log.info("Utilisateur Keycloak supprimé (rollback): {}", keycloakUserId);
        } catch (Exception e) {
            log.warn("Impossible de supprimer l'utilisateur Keycloak {}: {}", keycloakUserId, e.getMessage());
        }
    }

    private String getMasterRealmAdminToken() {
        String tokenUrl = keycloakUrl + "/realms/master/protocol/openid-connect/token";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", "admin-cli");
        body.add("username", adminUsername);
        body.add("password", adminPassword);
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, entity, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("access_token")) {
                return (String) response.getBody().get("access_token");
            }
        } catch (Exception e) {
            log.error("Impossible d'obtenir le token admin Keycloak: {}", e.getMessage());
            throw new RuntimeException("Keycloak admin inaccessible. Vérifiez keycloak.admin.username et keycloak.admin.password.");
        }
        return null;
    }

    private String createUser(String adminToken, String username, String email, String firstName, String lastName) {
        String url = keycloakUrl + "/admin/realms/" + realm + "/users";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);
        Map<String, Object> user = Map.of(
                "username", username,
                "email", email != null ? email : "",
                "firstName", firstName != null ? firstName : "",
                "lastName", lastName != null ? lastName : "",
                "enabled", true
        );
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(user, headers);
        try {
            ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            String location = response.getHeaders().getFirst(HttpHeaders.LOCATION);
            if (location != null && location.contains("/users/")) {
                return location.substring(location.lastIndexOf("/") + 1);
            }
            // Fallback: list users and find by username
            return findUserIdByUsername(adminToken, username);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 409) {
                throw new RuntimeException("Cet identifiant existe déjà dans Keycloak.");
            }
            throw new RuntimeException("Keycloak: " + (e.getResponseBodyAsString() != null ? e.getResponseBodyAsString() : e.getMessage()));
        }
    }

    private String findUserIdByUsername(String adminToken, String username) {
        String url = keycloakUrl + "/admin/realms/" + realm + "/users?username=" + username;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        @SuppressWarnings("unchecked")
        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(url, HttpMethod.GET, entity,
                (Class<List<Map<String, Object>>>) (Class<?>) List.class);
        if (response.getBody() != null && !response.getBody().isEmpty() && response.getBody().get(0).containsKey("id")) {
            return (String) response.getBody().get(0).get("id");
        }
        return null;
    }

    private void setPassword(String adminToken, String userId, String password) {
        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/reset-password";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);
        Map<String, Object> body = Map.of(
                "type", "password",
                "value", password,
                "temporary", false
        );
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        restTemplate.exchange(url, HttpMethod.PUT, entity, Void.class);
    }

    private void assignRealmRole(String adminToken, String userId, String roleName) {
        String roleUrl = keycloakUrl + "/admin/realms/" + realm + "/roles/" + roleName;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> getRole = new HttpEntity<>(headers);
        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> roleResponse = restTemplate.exchange(roleUrl, HttpMethod.GET, getRole, (Class<Map<String, Object>>) (Class<?>) Map.class);
        if (roleResponse.getBody() == null || !roleResponse.getBody().containsKey("id")) {
            throw new RuntimeException("Rôle 'patient' introuvable dans Keycloak. Créez le rôle dans le realm.");
        }
        String mappingUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<List<Map<String, Object>>> mapEntity = new HttpEntity<>(List.of(roleResponse.getBody()), headers);
        restTemplate.exchange(mappingUrl, HttpMethod.POST, mapEntity, Void.class);
    }
}
