import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Keycloak from 'keycloak-js';
import { keycloakConfig } from './keycloak-config';
import { decodeJwtPayload } from './jwt-helper';

/** URL relative : le proxy (proxy.conf.json) redirige /api vers le backend → pas de CORS. */
const LOGIN_API = '/api/auth/login';

/** Clé sessionStorage : évite de perdre le JWT au F5 (sinon 401 sur /vital/** sans Keycloak SSO). */
const SESSION_TOKEN_KEY = 'vurr_medecin_access_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private keycloak: Keycloak | null = null;
  private initPromise: Promise<boolean> | null = null;
  /** Token reçu après connexion via formulaire personnalisé (backend + Keycloak). */
  private storedToken: string | null = null;

  constructor(private http: HttpClient) {
    try {
      const t = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (t) this.storedToken = t;
    } catch {
      /* ignore */
    }
  }

  /** Initialise Keycloak. À appeler une seule fois (APP_INITIALIZER). Ne bloque pas l'affichage si Keycloak est indisponible. */
  init(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;
    this.keycloak = new Keycloak({
      url: keycloakConfig.url,
      realm: keycloakConfig.realm,
      clientId: keycloakConfig.clientId
    });
    /**
     * Pas de onLoad: 'check-sso' : sans iframe silencieux, keycloak-js redirige vers /auth?prompt=none+PKCE,
     * ce qui peut renvoyer 400 (pas de session SSO, client PKCE, redirect_uri, etc.).
     * L’auth métier repose sur le formulaire + JWT ; login() déclenche une vraie redirection Keycloak si besoin.
     */
    const initOptions = {
      checkLoginIframe: false,
    };
    this.initPromise = this.keycloak.init(initOptions)
      .then((authenticated) => {
        return authenticated;
      })
      .catch((err) => {
        console.warn('Keycloak non disponible, l\'app s\'affiche sans authentification:', err);
        return false;
      });
    return this.initPromise;
  }

  /** Connexion par redirection vers Keycloak (SSO). */
  login(redirectUri?: string): Promise<void> {
    if (!this.keycloak) return Promise.reject(new Error('Keycloak non initialisé'));
    return this.keycloak.login({ redirectUri: redirectUri || window.location.href });
  }

  /**
   * Connexion via formulaire personnalisé : envoi username/password au backend Spring Boot,
   * qui les envoie à Keycloak (Resource Owner Password) et renvoie le token.
   */
  loginWithCredentials(username: string, password: string): Promise<void> {
    return firstValueFrom(
      this.http.post<{ access_token: string }>(LOGIN_API, { username, password })
    ).then((res) => {
      if (res?.access_token) {
        this.storedToken = res.access_token;
        try {
          sessionStorage.setItem(SESSION_TOKEN_KEY, res.access_token);
        } catch {
          /* ignore */
        }
        return Promise.resolve();
      }
      return Promise.reject(new Error('Token manquant'));
    }).catch((err) => {
      // Backend 401/502 body: { message: "..." } — garder pour affichage dans le formulaire
      const msg = err?.error?.message ?? err?.message ?? 'Erreur de connexion';
      return Promise.reject({ ...err, message: msg, error: { ...(err?.error ?? {}), message: msg } });
    });
  }

  /** Efface le token formulaire (appelé après 401 pour forcer une nouvelle connexion). */
  clearStoredToken(): void {
    this.storedToken = null;
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  /** Déconnexion : efface le token stocké ; si session Keycloak ouverte, redirige vers Keycloak logout. */
  logout(redirectUri?: string): Promise<void> {
    this.clearStoredToken();
    if (this.keycloak?.authenticated) {
      return this.keycloak.logout({ redirectUri: redirectUri || window.location.origin + '/' });
    }
    return Promise.resolve();
  }

  /** Token JWT pour les appels API (Bearer). */
  getToken(): string | null {
    if (this.storedToken) {
      const p = decodeJwtPayload(this.storedToken);
      if (this.isStoredJwtExpiredOrInvalid(p)) {
        this.clearStoredToken();
      } else {
        return this.storedToken;
      }
    }
    if (this.keycloak?.token) return this.keycloak.token;
    return null;
  }

  /**
   * Jeton à utiliser sur les requêtes HTTP : pour la session Keycloak (SSO),
   * appelle {@link Keycloak#updateToken} afin d’obtenir ou rafraîchir le jeton
   * avant d’envoyer le header `Authorization` (évite Bearer absent / expiré).
   */
  async getTokenForRequest(): Promise<string | null> {
    if (this.storedToken) {
      const p = decodeJwtPayload(this.storedToken);
      if (this.isStoredJwtExpiredOrInvalid(p)) {
        this.clearStoredToken();
      } else {
        return this.storedToken;
      }
    }
    if (!this.keycloak) return this.getToken();
    if (this.keycloak.authenticated) {
      try {
        const refreshMs = 12000;
        await Promise.race([
          this.keycloak.updateToken(30),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('keycloak-update-token-timeout')), refreshMs),
          ),
        ]);
      } catch {
        /* refresh échoué ou délai dépassé : on réutilise keycloak.token s'il existe */
      }
    }
    return this.getToken();
  }

  /** Indique si l'utilisateur est authentifié (token formulaire ou Keycloak). */
  isLoggedIn(): boolean {
    return !!this.getToken() || !!this.keycloak?.authenticated;
  }

  /** Met à jour le token (à appeler avant requêtes si token expiré). */
  updateToken(minValidity = 5): Promise<boolean> {
    if (!this.keycloak) return Promise.resolve(false);
    return this.keycloak.updateToken(minValidity);
  }

  /** Profil utilisateur (username, email, etc.) depuis le token stocké ou Keycloak. */
  getProfile(): { username?: string; email?: string; name?: string; [key: string]: unknown } | null {
    const p = this.getTokenPayload();
    if (!p) return null;
    return {
      username: (p['preferred_username'] as string) ?? (p['sub'] as string),
      email: (p['email'] as string) ?? '',
      name: (p['name'] as string) ?? (p['given_name'] as string) ?? ''
    };
  }

  private getTokenPayload(): Record<string, unknown> | null {
    if (this.storedToken) {
      const p = decodeJwtPayload(this.storedToken);
      if (this.isStoredJwtExpiredOrInvalid(p)) {
        this.clearStoredToken();
        return this.keycloak?.tokenParsed
          ? (this.keycloak.tokenParsed as Record<string, unknown>)
          : null;
      }
      return Object.keys(p).length ? p : null;
    }
    if (this.keycloak?.tokenParsed) return this.keycloak.tokenParsed as Record<string, unknown>;
    return null;
  }

  /** Jeton login formulaire expiré ou illisible : évite d’afficher « médecin » alors que l’API renverra 401. */
  private isStoredJwtExpiredOrInvalid(payload: Record<string, unknown>): boolean {
    if (!payload || Object.keys(payload).length === 0) return true;
    const exp = payload['exp'];
    if (typeof exp !== 'number') return false;
    return Math.floor(Date.now() / 1000) >= exp - 5;
  }

  /** Rôles du realm (ex: medecin, patient). */
  getRealmRoles(): string[] {
    const p = this.getTokenPayload();
    if (!p || !p['realm_access']) return [];
    const realmAccess = p['realm_access'] as { roles?: string[] };
    return realmAccess?.roles ?? [];
  }

  /** Rôles du client (resource) pour ce clientId. */
  getResourceRoles(): string[] {
    const p = this.getTokenPayload();
    if (!p) return [];
    const resource = p[keycloakConfig.clientId] as { roles?: string[] } | undefined;
    return resource?.roles ?? [];
  }

  /** Vérifie si l'utilisateur a au moins un des rôles donnés (realm ou resource). */
  hasRole(roles: string[]): boolean {
    const realm = this.getRealmRoles();
    const resource = this.getResourceRoles();
    const all = [...realm, ...resource];
    return roles.some(r => all.includes(r));
  }

  /** Instance Keycloak (pour écouter les événements si besoin). */
  getKeycloak(): Keycloak | null {
    return this.keycloak;
  }
}
