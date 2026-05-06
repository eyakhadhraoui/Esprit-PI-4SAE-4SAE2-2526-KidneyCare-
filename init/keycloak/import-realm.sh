#!/bin/bash

# ====================================
# Script d'initialisation Keycloak
# ====================================
# Ce script importe le realm JSON après le démarrage de Keycloak
# À lancer avec : docker-compose exec keycloak bash /init/import-realm.sh

set -e

echo "======================================"
echo "  Import du Realm Keycloak"
echo "======================================"
echo ""

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM_FILE="/opt/keycloak/data/import/kidneyCare-realm.json"
REALM_NAME="kidneyCare-realm"

echo "🔧 Configuration :"
echo "   URL Keycloak : $KEYCLOAK_URL"
echo "   Admin User   : $ADMIN_USER"
echo "   Realm        : $REALM_NAME"
echo "   Fichier      : $REALM_FILE"
echo ""

# Vérifier que le fichier JSON existe
if [ ! -f "$REALM_FILE" ]; then
    echo "❌ ERREUR : Le fichier realm JSON n'existe pas !"
    echo "   Chemin attendu : $REALM_FILE"
    exit 1
fi

echo "✅ Fichier realm trouvé"

# Valider le JSON
echo "🔍 Validation du JSON..."
if ! jq . "$REALM_FILE" > /dev/null 2>&1; then
    echo "❌ ERREUR : Le fichier JSON n'est pas valide !"
    exit 1
fi
echo "✅ JSON valide"

# Attendre que Keycloak soit prêt
echo ""
echo "⏳ Attente du démarrage de Keycloak..."
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s "$KEYCLOAK_URL/health" > /dev/null 2>&1; then
        echo "✅ Keycloak est prêt!"
        break
    fi
    echo "⏳ Tentative $attempt/$max_attempts..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ ERREUR : Keycloak n'a pas pu démarrer après $((max_attempts * 2)) secondes"
    exit 1
fi

echo ""

# Obtenir un token admin
echo "🔐 Authentification auprès de Keycloak..."
TOKEN_RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" 2>&1)

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "❌ ERREUR : Impossible d'obtenir un token d'authentification"
    echo "   Réponse : $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Authentification réussie (token obtenu)"

# Vérifier si le realm existe déjà
echo ""
echo "🔍 Vérification du realm existant..."

REALM_EXISTS=$(curl -s -X GET \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '. | has("id")' 2>/dev/null || echo "false")

if [ "$REALM_EXISTS" == "true" ]; then
    echo "ℹ️  Le realm '$REALM_NAME' existe déjà"

    # Optionnel : supprimer le realm existant avant d'importer
    read -p "Voulez-vous supprimer et réimporter le realm ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        echo "🗑️  Suppression du realm existant..."
        curl -s -X DELETE \
          "$KEYCLOAK_URL/admin/realms/$REALM_NAME" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json"
        echo "✅ Realm supprimé"
    else
        echo "ℹ️  Conservement du realm existant"
        echo ""
        echo "======================================"
        echo "✅ Import Keycloak TERMINÉ"
        echo "   Le realm '$REALM_NAME' est déjà configuré"
        echo "======================================"
        echo ""
        exit 0
    fi
fi

# Importer le realm
echo ""
echo "📤 Import du realm..."

IMPORT_RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @"$REALM_FILE" 2>&1)

# Vérifier la réponse
if echo "$IMPORT_RESPONSE" | grep -q "error"; then
    echo "⚠️  Attention : $IMPORT_RESPONSE"
else
    echo "✅ Realm importé avec succès !"
fi

# Afficher les infos du realm importé
echo ""
echo "ℹ️  Informations du realm :"

REALM_INFO=$(curl -s -X GET \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$REALM_INFO" | jq '{
  id: .id,
  name: .realm,
  displayName: .displayName,
  enabled: .enabled,
  accessTokenLifespan: .accessTokenLifespan
}'

# Afficher les clients
echo ""
echo "👥 Clients du realm :"

curl -s -X GET \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.[] | {id: .id, clientId: .clientId, enabled: .enabled}'

# Afficher les rôles
echo ""
echo "🔐 Rôles du realm :"

curl -s -X GET \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.[] | {name: .name, description: .description}'

echo ""
echo "======================================"
echo "✅ Import Keycloak TERMINÉ"
echo "======================================"
echo ""
echo "🌐 Accédez au realm :"
echo "   http://localhost:8080/realms/$REALM_NAME"
echo ""
echo "🔑 Admin Console :"
echo "   http://localhost:8080/admin"
echo "   Identifiants : $ADMIN_USER / $ADMIN_PASSWORD"
echo ""

