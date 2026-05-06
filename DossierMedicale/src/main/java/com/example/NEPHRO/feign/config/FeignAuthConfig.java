package com.example.NEPHRO.feign.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Propage le header Authorization (Bearer) aux appels OpenFeign.
 */
public class FeignAuthConfig {

    @Bean
    public RequestInterceptor bearerForwardInterceptor() {
        return template -> {
            Authentication auth = SecurityContextHolder.getContext() != null
                    ? SecurityContextHolder.getContext().getAuthentication()
                    : null;
            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                String token = jwtAuth.getToken() != null ? jwtAuth.getToken().getTokenValue() : null;
                if (token != null && !token.isBlank()) {
                    template.header("Authorization", "Bearer " + token);
                }
            }
        };
    }
}

