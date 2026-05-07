Write-Host "=============================="
Write-Host " KUBERNETES PIPELINE CHECK"
Write-Host "=============================="

Write-Host "`n[1] Cluster info"
kubectl cluster-info

Write-Host "`n[2] Nodes"
kubectl get nodes -o wide

Write-Host "`n[3] Deployments"
kubectl get deployments

Write-Host "`n[4] Pods"
kubectl get pods -o wide

Write-Host "`n[5] Services"
kubectl get services

Write-Host "`n[6] Events recents"
kubectl get events --sort-by=.metadata.creationTimestamp

Write-Host "`n[7] Verification du deployment job"

$deployment = kubectl get deployment job --ignore-not-found

if ($deployment) {
    Write-Host "Deployment job existe."

    Write-Host "`n[8] Attente que le pod soit Ready"
    kubectl rollout status deployment/job --timeout=180s

    Write-Host "`n[9] Pods apres rollout"
    kubectl get pods -o wide

    Write-Host "`n[10] Description du pod job"
    kubectl describe pod -l app=job

    Write-Host "`n[11] Logs du pod job"
    kubectl logs -l app=job --tail=100
}
else {
    Write-Host "Deployment job n'existe pas. Creation..."
    kubectl create deployment job --image=loujainrouached/job:1.02

    Write-Host "`nAttente du demarrage..."
    kubectl rollout status deployment/job --timeout=180s

    Write-Host "`nPods:"
    kubectl get pods -o wide

    Write-Host "`nDetails:"
    kubectl describe pod -l app=job
}

Write-Host "`n=============================="
Write-Host " FIN DU PIPELINE"
Write-Host "=============================="