# 📚 Guide Complet — Déploiement K8s avec Jenkins

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser les deux approches de déploiement K8s :

1. **🔄 Pipeline Principal Modifié** — Jenkinsfile avec stage K8s intégré
2. **⚙️ Pipeline Séparé** — JenkinsfileK8s pour déploiement K8s dédié

---

## 📋 Table des matières

- [Option A : Déploiement depuis le pipeline principal](#option-a--déploiement-depuis-le-pipeline-principal)
- [Option B : Déploiement depuis JenkinsfileK8s séparé](#option-b--déploiement-depuis-jenkinsfilek8s-séparé)
- [Configuration requise](#-configuration-requise)
- [Étapes du déploiement K8s](#-étapes-du-déploiement-k8s)
- [Résolution des problèmes](#-résolution-des-problèmes)
- [Exemples et tests](#-exemples-et-tests)

---

## 🔄 Option A — Déploiement depuis le pipeline principal

### Description

Le **Jenkinsfile** a été modifié pour inclure un nouveau stage **`Deploy K8s`** qui s'exécute automatiquement après les builds docker.

### Étapes du stage

```groovy
stage('Deploy K8s') {
    // 1️⃣  Vérification de kubectl
    // 2️⃣  Test de connexion au cluster K8s
    // 3️⃣  Création du namespace 'kidneycare'
    // 4️⃣  Application des manifests YAML (depuis le dossier k8s/)
    // 5️⃣  Attente du rollout des déploiements
    // 6️⃣  Vérification des pods et services
    // 7️⃣  Collecte des logs
}
```

### ✅ Avantages

- ✅ Déploiement automatique dans le workflow CI/CD
- ✅ Vérifications intégrées au pipeline
- ✅ Logs et diagnostiques consolidés
- ✅ Pas besoin de pipeline séparé

### ⚠️ Conditions d'exécution

Le stage `Deploy K8s` s'exécute **seulement si** :

1. **La branche est** : `main`, `master` ou `develop`
2. **OU** une variable d'environnement `DEPLOY_K8S=true` est définie

### Comment activer le déploiement K8s

#### Option 1 : Activer via variable d'environnement Jenkins

```bash
# Dans Jenkins Web UI : Job → Paramètres
# Ajouter une variable build : DEPLOY_K8S=true
```

#### Option 2 : Modifier le Jenkinsfile (commenter la condition)

```groovy
stage('Deploy K8s') {
    // Modifier cette ligne :
    when {
        anyOf {
            branch 'main'
            branch 'master'
            branch 'develop'
        }
        // environment name: 'DEPLOY_K8S', value: 'true'  ← Commenter ou supprimer
    }
    steps {
        // ...
    }
}
```

---

## ⚙️ Option B — Déploiement depuis JenkinsfileK8s séparé

### Description

**JenkinsfileK8s** est un pipeline **indépendant et complet** pour le déploiement K8s avec des vérifications exhaustives.

### Utilisation dans Jenkins

#### Créer un nouveau job Jenkins

1. **Créer un nouveau Pipeline job** dans Jenkins
2. **Configurer la source** → Git
   ```
   Repository URL: <votre-repo>
   Branch: */main
   ```

3. **Configurer le pipeline**
   ```
   Pipeline script from SCM
   SCM: Git
   Script path: JenkinsfileK8s
   ```

4. **Enregistrer et exécuter**

### 🔀 Déploiement depuis une branche Git

```bash
# Option A: Brancher et pousser vers une nouvelle branche
git checkout -b k8s-deployment
git push origin k8s-deployment

# Option B: Créer un tag pour le déploiement
git tag -a k8s-v1.0.0 -m "Déploiement K8s v1.0.0"
git push origin k8s-v1.0.0
```

### 📊 Stages du JenkinsfileK8s

| Stage | Fonction | Timeout |
|-------|----------|---------|
| **📋 Vérification K8s — Prérequis** | Vérifie kubectl, connexion, nodes | - |
| **📦 Application des Manifests** | Applique les fichiers YAML | - |
| **⏳ Rollout Status — Attendre les Pods** | Attend le déploiement complet | 5m |
| **🔍 Vérification des Pods et Services** | Affiche l'état des ressources | - |
| **📋 Logs du Déploiement** | Collecte les logs de tous les pods | - |
| **🧪 Tests de Connectivité** | Teste l'accès aux services | - |
| **✅ Vérification Finale** | Résumé du déploiement | - |

---

## ⚙️ Configuration requise

### 1️⃣ Prérequis Jenkins

Vérifiez que les plugins suivants sont installés :

```
✅ Pipeline
✅ Git
✅ Blue Ocean (optionnel, pour meilleure visualisation)
✅ Timestamper (pour les timestamps)
```

### 2️⃣ Prérequis K8s

Sur le **serveur Jenkins** :

```bash
# Vérifier kubectl
kubectl version --client

# Vérifier la connexion
kubectl cluster-info

# Vérifier l'accès
kubectl auth can-i create deployments --all-namespaces
```

### 3️⃣ Variables d'environnement Jenkins

Créer des **credentials** Jenkins (Manage Jenkins → Security → Manage Credentials) :

```
kubeconfig-path → fichier ~/.kube/config
k8s-context-name → nom du contexte (ex: docker-desktop)
```

Ou modifier directement dans le Jenkinsfile :

```groovy
environment {
    K8S_NAMESPACE = 'default'                    // Votre namespace
    K8S_CONTEXT = credentials('k8s-context')   // Votre contexte K8s
    KUBECONFIG = credentials('kubeconfig-path') // Chemin au fichier config
}
```

### 4️⃣ Structure des manifests

Créez un dossier `k8s/` à la racine du repo avec vos manifests YAML :

```
repo/
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── deployment-eureka.yaml
│   ├── deployment-gateway.yaml
│   ├── deployment-services.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── pvc.yaml
├── Jenkinsfile
├── JenkinsfileK8s
└── docker-compose.yml
```

---

## 🚀 Étapes du déploiement K8s

### Étape 1 : Vérification de la connexion

```bash
✓ kubectl version --client --short
✓ kubectl cluster-info
✓ kubectl get namespace
✓ kubectl get nodes -o wide
```

**Sortie attendue :**
```
Kubernetes control plane is running at https://...
Kubernetes version: v1.28.0
NAME        STATUS   ROLES           AGE     VERSION
node-1      Ready    control-plane   10d     v1.28.0
node-2      Ready    <none>          10d     v1.28.0
```

### Étape 2 : Application des manifests

```bash
# Validation (dry-run)
kubectl apply -f k8s/deployment.yaml --dry-run=client -o yaml

# Application réelle
kubectl apply -f k8s/ -n kidneycare
```

**Sortie attendue :**
```
deployment.apps/eureka-server created
deployment.apps/api-gateway created
service/eureka-service created
...
```

### Étape 3 : Attente du rollout

```bash
kubectl rollout status deployment/eureka-server -n kidneycare --timeout=5m
```

**Sortie attendue :**
```
Waiting for deployment "eureka-server" rollout to finish: 0 of 2 updated replicas are available...
Waiting for deployment "eureka-server" rollout to finish: 1 of 2 updated replicas are available...
deployment "eureka-server" successfully rolled out
```

### Étape 4 : Vérification des ressources

```bash
# Vérifier les pods
kubectl get pods -n kidneycare -o wide

# Vérifier les services
kubectl get services -n kidneycare

# Vérifier les ingress
kubectl get ingress -n kidneycare

# Vérifier les PVC
kubectl get pvc -n kidneycare
```

### Étape 5 : Collecte des logs

```bash
# Logs d'un pod spécifique
kubectl logs eureka-server-abc123 -n kidneycare --tail=100

# Logs en temps réel
kubectl logs -f eureka-server-abc123 -n kidneycare

# Logs avec timestamps
kubectl logs eureka-server-abc123 -n kidneycare --timestamps=true
```

### Étape 6 : Vérification des erreurs

```bash
# Événements du cluster
kubectl get events -n kidneycare --sort-by='.lastTimestamp'

# Description détaillée d'un pod
kubectl describe pod eureka-server-abc123 -n kidneycare

# Métriques d'utilisation
kubectl top pods -n kidneycare
```

---

## 🛠️ Résolution des problèmes

### ❌ Erreur : kubectl: command not found

**Cause :** kubectl n'est pas installé

**Solution :**
```bash
# Linux
sudo apt-get install -y kubectl

# macOS
brew install kubectl

# Vérifier
kubectl version --client
```

---

### ❌ Erreur : Unable to connect to server

**Cause :** Kubeconfig non trouvé ou cluster inaccessible

**Solution :**
```bash
# Vérifier le kubeconfig
echo $KUBECONFIG
cat ~/.kube/config

# Définir le kubeconfig
export KUBECONFIG=/path/to/config

# Tester la connexion
kubectl cluster-info
kubectl auth can-i get deployments
```

---

### ❌ Erreur : Pods not ready / ImagePullBackOff

**Cause :** Image Docker non trouvée ou non accessible

**Solution :**
```bash
# Vérifier le pod
kubectl describe pod <pod-name> -n kidneycare

# Vérifier les événements
kubectl get events -n kidneycare | grep -i pull

# Vérifier l'image
docker pull <image-name>:<tag>

# Vérifier les secrets (si registry privée)
kubectl get secrets -n kidneycare
```

---

### ❌ Erreur : CrashLoopBackOff

**Cause :** L'application dans le pod crash au démarrage

**Solution :**
```bash
# Vérifier les logs
kubectl logs <pod-name> -n kidneycare

# Logs des événements précédents
kubectl logs <pod-name> -n kidneycare --previous

# Décrire le pod pour plus de détails
kubectl describe pod <pod-name> -n kidneycare

# Vérifier la sonde de santé
kubectl get pod <pod-name> -n kidneycare -o yaml | grep -A 10 livenessProbe
```

---

### ❌ Erreur : Service has no endpoints

**Cause :** Les pods ne sont pas en state Running ou labels ne correspondent pas

**Solution :**
```bash
# Vérifier les endpoints
kubectl get endpoints <service-name> -n kidneycare

# Vérifier les labels
kubectl get pods -n kidneycare --show-labels

# Vérifier le sélecteur du service
kubectl get service <service-name> -n kidneycare -o yaml | grep selector -A 2

# Labels doivent correspondre
kubectl label pod <pod-name> app=<label-value> -n kidneycare
```

---

## 📝 Exemples et tests

### Exemple 1 : Déploiement simple

**deployment.yaml :**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eureka-server
  namespace: kidneycare
spec:
  replicas: 2
  selector:
    matchLabels:
      app: eureka-server
  template:
    metadata:
      labels:
        app: eureka-server
    spec:
      containers:
      - name: eureka
        image: kidneycare/eureka-server:latest
        ports:
        - containerPort: 8761
        env:
        - name: JAVA_OPTS
          value: "-Xmx256m -Xms256m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8761
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8761
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

### Exemple 2 : Test de déploiement

```bash
# Créer un namespace de test
kubectl create namespace k8s-test

# Appliquer les manifests de test
kubectl apply -f k8s/ -n k8s-test

# Attendre le déploiement
kubectl rollout status deployment/eureka-server -n k8s-test --timeout=5m

# Vérifier les pods
kubectl get pods -n k8s-test

# Afficher les logs
kubectl logs -f $(kubectl get pods -n k8s-test -o jsonpath='{.items[0].metadata.name}') -n k8s-test

# Nettoyer
kubectl delete namespace k8s-test
```

---

### Exemple 3 : Port-forward pour test local

```bash
# Mapper un port local vers un pod
kubectl port-forward svc/eureka-service 8761:8761 -n kidneycare

# Tester l'accès
curl http://localhost:8761/actuator/health
```

---

### Exemple 4 : Exécuter une commande dans un pod

```bash
# Exécuter une commande
kubectl exec -it <pod-name> -n kidneycare -- bash

# Exemple : vérifier les variables d'environnement
kubectl exec <pod-name> -n kidneycare -- env | grep -i java

# Tester la connectivité
kubectl exec <pod-name> -n kidneycare -- curl http://eureka-service:8761
```

---

### Exemple 5 : Mise à jour d'un déploiement

```bash
# Mettre à jour l'image
kubectl set image deployment/eureka-server eureka=kidneycare/eureka-server:v2.0 -n kidneycare

# Vérifier le rollout
kubectl rollout status deployment/eureka-server -n kidneycare

# Annuler en cas de problème
kubectl rollout undo deployment/eureka-server -n kidneycare

# Voir l'historique
kubectl rollout history deployment/eureka-server -n kidneycare
```

---

## 📊 Commandes utiles

```bash
# SURVEILLANCE
kubectl get all -n kidneycare                           # État global
kubectl describe node                                   # Infos nœuds
kubectl top nodes                                       # CPU/Memory des nœuds
kubectl top pods -n kidneycare                          # CPU/Memory des pods

# LOGS
kubectl logs <pod> -n kidneycare                        # Logs simples
kubectl logs -f <pod> -n kidneycare                     # Logs en temps réel
kubectl logs <pod> -n kidneycare --tail=50              # 50 dernières lignes
kubectl logs <pod> -n kidneycare -c <container>         # Container spécifique

# DÉBOGAGE
kubectl exec -it <pod> -n kidneycare -- bash            # Shell interactif
kubectl describe pod <pod> -n kidneycare                # Détails complets
kubectl get events -n kidneycare --sort-by='.lastTimestamp'  # Événements

# MANIFESTS
kubectl apply -f k8s/ -n kidneycare                     # Appliquer
kubectl delete -f k8s/ -n kidneycare                    # Supprimer
kubectl get deployment -o yaml                         # Export YAML
kubectl diff -f k8s/ -n kidneycare                      # Voir les changements

# NETTOYAGE
kubectl delete namespace kidneycare                     # Supprimer le namespace
kubectl scale deployment eureka-server --replicas=3 -n kidneycare  # Scaler
```

---

## ✅ Checklist de déploiement

Avant de déployer, vérifiez :

- [ ] kubectl installé et accessible (`kubectl version --client`)
- [ ] Connexion au cluster (`kubectl cluster-info`)
- [ ] Namespace créé (`kubectl create namespace kidneycare`)
- [ ] Manifests YAML valides (`kubectl apply -f k8s/ --dry-run=client`)
- [ ] Images Docker disponibles (`docker pull <image>`)
- [ ] Secrets et ConfigMaps créés
- [ ] Resource requests/limits définis
- [ ] Health checks configurés (liveness + readiness)
- [ ] Services et Ingress configurés
- [ ] PVC créés si nécessaire

---

## 📞 Support

Pour plus d'informations :
- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Jenkins Pipeline Documentation](https://jenkins.io/doc/book/pipeline/)
- Contactez votre administrateur K8s

---

**Dernière mise à jour :** 2026-05-07  
**Version :** 1.0
