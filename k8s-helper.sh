#!/bin/bash

###############################################################################
# KidneyCare K8s Helper Script
# Utilitaire pour faciliter le déploiement et la gestion K8s
# Usage: ./k8s-helper.sh [command] [options]
###############################################################################

set -e

# Variables
NAMESPACE="kidneycare"
DEPLOYMENT_TIMEOUT="5m"
CONFIG_FILE="k8s/manifests.yaml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# Fonctions utilitaires
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

separator() {
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
}

check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_warning "docker n'est pas installé (optionnel)"
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Impossible de se connecter au cluster K8s"
        exit 1
    fi
    
    log_success "Tous les prérequis sont OK"
}

###############################################################################
# Commandes disponibles
###############################################################################

# 1. Vérifier la connexion K8s
cmd_check() {
    separator
    log_info "Vérification de la connexion K8s"
    separator
    
    echo ""
    log_info "Version kubectl:"
    kubectl version --client --short
    
    echo ""
    log_info "Cluster info:"
    kubectl cluster-info
    
    echo ""
    log_info "Nœuds disponibles:"
    kubectl get nodes -o wide
    
    echo ""
    log_info "Pods en cours d'exécution:"
    kubectl get pods -n $NAMESPACE -o wide 2>/dev/null || log_warning "Namespace $NAMESPACE n'existe pas encore"
    
    log_success "Vérification OK"
}

# 2. Créer le namespace
cmd_namespace_create() {
    separator
    log_info "Création du namespace: $NAMESPACE"
    separator
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Namespace $NAMESPACE créé/vérifié"
}

# 3. Appliquer les manifests
cmd_deploy() {
    separator
    log_info "Déploiement des manifests"
    separator
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Fichier de configuration non trouvé: $CONFIG_FILE"
        exit 1
    fi
    
    log_info "Validation des manifests..."
    kubectl apply -f $CONFIG_FILE --dry-run=client --validate=true > /dev/null
    log_success "Manifests validés"
    
    echo ""
    log_info "Application des manifests..."
    kubectl apply -f $CONFIG_FILE
    
    log_success "Manifests appliqués"
}

# 4. Attendre le rollout
cmd_wait_rollout() {
    separator
    log_info "Attente du rollout des déploiements"
    separator
    
    DEPLOYMENTS=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')
    
    if [ -z "$DEPLOYMENTS" ]; then
        log_warning "Aucun déploiement trouvé dans le namespace $NAMESPACE"
        return
    fi
    
    for deployment in $DEPLOYMENTS; do
        log_info "Attente: $deployment (timeout: $DEPLOYMENT_TIMEOUT)"
        kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=$DEPLOYMENT_TIMEOUT || {
            log_error "Timeout pour le déploiement $deployment"
            return 1
        }
        log_success "$deployment est prêt"
    done
    
    log_success "Tous les déploiements sont prêts"
}

# 5. Vérifier les ressources
cmd_status() {
    separator
    log_info "Statut des ressources"
    separator
    
    echo ""
    log_info "PODS:"
    kubectl get pods -n $NAMESPACE -o wide
    
    echo ""
    log_info "SERVICES:"
    kubectl get services -n $NAMESPACE -o wide
    
    echo ""
    log_info "INGRESS:"
    kubectl get ingress -n $NAMESPACE -o wide 2>/dev/null || log_warning "Aucun ingress trouvé"
    
    echo ""
    log_info "PVC:"
    kubectl get pvc -n $NAMESPACE -o wide 2>/dev/null || log_warning "Aucun PVC trouvé"
    
    log_success "Statut affiché"
}

# 6. Afficher les logs
cmd_logs() {
    local pod_name=$1
    
    if [ -z "$pod_name" ]; then
        separator
        log_info "Logs de tous les pods"
        separator
        
        PODS=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')
        
        for pod in $PODS; do
            echo ""
            log_info "Logs du pod: $pod"
            echo "─────────────────────────────────────────"
            kubectl logs $pod -n $NAMESPACE --tail=50
        done
    else
        separator
        log_info "Logs du pod: $pod_name"
        separator
        
        kubectl logs -f $pod_name -n $NAMESPACE
    fi
}

# 7. Événements du cluster
cmd_events() {
    separator
    log_info "Événements récents"
    separator
    
    kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -20
}

# 8. Décrire un pod
cmd_describe() {
    local pod_name=$1
    
    if [ -z "$pod_name" ]; then
        log_error "Veuillez spécifier un pod: $0 describe <pod-name>"
        exit 1
    fi
    
    separator
    log_info "Description du pod: $pod_name"
    separator
    
    kubectl describe pod $pod_name -n $NAMESPACE
}

# 9. Port-forward
cmd_port_forward() {
    local pod_name=$1
    local local_port=$2
    local remote_port=$3
    
    if [ -z "$pod_name" ] || [ -z "$local_port" ] || [ -z "$remote_port" ]; then
        log_error "Usage: $0 port-forward <pod-name> <local-port> <remote-port>"
        exit 1
    fi
    
    separator
    log_info "Port-forward: $pod_name (local:$local_port -> remote:$remote_port)"
    separator
    
    kubectl port-forward $pod_name $local_port:$remote_port -n $NAMESPACE
}

