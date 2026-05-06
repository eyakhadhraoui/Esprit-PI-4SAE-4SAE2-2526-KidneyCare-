# ====================================
# GUIDE : Importer BD MySQL & Realm Keycloak
# ====================================

## 📌 RÉPONSE : OUI, C'EST POSSIBLE !

Vous pouvez importer :
✅ Une base de données MySQL existante
✅ Un realm Keycloak en JSON

---

## 📋 ÉTAPE 1 : Exporter votre BD MySQL actuelle

### Option A : Export via ligne de commande

```bash
# Depuis votre MySQL local (Windows)
mysqldump -u root -p nep > C:\Users\eyakh\Desktop\PI 2025_2026\pi\init\mysql\nep_backup.sql

# Depuis votre MySQL local (Mac/Linux)
mysqldump -u root -p nep > ~/Desktop/PI\ 2025_2026/pi/init/mysql/nep_backup.sql

# ⚠️ Remplacer 'root' par votre utilisateur MySQL s'il est différent
# ⚠️ Remplacer 'nep' par le nom de votre BD
```

### Option B : Export via MySQL Workbench

1. Ouvrir MySQL Workbench
2. Se connecter au serveur
3. Clic droit sur la BD → Export Dump Project
4. Choisir un dossier de destination
5. Sauvegarder en tant que `nep_backup.sql`

### Option C : Export via phpMyAdmin (si vous l'utilisez)

1. Ouvrir phpMyAdmin
2. Sélectionner la BD `nep`
3. Clic sur "Exporter"
4. Format : SQL
5. Télécharger le fichier

---

## 📋 ÉTAPE 2 : Exporter votre Realm Keycloak

### Option A : Via l'interface admin Keycloak

1. Accédez à http://localhost:8080/admin
2. Login : admin / admin
3. Sélectionner le realm `kidneyCare-realm`
4. Aller à "Realm Settings"
5. Aller à l'onglet "Export"
6. Cliquer "Export"
7. Choisir "Export clients" : YES
8. Le fichier `kidneyCare-realm.json` se télécharge

### Option B : Via la CLI Docker (si Keycloak tourne)

```bash
docker-compose exec keycloak /opt/keycloak/bin/kc.sh export \
  --file /tmp/kidneyCare-realm.json \
  --realm kidneyCare-realm
```

### Option C : Via Script Keycloak

```bash
# Dans un fichier export-realm.sh
#!/bin/bash
docker-compose exec keycloak /opt/keycloak/bin/kc.sh \
  export \
  --file /tmp/export/kidneyCare-realm.json \
  --realm kidneyCare-realm
```

---

## 📋 ÉTAPE 3 : Créer la structure de dossiers

```bash
# Créer les dossiers pour les imports
mkdir -p C:\Users\eyakh\Desktop\PI 2025_2026\pi\init\mysql
mkdir -p C:\Users\eyakh\Desktop\PI 2025_2026\pi\init\keycloak

# Placer les fichiers exportés :
# C:\Users\eyakh\Desktop\PI 2025_2026\pi\init\mysql\nep_backup.sql
# C:\Users\eyakh\Desktop\PI 2025_2026\pi\init\keycloak\kidneyCare-realm.json
```

Voici la structure attendue :

```
pi/
├── init/
│   ├── mysql/
│   │   ├── nep_backup.sql  ← File d'export MySQL
│   │   └── 01-init.sh      ← Script d'import (optionnel)
│   ├── keycloak/
│   │   ├── kidneyCare-realm.json  ← Realm exporté
│   │   └── import-realm.sh        ← Script d'import (optionnel)
├── docker-compose.yml
└── ...autres fichiers...
```

---

## 📋 ÉTAPE 4 : Modifier le docker-compose.yml

👇 **Voir le fichier `docker-compose-avec-import.yml` fourni séparément** 👇

Les modifications principales :

### Pour MySQL :

```yaml
mysql:
  image: mysql:8.0
  # ...existing code...
  volumes:
    - mysql_data:/var/lib/mysql
    - ./init/mysql/nep_backup.sql:/docker-entrypoint-initdb.d/01-nep_backup.sql  ← AJOUTER
```

### Pour Keycloak :

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:26.0.0
  # ...existing code...
  volumes:
    - keycloak_data:/opt/keycloak/data
    - ./init/keycloak/kidneyCare-realm.json:/opt/keycloak/data/import/kidneyCare-realm.json  ← AJOUTER
  command: start-dev --import-realm  ← MODIFIER
```

---

## 📋 ÉTAPE 5 : Script d'initialisation MySQL (optionnel mais recommandé)

Créer le fichier : `init/mysql/01-init.sh`

```bash
#!/bin/bash

# Attendre que MySQL soit prêt
while ! mysqladmin ping -h"localhost" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent; do
    echo 'Attente de MySQL...'
    sleep 1
done

echo "✅ MySQL est prêt!"

