package com.esprit.microservice.aigateway.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Mappe les rôles Keycloak ({@code realm_access.roles}) vers {@code ROLE_<nom>} tel que Keycloak les envoie
 * (ex. {@code medecin} → {@code ROLE_medecin}), aligné sur {@link org.springframework.security.access.expression.SecurityExpressionRoot#hasRole(String)}.
 */
public class KeycloakRealmRolesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null || realmAccess.get("roles") == null) {
            return Collections.emptyList();
        }
        Object raw = realmAccess.get("roles");
        if (!(raw instanceof Collection<?> roles)) {
            return Collections.emptyList();
        }
        return roles.stream()
                .filter(r -> r != null)
                .map(r -> new SimpleGrantedAuthority("ROLE_" + String.valueOf(r).trim()))
                .collect(Collectors.toList());
    }
}
