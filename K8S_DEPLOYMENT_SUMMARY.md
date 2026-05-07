# 📋 Résumé Complet — Déploiement K8s

## 🎯 Objectif

Fournir deux approches robustes pour déployer KidneyCare sur Kubernetes avec vérifications complètes et logs détaillés.

---

## 📦 Fichiers livrés

### 1. **JenkinsfileK8s** — Pipeline K8s autonome

**Localisation :** `/JenkinsfileK8s`

**Stages :**
- ✅ Vérification K8s — Prérequis (kubectl, cluster, nodes, namespace)
- ✅ Application des Manifests — Validation YAML + kubectl apply
- ✅ Rollout Status — Attente des pods (5 minutes max)
- ✅ Vérification des Pods et Services — État des ressources
- ✅ Logs du Déploiement — Collecte les logs de tous les pods
- ✅ Tests de Connectivité — Vérifie les endpoints
- ✅ Vérification Finale — Résumé du déploiement

**Usage :** Pour un déploiement K8s **indépendant** du workflow CI/CD

**Avantages :**
- ⭐ Vérifications exhaustives
- ⭐ Logs détaillés et diagnostiques
- ⭐ Gestion complète du cicle de vie
- ⭐ Rollback possible

---

### 2. **Jenkinsfile** (modifié) — Pipeline principal

**Localisation :** `/Jenkinsfile`

**Modification :**
- Stage 'Deploy' inchangé (docker-compose)
- ✅ **Nouveau stage 'Deploy K8s'** ajouté après 'Build Docker Images'

**Stage 'Deploy K8s' :**
```groovy
stage('Deploy K8s') {
    when {
        anyOf {
            branch 'main', 'master', 'develop'
        }
        environment name: 'DEPLOY_K8S', value: 'true'
    }
    steps {
        // 1. Vérification kubectl
        // 2. Test de connexion
        // 3. Création namespace
        // 4. Application des manifests
        // 5. Attente du rollout
        // 6. Vérification pods/services
        // 7. Collecte des logs
    }
}
```

**Usage :** Pour un déploiement K8s **intégré** au pipeline CI/CD

**Avantages :**
- ⭐ Déploiement automatique après les builds
- ⭐ Vérifications intégrées
- ⭐ Logs consolidés
- ⭐ Pas besoin de pipeline séparé

---

### 3. **K8S_DEPLOYMENT_GUIDE.md** — Guide complet

**Localisation :** `/K8S_DEPLOYMENT_GUIDE.md`

**Contenu :**
- Vue d'ensemble complète
- Configuration détaillée
- Étapes du déploiement
- Résolution des problèmes (6 cas courants)
- Exemples pratiques et tests
- Commandes essentielles

**Usage :** Documentation de référence complète

---

### 4. **K8S_QUICK_START.md** — Guide rapide

**Localisation :** `/K8S_QUICK_START.md`

**Contenu :**
- Quick start pour les deux options
- Configuration minimale requise
- Vérification du déploiement
- Tests rapides
- Checklist pré-déploiement

**Usage :** Pour démarrer rapidement

---

### 5. **k8s/manifests.yaml** — Exemples de manifests

**Localisation :** `/k8s/manifests.yaml`

**Ressources incluses :**
- ✅ Namespace
- ✅ ConfigMap
- ✅ Secrets
- ✅ PersistentVolumeClaims (uploads, database)
- ✅ Deployments (Eureka, Gateway, Services)
- ✅ Services (ClusterIP, LoadBalancer)
- ✅ Ingress (HTTPS)
- ✅ HorizontalPodAutoscaler

**Usage :** Modèles à adapter à votre environnement

---

### 6. **k8s-helper.sh** — Script helper

**Localisation :** `/k8s-helper.sh`

**Commandes :**
| Commande | Fonction |
|----------|----------|
| `check` | Vérifier la connexion K8s |
| `namespace-create` | Créer le namespace |
| `deploy` | Appliquer les manifests |
| `wait-rollout` | Attendre le rollout |
| `status` | Afficher le statut |
| `logs` | Afficher les logs |
| `events` | Afficher les événements |
| `describe` | Décrire un pod |
| `port-forward` | Mapper un port |
| `exec` | Exécuter une commande |
| `cleanup` | Supprimer le namespace |
| `full-test` | Test complet |