# Importer la base de données si le fichier existe
if [ -f /docker-entrypoint-initdb.d/nep_backup.sql ]; then
    echo "📦 Importation de nep_backup.sql..."
    mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/nep_backup.sql
    echo "✅ Import MySQL terminé!"
else
    echo "⚠️  nep_backup.sql non trouvé"
fi
```

---

## 📋 ÉTAPE 6 : Script d'initialisation Keycloak (optionnel)

Créer le fichier : `init/keycloak/import-realm.sh`

```bash
#!/bin/bash

# Ce script permet d'importer le realm après le démarrage

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM_FILE="/tmp/kidneyCare-realm.json"

# Attendre que Keycloak soit prêt
echo "⏳ Attente du démarrage de Keycloak..."
for i in {1..60}; do
    if curl -s "$KEYCLOAK_URL/health" > /dev/null 2>&1; then
        echo "✅ Keycloak est prêt!"
        break
    fi
    echo "Tentative $i/60..."
    sleep 2
done

# Obtenir un token admin
echo "🔐 Authentification..."
TOKEN=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "❌ Échec de l'authentification"
    exit 1
fi

echo "📤 Import du realm..."
curl -s -X POST \
  "$KEYCLOAK_URL/admin/realms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @"$REALM_FILE"

echo "✅ Import Keycloak terminé!"
```

---

## 📋 ÉTAPE 7 : Déployer avec les imports

```bash
# Aller dans le répertoire racine
cd C:\Users\eyakh\Desktop\PI 2025_2026\pi

# Démarrer avec le docker-compose modifié
docker-compose -f docker-compose-avec-import.yml up -d

# Vérifier les logs
docker-compose logs -f mysql
docker-compose logs -f keycloak

# Vérifier que les imports sont terminés
docker-compose ps
```

---

## 📋 ÉTAPE 8 : Vérification

### Vérifier MySQL

```bash
# Accédez au conteneur MySQL
docker-compose exec mysql mysql -u nephro_user -p nephro_password nep

# Puis dans MySQL :
SHOW TABLES;
SELECT COUNT(*) FROM patient;
QUIT;
```

### Vérifier Keycloak

```bash
# 1. Via l'interface web
http://localhost:8080/admin
Login: admin / admin

# 2. Via API
curl http://localhost:8080/admin/realms/kidneyCare-realm \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📋 ÉTAPE 9 : Dépannage

### Problème : Le fichier SQL n'est pas importé

```bash
# Vérifier que le fichier existe
ls -la ./init/mysql/

# Vérifier les permissions
chmod 644 ./init/mysql/nep_backup.sql

# Réconstruire
docker-compose down
docker-compose -f docker-compose-avec-import.yml up -d --build
```

### Problème : Keycloak ne importe pas le realm

```bash
# Vérifier les logs Keycloak
docker-compose logs -f keycloak | grep -i import

# Le fichier doit être en JSON valide
cat ./init/keycloak/kidneyCare-realm.json | jq . > /dev/null

# Vérifier la structure
ls -la ./init/keycloak/
```

### Problème : Conflits de ports

```bash
# Vérifier les ports utilisés
netstat -an | findstr "3306"
netstat -an | findstr "8080"

# Libérer le port
taskkill /PID <PID> /F

# Ou modifier les ports dans docker-compose.yml
```

---

## 🎯 RÉSUMÉ DES ÉTAPES

1. ✅ Exporter BD MySQL → `nep_backup.sql`
2. ✅ Exporter Realm Keycloak → `kidneyCare-realm.json`
3. ✅ Créer dossiers `init/mysql/` et `init/keycloak/`
4. ✅ Placer les fichiers dans ces dossiers
5. ✅ Modifier `docker-compose.yml` (volumes + command)
6. ✅ (Optionnel) Créer scripts d'initialisation
7. ✅ Démarrer avec `docker-compose up -d`
8. ✅ Vérifier les imports
9. ✅ Accédez à l'application

---

## 💾 Fichiers à avoir prêts

```
init/
├── mysql/
│   ├── nep_backup.sql  ← Database SQL
│   └── 01-init.sh      ← (optionnel)
└── keycloak/
    ├── kidneyCare-realm.json  ← Realm JSON
    └── import-realm.sh        ← (optionnel)
```

---

## 🔒 Notes de sécurité

⚠️ Ne pas committer les fichiers SQL/JSON contenant des données sensibles :

```bash
# Ajouter à .gitignore
echo "init/mysql/*.sql" >> .gitignore
echo "init/keycloak/*.json" >> .gitignore
```

---

## ✅ PRÊT À DÉPLOYER ?

Oui ! Une fois les fichiers exportés et placés, le docker-compose importera :
- ✅ Toutes les tables MySQL
- ✅ Tous les utilisateurs et rôles Keycloak
- ✅ Toute la configuration du realm

Voir le fichier `docker-compose-avec-import.yml` pour la configuration complète ! 🚀

