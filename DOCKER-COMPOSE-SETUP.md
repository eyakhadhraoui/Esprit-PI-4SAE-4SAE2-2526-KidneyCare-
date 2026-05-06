## Docker Compose Setup - KidneyCare Platform

### Description
Ce fichier `docker-compose.yml` orchestrate tous les services du système KidneyCare :
- **MySQL** : Base de données (port 3306)
- **Keycloak** : Authentification & Autorisation (port 8080)
- **Eureka** : Service Discovery (port 8761)
- **API Gateway** : Routage (port 8088)
- **NEPHRO** : Service principal (port 8089)
- **Services métier** : Consultation, Vital Parameters, Infection/Vaccination, Nutrition, Prescription, Greffe
- **Frontend Angular** : Interface (port 80)
- **MailHog** : Test email (port 8025)

### Prérequis
1. Docker & Docker Compose installés
2. Ports libres : 80, 3306, 8080, 8088, 8089, 8081-8086, 8096, 8761, 1025, 8025
3. Au moins 4GB RAM disponible pour les conteneurs

### Démarrage complet

```bash
# Cloner/Accéder au répertoire racine du projet
cd C:\Users\eyakh\Desktop\PI 2025_2026\pi

# Build et démarrage de tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f nephro
docker-compose logs -f keycloak
```

### Architecture & Ports

| Service | Port | URL | Rôle |
|---------|------|-----|------|
| Frontend | 80 | http://localhost | Interface Angular |
| Keycloak | 8080 | http://localhost:8080 | Auth & Token |
| Eureka | 8761 | http://localhost:8761 | Service Discovery |
| API Gateway | 8088 | http://localhost:8088 | Routage API |
| NEPHRO | 8089 | http://localhost:8089 | Dossier Médical |
| Consultation | 8081 | http://localhost:8081 | Consultations |
| ParamètrVital | 8082 | http://localhost:8082 | Paramètres Vitaux |
| Infection/Vaccination | 8083 | http://localhost:8083 | Infections & Vaccinations |
| Nutrition | 8084 | http://localhost:8084 | Nutrition |
| Prescription | 8086 | http://localhost:8086 | Prescriptions |
| Greffe | 8096 | http://localhost:8096 | Greffe |
| MySQL | 3306 | localhost:3306 | Base de données |
| MailHog | 8025 | http://localhost:8025 | Email Testing |

### Configuration Keycloak

#### Initial Setup (First Time)
1. Accédez à http://localhost:8080/admin
2. Login: `admin` / `admin`
3. Créer le Realm `kidneyCare-realm`
4. Créer le Client `kidneycare-app`
5. Activer "Direct access grants" dans l'onglet Settings
6. Créer les rôles : `MEDECIN`, `PATIENT`
7. Créer un utilisateur test avec le rôle `MEDECIN` ou `PATIENT`

#### Default Credentials
- Admin Username: `admin`
- Admin Password: `admin`

### Configuration MySQL

Default Credentials:
- Root Password: `root`
- Database: `nep`
- User: `nephro_user`
- Password: `nephro_password`

### Accédez aux Applications

1. **Frontend Angular**
   ```
   http://localhost
   Login avec le compte Keycloak créé
   ```

2. **Keycloak Admin Console**
   ```
   http://localhost:8080/admin
   ```

3. **MailHog (Test Emails)**
   ```
   http://localhost:8025
   ```

4. **Eureka Dashboard**
   ```
   http://localhost:8761
   ```

### Arrêt des services

```bash
# Arrêter tous les services (garder les volumes)
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Redémarrer un service
docker-compose restart nephro
```

### Diagnostique & Troubleshooting

```bash
# Voir les logs détaillés d'un service
docker-compose logs -f nephro --tail=100

# Vérifier les ports
netstat -an | findstr "LISTENING"  # Windows
lsof -i                             # Mac/Linux

# Accéder au conteneur MySQL
docker-compose exec mysql mysql -u root -p

# Accéder à un conteneur Java
docker-compose exec nephro /bin/bash

# Reconstruire un service
docker-compose build --no-cache nephro
docker-compose up -d nephro
```

### Variables d'Environnement

Les variables suivantes peuvent être modifiées dans `docker-compose.yml` :

```yaml
# MySQL
MYSQL_ROOT_PASSWORD: root
MYSQL_DATABASE: nep
MYSQL_USER: nephro_user
MYSQL_PASSWORD: nephro_password

# Keycloak
KEYCLOAK_ADMIN: admin
KEYCLOAK_ADMIN_PASSWORD: admin

# Services
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE: http://eureka:8761/eureka
SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/nep
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI: http://keycloak:8080/realms/kidneyCare-realm
```

### Persistence & Données

- **MySQL Data** : Stocké dans le volume `mysql_data`
- **Keycloak Data** : Stocké dans le volume `keycloak_data`
- **Uploads** : Stockés dans le volume `nephro_uploads`

Pour supprimer les volumes ET les données :
```bash
docker-compose down -v
```

### Performance & Ressources

Pour les déploiements en production, ajustez les ressources dans le docker-compose.yml :

```yaml
services:
  nephro:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Support & Logs

- **Logs MySQL** : `docker-compose logs mysql`
- **Logs Keycloak** : `docker-compose logs keycloak`
- **Logs NEPHRO** : `docker-compose logs nephro`
- **Tous les logs** : `docker-compose logs -f`

Monitorer en temps réel :
```bash
watch docker-compose ps
```

### Notes de Sécurité

⚠️ **IMPORTANT** : Cette configuration est pour le **développement UNIQUEMENT**

Pour la production :
1. Changer tous les mots de passe par défaut
2. Activer HTTPS/TLS
3. Configurer les CORS correctement
4. Mettre en place un reverse proxy (Nginx, HAProxy)
5. Utiliser des secrets Docker/Kubernetes
6. Mettre en place la gestion des logs centralisée
7. Configurer les backups automatiques de la BD


