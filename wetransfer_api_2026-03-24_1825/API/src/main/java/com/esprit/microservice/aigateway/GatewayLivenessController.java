package com.esprit.microservice.aigateway;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Utilisé par le healthcheck Docker (curl) : indique que Netty écoute, sans dépendre d’Eureka ni de Keycloak.
 */
@RestController
public class GatewayLivenessController {

    @GetMapping("/internal/liveness")
    public String liveness() {
        return "OK";
    }
}
