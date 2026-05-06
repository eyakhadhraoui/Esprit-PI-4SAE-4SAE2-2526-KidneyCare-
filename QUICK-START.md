# 🚀 GUIDE RAPIDE : Import BD MySQL & Realm Keycloak

## ✅ RÉPONSE RAPIDE

**OUI, c'est complètement possible !**

Tu peux importer :
- ✅ ta BD MySQL existante
- ✅ ton Realm Keycloak en JSON

---

## 📋 ÉTAPES RAPIDES (5 MINUTES)

### ÉTAPE 1 : Exporter les données (depuis ta machine locale)

#### Exporter la BD MySQL :
```bash
# Windows (PowerShell)
mysqldump -u root -p nep > "C:\Users\eyakh\Desktop\PI 2025_2026\pi\init\mysql\nep_backup.sql"

# Mac/Linux
mysqldump -u root -p nep > ~/Desktop/"PI 2025_2026"/pi/init/mysql/nep_backup.sql
```

#### Exporter le Realm Keycloak :

**Méthode rapide via interface web :**
1. Va sur http://localhost:8080/admin
2. Login : admin / admin
3. Clique sur ton realm `kidneyCare-realm`
4. Va dans "Realm Settings" → "Export"
5. Clique bouton "Export"
6. Le fichier `kidneyCare-realm.json` se télécharge
7. Place-le dans : `init/keycloak/kidneyCare-realm.json`

---

### ÉTAPE 2 : Créer la structure de dossiers

```bash
# Créer les dossiers (s'ils n'existent pas)
mkdir init/mysql
mkdir init/keycloak

# Placer les fichiers within ces dossiers :
# init/mysql/nep_backup.sql
# init/keycloak/kidneyCare-realm.json
```

---

### ÉTAPE 3 : Modifier le docker-compose

Tu as 2 options :

**Option A : Utiliser le docker-compose modifié (recommandé)**

```bash
# Utilise le fichier docker-compose-avec-import.yml
docker-compose -f docker-compose-avec-import.yml up -d
```

**Option B : Modifier ton docker-compose.yml existant**

Pour **MySQL** :
```yaml
mysql:
  # ... existing config ...
  volumes:
    - mysql_data:/var/lib/mysql
    - ./init/mysql/nep_backup.sql:/docker-entrypoint-initdb.d/01-nep_backup.sql  ← AJOUTER CETTE LIGNE
```

Pour **Keycloak** :
```yaml
keycloak:
  # ... existing config ...
  volumes:
    - keycloak_data:/opt/keycloak/data
    - ./init/keycloak:/opt/keycloak/data/import  ← AJOUTER CETTE LIGNE
  command: start-dev --import-realm  ← CHANGER CETTE LIGNE
```

---

### ÉTAPE 4 : Démarrer

```bash
# Option A (recommandé - avec imports)
docker-compose -f docker-compose-avec-import.yml up -d

# Option B (si tu as modifié le docker-compose.yml existant)
docker-compose up -d

# Vérifier le démarrage
docker-compose ps

# Voir les logs
docker-compose logs -f mysql
docker-compose logs -f keycloak
```

---

### ÉTAPE 5 : Vérifier que ça marche

```bash
# Vérifier MySQL
docker-compose exec mysql mysql -u nephro_user -p nephro_password nep -e "SHOW TABLES;"

# Vérifier Keycloak
# Ouvre : http://localhost:8080/admin
# Login : admin / admin
# Le realm 'kidneyCare-realm' doit être visible
```

---

## 📊 Structure finale attendue

```
pi/
├── init/
│   ├── mysql/
│   │   ├── nep_backup.sql          ← Ton export MySQL
│   │   └── 01-init.sh              ← Script auto (déjà créé)
│   ├── keycloak/
│   │   ├── kidneyCare-realm.json   ← Ton export Keycloak
│   │   └── import-realm.sh         ← Script auto (déjà créé)
├── docker-compose.yml
├── docker-compose-avec-import.yml  ← UTILISE CELUI-CI
└── ... autres fichiers ...
```

---

## 🎯 C'EST TOUT !

Le docker-compose gère automatiquement :
1. ✅ Création des conteneurs
2. ✅ Import de ta BD MySQL
3. ✅ Import de ton Realm Keycloak
4. ✅ Démarrage de tous les services

---

## ⚠️ IMPORTANT

Si tu as des erreurs :

### "File not found: nep_backup.sql"
```
→ Vérifie que le fichier est dans : init/mysql/nep_backup.sql
```

### "JSON not valid" pour le realm
```bash
→ Valide le JSON :
cat init/keycloak/kidneyCare-realm.json | jq .
```

### Les données n'ont pas été importées
```bash
→ Vérifie les logs :
docker-compose logs mysql
docker-compose logs keycloak
```

### Veux réimporter à 0
```bash
# Supprimer et recommencer
docker-compose down -v
docker-compose -f docker-compose-avec-import.yml up -d
```

---

## 📦 FICHIERS CRÉÉS POUR TOI

✅ `docker-compose-avec-import.yml` - Docker Compose avec imports automatiques
✅ `init/mysql/01-init.sh` - Script init MySQL
✅ `init/keycloak/import-realm.sh` - Script import Keycloak
✅ `scripts/export-data.sh` - Script d'export (optionnel)
✅ `IMPORT-BD-KEYCLOAK-GUIDE.md` - Documentation complète

---

## 🚀 COMMANDE FINALE

```bash
cd C:\Users\eyakh\Desktop\PI 2025_2026\pi

# 1. Exporter tes données
mysqldump -u root -p nep > init/mysql/nep_backup.sql
# + Télécharger kidneyCare-realm.json via l'interface Keycloak

# 2. Démarrer avec imports
docker-compose -f docker-compose-avec-import.yml up -d

# 3. Attendre ~30 secondes et vérifier
docker-compose ps
```

**C'est prêt ! 🎉**

---

Pour plus de détails : **IMPORT-BD-KEYCLOAK-GUIDE.md**

