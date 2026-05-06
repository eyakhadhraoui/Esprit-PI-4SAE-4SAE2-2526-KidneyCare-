package com.esprit.microservice.aigateway.config;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    /** JWK via Docker ; accepte plusieurs {@code iss} (navigateur localhost:8081 vs keycloak:8080). */
    @Bean
    public ReactiveJwtDecoder reactiveJwtDecoder(
            @Value("${gateway.keycloak.jwk-set-uri:http://keycloak:8080/realms/kidneyCare-realm/protocol/openid-connect/certs}") String jwkSetUri,
            @Value("${gateway.keycloak.allowed-issuers:http://localhost:8081/realms/kidneyCare-realm,http://127.0.0.1:8081/realms/kidneyCare-realm,http://keycloak:8080/realms/kidneyCare-realm}") String allowedIssuersCsv) {
        Set<String> allowedIssuers = Arrays.stream(allowedIssuersCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri).build();
        OAuth2TokenValidator<Jwt> issuerOk = jwt -> {
            String iss = jwt.getClaimAsString(JwtClaimNames.ISS);
            if (iss != null && allowedIssuers.contains(iss)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error(OAuth2ErrorCodes.INVALID_TOKEN, "JWT issuer not allowed", null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(new JwtTimestampValidator(), issuerOk));
        return decoder;
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http, CorsConfigurationSource corsConfigurationSource) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .authorizeExchange(auth -> auth
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/patients/register-profile").permitAll()
                        .pathMatchers("/nephro/api/auth/**").permitAll()
                        .pathMatchers("/projet/api/auth/**").permitAll()
                        .pathMatchers("/projet/auth/**").permitAll()
                        .pathMatchers("/prescription/auth/**").permitAll()
                        .pathMatchers("/api/medications", "/api/medications/**").permitAll()
                        .pathMatchers("/api/prescriptions", "/api/prescriptions/**").permitAll()
                        .pathMatchers("/uploads/**").permitAll()
                        .pathMatchers("/ws/**").permitAll()
                        .pathMatchers("/actuator/**").permitAll()
                        .pathMatchers("/internal/liveness").permitAll()
                        // Swagger UI centralisé + proxy OpenAPI vers les microservices
                        .pathMatchers("/favicon.ico").permitAll()
                        .pathMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/webjars/**").permitAll()
                        .pathMatchers("/dossiers-openapi/**", "/prescriptions-openapi/**", "/infection-openapi/**", "/projet-openapi/**").permitAll()
                        // Console H2 (consultation / infection) — sans JWT ; ouvrir dans un onglet dédié, pas dans un iframe Swagger
                        .pathMatchers("/infection/h2", "/infection/h2/**").permitAll()
                        .pathMatchers("/projet/h2-console", "/projet/h2-console/**").permitAll()
                        .pathMatchers("/prescription/v3/api-docs", "/prescription/v3/api-docs/**").permitAll()
                        .pathMatchers("/nephro/v3/api-docs", "/nephro/v3/api-docs/**").permitAll()
                        .pathMatchers("/projet/v3/api-docs", "/projet/v3/api-docs/**").permitAll()
                        .pathMatchers("/infection/v3/api-docs", "/infection/v3/api-docs/**").permitAll()
                        .pathMatchers("/hospitalisation/v3/api-docs", "/hospitalisation/v3/api-docs/**").permitAll()
                        // Nutrition_Service — écriture médecin, lecture authentifiée
                        .pathMatchers(HttpMethod.GET, "/api/nutrition/**", "/api/aliments/**",
                                "/api/besoins-nutritionnels/**", "/api/restrictions-alimentaires/**",
                                "/api/alertes-nutrition/**").authenticated()
                        .pathMatchers(HttpMethod.POST, "/api/nutrition/**", "/api/aliments/**",
                                "/api/besoins-nutritionnels/**", "/api/restrictions-alimentaires/**",
                                "/api/alertes-nutrition/**").hasRole("medecin")
                        .pathMatchers(HttpMethod.PUT, "/api/nutrition/**", "/api/aliments/**",
                                "/api/besoins-nutritionnels/**", "/api/restrictions-alimentaires/**",
                                "/api/alertes-nutrition/**").hasRole("medecin")
                        .pathMatchers(HttpMethod.DELETE, "/api/nutrition/**", "/api/aliments/**",
                                "/api/besoins-nutritionnels/**", "/api/restrictions-alimentaires/**",
                                "/api/alertes-nutrition/**").hasRole("medecin")
                        .pathMatchers("/nutrition-openapi/**").permitAll()
                        // Paramètres Vitaux — authentifié
                        .pathMatchers("/vital/**").authenticated()
                        .pathMatchers("/vital-openapi/**").permitAll()
                        // Graft Function Monitoring — médecin ET patient
                        .pathMatchers("/graft/**").hasAnyRole("medecin", "patient")
                        .pathMatchers("/graft-openapi/**").permitAll()
                        // NEPHRO (DossierMedical) — médecin ET patient
                        .pathMatchers(HttpMethod.GET,
                                "/nephro/**", "/api/dossiers-medicaux/**",
                                "/api/patients/**", "/suivis/**").hasAnyRole("medecin", "patient")
                        .pathMatchers(HttpMethod.POST,
                                "/nephro/**", "/api/dossiers-medicaux/**",
                                "/api/patients/**", "/suivis/**").hasAnyRole("medecin", "patient")
                        .pathMatchers(HttpMethod.PUT,
                                "/nephro/**", "/api/dossiers-medicaux/**",
                                "/api/patients/**", "/suivis/**").hasAnyRole("medecin", "patient")
                        .pathMatchers(HttpMethod.DELETE,
                                "/nephro/**", "/api/dossiers-medicaux/**",
                                "/api/patients/**", "/suivis/**").hasAnyRole("medecin", "patient")
                        // Paramètres vitaux — médecin ET patient
                        .pathMatchers("/vital/**").hasAnyRole("medecin", "patient")
                        .pathMatchers("/prescription/admin/**").hasRole("medecin")
                        .anyExchange().authenticated()
                );
        http.oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(this::jwtAuthenticationConverter))
        );
        return http.build();
    }

    private Mono<AbstractAuthenticationToken> jwtAuthenticationConverter(Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        Object realmAccess = jwt.getClaims().get("realm_access");
        if (realmAccess instanceof Map<?, ?> realmAccessMap) {
            Object rolesObj = realmAccessMap.get("roles");
            if (rolesObj instanceof Collection<?> roles) {
                for (Object role : roles) {
                    if (role != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toString()));
                    }
                }
            }
        }

        Object resourceAccess = jwt.getClaims().get("resource_access");
        if (resourceAccess instanceof Map<?, ?> resourceAccessMap) {
            for (Object clientEntryValue : resourceAccessMap.values()) {
                if (!(clientEntryValue instanceof Map<?, ?> clientMap)) continue;
                Object clientRolesObj = clientMap.get("roles");
                if (clientRolesObj instanceof Collection<?> clientRoles) {
                    for (Object role : clientRoles) {
                        if (role != null) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toString()));
                        }
                    }
                }
            }
        }

        return Mono.just(new JwtAuthenticationToken(jwt, authorities));
    }
}