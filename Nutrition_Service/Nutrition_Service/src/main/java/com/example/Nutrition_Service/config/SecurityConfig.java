package com.example.Nutrition_Service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Protection des API nutrition : JWT Keycloak + rôles realm ({@code medecin}, {@code patient}, etc.).
 * Les contrôleurs sous {@code /api/...} (alertes, aliments, besoins, restrictions, stats, nutrition) sont couverts.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info", "/actuator/prometheus").permitAll()
                        .requestMatchers("/public/**").permitAll()
                        // Suppression / modification de référentiels ou fiches : médecin
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("MEDECIN")
                        .requestMatchers(HttpMethod.POST,
                                "/api/aliments/**",
                                "/api/besoins-nutritionnels/**",
                                "/api/restrictions-alimentaires/**",
                                "/api/alertes-nutrition/**",
                                "/api/nutrition/lab/**").hasAnyRole("MEDECIN", "PATIENT")
                        .requestMatchers(HttpMethod.PUT, "/api/**").hasRole("MEDECIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/**").hasAnyRole("MEDECIN", "PATIENT")
                        // Suggestions auto-complétion (front) — sans JWT pour éviter les 401 via proxy
                        .requestMatchers(HttpMethod.GET, "/api/nutrition/suggestions").permitAll()
                        // Besoin actif (front back-office) — renvoie 204 si absent, pas besoin de JWT
                        .requestMatchers(HttpMethod.GET, "/api/besoins-nutritionnels/patient/*/actif").permitAll()
                        // Lecture publique pour la vue patient (pas de JWT côté front)
                        .requestMatchers(HttpMethod.GET,
                                "/api/alertes-nutrition/patient/**",
                                "/api/restrictions-alimentaires/patient/**",
                                "/api/aliments/**",
                                "/api/nutrition/menus-semaine/**").permitAll()
                        // Marquer alertes comme lues (patient)
                        .requestMatchers(HttpMethod.PATCH,
                                "/api/alertes-nutrition/*/marquer-lue",
                                "/api/alertes-nutrition/patient/*/marquer-toutes-lues").permitAll()
                        // Lecture : médecin ou patient
                        .requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole("MEDECIN", "PATIENT")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:4200",
                "http://localhost:8095"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null) {
                return List.of();
            }
            @SuppressWarnings("unchecked")
            Collection<String> roles = (Collection<String>) realmAccess.get("roles");
            if (roles == null) {
                return List.of();
            }
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        });
        return converter;
    }
}
