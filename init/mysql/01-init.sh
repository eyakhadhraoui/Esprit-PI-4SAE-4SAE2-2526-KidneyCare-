#!/bin/bash

# ====================================
# Script d'initialisation MySQL
# ====================================
# Ce script est exécuté automatiquement à la création du conteneur MySQL
# Les fichiers dans /docker-entrypoint-initdb.d/ sont exécutés dans l'ordre alphabétique

set -e

echo "======================================"
echo "  Initialisation MySQL"
echo "======================================"
echo ""

# Attendre que MySQL soit vraiment prêt
echo "⏳ Attente du démarrage de MySQL..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if mysqladmin ping -h"localhost" -u"root" -p"$MYSQL_ROOT_PASSWORD" --silent; then
        echo "✅ MySQL est prêt!"
        break
    fi
    echo "⏳ Tentative $attempt/$max_attempts..."
    sleep 1
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Erreur : MySQL n'a pas pu démarrer après $max_attempts tentatives"
    exit 1
fi

echo ""
echo "📊 État actuel des bases de données :"
mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" -e "SHOW DATABASES;"

echo ""

# Vérifier et import du fichier SQL principal
if [ -f /docker-entrypoint-initdb.d/nep_backup.sql ]; then
    echo "📦 Importation de nep_backup.sql..."
    echo "   Cela peut prendre quelques minutes..."

    # Importer le fichier SQL
    mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/nep_backup.sql

    echo "✅ Import du fichier SQL terminé !"

    # Vérifier que l'import a réussi
    TABLES_COUNT=$(mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SELECT COUNT(DISTINCT TABLE_NAME) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$MYSQL_DATABASE';" | tail -n 1)

    echo "   📊 Nombre de tables importées : $TABLES_COUNT"

    # Afficher quelques infos sur les tables
    echo ""
    echo "📋 Tables disponibles :"
    mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;" | head -n 20

else
    echo "⚠️  Fichier nep_backup.sql non trouvé"
    echo "    Les tables seront créées automatiquement par Hibernate DDL"
fi

echo ""
echo "👤 Utilisateurs MySQL :"
mysql -u"root" -p"$MYSQL_ROOT_PASSWORD" -e "SELECT User, Host FROM mysql.user WHERE User NOT IN ('mysql.session', 'mysql.sys');"

echo ""
echo "======================================"
echo "✅ Initialisation MySQL TERMINÉE"
echo "======================================"
echo ""

