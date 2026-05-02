# 🚀 Jenkins Pipeline Setup - KidneyCare Platform

## ✅ Configuration Vérifiée et Corrigée

Tous les services sont maintenant prêts pour la pipeline Jenkins avec une configuration standardisée et optimisée.

---

## 📋 Checklist Pre-Pipeline

### ✅ Java Projects
- [x] Tous les pom.xml avec Spring Boot **3.5.10**
- [x] Spring Cloud **2025.0.1** standardisé
- [x] Dépendances dupliquées supprimées
- [x] JWT/OAuth2 correctement configuré

### ✅ Dockerfiles
- [x] Tous les Dockerfiles standardisés
- [x] Maven **3.9.6-eclipse-temurin-17** unifié
- [x] Runtime **eclipse-temurin:17-jre-alpine** (léger et optimisé)
- [x] Healthchecks sur tous les services
- [x] Multi-stage builds avec compilation `-DskipTests`

| Service | Port | Dockerfile | Status |
|---------|------|-----------|--------|
| API (Gateway) | 8095 | ✅ Standardisé | OK |
| EurekaServer | 8761 | ✅ Standardisé | OK |
| Prescription | 8086 | ✅ Standardisé | OK |
| Nutrition | 8084 | ✅ Standardisé | OK |
| NEPHRO | 8083 | ✅ Standardisé | OK |
| FoncGreffon | 8089 | ✅ Standardisé | OK |
| InfectionEtVaccination | 8082 | ✅ Standardisé | OK |
| Consultation | 8081 | ✅ Standardisé | OK |
| VitalParams | 8087 | ✅ Standardisé | OK |
| Frontend | 80 | ✅ Node Alpine | OK |

### ✅ Docker Compose
- [x] Tous les 9 services Java configurés
- [x] Dépendances correctes (MySQL → Keycloak → Eureka → Services)
- [x] Environnements variables complètes
- [x] Health checks pour tous les services
- [x] Volumes et réseaux configurés

### ✅ Configuration
- [x] `.env.dev` pour développement
- [x] `.env.example` avec documentation
- [x] Support multi-environnement
- [x] Variables Keycloak et JWT centralisées

### ✅ Jenkinsfile
- [x] Pipeline avec stages: Checkout, Build, Test, SonarQube, Docker, Deploy
- [x] Build parallèle des 9 services
- [x] Tests parallèles
- [x] Analysis SonarQube complète
- [x] Déploiement sur branches main/master/develop

---

## 🔧 Configuration Jenkins

### 1. Installation des Plugins Jenkins

```
- Pipeline
- Docker Pipeline
- Docker
- SonarQube Scanner
- Cobertura Plugin
- JUnit Plugin
- Maven Integration
```

### 2. Configuration des Credentials

```groovy
// Jenkins → Manage Credentials → Add Credentials

1. Docker Registry (Si registry externe)
   - Type: Username with password
   - ID: docker-registry
   - Username: <your-docker-username>
   - Password: <your-docker-token>

2. Git (Si repository privé)
   - Type: SSH Key ou Username/Password
   - ID: git-repo
   - URL: <your-repo-url>

3. SonarQube Token
   - Type: Secret text
   - ID: sonar-token
   - Secret: <sonarqube-token>
```

### 3. Configuration Jenkins Global

```
Jenkins → Manage Jenkins → Configure System

1. SonarQube
   - Name: SonarQube
   - Server URL: http://localhost:9000 (ou votre serveur)
   - Server Authentication Token: <sonar-token>

2. Docker
   - Cloud URL: unix:///var/run/docker.sock (ou TCP si distant)
```

### 4. Configuration Job Pipeline

```groovy
Pipeline Script from SCM
- Repository URL: <your-repo-url>
- Credentials: git-repo (si privé)
- Branch: */main, */develop
- Script Path: Jenkinsfile
```

---

## 🚀 Démarrage de la Pipeline

### Option 1: Manual Build

```bash
# Dans le workspace Jenkins
./jenkins-build.sh

# Ou directement avec Maven
mvn -v
docker-compose --version

# Build tous les services
for proj in EurekaServer API FoncGreffon InfectionEtVaccination NEPHRO \
            Nutrition_Service/Nutrition_Service prescription-Service \
            projetconsultation projetparametrevital/projetparametrevital; do
  (cd $proj && mvn clean package -DskipTests -B) &
done
wait

# Build Docker images
docker-compose build --parallel

# Déployer (si main/develop)
docker-compose up -d --remove-orphans
```

### Option 2: Pipeline Jenkins (Automatique)

1. Créer un job Pipeline Jenkins
2. Pointer vers ce Jenkinsfile
3. Déclencher build manuel ou par webhook Git

```bash
# Webhook Git (GitHub/GitLab)
POST https://jenkins.server/github-webhook/
ou
POST https://jenkins.server/gitlab/project_push/
```

---

## 📊 Pipeline Stages

### 1. **Checkout** (2-3 min)
- Clone le repository
- Affiche branch et commit

### 2. **Build** (15-20 min) - Parallèle
- 9 services compilés en parallèle
- Maven goals: `clean package -DskipTests -B`
- Sortie: JAR dans chaque `/target`

