#!/bin/bash

# ====================================
# Script d'EXPORT - BD MySQL et Realm Keycloak
# ====================================
# À exécuter depuis votre machine locale AVANT de déployer avec Docker
#
# Usage: bash export-data.sh
#

set -e

echo "======================================"
echo "  EXPORT : BD MySQL & Realm Keycloak"
echo "======================================"
echo ""

# Configuration
EXPORT_DIR="./init"
MYSQL_DIR="$EXPORT_DIR/mysql"
KEYCLOAK_DIR="$EXPORT_DIR/keycloak"
MYSQL_USER="root"
MYSQL_PASSWORD="root"
MYSQL_DATABASE="nep"
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_PASSWORD="admin"

echo "📁 Dossier d'export : $EXPORT_DIR"
echo ""

# Créer les répertoires
echo "📂 Création des répertoires..."
mkdir -p "$MYSQL_DIR"
mkdir -p "$KEYCLOAK_DIR"
echo "✅ Répertoires créés"

# ===================== EXPORT MySQL =====================
echo ""
echo "======================================"
echo "  EXPORT MySQL"
echo "======================================"
echo ""

read -p "Voulez-vous exporter la BD MySQL ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then

    echo "🔍 Vérification de la connexion MySQL..."
    if ! mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
        echo "❌ ERREUR : Impossible de se connecter à MySQL"
        echo "   Assurez-vous que MySQL est démarré et les identifiants sont corrects"
        exit 1
    fi
    echo "✅ Connexion OK"

    echo ""
    echo "📤 Extraction de la BD '$MYSQL_DATABASE'..."

    # Exporter la base de données
    mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
        --single-transaction \
        --quick \
        --lock-tables=false \
        "$MYSQL_DATABASE" > "$MYSQL_DIR/nep_backup.sql"

    EXPORT_SIZE=$(du -h "$MYSQL_DIR/nep_backup.sql" | cut -f1)

    echo "✅ Export réussi !"
    echo "   📌 Fichier : $MYSQL_DIR/nep_backup.sql"
    echo "   📊 Taille : $EXPORT_SIZE"

    # Compter les tables
    TABLE_COUNT=$(mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;" | wc -l)
    echo "   📋 Tables : $((TABLE_COUNT - 1))"

    # Afficher un aperçu
    echo ""
    echo "Tables exportées :"
    mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;" | head -n 20

else
    echo "ℹ️  Export MySQL ignoré"
fi

# ===================== EXPORT Keycloak =====================
echo ""
echo "======================================"
echo "  EXPORT Keycloak"
echo "======================================"
echo ""

read -p "Voulez-vous exporter le Realm Keycloak ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then

    echo "🔍 Vérification de la connexion Keycloak..."
    if ! curl -s "$KEYCLOAK_URL/health" > /dev/null 2>&1; then
        echo "❌ ERREUR : Impossible de se connecter à Keycloak"
        echo "   Assurez-vous que Keycloak est démarré : $KEYCLOAK_URL"
        exit 1
    fi
    echo "✅ Connexion OK"

    echo ""
    echo "🔐 Authentification..."

    # Obtenir un token
    TOKEN_RESPONSE=$(curl -s -X POST \
      "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "client_id=admin-cli" \
      -d "username=$KEYCLOAK_ADMIN" \
      -d "password=$KEYCLOAK_ADMIN_PASSWORD" \
      -d "grant_type=password" 2>&1)

    TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)

    if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
        echo "❌ ERREUR : Authentification échouée"
        echo "   Vérifiez les identifiants admin"
        exit 1
    fi

    echo "✅ Authentification réussie"

    echo ""

    # Lister les realms disponibles
    echo "📋 Realms disponibles :"
    REALMS=$(curl -s -X GET \
      "$KEYCLOAK_URL/admin/realms" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq -r '.[].realm')

    echo "$REALMS"

    echo ""
    read -p "Quel realm voulez-vous exporter ? (défaut: kidneyCare-realm) " REALM_NAME
    REALM_NAME=${REALM_NAME:-kidneyCare-realm}

    echo ""
    echo "📤 Export du realm '$REALM_NAME'..."

    # Exporter le realm
    curl -s -X GET \
      "$KEYCLOAK_URL/admin/realms/$REALM_NAME" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq . > "$KEYCLOAK_DIR/$REALM_NAME.json"

    # Exporter les clients
    curl -s -X GET \
      "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq . > "$KEYCLOAK_DIR/${REALM_NAME}_clients.json"

    # Exporter les rôles
    curl -s -X GET \
      "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq . > "$KEYCLOAK_DIR/${REALM_NAME}_roles.json"

    # Exporter les utilisateurs
    curl -s -X GET \
      "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" | jq . > "$KEYCLOAK_DIR/${REALM_NAME}_users.json"

    echo "✅ Export réussi !"
    echo ""
    echo "📌 Fichiers exportés :"
    ls -lh "$KEYCLOAK_DIR/"

else
    echo "ℹ️  Export Keycloak ignoré"
fi

echo ""
echo "======================================"
echo "✅ EXPORT TERMINÉ"
echo "======================================"
echo ""
echo "📁 Fichiers disponibles dans : ./$EXPORT_DIR/"
echo ""
echo "⚠️  IMPORTANT :"
echo "   - Ces fichiers contiennent des données sensibles"
echo "   - À ne pas committer dans le git"
echo "   - À placer dans .gitignore"
echo ""
echo "🚀 Prochaine étape :"
echo "   1. Utilisez docker-compose-avec-import.yml"
echo "   2. Lancez : docker-compose -f docker-compose-avec-import.yml up -d"
echo ""