# 10. Exécuter une commande dans un pod
cmd_exec() {
    local pod_name=$1
    shift
    local command="$@"
    
    if [ -z "$pod_name" ]; then
        log_error "Usage: $0 exec <pod-name> <command>"
        exit 1
    fi
    
    separator
    log_info "Exécution: $command dans $pod_name"
    separator
    
    kubectl exec -it $pod_name -n $NAMESPACE -- $command
}

# 11. Nettoyer le namespace
cmd_cleanup() {
    separator
    log_warning "Suppression du namespace: $NAMESPACE"
    separator
    
    read -p "Êtes-vous sûr? (yes/no): " confirmation
    if [ "$confirmation" == "yes" ]; then
        kubectl delete namespace $NAMESPACE
        log_success "Namespace supprimé"
    else
        log_info "Suppression annulée"
    fi
}

# 12. Test complet
cmd_full_test() {
    separator
    log_info "Test complet du déploiement"
    separator
    
    echo ""
    cmd_check
    
    echo ""
    cmd_namespace_create
    
    echo ""
    cmd_deploy
    
    echo ""
    cmd_wait_rollout
    
    echo ""
    cmd_status
    
    echo ""
    log_success "Test complet terminé ✓"
}

# 13. Usage/Help
cmd_help() {
    cat << EOF
${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}
${BLUE}║        KidneyCare K8s Helper Script                            ║${NC}
${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}

${GREEN}Usage:${NC} ./k8s-helper.sh [command] [options]

${GREEN}Commandes:${NC}

  ${BLUE}check${NC}                   Vérifier la connexion K8s
  ${BLUE}namespace-create${NC}        Créer le namespace
  ${BLUE}deploy${NC}                  Appliquer les manifests
  ${BLUE}wait-rollout${NC}            Attendre le rollout complet
  ${BLUE}status${NC}                  Afficher le statut des ressources
  ${BLUE}logs${NC} [pod-name]         Afficher les logs (tous les pods ou spécifique)
  ${BLUE}events${NC}                  Afficher les événements récents
  ${BLUE}describe${NC} <pod-name>     Décrire un pod en détail
  ${BLUE}port-forward${NC} <pod> <local:remote>  Mapper un port
  ${BLUE}exec${NC} <pod> <command>    Exécuter une commande dans un pod
  ${BLUE}cleanup${NC}                 Supprimer le namespace
  ${BLUE}full-test${NC}               Test complet (check -> deploy -> wait)
  ${BLUE}help${NC}                    Afficher cette aide

${GREEN}Exemples:${NC}

  # Vérifier la connexion
  $ ./k8s-helper.sh check

  # Déployer les manifests
  $ ./k8s-helper.sh deploy

  # Attendre le rollout
  $ ./k8s-helper.sh wait-rollout

  # Afficher les logs
  $ ./k8s-helper.sh logs
  $ ./k8s-helper.sh logs eureka-server-abc123

  # Afficher le statut
  $ ./k8s-helper.sh status

  # Décrire un pod
  $ ./k8s-helper.sh describe eureka-server-abc123

  # Port-forward
  $ ./k8s-helper.sh port-forward eureka-server-abc123 8761 8761

  # Exécuter une commande
  $ ./k8s-helper.sh exec eureka-server-abc123 bash
  $ ./k8s-helper.sh exec eureka-server-abc123 curl http://localhost:8761/actuator/health

  # Test complet
  $ ./k8s-helper.sh full-test

${GREEN}Variables d'environnement:${NC}

  NAMESPACE          Namespace K8s (défaut: ${BLUE}kidneycare${NC})
  CONFIG_FILE        Fichier de configuration (défaut: ${BLUE}k8s/manifests.yaml${NC})

${GREEN}Variables:${NC}

  NAMESPACE=${NAMESPACE}
  CONFIG_FILE=${CONFIG_FILE}

${BLUE}═══════════════════════════════════════════════════════════════${NC}
EOF
}

###############################################################################
# Point d'entrée principal
###############################################################################

main() {
    if [ $# -eq 0 ]; then
        cmd_help
        exit 0
    fi
    
    # Vérifier les prérequis (sauf pour help)
    if [ "$1" != "help" ]; then
        check_prerequisites
    fi
    
    # Router les commandes
    case "$1" in
        check)
            cmd_check
            ;;
        namespace-create)
            cmd_namespace_create
            ;;
        deploy)
            cmd_deploy
            ;;
        wait-rollout)
            cmd_wait_rollout
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs "$2"
            ;;
        events)
            cmd_events
            ;;
        describe)
            cmd_describe "$2"
            ;;
        port-forward)
            cmd_port_forward "$2" "$3" "$4"
            ;;
        exec)
            shift
            cmd_exec "$@"
            ;;
        cleanup)
            cmd_cleanup
            ;;
        full-test)
            cmd_full_test
            ;;
        help)
            cmd_help
            ;;
        *)
            log_error "Commande inconnue: $1"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

# Exécuter
main "$@"
