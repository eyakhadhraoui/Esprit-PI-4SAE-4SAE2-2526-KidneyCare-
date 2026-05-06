pipeline {
    agent any
    tools {
        maven 'M2_HOME'
    }
    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Clone Repository') {
            steps {
                git branch: 'DEVOPS1',
                    url: 'https://github.com/eyakhadhraoui/Esprit-PI-4SAE-4SAE2-2526-KidneyCare-.git'
            }
        }

        stage('Build All Services') {
            steps {
                script {
                    def serviceModules = [
                        'demo',
                        'demo1',
                        'NEPHRO',
                        'InfectionEtVaccination',
                        'projetconsultation',
                        'prescription-Service',
                        'projetparametrevital/projetparametrevital',
                        'Nutrition_Service/Nutrition_Service',
                        'FoncGreffon',
                        'wetransfer_api_2026-03-24_1825/API'
                    ]
                    serviceModules.each { module ->
                        dir(module) {
                            sh 'mvn clean install -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    def testModules = ['NEPHRO']
                    testModules.each { module ->
                        dir(module) {
                            sh 'mvn test'
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def serviceModules = [
                            'demo',
                            'demo1',
                            'NEPHRO',
                            'projetconsultation',
                            'InfectionEtVaccination',
                            'projetparametrevital/projetparametrevital',
                            'Nutrition_Service/Nutrition_Service',
                            'FoncGreffon',
                            'prescription-Service',
                            'wetransfer_api_2026-03-24_1825/API'
                        ]
                        serviceModules.each { module ->
                            dir(module) {
                                sh 'mvn sonar:sonar'
                            }
                        }
                    }
                }
            }
        }

        stage('Package JAR') {
            steps {
                script {
                    def serviceModules = [
                        'demo',
                        'demo1',
                        'NEPHRO',
                        'projetconsultation',
                        'InfectionEtVaccination',
                        'projetparametrevital/projetparametrevital',
                        'Nutrition_Service/Nutrition_Service',
                        'FoncGreffon',
                        'wetransfer_api_2026-03-24_1825/API',
                        'prescription-Service'
                    ]
                    serviceModules.each { module ->
                        dir(module) {
                            sh 'mvn package -DskipTests'
                        }
                    }
                }
            }
        }

        // ─── DOCKER COMPOSE ───────────────────────────────────────────────────
        // --build : force le rebuild des images avec les nouveaux JARs Maven
        stage('Docker Compose Restart') {
            steps {
                sh '''
                    docker-compose up -d --build
                '''
            }
        }

        stage('Configure Prometheus') {
            steps {
                sh '''
                    echo "=== Attente démarrage Prometheus ==="
                    sleep 10
        
                    echo "=== Copie prometheus.yml dans le conteneur ==="
                    docker cp /var/jenkins_home/workspace/KidneyCare-CICD/prometheus.yml prometheus:/etc/prometheus/prometheus.yml
        
                    echo "=== Rechargement de la config Prometheus ==="
                    docker restart prometheus
        
                    echo "=== Vérification ==="
                    sleep 5
                    docker exec prometheus cat /etc/prometheus/prometheus.yml
                    docker logs prometheus --tail=10
                '''
            }
        }
   

        // ─── KUBERNETES ───────────────────────────────────────────────────────

        // Ordre : valider les YAML → vérifier l’accès cluster (ConfigMaps) → builds longs → apply → état.
        stage('Kubernetes — Valider manifests') {
            steps {
                sh '''
                    set -e
                    echo "=== Kustomize k8s/ ==="
                    kubectl kustomize k8s > kidneycare-k8s-rendered.yaml
                    test -s kidneycare-k8s-rendered.yaml
                    wc -l kidneycare-k8s-rendered.yaml
                    echo "=== dry-run client ==="
                    kubectl kustomize k8s | kubectl apply --dry-run=client -f -
                '''
            }
        }

        stage('Kubernetes — ConfigMaps') {
            steps {
                withCredentials([file(credentialsId: 'kidneycare-kubeconfig', variable: 'KUBECONFIG')]) {
                    sh '''
                        set -e
                        kubectl apply -f k8s/namespace.yaml

                        kubectl -n kidneycare create configmap mysql-init-sql \
                          --from-file=nep.sql=nep.sql \
                          --dry-run=client -o yaml | kubectl apply -f -

                        kubectl -n kidneycare create configmap keycloak-realm \
                          --from-file=realm.json=realm-export.json \
                          --dry-run=client -o yaml | kubectl apply -f -

                        if [ -f agent_analyse_labo.py ]; then
                          kubectl -n kidneycare create configmap nephro-lab-agent \
                            --from-file=agent_analyse_labo.py=agent_analyse_labo.py \
                            --dry-run=client -o yaml | kubectl apply -f -
                        fi
                    '''
                }
            }
        }

        // eval minikube docker-env : images visibles par le nœud Minikube sans registry (agent doit avoir minikube).
        stage('Kubernetes — Build images (Docker Minikube)') {
            steps {
                sh '''
                    set -e
                    echo "=== Docker Minikube (eval minikube docker-env) ==="
                    eval "$(minikube -p minikube docker-env)"

                    docker build -t kidneycare/eureka:latest                demo
                    docker build -t kidneycare/api-gateway:latest            demo1
                    docker build -t kidneycare/nephro:latest                 NEPHRO
                    docker build -t kidneycare/consultation:latest           projetconsultation
                    docker build -t kidneycare/parametrevital:latest         projetparametrevital/projetparametrevital
                    docker build -t kidneycare/infection-vaccination:latest  InfectionEtVaccination
                    docker build -t kidneycare/nutrition:latest              Nutrition_Service/Nutrition_Service
                    docker build -t kidneycare/prescription:latest           prescription-Service
                    docker build -t kidneycare/greffe:latest                 FoncGreffon
                    docker build -t kidneycare/frontend:latest               mon-projet
                '''
            }
        }

        stage('Kubernetes — Deploy') {
            steps {
                withCredentials([file(credentialsId: 'kidneycare-kubeconfig', variable: 'KUBECONFIG')]) {
                    sh '''
                        set -e
                        kubectl apply -k k8s/
                    '''
                }
            }
        }

        stage('Kubernetes — Etat des pods') {
            steps {
                withCredentials([file(credentialsId: 'kidneycare-kubeconfig', variable: 'KUBECONFIG')]) {
                    sh 'kubectl get pods -n kidneycare -o wide'
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline terminée avec succès.'
        }
        failure {
            echo '❌ Pipeline échouée — vérifier les logs ci-dessus.'
        }
    }
}
