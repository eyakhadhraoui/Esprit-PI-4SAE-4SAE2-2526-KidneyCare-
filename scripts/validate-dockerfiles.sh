#!/bin/bash

# ====================================
# Script de validation des Dockerfiles
# ====================================

set -e

echo "======================================"
echo "  Validation des Dockerfiles"
echo "======================================"
echo ""

# Checker si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

echo "✅ Docker trouvé : $(docker --version)"
echo ""

# Array des services et leurs chemins
declare -a services=(
    "NEPHRO:./NEPHRO"
    "Eureka:./demo"
    "ApiGateway:./demo1"
    "FoncGreffon:./FoncGreffon"
    "InfectionVaccination:./InfectionEtVaccination"
    "Nutrition:./Nutrition_Service/Nutrition_Service"
    "Prescription:./prescription-Service"
    "Consultation:./projetconsultation"
    "ParametreVital:./projetparametrevital/projetparametrevital"
    "Frontend:./mon-projet"
)

echo "🔍 Validation des Dockerfiles..."
echo ""

for service in "${services[@]}"; do
    IFS=':' read -r name path <<< "$service"
    dockerfile="$path/Dockerfile"

    if [ ! -f "$dockerfile" ]; then
        echo "❌ $name : Dockerfile non trouvé ($dockerfile)"
        continue
    fi

    echo "📋 Validant $name..."

    # Vérifier la présence de FROM
    if ! grep -q "^FROM" "$dockerfile"; then
        echo "   ❌ FROM manquant"
        continue
    fi

    # Vérifier la présence de EXPOSE
    if ! grep -q "^EXPOSE" "$dockerfile"; then
        echo "   ⚠️  EXPOSE manquant"
    fi

    # Vérifier la présence de ENTRYPOINT ou CMD
    if ! grep -q "^ENTRYPOINT\|^CMD" "$dockerfile"; then
        echo "   ⚠️  ENTRYPOINT/CMD manquant"
    fi

    # Vérifier la présence de HEALTHCHECK (optionnel)
    if ! grep -q "HEALTHCHECK" "$dockerfile"; then
        echo "   ⚠️  HEALTHCHECK manquant (recommandé)"
    fi

    echo "   ✅ OK"
done

echo ""
echo "======================================"
echo "✅ Validation TERMINÉE"
echo "======================================"
echo ""
echo "💡 Pour rebuild les images :"
echo "   docker-compose --file docker-compose-avec-import.yml build --no-cache"
echo ""

