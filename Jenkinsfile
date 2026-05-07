pipeline {
    agent any
    // Node : plugin « NodeJS » + installation nommée exactement « NodeJS » (Manage Jenkins → Global Tool Configuration).
    // Si votre installation a un autre nom, remplacez « NodeJS » ci-dessous par ce libellé.
    tools {
        maven 'M2_HOME'
        nodejs 'NodeJS'
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
                        'TestBilan',
                        'DossierMedicale',
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

        stage('Tests unitaires - demo') {
            steps {
                dir('demo') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - TestBilan') {
            steps {
                dir('TestBilan') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - DossierMedicale') {
            steps {
                dir('DossierMedicale') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - InfectionEtVaccination') {
            steps {
                dir('InfectionEtVaccination') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - projetconsultation') {
            steps {
                dir('projetconsultation') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - projetparametrevital') {
            steps {
                dir('projetparametrevital/projetparametrevital') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - Nutrition_Service') {
            steps {
                dir('Nutrition_Service/Nutrition_Service') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - FoncGreffon') {
            steps {
                dir('FoncGreffon') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - prescription-Service') {
            steps {
                dir('prescription-Service') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }
        stage('Tests unitaires - API Gateway') {
            steps {
                dir('wetransfer_api_2026-03-24_1825/API') { sh 'mvn -B test -DfailIfNoTests=false' }
            }
        }

        // Binaires Node récents : libatomic.so.1 (paquet libatomic1 sur Debian/Ubuntu)
        stage('Préparation Node — libatomic (Linux)') {
            steps {
                sh 'bash scripts/jenkins-ensure-node-libatomic.sh'
            }
        }

        // ─── SONARQUBE + NOTIFICATION EMAIL ──────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def serviceModules = [
                            'demo',
                            'TestBilan',
                            'DossierMedicale',
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
                        // Frontend Angular / TS (sonar-project.properties + sonarqube-scanner)
                        sh 'bash scripts/jenkins-ensure-node-libatomic.sh'
                        dir('mon-projet') {
                            sh 'npm ci'
                            sh 'npm run sonar'
                        }
                    }
                }
            }
            // ── Notifications email SonarQube ──────────────────────────────
            post {
                success {
                    mail to: 'eyakhadhraoui28@gmail.com',
                         subject: "✅ SonarQube PASSED — ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                         body: """\
Bonjour,

L'analyse SonarQube s'est terminée avec succès.

• Job       : ${env.JOB_NAME}
• Build     : #${env.BUILD_NUMBER}
• Branche   : ${env.GIT_BRANCH ?: 'DEVOPS1'}
• Résultat  : SUCCESS
• Tableau   : ${env.BUILD_URL}

Cordialement,
Jenkins CI — KidneyCare Pipeline
"""
                }
                failure {
                    mail to: 'eyakhadhraoui28@gmail.com',
                         subject: "❌ SonarQube FAILED — ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                         body: """\
Bonjour,

L'analyse SonarQube a échoué.

• Job       : ${env.JOB_NAME}
• Build     : #${env.BUILD_NUMBER}
• Branche   : ${env.GIT_BRANCH ?: 'DEVOPS1'}
• Résultat  : FAILURE
• Logs      : ${env.BUILD_URL}console

Merci de vérifier les logs Jenkins pour identifier le problème.

Cordialement,
Jenkins CI — KidneyCare Pipeline
"""
                }
            }
        }

        stage('Package JAR') {
            steps {
                script {
                    def serviceModules = [
                        'demo',
                        'TestBilan',
                        'DossierMedicale',
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

        // Build Angular sur l'agent (réseau Jenkins) — l'image Docker ne fait plus npm ci (évite ECONNRESET dans le daemon).
        stage('Build frontend (Docker)') {
            steps {
                sh 'bash scripts/jenkins-ensure-node-libatomic.sh'
                dir('mon-projet') {
                    sh 'npm ci'
                    sh 'npm run build -- --configuration production'
                }
            }
        }

        // ─── DOCKER COMPOSE ───────────────────────────────────────────────────
        stage('Docker Compose Restart') {
            steps {
                timeout(time: 30, unit: 'MINUTES') {
                    script {
                        def hasDocker = sh(script: 'command -v docker >/dev/null 2>&1', returnStatus: true) == 0
                        if (!hasDocker) {
                            def require = env.REQUIRE_DOCKER_COMPOSE?.toString()?.equalsIgnoreCase('true')
                            echo '⚠️ Docker est absent sur cet agent : étape « Docker Compose Restart » ignorée.'
                            echo 'Pour l\'exécuter : utiliser un agent avec Docker (+ plugin compose v2 ou binaire docker-compose), ou un label du type « docker ».'
                            if (require) {
                                error('REQUIRE_DOCKER_COMPOSE=true mais docker introuvable dans le PATH.')
                            }
                            return
                        }
                        sh '''
                            set -e
                            docker version

                            if docker compose version >/dev/null 2>&1; then
                              COMPOSE_CMD="docker compose"
                            elif docker-compose version >/dev/null 2>&1; then
                              COMPOSE_CMD="docker-compose"
                            else
                              echo "ERROR: Docker Compose is not installed on this Jenkins agent."
                              exit 1
                            fi

                            echo "Using compose command: ${COMPOSE_CMD}"
                            ${COMPOSE_CMD} version

                            export DOCKER_BUILDKIT=1
                            export COMPOSE_DOCKER_CLI_BUILD=1
                            export BUILDKIT_PROGRESS=plain

                            echo ">>> compose config"
                            ${COMPOSE_CMD} config >/dev/null

                            echo ">>> compose down"
                            ${COMPOSE_CMD} down --remove-orphans || true

                            echo ">>> compose build"
                            ${COMPOSE_CMD} build --parallel

                            echo ">>> compose up"
                            ${COMPOSE_CMD} up -d --remove-orphans

                            echo ">>> compose ps"
                            ${COMPOSE_CMD} ps
                        '''
                    }
                }
            }
            post {
                failure {
                    sh '''
                        set +e
                        if docker compose version >/dev/null 2>&1; then
                          docker compose ps -a
                          docker compose logs --tail=150
                        elif docker-compose version >/dev/null 2>&1; then
                          docker-compose ps -a
                          docker-compose logs --tail=150
                        fi
                    '''
                }
            }
        }

        // ─── KUBERNETES ───────────────────────────────────────────────────────

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

        stage('Kubernetes — Build images (Docker Minikube)') {
            steps {
                sh '''
                    set -e
                    echo "=== Docker Minikube (eval minikube docker-env) ==="
                    eval "$(minikube -p minikube docker-env)"

                    docker build -t kidneycare/eureka:latest                demo
                    docker build -t kidneycare/api-gateway:latest            TestBilan
                    docker build -t kidneycare/nephro:latest                 DossierMedicale
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
        always {
            junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
        }
        success {
            echo '✅ Pipeline terminée avec succès.'
        }
        failure {
            echo '❌ Pipeline échouée — vérifier les logs ci-dessus.'
        }
    }
}
