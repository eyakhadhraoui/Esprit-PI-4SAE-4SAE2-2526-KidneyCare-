/**
 * Configuration Keycloak pour l'intégration SSO.
 * À adapter selon votre realm et client Keycloak.
 */
export const keycloakConfig = {
  /** Même Keycloak / realm que les backends (NEPHRO, projetparametrevital, etc.) — sinon JWT rejeté (401). */
  url: 'http://localhost:8080',
  realm: 'kidneyCare-realm',
  clientId: 'vurr-frontend', // client public SPA : doit exister dans ce realm
};

export type KeycloakConfig = typeof keycloakConfig;
