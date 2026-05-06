# Ouvre plusieurs terminaux ou lance une seule commande à la fois.
# Même ports qu’en docker-compose pour coller aux variables du frontend (localhost).
$ns = "kidneycare"
Write-Host @"
Lance chaque ligne dans un terminal séparé (ou en arrière-plan) :

kubectl -n $ns port-forward svc/keycloak   18080:8080
kubectl -n $ns port-forward svc/nephro     18089:8089
kubectl -n $ns port-forward svc/frontend   14200:80
kubectl -n $ns port-forward svc/grafana    3000:3000
kubectl -n $ns port-forward svc/prometheus 9090:9090
kubectl -n $ns port-forward svc/mailhog    18025:8025
"@