**Usage :**
```bash
chmod +x k8s-helper.sh
./k8s-helper.sh full-test
```

---

## 🚀 Utilisation

### Scénario 1 : Pipeline principal avec déploiement K8s (recommandé)

**Configuration :**

1. Vérifier que `k8s/manifests.yaml` existe
2. Adapter les manifests à votre environnement
3. Configurer le kubeconfig dans Jenkins

**Activation :**

```groovy
// Option 1 : Automatique (commenter la ligne)
when {
    anyOf {
        branch 'main'
        branch 'master'
        branch 'develop'
    }
    // environment name: 'DEPLOY_K8S', value: 'true'
}

// Option 2 : Via Jenkins UI
// Ajouter paramètre DEPLOY_K8S=true lors du build
```

**Exécution :**

```bash
git push origin main
# Jenkins lance le pipeline automatiquement
```

---

### Scénario 2 : Pipeline K8s autonome

**Configuration :**

1. Créer un nouveau job Jenkins
2. Configurer le script path : `JenkinsfileK8s`
3. Configurer le kubeconfig

**Exécution :**

```bash
# Déclencher depuis Jenkins UI
# Ou via CLI
curl -X POST http://jenkins/job/KidneyCare-K8s-Deploy/build -u user:password
```

---

### Scénario 3 : Déploiement manuel local

**Utiliser le script helper :**

```bash
# Test complet
./k8s-helper.sh full-test

# Ou étape par étape
./k8s-helper.sh check
./k8s-helper.sh namespace-create
./k8s-helper.sh deploy
./k8s-helper.sh wait-rollout
./k8s-helper.sh status
```

---

## ⚙️ Configuration requise

### Prérequis système

```bash
✅ kubectl installé
✅ Accès au cluster K8s
✅ Fichier kubeconfig configuré
✅ Images Docker disponibles (registry accessible)
```

### Prérequis Jenkins

```groovy
environment {
    K8S_NAMESPACE = 'kidneycare'           // Namespace K8s
    K8S_CONTEXT = 'docker-desktop'         // Contexte K8s
    KUBECONFIG = '/var/jenkins_home/.kube/config'  // Chemin kubeconfig
}
```

### Prérequis manifests K8s

```
repo/
├── k8s/
│   └── manifests.yaml  (ou *.yaml)
├── Jenkinsfile
├── JenkinsfileK8s
└── docker-compose.yml
```

---

## 📊 Vérifications effectuées

### Stage 1 : Vérification K8s

```bash
✓ kubectl version --client --short
✓ kubectl cluster-info
✓ kubectl get namespace ${K8S_NAMESPACE}
✓ kubectl get nodes -o wide
✓ kubectl top nodes (optionnel)
```

### Stage 2 : Application des manifests

```bash
✓ Vérifier la présence des manifests (k8s/ ou manifests/)
✓ Valider chaque fichier YAML (--dry-run=client)
✓ Appliquer les manifests (kubectl apply)
```

### Stage 3 : Rollout status

```bash
✓ Attendre chaque déploiement
✓ Timeout: 5 minutes par déploiement
✓ Afficher la progression
```

### Stage 4 : Vérification des ressources

```bash
✓ Pods en Running
✓ Services avec endpoints
✓ Ingress configuré
✓ PVC mounted
```

### Stage 5 : Logs

```bash
✓ Dernières 100 lignes de logs par pod
✓ Événements du cluster
✓ Description détaillée en cas d'erreur
```

---

## 🛠️ Commandes clés

### Vérification

```bash
kubectl cluster-info
kubectl get nodes -o wide
kubectl get all -n kidneycare
```

### Déploiement

```bash
kubectl apply -f k8s/
kubectl rollout status deployment/eureka-server -n kidneycare
kubectl get pods -n kidneycare -o wide
```

### Logs et diagnostiques

```bash
kubectl logs -f deployment/eureka-server -n kidneycare
kubectl describe pod <pod-name> -n kidneycare
kubectl get events -n kidneycare --sort-by='.lastTimestamp'
```

### Tests

```bash
kubectl port-forward svc/eureka-service 8761:8761 -n kidneycare
curl http://localhost:8761/actuator/health
```

---

## ⚠️ Résolution des problèmes

### Problème : Pods en CrashLoopBackOff