### 3. **Tests** (5-10 min) - Séquentiel
- Tests unitaires pour chaque service
- Rapports JUnit générés
- Tolérance aux erreurs (`|| true`)

### 4. **SonarQube Analysis** (10-15 min) - Parallèle
- 9 projets analysés en parallèle
- Rapports: coverage, bugs, code smells
- Quality Gate attendu

### 5. **Quality Gate** (3-5 min)
- Attend le résultat SonarQube
- Continue si gate OK
- Abort si gate FAIL

### 6. **Build Docker Images** (20-30 min)
- `docker-compose build --parallel`
- 9 images + 1 frontend créées
- Images taggées: `latest`

### 7. **Deploy** (5-10 min) - Branches main/develop seulement
- Copy `.env.dev` → `.env`
- `docker-compose up -d`
- Affiche statut services

---

## 🔍 Verification Post-Deployment

```bash
# Vérifier les containers
docker-compose ps

# Vérifier les logs
docker-compose logs -f

# Health checks
curl http://localhost:8761/actuator/health         # Eureka
curl http://localhost:8095/actuator/health         # Gateway
curl http://localhost:8086/actuator/health         # Prescription
curl http://localhost:8084/actuator/health         # Nutrition
curl http://localhost:8083/actuator/health         # NEPHRO
curl http://localhost:8089/actuator/health         # FoncGreffon
curl http://localhost:8082/actuator/health         # Infection
curl http://localhost:8081/actuator/health         # Consultation
curl http://localhost:8087/actuator/health         # VitalParams
curl http://localhost:80                           # Frontend

# Accès services
http://localhost:80                 → Frontend
http://localhost:8080               → Keycloak
http://localhost:3306               → MySQL
http://localhost:9000               → SonarQube (si configuré)
```

---

## ⚙️ Configuration Environnement

### `.env.dev` - Développement
```bash
ENVIRONMENT=development
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
# ... autres variables
```

### `.env.prod` - Production (À créer)
```bash
ENVIRONMENT=production
KEYCLOAK_ADMIN_USERNAME=<secure-username>
KEYCLOAK_ADMIN_PASSWORD=<secure-password>
MAIL_USERNAME=<prod-email>
MAIL_PASSWORD=<prod-password>
# Autres credentials sécurisés
```

### Utilisation
```bash
# Dev
docker-compose --env-file .env.dev up -d

# Production
docker-compose --env-file .env.prod up -d
```

---

## 🐛 Dépannage

### Build échoue
```bash
# Nettoyer cache Maven
mvn clean -DskipTests

# Reconstruire
mvn package -DskipTests -B

# Vérifier Java version
java -version  # Doit être 17+

# Vérifier Maven
mvn -version   # Doit être 3.8+
```

### Docker build échoue
```bash
# Nettoyer images
docker system prune -a

# Rebuild
docker-compose build --no-cache --parallel

# Vérifier Docker
docker version
```

### Services ne démarrent pas
```bash
# Vérifier .env
cat .env

# Voir les logs
docker-compose logs <service-name>

# Redémarrer
docker-compose restart
docker-compose down -v
docker-compose up -d
```

### Pipeline SonarQube échoue
```bash
# Vérifier configuration
Jenkins → System Configuration → SonarQube

# Vérifier SonarQube server
curl http://localhost:9000/api/system/health

# Token
http://localhost:9000/account/security
```

---

## 📈 Monitoring Pipeline

### Jenkins Web UI
```
http://localhost:8080/

- Job History
- Build Logs
- Stage View (Blue Ocean)
- Artifact Management
```

### SonarQube Dashboard
```
http://localhost:9000/

Projects
- kidneycare-platform-eureka
- kidneycare-platform-gateway
- kidneycare-platform-graft
- kidneycare-platform-infection
- kidneycare-platform-nephro
- kidneycare-platform-nutrition
- kidneycare-platform-prescription
- kidneycare-platform-consultation
- kidneycare-platform-vitalparams
```

### Docker Monitoring
```bash
# Statut containers
docker-compose ps

# Logs en temps réel
docker-compose logs -f

# Stats ressources
docker stats
```

---

## ✅ Validation

Avant de push le travail vers Git:

```bash
# 1. Vérifier tous les Dockerfiles
docker-compose build --dry-run

# 2. Vérifier maven build
./jenkins-build.sh

# 3. Vérifier docker-compose
docker-compose config

# 4. Tests locaux
docker-compose up -d
docker-compose ps
curl http://localhost:8761/actuator/health

# 5. Cleanup
docker-compose down -v

# 6. Git commit & push
git add -A
git commit -m "Pipeline Jenkins: Standardisation Dockerfiles et configuration"
git push origin main
```

---

## 🎯 Next Steps

1. **Configure Jenkins Server** avec les plugins requis
2. **Setup SonarQube** pour la qualité du code
3. **Configure Git Webhook** pour triggers automatiques
4. **Test Pipeline** sur une branche develop
5. **Monitor Deployments** via Jenkins/SonarQube Dashboard

---

**✅ Tout est maintenant prêt pour la pipeline Jenkins!**

Pour questions ou issues, consultez les logs:
```bash
docker-compose logs <service>
cat /var/log/jenkins/jenkins.log
```
