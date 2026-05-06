# Kubernetes (Minikube) — KidneyCare

Aucune modification du code Java/Angular requise pour ce dossier : uniquement manifests + scripts.

## Prérequis

- `minikube start --driver=docker`
- `kubectl`
- Docker utilisé par Minikube
- JAR Spring déjà construits dans chaque module (`mvn package` ou pipeline) avant `docker build`

## Fichiers ajoutés

- `k8s/kustomization.yaml` — point d’entrée `kubectl apply -k k8s/`
- `k8s/namespace.yaml`, `k8s/secrets.yaml`
- `k8s/mysql/`, `k8s/keycloak/` (+ Job `keycloak-init`)
- `k8s/mailhog/`, `k8s/eureka/`, `k8s/api-gateway/`, `k8s/nephro/`, microservices, `k8s/frontend/`
- `k8s/prometheus/`, `k8s/grafana/`
- `k8s/scripts/*.ps1` — ConfigMaps, build images, port-forward

## Déploiement (ordre)

1. Depuis la **racine du repo** :

   ```powershell
   .\k8s\scripts\bootstrap-configmaps.ps1
   .\k8s\scripts\build-images-minikube.ps1
   kubectl apply -k k8s/
   ```

2. Attendre que MySQL et Keycloak soient prêts, puis vérifier le Job :

   ```powershell
   kubectl -n kidneycare get pods
   kubectl -n kidneycare logs job/keycloak-init
   ```

3. Accès depuis ton PC (comme docker-compose) : voir `k8s/scripts/port-forward.ps1` et lancer les `kubectl port-forward` indiqués.

## Images utilisées

Toutes les applications custom utilisent le préfixe d’image `kidneycare/*:latest` (construites localement dans le Docker Minikube).

## Sécurité

`k8s/secrets.yaml` contient des mots de passe de **développement** uniquement. En production : SealedSecrets, External Secrets, ou secrets managés par le cloud.
