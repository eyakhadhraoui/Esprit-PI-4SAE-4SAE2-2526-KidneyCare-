# Exécuter depuis la RACINE du dépôt. Prérequis : JAR présents (mvn package) pour les modules Java.
# Exemples :
#   .\k8s\scripts\build-images-minikube.ps1                    # tout
#   .\k8s\scripts\build-images-minikube.ps1 -Service greffe     # uniquement greffe (FoncGreffon)
param(
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
Set-Location $root

$images = @{
    "eureka"                 = @{ Context = "demo";                                  Tag = "kidneycare/eureka:latest" }
    "api-gateway"            = @{ Context = "TestBilan";                             Tag = "kidneycare/api-gateway:latest" }
    "nephro"                 = @{ Context = "DossierMedicale";                       Tag = "kidneycare/nephro:latest" }
    "consultation"           = @{ Context = "projetconsultation";                    Tag = "kidneycare/consultation:latest" }
    "parametrevital"         = @{ Context = "projetparametrevital/projetparametrevital"; Tag = "kidneycare/parametrevital:latest" }
    "infection-vaccination"  = @{ Context = "InfectionEtVaccination";                 Tag = "kidneycare/infection-vaccination:latest" }
    "nutrition"              = @{ Context = "Nutrition_Service/Nutrition_Service";   Tag = "kidneycare/nutrition:latest" }
    "prescription"           = @{ Context = "prescription-Service";                  Tag = "kidneycare/prescription:latest" }
    "greffe"                 = @{ Context = "FoncGreffon";                           Tag = "kidneycare/greffe:latest" }
    "frontend"               = @{ Context = "mon-projet";                            Tag = "kidneycare/frontend:latest" }
}

Write-Host "Connexion au Docker Minikube..."
minikube -p minikube docker-env --shell powershell | Invoke-Expression

function Build-App {
    param([string]$ctx, [string]$tag)
    Write-Host "docker build -t $tag $ctx"
    docker build -t $tag $ctx
}

if ($Service -ne "") {
    if (-not $images.ContainsKey($Service)) {
        throw "Service inconnu: '$Service'. Valeurs: $($images.Keys -join ', ')"
    }
    $i = $images[$Service]
    Build-App $i.Context $i.Tag
    Write-Host "Image $($i.Tag) construite. Redémarrer le déploiement : kubectl rollout restart deployment/$Service -n kidneycare"
    exit 0
}

foreach ($name in $images.Keys) {
    $i = $images[$name]
    Build-App $i.Context $i.Tag
}

Write-Host "Toutes les images construites. Déploiement : kubectl apply -k k8s/"
