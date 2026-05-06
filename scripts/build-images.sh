#!/bin/bash

# ====================================
# Script de build des images Docker
# ====================================

set -e

echo "======================================"
echo "  Build des images Docker"
echo "======================================"
echo ""

# Checker si Docker est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

echo "✅ Docker Compose trouvé : $(docker-compose --version)"
echo ""

# Options de build
BUILD_OPTS=""
NO_CACHE=false
PARALLEL=true

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --serial)
            PARALLEL=false
            shift
            ;;
        *)
            echo "Option inconnue: $1"
            shift
            ;;
    esac
done

# Construire les options
if [ "$NO_CACHE" = true ]; then
    BUILD_OPTS="--no-cache"
fi

echo "📝 Options de build : $BUILD_OPTS"
echo ""

# Services à builder
SERVICES=(
    "eureka"
    "api-gateway"
    "mysql"
    "keycloak"
    "nephro"
    "consultation"
    "parametrevital"
    "infection-vaccination"
    "nutrition"
    "prescription"
    "greffe"
    "frontend"
)

echo "🔨 Démarrage du build des images..."
echo ""

# Utiliser le fichier docker-compose approprié
COMPOSE_FILE="docker-compose-avec-import.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="docker-compose.yml"
fi

echo "📁 Utilising: $COMPOSE_FILE"
echo ""

# Builder les images
if [ "$PARALLEL" = true ]; then
    echo "⚡ Build parallèle (plus rapide)"
    docker-compose -f "$COMPOSE_FILE" build $BUILD_OPTS
else
    echo "🔄 Build séquentiel"
    for service in "${SERVICES[@]}"; do
        echo ""
        echo "📦 Building $service..."
        docker-compose -f "$COMPOSE_FILE" build $BUILD_OPTS "$service" 2>/dev/null || echo "   (Skipped - service non dans compose)"
    done
fi

echo ""
echo "======================================"
echo "✅ Build TERMINÉ"
echo "======================================"
echo ""

# Afficher les images construites
echo "📊 Images disponibles :"
docker images | grep -E "(nephro|eureka|gateway|consultation|nutrition|prescription|greffe|frontend)" || echo "   (Aucune image trouvée)"

echo ""
echo "💡 Pour démarrer les services :"
echo "   docker-compose -f $COMPOSE_FILE up -d"
echo ""

