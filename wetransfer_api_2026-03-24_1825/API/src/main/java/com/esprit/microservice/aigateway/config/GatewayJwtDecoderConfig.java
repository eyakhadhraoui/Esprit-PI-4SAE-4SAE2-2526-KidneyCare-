package com.esprit.microservice.aigateway.config;

import java.net.URI;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.util.StringUtils;

/**
 * Décodeur JWT unique : JWK depuis une URL joignable par la gateway (Docker : {@code http://keycloak:8080/...}),
 * tout en acceptant plusieurs valeurs du claim {@code iss} (navigateur → localhost:8081, Symfony → keycloak:8080).
 */
@Configuration
public class GatewayJwtDecoderConfig {

    @Bean
    @Primary
    public JwtDecoder jwtDecoder(
            @Value("${gateway.keycloak.jwk-set-uri}") String jwkSetUri,
            @Value("${gateway.keycloak.allowed-issuers:}") String allowedIssuersRaw) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();

        Set<String> allowed = new HashSet<>(parseIssuers(allowedIssuersRaw));
        if (allowed.isEmpty()) {
            allowed.add("http://localhost:8081/realms/kidneyCare-realm");
            allowed.add("http://127.0.0.1:8081/realms/kidneyCare-realm");
            allowed.add("http://localhost:8080/realms/kidneyCare-realm");
            allowed.add("http://127.0.0.1:8080/realms/kidneyCare-realm");
            allowed.add("http://keycloak:8080/realms/kidneyCare-realm");
        }

        final String realmPath = "/realms/kidneyCare-realm";
        OAuth2TokenValidator<Jwt> issuerValidator = jwt -> {
            String iss = jwt.getIssuer() != null ? jwt.getIssuer().toString().trim() : "";
            if (iss.endsWith("/")) {
                iss = iss.substring(0, iss.length() - 1);
            }
            if (allowed.contains(iss)) {
                return OAuth2TokenValidatorResult.success();
            }
            try {
                URI u = URI.create(iss);
                String path = u.getPath() != null ? u.getPath().replaceAll("/$", "") : "";
                if (realmPath.equals(path)) {
                    return OAuth2TokenValidatorResult.success();
                }
            } catch (Exception ignored) {
                // ignore
            }
            return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "Issuer non reconnu: " + iss, null));
        };

        OAuth2TokenValidator<Jwt> validators = new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(Duration.ofMinutes(2)),
                issuerValidator);
        decoder.setJwtValidator(validators);
        return decoder;
    }

    private static Set<String> parseIssuers(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
    }
}
