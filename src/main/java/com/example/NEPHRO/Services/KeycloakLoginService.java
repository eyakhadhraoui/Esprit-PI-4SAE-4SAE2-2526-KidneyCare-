package com.example.NEPHRO.Services;

import com.example.NEPHRO.dto.LoginRequest;
import com.example.NEPHRO.dto.LoginResponse;
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

@Service
@RequiredArgsConstructor
public class KeycloakLoginService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakLoginService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${keycloak.url:http://localhost:8080}")
    private String keycloakUrl;

    @Value("${keycloak.realm:kidneyCare-realm}")
    private String realm;

    @Value("${keycloak.client-id-backend:kidneycare-app}")
    private String clientId;

    @Value("${keycloak.client-secret:}")
    private String clientSecret;

    public LoginResponse login(LoginRequest request) {
        String tokenUrl = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            body.add("client_secret", clientSecret);
        }
        body.add("username", request.getUsername());
        body.add("password", request.getPassword());

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<LoginResponse> response = restTemplate.exchange(
                    tokenUrl,
                    HttpMethod.POST,
                    entity,
                    LoginResponse.class
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new RuntimeException("Keycloak login failed");

        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            log.warn("Keycloak token endpoint erreur {}: {}", e.getStatusCode(), errorBody);
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new RuntimeException("Identifiant ou mot de passe incorrect");
            }
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST && errorBody != null) {
                if (errorBody.contains("invalid_grant") || errorBody.contains("Invalid user credentials")) {
                    throw new RuntimeException("Identifiant ou mot de passe incorrect");
                }
                if (errorBody.contains("unauthorized_client") || errorBody.contains("Direct access")) {
                    throw new RuntimeException("Keycloak : activez « Direct access grants » pour le client kidneycare-app");
                }
            }
            throw new RuntimeException(
                    errorBody != null && !errorBody.isBlank()
                            ? errorBody
                            : "Erreur Keycloak: " + e.getMessage()
            );

        } catch (Exception e) {
            log.error("Connexion Keycloak impossible", e);
            throw new RuntimeException("Connexion Keycloak impossible: " + e.getMessage(), e);
        }
    }
}