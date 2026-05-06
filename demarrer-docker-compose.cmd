@echo off
REM Script de démarrage du système KidneyCare complet avec Docker Compose

setlocal enabledelayedexpansion

echo.
echo ====================================
echo   KidneyCare - Docker Compose Setup
echo ====================================
echo.

REM Vérifier si Docker est installé
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas installé ou non accessible.
    echo Veuillez installer Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker trouvé

REM Vérifier si Docker Compose est installé
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker Compose n'est pas installé.
    echo Veuillez installer Docker Compose: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo [OK] Docker Compose trouvé
echo.

REM Menu de sélection
echo Sélectionnez une option:
echo.
echo 1. Démarrer tous les services (docker-compose up -d)
echo 2. Afficher le statut des services (docker-compose ps)
echo 3. Afficher les logs en direct (docker-compose logs -f)
echo 4. Arrêter tous les services (docker-compose down)
echo 5. Arrêter et supprimer les volumes (docker-compose down -v)
echo 6. Redémarrer les services (docker-compose restart)
echo 7. Builder les images (docker-compose build)
echo 8. Quitter
echo.

set /p choice="Votre choix (1-8): "

if "%choice%"=="1" (
    echo.
    echo [INFO] Démarrage de tous les services...
    echo.
    docker-compose up -d
    echo.
    echo [OK] Services démarrés!
    echo.
    echo Attente du démarrage des services... (30 secondes)
    timeout /t 30 /nobreak
    echo.
    docker-compose ps
    echo.
    echo [INFO] Accédez aux applications:
    echo   - Frontend: http://localhost
    echo   - Keycloak: http://localhost:8080/admin (admin / admin)
    echo   - MailHog: http://localhost:8025
    echo   - Eureka: http://localhost:8761
    echo   - NEPHRO: http://localhost:8089
    echo.
    pause
) else if "%choice%"=="2" (
    echo.
    docker-compose ps
    echo.
    pause
) else if "%choice%"=="3" (
    echo.
    echo [INFO] Affichage des logs (Appuyez sur Ctrl+C pour quitter)...
    echo.
    docker-compose logs -f
) else if "%choice%"=="4" (
    echo.
    echo [ATTENTION] Arrêt de tous les services...
    echo.
    docker-compose down
    echo.
    echo [OK] Services arrêtés!
    echo.
    pause
) else if "%choice%"=="5" (
    echo.
    echo [ATTENTION] Arrêt et suppression des volumes (DONNÉES PERDUES!)...
    set /p confirm="Êtes-vous sûr? (o/n): "
    if /i "%confirm%"=="o" (
        docker-compose down -v
        echo [OK] Services arrêtés et volumes supprimés!
    ) else (
        echo Annulé.
    )
    echo.
    pause
) else if "%choice%"=="6" (
    echo.
    echo [INFO] Redémarrage des services...
    echo.
    docker-compose restart
    echo.
    echo [OK] Services redémarrés!
    echo.
    pause
) else if "%choice%"=="7" (
    echo.
    echo [INFO] Building des images Docker...
    echo.
    docker-compose build --no-cache
    echo.
    echo [OK] Images buildées!
    echo.
    pause
) else if "%choice%"=="8" (
    echo Au revoir!
    exit /b 0
) else (
    echo [ERREUR] Choix invalide!
    pause
    goto :start
)

goto :end

:end
endlocal

