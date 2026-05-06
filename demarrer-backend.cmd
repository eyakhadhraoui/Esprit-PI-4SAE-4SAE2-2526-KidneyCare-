@echo off
echo ========================================
echo   Demarrage du backend DossierMedicale (port 8089)
echo ========================================
echo.
echo Assurez-vous que MySQL est demarre.
echo.
cd /d "%~dp0DossierMedicale"
if not exist mvnw.cmd (
    echo Erreur: mvnw.cmd introuvable dans DossierMedicale
    pause
    exit /b 1
)
call mvnw.cmd spring-boot:run
pause
