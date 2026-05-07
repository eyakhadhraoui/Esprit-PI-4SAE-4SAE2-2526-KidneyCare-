# 🚀 Guide Rapide — Déploiement K8s avec Jenkins

## 📋 Fichiers créés

| Fichier | Description | Usage |
|---------|-------------|-------|
| **JenkinsfileK8s** | Pipeline K8s indépendant avec vérifications complètes | Déploiement K8s autonome |
| **Jenkinsfile** (modifié) | Jenkinsfile principal avec stage 'Deploy K8s' robuste | Déploiement intégré au workflow CI/CD |
| **K8S_DEPLOYMENT_GUIDE.md** | Guide complet avec exemples et résolution de problèmes | Documentation détaillée |
| **k8s/manifests.yaml** | Exemples de manifests K8s pour KidneyCare | Modèles à adapter |

---

## ⚡ Quick Start

### Option A : Utiliser le pipeline principal (recommandé)

#### 1. Préparer les manifests K8s

```bash
# Créer le dossier k8s/
mkdir -p k8s/

# Copier les exemples (ou créer les vôtres)
cp k8s/manifests.yaml k8s/

# Vérifier la structure
ls -la k8s/
# Output:
# -rw-r--r-- manifests.yaml
```

#### 2. Activer le déploiement K8s dans Jenkins

**Option 2A : Via le Jenkinsfile**

Modifier le stage 'Deploy K8s' dans le Jenkinsfile :

```groovy
stage('Deploy K8s') {
    when {
        anyOf {
            branch 'main'
            branch 'master'
            branch 'develop'
        }
        // Commenter cette ligne pour activer automatiquement
        // environment name: 'DEPLOY_K8S', value: 'true'
    }
    steps { ... }
}
```

**Option 2B : Via Jenkins UI**

1. Ouvrir le job Jenkins
2. Cliquer sur **Build with Parameters**
3. Ajouter une variable : `DEPLOY_K8S=true`
4. Lancer le build

#### 3. Configurer le kubeconfig dans Jenkins

**Méthode 1 : Ajouter le kubeconfig via Jenkins Credentials**

```bash
# 1. Aller dans Jenkins → Manage → Manage Credentials
# 2. Créer un Secret file :
#    - ID: kubeconfig-path
#    - File: ~/.kube/config
```

**Méthode 2 : Modifier le Jenkinsfile**

```groovy
environment {
    K8S_NAMESPACE = 'kidneycare'
    KUBECONFIG = '/var/jenkins_home/.kube/config'  // Adapter le chemin
}
```

#### 4. Lancer le déploiement

```bash
# Push vers la branche main/master/develop
git push origin main

# Jenkins déclenche le pipeline automatiquement
# Attendre la fin du pipeline
```

#### 5. Vérifier le déploiement

```bash
# Vérifier les pods
kubectl get pods -n kidneycare -o wide

# Vérifier les services
kubectl get services -n kidneycare

# Vérifier les logs
kubectl logs -f deployment/eureka-server -n kidneycare
```

---

### Option B : Utiliser JenkinsfileK8s (pipeline séparé)

#### 1. Créer un nouveau job Jenkins

**Jenkins Web UI :**

1. **New Job** → Pipeline
2. **Name** : `KidneyCare-K8s-Deploy`
3. **Pipeline** → Pipeline script from SCM
   ```
   SCM: Git
   Repository URL: <votre-repo>
   Branch: */main
   Script path: JenkinsfileK8s
   ```
4. **Save** et **Build Now**

#### 2. Ou utiliser Jenkins depuis le CLI

```bash
# Déclencher un build
curl -X POST http://jenkins.local:8080/job/KidneyCare-K8s-Deploy/build \
  -u user:password
```

#### 3. Vérifier l'exécution

```bash
# Aller dans Jenkins Web UI → KidneyCare-K8s-Deploy → #1 (build number)
# Consulter les logs
```

---

## 🔧 Configuration

### Adapter les manifests à votre environnement

#### 1. Modifier le namespace

Dans `k8s/manifests.yaml` :

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kidneycare  # ← Changer si nécessaire
```

#### 2. Modifier les images Docker

```yaml
containers:
- name: eureka
  image: kidneycare/eureka-server:latest  # ← Votre registry
  imagePullPolicy: Always
```

#### 3. Adapter les secrets

```bash
# Générer un secret base64
echo -n "mypassword" | base64
# Output: bXlwYXNzd29yZA==

# Mettre à jour dans manifests.yaml
stringData:
  DATABASE_PASSWORD: mypassword  # ← Adapter
  JWT_SECRET: your-secret        # ← Adapter
```

#### 4. Configurer les ressources

```yaml
resources:
  requests:
    cpu: 250m          # ← Adapter selon vos besoins
    memory: 512Mi      # ← Adapter selon vos besoins
  limits:
    cpu: 500m
    memory: 1Gi
```

---

## 📊 Vérifier le déploiement

### Avant le déploiement

```bash
# 1. Vérifier kubectl
kubectl version --client

# 2. Vérifier la connexion K8s
kubectl cluster-info

