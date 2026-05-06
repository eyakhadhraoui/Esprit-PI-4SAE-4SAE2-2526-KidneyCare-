package com.esprit.microservice.aigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {

    
    @Bean
    public RouteLocator gatewayRoutes(
            RouteLocatorBuilder builder,
            @Value("${gateway.routing.uri.dossiermedicale:lb://DossierMedical}") String dossierMedicaleUri,
            @Value("${gateway.routing.uri.prescription-service:lb://prescription-Service}") String prescriptionServiceUri,
            @Value("${gateway.routing.uri.infection:lb://InfectionEtVaccination}") String infectionUri,
            @Value("${gateway.routing.uri.projetconsultation:lb://projetconsultation}") String projetConsultationUri,
            @Value("${gateway.routing.uri.foncgreffon:lb://FoncGreffon}") String foncGreffonUri,
            @Value("${gateway.routing.uri.nutrition:lb://Nutrition_Service}") String nutritionUri,
            @Value("${gateway.routing.uri.parametrevital:lb://projetparametrevital}") String parametreVitalUri,
            @Value("${gateway.public.host:localhost:8095}") String publicHost) {
        return builder.routes()

                // OpenAPI dossiermedicale : /api/** va au catch-all NEPHRO — préfixe dédié pour agrégation Swagger sur la gateway
                .route("DOSSIERMEDICAL_OPENAPI", r -> r.order(-20)
                        .path("/dossiers-openapi/v3/api-docs", "/dossiers-openapi/v3/api-docs/**")
                        .filters(f -> f
                                .rewritePath("/dossiers-openapi/(?<segment>.*)", "/${segment}")
                                .addRequestHeader("X-Forwarded-Host", publicHost)
                                .addRequestHeader("X-Forwarded-Proto", "http")
                                .addRequestHeader("X-Forwarded-Port", publicHost.contains(":") ? publicHost.split(":")[1] : "80"))
                        .uri(dossierMedicaleUri))

                .route("PRESCRIPTION_OPENAPI", r -> r.order(-20)
                        .path("/prescriptions-openapi/v3/api-docs", "/prescriptions-openapi/v3/api-docs/**")
                        .filters(f -> f
                                .rewritePath("/prescriptions-openapi/(?<segment>.*)", "/${segment}")
                                .addRequestHeader("X-Forwarded-Host", publicHost)
                                .addRequestHeader("X-Forwarded-Proto", "http")
                                .addRequestHeader("X-Forwarded-Port", publicHost.contains(":") ? publicHost.split(":")[1] : "80"))
                        .uri(prescriptionServiceUri))

                .route("INFECTION_OPENAPI", r -> r.order(-20)
                        .path("/infection-openapi/v3/api-docs", "/infection-openapi/v3/api-docs/**")
                        .filters(f -> f
                                .rewritePath("/infection-openapi/(?<segment>.*)", "/infection/${segment}")
                                .addRequestHeader("X-Forwarded-Host", publicHost)
                                .addRequestHeader("X-Forwarded-Proto", "http")
                                .addRequestHeader("X-Forwarded-Port", publicHost.contains(":") ? publicHost.split(":")[1] : "80"))
                        .uri(infectionUri))

                .route("PROJET_OPENAPI", r -> r.order(-20)
                        .path("/projet-openapi/v3/api-docs", "/projet-openapi/v3/api-docs/**")
                        .filters(f -> f
                                .rewritePath("/projet-openapi/(?<segment>.*)", "/projet/${segment}")
                                .addRequestHeader("X-Forwarded-Host", publicHost)
                                .addRequestHeader("X-Forwarded-Proto", "http")
                                .addRequestHeader("X-Forwarded-Port", publicHost.contains(":") ? publicHost.split(":")[1] : "80"))
                        .uri(projetConsultationUri))

                // ── Nutrition_Service ────────────────────────────────────────────────────
                .route("NUTRITION_OPENAPI", r -> r.order(-20)
                        .path("/nutrition-openapi/v3/api-docs", "/nutrition-openapi/v3/api-docs/**")
                        .filters(f -> f
                                .rewritePath("/nutrition-openapi/(?<segment>.*)", "/${segment}")
                                .addRequestHeader("X-Forwarded-Host", publicHost)
                                .addRequestHeader("X-Forwarded-Proto", "http")
                                .addRequestHeader("X-Forwarded-Port", publicHost.contains(":") ? publicHost.split(":")[1] : "80"))
                        .uri(nutritionUri))

                // Routes nutrition prioritaires sur le catch-all /api/** de DossierMedical
                .route("NUTRITION_API", r -> r.order(-10)
                        .path("/api/nutrition/**",
                              "/api/aliments", "/api/aliments/**",
                              "/api/besoins-nutritionnels", "/api/besoins-nutritionnels/**",
                              "/api/restrictions-alimentaires", "/api/restrictions-alimentaires/**",
                              "/api/alertes-nutrition", "/api/alertes-nutrition/**")
                        .uri(nutritionUri))

                // ── projetparametrevital ──────────────────────────────────────────────────
                .route("VITAL_OPENAPI", r -> r.order(-20)
                        .path("/vital-openapi/v3/api-docs", "/vital-openapi/v3/api-docs/**")
                        .filters(f -> f
                                .rewritePath("/vital-openapi/(?<segment>.*)", "/${segment}")
                                .addRequestHeader("X-Forwarded-Host", publicHost)
                                .addRequestHeader("X-Forwarded-Proto", "http")
                                .addRequestHeader("X-Forwarded-Port", publicHost.contains(":") ? publicHost.split(":")[1] : "80"))
                        .uri(parametreVitalUri))

                // /vital/** → strip /vital → projetparametrevital (pas de context-path côté service)
                .route("VITAL_SERVICE", r -> r.path("/vital/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri(parametreVitalUri))

                // ── FoncGreffon (Graft Function Monitoring) ──────────────────────────────
                .route("FONCGREFFON_OPENAPI", r -> r.order(-20)
                        .path("/graft-openapi/v3/api-docs", "/graft-openapi/v3/api-docs/**")
                        .filters(f -> f
                                .rewritePath("/graft-openapi/(?<segment>.*)", "/${segment}")
                                .addRequestHeader("X-Forwarded-Host", publicHost)
                                .addRequestHeader("X-Forwarded-Proto", "http")
                                .addRequestHeader("X-Forwarded-Port", publicHost.contains(":") ? publicHost.split(":")[1] : "80"))
                        .uri(foncGreffonUri))

                .route("FONCGREFFON_SERVICE", r -> r.path("/graft/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri(foncGreffonUri))

                .route("PRESCRIPTION_SERVICE", r -> r.path("/prescription/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri(prescriptionServiceUri))

                // infection service a server.servlet.context-path=/infection → ne pas strip le prefix
                .route("INFECTION_SERVICE", r -> r.path("/infection/**")
                        .uri(infectionUri))

                // Pas de stripPrefix : projetconsultation a server.servlet.context-path=/projet (chemins /projet/medecin/…).
                .route("PROJET_SERVICE", r -> r.path("/projet/**")
                        .uri(projetConsultationUri))

                
                .route("DOSSIER_MEDICAL_PREFIX", r -> r.path("/nephro/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri(dossierMedicaleUri))

                // Même order (0) : tri par id → « DOSSIER_MEDICAL_API » avant « PRESCRIPTION_* » → /api/medications allait au mauvais service (403/404).
                .route("PRESCRIPTION_API_MEDICATIONS", r -> r.order(-10)
                        .path("/api/medications", "/api/medications/**")
                        .uri(prescriptionServiceUri))

                .route("PRESCRIPTION_API_PRESCRIPTIONS", r -> r.order(-10)
                        .path("/api/prescriptions", "/api/prescriptions/**")
                        .uri(prescriptionServiceUri))

                .route("PRESCRIPTION_API_ITEMS", r -> r.order(-10)
                        .path("/api/prescription-items", "/api/prescription-items/**")
                        .uri(prescriptionServiceUri))

                .route("PRESCRIPTION_API_HISTORY", r -> r.order(-10)
                        .path("/api/medication-history", "/api/medication-history/**")
                        .uri(prescriptionServiceUri))

                .route("PRESCRIPTION_API_DOSAGE", r -> r.order(-10)
                        .path("/api/dosage-adjustments", "/api/dosage-adjustments/**")
                        .uri(prescriptionServiceUri))

                .route("PRESCRIPTION_API_ALERTS", r -> r.order(-10)
                        .path("/api/doctor-alerts", "/api/doctor-alerts/**")
                        .uri(prescriptionServiceUri))

                // Compliance (rappel médicaments) : exposé par prescription-service, ne doit pas tomber sur le catch-all /api/** de NEPHRO.
                .route("PRESCRIPTION_API_COMPLIANCE", r -> r.order(-10)
                        .path("/api/compliance", "/api/compliance/**")
                        .uri(prescriptionServiceUri))

                // dossiermedicale : order élevé = priorité basse, après toutes les routes /api/* dédiées (prescription, auth).
                // /ws/** = SockJS + STOMP (notifications patient, ex. nouvelle image médicale)
                .route("DOSSIER_MEDICAL_API", r -> r.order(100)
                        .path("/api/**", "/suivis/**", "/uploads/**", "/ws/**")
                        .uri(dossierMedicaleUri))

                .build();
    }
}
