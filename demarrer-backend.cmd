@echo off
echo ========================================
echo   Demarrage du backend NEPHRO (port 8089)
echo ========================================
echo.
echo Assurez-vous que MySQL est demarre.
echo.
cd /d "%~dp0NEPHRO"
if not exist mvnw.cmd (
    echo Erreur: mvnw.cmd introuvable dans NEPHRO
    pause
    exit /b 1
)
call mvnw.cmd spring-boot:run
pause