# 3. Vérifier les nœuds
kubectl get nodes

# 4. Valider les manifests
kubectl apply -f k8s/manifests.yaml --dry-run=client --validate=true
```

### Pendant le déploiement

```bash
# Regarder les événements en temps réel
watch kubectl get pods -n kidneycare

# Vérifier le rollout
kubectl rollout status deployment/eureka-server -n kidneycare

# Voir les logs
kubectl logs -f deployment/eureka-server -n kidneycare
```

### Après le déploiement

```bash
# 1. Tous les pods running?
kubectl get pods -n kidneycare
# Expected: All pods should be Running

# 2. Services accessible?
kubectl get services -n kidneycare
kubectl get endpoints -n kidneycare

# 3. Santé des pods?
kubectl top pods -n kidneycare

# 4. Pas d'erreurs?
kubectl get events -n kidneycare --sort-by='.lastTimestamp'
```

---

## 🧪 Tests rapides

### Test 1 : Déploiement dans un namespace de test

```bash
# Créer un namespace de test
kubectl create namespace k8s-test

# Appliquer les manifests
kubectl apply -f k8s/manifests.yaml -n k8s-test

# Attendre (5-10 secondes)
sleep 10

# Vérifier
kubectl get pods -n k8s-test

# Nettoyer
kubectl delete namespace k8s-test
```

### Test 2 : Vérifier la connectivité entre pods

```bash
# Entrer dans un pod
kubectl exec -it deployment/api-gateway -n kidneycare -- bash

# Tester la connectivité
curl http://eureka-service:8761/actuator/health
# Expected: {"status":"UP"}

# Sortir
exit
```

### Test 3 : Port-forward pour test local

```bash
# Mapper un port
kubectl port-forward svc/eureka-service 8761:8761 -n kidneycare &

# Tester
curl http://localhost:8761/actuator/health
# Expected: {"status":"UP"}

# Arrêter
pkill -f "port-forward"
```

---

## 📈 Étapes du déploiement

```
1️⃣  Vérification K8s
    └─ kubectl, cluster-info, nodes, namespace

2️⃣  Application des manifests
    └─ Validation YAML + kubectl apply

3️⃣  Attente du rollout (5 minutes max)
    └─ kubectl rollout status

4️⃣  Vérification des pods et services
    └─ get pods, get services, get endpoints

5️⃣  Collecte des logs
    └─ kubectl logs de tous les pods

6️⃣  Tests de connectivité
    └─ Vérifier les endpoints des services

7️⃣  Résumé final
    └─ État du déploiement
```

---

## ⚠️ Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| **kubectl: command not found** | kubectl non installé | `brew install kubectl` ou `apt-get install kubectl` |
| **Unable to connect to server** | kubeconfig incorrect | Vérifier `kubectl cluster-info` |
| **ImagePullBackOff** | Image Docker non trouvée | Vérifier `docker pull <image>` |
| **CrashLoopBackOff** | Application crash au démarrage | Vérifier `kubectl logs <pod>` |
| **Pods not ready** | Readiness probe échoue | Vérifier `kubectl describe pod <pod>` |
| **Service has no endpoints** | Labels ne correspondent pas | Vérifier `kubectl get pods --show-labels` |

---

## 📞 Commandes essentielles

```bash
# DIAGNOSTIC
kubectl get all -n kidneycare
kubectl describe pod <pod-name> -n kidneycare
kubectl get events -n kidneycare --sort-by='.lastTimestamp'

# LOGS
kubectl logs <pod-name> -n kidneycare
kubectl logs -f <pod-name> -n kidneycare
kubectl logs <pod-name> -n kidneycare --tail=50

# DÉBOGAGE
kubectl exec -it <pod-name> -n kidneycare -- bash
kubectl port-forward <pod-name> 8080:8080 -n kidneycare

# MANIFESTS
kubectl apply -f k8s/ -n kidneycare
kubectl delete -f k8s/ -n kidneycare
kubectl diff -f k8s/ -n kidneycare
```

---

## ✅ Checklist pré-déploiement

- [ ] kubectl installé et accessible
- [ ] Connexion K8s vérifiée
- [ ] Manifests YAML dans `k8s/` valides
- [ ] Images Docker disponibles
- [ ] Secrets et ConfigMaps adaptés
- [ ] Kubeconfig configuré dans Jenkins
- [ ] Branch est main/master/develop
- [ ] Pas de pods CrashLoopBackOff dans un déploiement antérieur

---

## 📚 Ressources

- [Jenkinsfile GitHub](./Jenkinsfile) — Pipeline principal
- [JenkinsfileK8s](./JenkinsfileK8s) — Pipeline K8s autonome
- [K8S_DEPLOYMENT_GUIDE.md](./K8S_DEPLOYMENT_GUIDE.md) — Guide complet
- [k8s/manifests.yaml](./k8s/manifests.yaml) — Exemples de manifests

---

**Pour l'assistance :** Consultez le guide complet [K8S_DEPLOYMENT_GUIDE.md](./K8S_DEPLOYMENT_GUIDE.md)
