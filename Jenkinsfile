pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY = 'kidneycare-platform'
        SONAR_HOST_URL    = "${env.SONAR_HOST_URL ?: 'http://sonarqube:9000'}"
        JAVA_SERVICES = 'API EurekaServer FoncGreffon InfectionEtVaccination NEPHRO prescription-Service projetconsultation'
        JAVA_NESTED   = 'Nutrition_Service/Nutrition_Service projetparametrevital/projetparametrevital'
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // ── 1. CHECKOUT ────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.GIT_BRANCH}  |  Commit: ${env.GIT_COMMIT?.take(8)}"
            }
        }

        // ── 2. BUILD ───────────────────────────────────────────────────────
        stage('Build') {
            parallel {

                stage('EurekaServer') {
                    steps { dir('EurekaServer') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('Gateway (API)') {
                    steps { dir('API') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('FoncGreffon') {
                    steps { dir('FoncGreffon') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('InfectionEtVaccination') {
                    steps { dir('InfectionEtVaccination') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('NEPHRO') {
                    steps { dir('NEPHRO') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('Nutrition_Service') {
                    steps { dir('Nutrition_Service/Nutrition_Service') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('prescription-Service') {
                    steps { dir('prescription-Service') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('projetconsultation') {
                    steps { dir('projetconsultation') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('projetparametrevital') {
                    steps { dir('projetparametrevital/projetparametrevital') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('Frontend (Angular)') {
                    steps {
                        dir('mon-projet') {
                            sh 'npm ci --prefer-offline'
                            sh 'npm run build -- --configuration production'
                        }
                    }
                }
            }
        }

        // ── 3. TESTS ───────────────────────────────────────────────────────
        stage('Tests') {
            parallel {

                stage('Test EurekaServer') {
                    steps { dir('EurekaServer') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'EurekaServer/target/surefire-reports/*.xml' } }
                }
                stage('Test Gateway') {
                    steps { dir('API') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'API/target/surefire-reports/*.xml' } }
                }
                stage('Test FoncGreffon') {
                    steps { dir('FoncGreffon') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'FoncGreffon/target/surefire-reports/*.xml' } }
                }
                stage('Test InfectionEtVaccination') {
                    steps { dir('InfectionEtVaccination') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'InfectionEtVaccination/target/surefire-reports/*.xml' } }
                }
                stage('Test NEPHRO') {
                    steps { dir('NEPHRO') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'NEPHRO/target/surefire-reports/*.xml' } }
                }
                stage('Test Nutrition') {
                    steps { dir('Nutrition_Service/Nutrition_Service') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'Nutrition_Service/Nutrition_Service/target/surefire-reports/*.xml' } }
                }
                stage('Test Prescription') {
                    steps { dir('prescription-Service') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'prescription-Service/target/surefire-reports/*.xml' } }
                }
                stage('Test Consultation') {
                    steps { dir('projetconsultation') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'projetconsultation/target/surefire-reports/*.xml' } }
                }
                stage('Test VitalParams') {
                    steps { dir('projetparametrevital/projetparametrevital') { sh 'mvn test -B' } }
                    post { always { junit allowEmptyResults: true, testResults: 'projetparametrevital/projetparametrevital/target/surefire-reports/*.xml' } }
                }
            }
        }

        // ── 4. SONARQUBE ───────────────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    parallel(
                        'Sonar-EurekaServer': {
                            dir('EurekaServer') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-eureka \
                                        -Dsonar.projectName='KidneyCare - EurekaServer'
                                """
                            }
                        },
                        'Sonar-Gateway': {
                            dir('API') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-gateway \
                                        -Dsonar.projectName='KidneyCare - Gateway'
                                """
                            }
                        },
                        'Sonar-FoncGreffon': {
                            dir('FoncGreffon') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-graft \
                                        -Dsonar.projectName='KidneyCare - FoncGreffon'
                                """
                            }
                        },
                        'Sonar-Infection': {
                            dir('InfectionEtVaccination') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-infection \
                                        -Dsonar.projectName='KidneyCare - InfectionEtVaccination'
                                """
                            }
                        },
                        'Sonar-NEPHRO': {
                            dir('NEPHRO') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-nephro \
                                        -Dsonar.projectName='KidneyCare - NEPHRO'
                                """
                            }
                        },
                        'Sonar-Nutrition': {
                            dir('Nutrition_Service/Nutrition_Service') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-nutrition \
                                        -Dsonar.projectName='KidneyCare - Nutrition'
                                """
                            }
                        },
                        'Sonar-Prescription': {
                            dir('prescription-Service') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-prescription \
                                        -Dsonar.projectName='KidneyCare - Prescription'
                                """
                            }
                        },
                        'Sonar-Consultation': {
                            dir('projetconsultation') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-consultation \
                                        -Dsonar.projectName='KidneyCare - Consultation'
                                """
                            }
                        },
                        'Sonar-VitalParams': {
                            dir('projetparametrevital/projetparametrevital') {
                                sh """
                                    mvn sonar:sonar -B \
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY}-vitalparams \
                                        -Dsonar.projectName='KidneyCare - VitalParams'
                                """
                            }
                        }
                    )
                }
            }
        }

        // ── 5. QUALITY GATE ────────────────────────────────────────────────
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ── 6. BUILD DOCKER IMAGES ─────────────────────────────────────────
        stage('Build Docker Images') {
            steps {
                sh 'docker-compose build --parallel'
            }
        }

        // ── 7. DEPLOY ──────────────────────────────────────────────────────
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
        cleanup {
            cleanWs()
        }
    }
}
