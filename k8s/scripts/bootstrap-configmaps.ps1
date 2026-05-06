# Exécuter depuis la RACINE du dépôt :  .\k8s\scripts\bootstrap-configmaps.ps1
$ErrorActionPreference = "Stop"
$ns = "kidneycare"
$root = (Get-Location).Path

kubectl apply -f (Join-Path $root "k8s\namespace.yaml")

Write-Host "ConfigMap mysql-init-sql (init DB)..."
kubectl -n $ns create configmap mysql-init-sql `
  --from-file="nep.sql=$(Join-Path $root 'nep.sql')" `
  --dry-run=client -o yaml | kubectl apply -f -

Write-Host "ConfigMap keycloak-realm..."
kubectl -n $ns create configmap keycloak-realm `
  --from-file="realm.json=$(Join-Path $root 'realm-export.json')" `
  --dry-run=client -o yaml | kubectl apply -f -

Write-Host "ConfigMap nephro-lab-agent (optionnel)..."
$agent = Join-Path $root "agent_analyse_labo.py"
if (Test-Path $agent) {
  kubectl -n $ns create configmap nephro-lab-agent `
    --from-file="agent_analyse_labo.py=$agent" `
    --dry-run=client -o yaml | kubectl apply -f -
} else {
  Write-Host "agent_analyse_labo.py introuvable à la racine — ignoré."
}

Write-Host "Terminé. Ensuite : .\k8s\scripts\build-images-minikube.ps1 puis kubectl apply -k k8s/"
