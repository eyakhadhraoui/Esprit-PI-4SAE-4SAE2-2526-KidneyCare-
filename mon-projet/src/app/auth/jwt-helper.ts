/**
 * Décodage du payload JWT (sans vérification de signature, côté client).
 * Utilisé pour lire profil et rôles à partir du token reçu du backend (Keycloak).
 */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}
