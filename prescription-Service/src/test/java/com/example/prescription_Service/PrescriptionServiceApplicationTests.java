package com.example.prescription_Service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Charge tout le contexte (JPA MySQL, Eureka, OAuth2 Keycloak). À activer en local si l’infra est prête.
 * Les tests utiles en CI sans Docker sont plutôt {@code DernierBilanControllerTest}.
 */
@SpringBootTest
@Disabled("Nécessite MySQL, Eureka et Keycloak accessibles (voir TESTS-QUALITE.md).")
class PrescriptionServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
