package com.example.NEPHRO.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.context.annotation.Profile;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Configuration Spring Security + Keycloak (JWT).
 * - Valide les tokens JWT émis par Keycloak (issuer-uri dans application.properties).
 * - Expose les rôles realm (medecin, patient) dans les authorities pour @PreAuthorize.
 * - CORS : autorise le front Angular (origine http://localhost:4200).
 * Désactivé en profil "test" (TestSecurityConfig prend le relais).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Profile("!test")
public class SecurityConfig {

    /** Chaîne 1 : /api/auth/** sans JWT (login, register publics). */
    @Bean
    @Order(1)
    public SecurityFilterChain authFilterChain(HttpSecurity http, @Qualifier("corsConfigurationSource") CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
            .securityMatcher(AntPathRequestMatcher.antMatcher("/api/auth/**"))
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http, @Qualifier("corsConfigurationSource") CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/uploads/**", "/error", "/actuator/health", "/ws/**").permitAll()
                // Lecture et écriture : médecin ET patient
                .requestMatchers(HttpMethod.GET,    "/api/**", "/suivis/**").hasAnyRole("MEDECIN", "PATIENT")
                .requestMatchers(HttpMethod.POST,   "/api/**", "/suivis/**").hasAnyRole("MEDECIN", "PATIENT")
                .requestMatchers(HttpMethod.PUT,    "/api/**", "/suivis/**").hasAnyRole("MEDECIN", "PATIENT")
                .requestMatchers(HttpMethod.DELETE, "/api/**", "/suivis/**").hasAnyRole("MEDECIN", "PATIENT")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );
        return http.build();
    }

    /**
     * Convertit le JWT Keycloak en Authentication en mappant les rôles realm (realm_access.roles)
     * et optionnellement les rôles client (resource_access.<client>.roles) en authorities ROLE_xxx.
     */
    @Bean
    public Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Set<String> roles = new HashSet<>();

            // Rôles realm (ex: medecin, patient)
            Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                Collection<String> realmRoles = (Collection<String>) realmAccess.get("roles");
                if (realmRoles != null) {
                    roles.addAll(realmRoles);
                }
            }

            // Rôles client (resource_access.<clientId>.roles)
            Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
            if (resourceAccess != null) {
                for (Object value : resourceAccess.values()) {
                    if (value instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> client = (Map<String, Object>) value;
                        if (client.containsKey("roles")) {
                            @SuppressWarnings("unchecked")
                            Collection<String> clientRoles = (Collection<String>) client.get("roles");
                            if (clientRoles != null) {
                                roles.addAll(clientRoles);
                            }
                        }
                    }
                }
            }

            return roles.stream()
                .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                .collect(Collectors.toList());
        });
        return converter;
    }
}
