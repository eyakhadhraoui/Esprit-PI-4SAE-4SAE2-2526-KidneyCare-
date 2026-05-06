package com.example.prescription_Service.client;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Propage le header {@code Authorization} (JWT) de la requête entrante vers NEPHRO,
 * afin que les appels Feign restent authentifiés comme le navigateur.
 */
@Configuration
public class NephroFeignConfig {

    @Bean
    public RequestInterceptor forwardAuthorizationHeader() {
        return (RequestTemplate template) -> {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) {
                return;
            }
            String auth = attrs.getRequest().getHeader("Authorization");
            if (auth != null && !auth.isBlank()) {
                template.header("Authorization", auth);
            }
        };
    }
}
