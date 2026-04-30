package com.esprit.microservice.projetconsultation.Consultation.utils;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class KeycloakUtils {
    public static String getUsername() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return jwt.getClaim("preferred_username");
    }

    public static String getEmail() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return jwt.getClaim("email");
    }
}