**Diagnostic :**
```bash
kubectl logs <pod-name> -n kidneycare
kubectl logs <pod-name> -n kidneycare --previous
kubectl describe pod <pod-name> -n kidneycare
```

**Solutions :**
- Vérifier les logs de l'application
- Vérifier les variables d'environnement
- Vérifier la sonde de santé (liveness/readiness)
- Vérifier les resource limits

---

### Problème : Service sans endpoints

**Diagnostic :**
```bash
kubectl get endpoints <service-name> -n kidneycare
kubectl get pods -n kidneycare --show-labels
kubectl get service <service-name> -n kidneycare -o yaml
```

**Solution :**
- Vérifier que les labels du pod correspondent au sélecteur du service
- Vérifier que les pods sont en Running
- Vérifier les readiness probes

---

### Problème : ImagePullBackOff

**Diagnostic :**
```bash
kubectl describe pod <pod-name> -n kidneycare
docker pull <image-name>:<tag>
```

**Solution :**
- Vérifier l'existence de l'image
- Vérifier les credentials du registry
- Vérifier l'imagePullPolicy

---

## 📈 Performance et optimisation

### Resource limits recommandés

```yaml
Eureka Server:
  requests: cpu 200m, memory 512Mi
  limits: cpu 500m, memory 1Gi

API Gateway:
  requests: cpu 250m, memory 512Mi
  limits: cpu 500m, memory 1Gi

Services:
  requests: cpu 250m, memory 512Mi
  limits: cpu 500m, memory 1Gi
```

### Autoscaling

```yaml
HorizontalPodAutoscaler:
  minReplicas: 2
  maxReplicas: 5
  CPU utilization: 70%
  Memory utilization: 80%
```

---

## ✅ Checklist de déploiement

- [ ] kubectl accessible sur le poste Jenkins
- [ ] Connexion K8s vérifiée
- [ ] Namespace kidneycare créé
- [ ] Manifests dans k8s/ valides
- [ ] Images Docker disponibles et testées
- [ ] Secrets et ConfigMaps adaptés
- [ ] Resource requests/limits définis
- [ ] Health checks configurés
- [ ] Services accessibles (ClusterIP/LoadBalancer)
- [ ] Ingress configuré (si nécessaire)
- [ ] Tests de connectivité réussis
- [ ] Pas de pods en CrashLoopBackOff

---

## 📞 Support et ressources

### Documentation

- [K8S_DEPLOYMENT_GUIDE.md](./K8S_DEPLOYMENT_GUIDE.md) — Guide complet
- [K8S_QUICK_START.md](./K8S_QUICK_START.md) — Quick start
- [k8s/manifests.yaml](./k8s/manifests.yaml) — Exemples
- [Jenkinsfile](./Jenkinsfile) — Pipeline principal
- [JenkinsfileK8s](./JenkinsfileK8s) — Pipeline K8s

### Ressources externes

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Jenkins Pipeline](https://jenkins.io/doc/book/pipeline/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

---

## 🎯 Prochaines étapes

1. ✅ Adapter les manifests à votre environnement
2. ✅ Configurer le kubeconfig dans Jenkins
3. ✅ Tester le déploiement localement
4. ✅ Intégrer au pipeline CI/CD
5. ✅ Configurer les monitoring/alertes
6. ✅ Documenter votre configuration

---

## 📝 Notes importantes

### Variables d'environnement

Le stage 'Deploy K8s' du Jenkinsfile utilise :

```groovy
K8S_NAMESPACE = "kidneycare"
DEPLOYMENT_TIMEOUT = "5m"
```

À adapter selon votre environnement.

### Sécurité

⚠️ Les secrets ne doivent **PAS** être en clair dans les manifests !

```bash
# Créer les secrets depuis Jenkins
kubectl create secret generic kidneycare-secrets \
  --from-literal=DATABASE_PASSWORD=... \
  --from-literal=JWT_SECRET=... \
  -n kidneycare
```

### Rollback

En cas de problème :

```bash
kubectl rollout undo deployment/eureka-server -n kidneycare
kubectl rollout history deployment/eureka-server -n kidneycare
```

---

**Version :** 1.0  
**Date :** 2026-05-07  
**Auteur :** DevOps Team  
**Status :** ✅ Production Ready
