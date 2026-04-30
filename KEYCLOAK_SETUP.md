# Configuration Keycloak pour KidneyCare

## Prérequis

- Keycloak sur `http://localhost:8080`
- Realm : `kidneyCare-realm`
- Client : `kidneycare-app`

## Configuration du client dans Keycloak

1. Aller dans **Clients** → `kidneycare-app`

2. **General Settings**
   - Client authentication : **OFF** (client public)
   - Authorization : **OFF**
   - Authentication flow : cocher **Standard flow** et **Direct access grants** (pour la connexion par formulaire)

   **Si vous avez une erreur 400** sur `POST .../openid-connect/token` au login par formulaire (identifiant/mot de passe sur la page de connexion), c’est en général parce que **Direct access grants** n’est pas activé pour le client `kidneycare-app`. Vérifiez que cette option est bien cochée dans **Authentication flow**.

3. **Valid Redirect URIs**
   ```
   http://localhost:4200/*
   http://localhost:4200
   ```

4. **Web Origins**
   ```
   http://localhost:4200
   ```

## Rôles (Realm roles)

Dans **Realm roles**, créer les rôles :
- `patient`
- `medecin`

## Attribuer les rôles aux utilisateurs

1. **Users** → sélectionner un utilisateur
2. **Role mapping** → **Assign role**
3. Assigner `patient` OU `medecin` selon le type d'utilisateur

**Important** : Un utilisateur doit avoir **au moins un** des deux rôles :
- **patient** → redirigé vers `/home` après login
- **medecin** → redirigé vers `/back` après login

## Inscription patient (formulaire custom)

L'inscription utilise l'API Admin de Keycloak. Dans `application.properties` :
- `keycloak.admin.username` : utilisateur admin Keycloak (realm master)
- `keycloak.admin.password` : mot de passe admin

Par défaut : `admin` / `admin`. Le client `admin-cli` du realm `master` doit avoir **Direct access grants** activé.

## Démarrage

1. Démarrer Keycloak : `http://localhost:8080`
2. Démarrer MySQL
3. Démarrer le backend Spring Boot : port 8081
4. Démarrer l’app Angular : `ng serve` (port 4200)

Puis ouvrir `http://localhost:4200` — Keycloak affichera la page de login.
