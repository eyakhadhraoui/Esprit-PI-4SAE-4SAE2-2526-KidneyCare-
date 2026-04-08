package com.esprit.microservice.aigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.reactive.CorsConfigurationSource;

/**
 * Sécurité du point d’entrée unique (API Gateway) : Spring Security WebFlux + JWT Keycloak.
 * <p>
 * Stratégie :
 * <ul>
 *   <li>Chemins publics : login, inscription, fichiers uploadés, actuator (voir ci-dessous).</li>
 *   <li>Endpoints sensibles : restriction par rôle {@code medecin} (alertes prescripteur, ajustements posologie).</li>
 *   <li>Préfixes inter-services : {@code /prescription/**}, {@code /nephro/**} — accès médecin ou patient authentifiés.</li>
 *   <li>Tout autre appel authentifié : JWT valide (sans rôle particulier).</li>
 * </ul>
 * Les rôles proviennent du realm Keycloak ({@code realm_access.roles}) et sont exposés comme
 * {@code ROLE_MEDECIN}, {@code ROLE_PATIENT}, etc. (voir {@link KeycloakRealmRolesConverter}).
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(
            ServerHttpSecurity http,
            CorsConfigurationSource corsConfigurationSource,
            ReactiveJwtAuthenticationConverterAdapter reactiveJwtAuthenticationConverter) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .authorizeExchange(auth -> auth
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // ——— Public (pas de JWT) ———
                        .pathMatchers("/api/auth/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/patients/register-profile").permitAll()
                        .pathMatchers("/nephro/api/auth/**").permitAll()
                        .pathMatchers("/projet/api/auth/**").permitAll()
                        .pathMatchers("/projet/auth/**").permitAll()
                        .pathMatchers("/prescription/auth/**").permitAll()
                        .pathMatchers("/uploads/**").permitAll()
                        .pathMatchers("/actuator/**").permitAll()
                        // ——— Rôles : ressources sensibles (prescription / NEPHRO) ———
                        .pathMatchers("/api/doctor-alerts/**").hasRole("medecin")
                        .pathMatchers("/api/dosage-adjustments/**").hasRole("medecin")
                        .pathMatchers("/prescription/**").hasAnyRole("medecin", "patient", "admin")
                        .pathMatchers("/nephro/**").hasAnyRole("medecin", "patient", "admin")
                        // ——— Par défaut : tout utilisateur avec JWT valide ———
                        .anyExchange().authenticated()
                );
        http.oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(reactiveJwtAuthenticationConverter)));
        return http.build();
    }
}
