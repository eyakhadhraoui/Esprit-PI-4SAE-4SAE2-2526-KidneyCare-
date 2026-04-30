/**
 * Noms des rôles Keycloak (realm ou client).
 * À faire correspondre avec les rôles créés dans le realm Keycloak.
 */
export const KEYCLOAK_ROLES = {
  medecin: 'medecin',
  patient: 'patient',
} as const;

export type KeycloakRole = (typeof KEYCLOAK_ROLES)[keyof typeof KEYCLOAK_ROLES];
