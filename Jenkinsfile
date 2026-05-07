pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY    = 'kidneycare-platform'
        MAVEN_OPTS           = '-Xmx1024m -XX:MaxMetaspaceSize=512m -XX:+UseG1GC'
        DOCKER_BUILDKIT      = '1'
        MAVEN_VERIFY_EXTRA   = '-B -DforkedProcessTimeoutInSeconds=600 -DforkCount=1.5C -DreuseForks=true'
    }

    options {
        timeout(time: 90, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.GIT_BRANCH} | Commit: ${env.GIT_COMMIT?.take(8)}"
            }
        }

        stage('Build & Test — batch 1') {
            parallel {
                stage('EurekaServer') {
                    steps { dir('EurekaServer') { sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}" } }
                }
                stage('Gateway (API)') {
                    steps { dir('API') { sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}" } }
                }
            }
        }

        stage('Build & Test — batch 2') {
            parallel {
                stage('FoncGreffon') {
                    steps { dir('FoncGreffon') { sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}" } }
                }
                stage('InfectionEtVaccination') {
                    steps { dir('InfectionEtVaccination') { sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}" } }
                }
            }
        }

        stage('Build & Test — batch 3') {
            parallel {
                stage('NEPHRO') {
                    steps { dir('NEPHRO') { sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}" } }
                }
                stage('Nutrition_Service') {
                    steps { dir('Nutrition_Service/Nutrition_Service') { sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}" } }
                }
            }
        }

        stage('Build & Test — batch 4') {
            parallel {
                stage('prescription-Service') {
                    steps { dir('prescription-Service') { sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}" } }
                }
                stage('projetconsultation') {
                    steps { dir('projetconsultation') { sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}" } }
                }
            }
        }

        stage('Build & Test — batch 5') {
            steps {
                dir('projetparametrevital/projetparametrevital') {
                    sh "mvn verify ${env.MAVEN_VERIFY_EXTRA}"
                }
            }
        }

        stage('JUnit reports') {
            steps {
                junit allowEmptyResults: true, testResults: [
                    'EurekaServer/target/surefire-reports/*.xml',
                    'API/target/surefire-reports/*.xml',
                    'FoncGreffon/target/surefire-reports/*.xml',
                    'InfectionEtVaccination/target/surefire-reports/*.xml',
                    'NEPHRO/target/surefire-reports/*.xml',
                    'Nutrition_Service/Nutrition_Service/target/surefire-reports/*.xml',
                    'prescription-Service/target/surefire-reports/*.xml',
                    'projetconsultation/target/surefire-reports/*.xml',
                    'projetparametrevital/projetparametrevital/target/surefire-reports/*.xml'
                ].join(',')
            }
        }

        stage('SonarQube — wave 1') {
            parallel {
                stage('Sonar-EurekaServer') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('EurekaServer') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-eureka -Dsonar.projectName='KidneyCare - EurekaServer'"
                            }
                        }
                    }
                }
                stage('Sonar-Gateway') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('API') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-gateway -Dsonar.projectName='KidneyCare - Gateway'"
                            }
                        }
                    }
                }
                stage('Sonar-FoncGreffon') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('FoncGreffon') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-graft -Dsonar.projectName='KidneyCare - FoncGreffon'"
                            }
                        }
                    }
                }
            }
        }

        stage('Sonar-Infection') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('InfectionEtVaccination') {
                        sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-infection -Dsonar.projectName='KidneyCare - InfectionEtVaccination'"
                    }
                }
            }
        }

        stage('Sonar-NEPHRO') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('NEPHRO') {
                        sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-nephro -Dsonar.projectName='KidneyCare - NEPHRO'"
                    }
                }
            }
        }

        stage('Sonar-Nutrition') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('Nutrition_Service/Nutrition_Service') {
                        sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-nutrition -Dsonar.projectName='KidneyCare - Nutrition'"
                    }
                }
            }
        }

        stage('Sonar-Prescription') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('prescription-Service') {
                        sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-prescription -Dsonar.projectName='KidneyCare - Prescription'"
                    }
                }
            }
        }

        stage('Sonar-Consultation') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('projetconsultation') {
                        sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-consultation -Dsonar.projectName='KidneyCare - Consultation'"
                    }
                }
            }
        }

        stage('Sonar-VitalParams') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('projetparametrevital/projetparametrevital') {
                        sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-vitalparams -Dsonar.projectName='KidneyCare - VitalParams'"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker-compose build --parallel'
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'develop'
                }
            }
            steps {
                sh '''
                    cp .env.dev .env 2>/dev/null || true
                    docker-compose up -d --remove-orphans
                    docker-compose ps
                '''
            }
        }

        stage('Deploy K8s') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'develop'
                }
                environment name: 'DEPLOY_K8S', value: 'true'
            }
            steps {
                script {
                    echo "════════════════════════════════════════════"
                    echo "  ☸️  DÉPLOIEMENT KUBERNETES"
                    echo "════════════════════════════════════════════"
                    
                    try {
                        sh '''
                            # 1️⃣  VÉRIFICATION K8S
                            echo "✓ Vérification de kubectl..."
                            kubectl version --client --short || {
                                echo "❌ kubectl non disponible"
                                exit 1
                            }
                            
                            # 2️⃣  VÉRIFICATION DE LA CONNEXION
                            echo "✓ Vérification de la connexion K8s..."
                            kubectl cluster-info
                            
                            # 3️⃣  CRÉER/VÉRIFIER LE NAMESPACE
                            K8S_NAMESPACE="kidneycare"
                            echo "✓ Création/Vérification du namespace: $K8S_NAMESPACE"
                            kubectl create namespace $K8S_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
                            
                            # 4️⃣  AFFICHER LES NŒUDS
                            echo "✓ État des nœuds K8s:"
                            kubectl get nodes -o wide
                            
                            # 5️⃣  APPLICATION DES MANIFESTS
                            if [ -d "k8s" ]; then
                                echo "✓ Application des manifests K8s..."
                                
                                # Validation
                                for file in k8s/*.yaml; do
                                    if [ -f "$file" ]; then
                                        echo "  Vérification: $(basename $file)"
                                        kubectl apply -f "$file" --dry-run=client -o yaml > /dev/null || {
                                            echo "❌ Manifest invalide: $file"
                                            exit 1
                                        }
                                    fi
                                done
                                
                                # Application
                                kubectl apply -f k8s -n $K8S_NAMESPACE
                                echo "✅ Manifests appliqués"
                            else
                                echo "⚠️  Aucun dossier k8s/ trouvé, passage de l'étape"
                            fi
                            
                            # 6️⃣  ATTENDRE LES DÉPLOIEMENTS
                            echo "✓ Attente du rollout des déploiements..."
                            DEPLOYMENTS=$(kubectl get deployments -n $K8S_NAMESPACE -o jsonpath='{.items[*].metadata.name}')
                            
                            for deployment in $DEPLOYMENTS; do
                                echo "  ⏳ Attente: $deployment"
                                kubectl rollout status deployment/$deployment -n $K8S_NAMESPACE --timeout=5m || {
                                    echo "❌ Timeout pour $deployment"
                                    exit 1
                                }
                            done
                            
                            echo "✅ Tous les déploiements sont prêts"
                            
                            # 7️⃣  VÉRIFIER LES PODS
                            echo "✓ Vérification des pods..."
                            kubectl get pods -n $K8S_NAMESPACE -o wide
                            
                            # 8️⃣  VÉRIFIER LES SERVICES
                            echo "✓ Vérification des services..."
                            kubectl get services -n $K8S_NAMESPACE -o wide
                            
                            # 9️⃣  LOGS
                            echo "✓ Collecte des logs..."
                            PODS=$(kubectl get pods -n $K8S_NAMESPACE -o jsonpath='{.items[*].metadata.name}')
                            for pod in $PODS; do
                                echo "  📝 Logs de $pod (dernières 50 lignes):"
                                kubectl logs $pod -n $K8S_NAMESPACE --tail=50 2>/dev/null || echo "    (aucun log disponible)"
                            done
                            
                            echo "✅ DÉPLOIEMENT K8S RÉUSSI"
                        '''
                    } catch (Exception e) {
                        echo "❌ ERREUR K8s: ${e.message}"
                        error("Déploiement K8s échoué")
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline terminé — statut : ${currentBuild.currentResult}"
        }
        success {
            echo "Tous les services déployés avec succès !"
        }
        failure {
            echo "Pipeline échoué — consultez les logs ci-dessus."
        }
    }
}
