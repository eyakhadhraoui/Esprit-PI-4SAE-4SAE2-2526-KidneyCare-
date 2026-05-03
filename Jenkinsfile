pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY = 'kidneycare-platform'
        SONAR_HOST_URL    = "${env.SONAR_HOST_URL ?: 'http://localhost:9000'}"
        /* JVM: évite de lancer 9+ JVM Maven géantes en parallèle (réduit le swap / le temps réel) */
        MAVEN_OPTS        = '-Xmx512m -XX:MaxMetaspaceSize=256m'
        DOCKER_BUILDKIT   = '1'
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

        /*
         * Un seul passage Maven par service : compile + tests + package (évite l’ancien enchaînement
         * clean package -DskipTests puis mvn test, qui doublait quasiment le travail).
         */
        stage('Build & Test — batch 1') {
            parallel {
                stage('EurekaServer') {
                    steps { dir('EurekaServer') { sh 'mvn verify -B' } }
                }
                stage('Gateway (API)') {
                    steps { dir('API') { sh 'mvn verify -B' } }
                }
                stage('FoncGreffon') {
                    steps { dir('FoncGreffon') { sh 'mvn verify -B' } }
                }
                stage('InfectionEtVaccination') {
                    steps { dir('InfectionEtVaccination') { sh 'mvn verify -B' } }
                }
                stage('NEPHRO') {
                    steps { dir('NEPHRO') { sh 'mvn verify -B' } }
                }
            }
        }

        stage('Build & Test — batch 2') {
            parallel {
                stage('Nutrition_Service') {
                    steps { dir('Nutrition_Service/Nutrition_Service') { sh 'mvn verify -B' } }
                }
                stage('prescription-Service') {
                    steps { dir('prescription-Service') { sh 'mvn verify -B' } }
                }
                stage('projetconsultation') {
                    steps { dir('projetconsultation') { sh 'mvn verify -B' } }
                }
                stage('projetparametrevital') {
                    steps { dir('projetparametrevital/projetparametrevital') { sh 'mvn verify -B' } }
                }
            }
        }

        stage('JUnit reports') {
            steps {
                junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
            }
        }

        /*
         * Sonar : 3 analyses en parallèle max par vague (au lieu de 9) pour ne pas saturer CPU / Sonar.
         */
        stage('SonarQube — wave 1') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    parallel(
                        'Sonar-EurekaServer': {
                            dir('EurekaServer') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-eureka -Dsonar.projectName='KidneyCare - EurekaServer'"
                            }
                        },
                        'Sonar-Gateway': {
                            dir('API') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-gateway -Dsonar.projectName='KidneyCare - Gateway'"
                            }
                        },
                        'Sonar-FoncGreffon': {
                            dir('FoncGreffon') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-graft -Dsonar.projectName='KidneyCare - FoncGreffon'"
                            }
                        }
                    )
                }
            }
        }

        stage('SonarQube — wave 2') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    parallel(
                        'Sonar-Infection': {
                            dir('InfectionEtVaccination') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-infection -Dsonar.projectName='KidneyCare - InfectionEtVaccination'"
                            }
                        },
                        'Sonar-NEPHRO': {
                            dir('NEPHRO') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-nephro -Dsonar.projectName='KidneyCare - NEPHRO'"
                            }
                        },
                        'Sonar-Nutrition': {
                            dir('Nutrition_Service/Nutrition_Service') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-nutrition -Dsonar.projectName='KidneyCare - Nutrition'"
                            }
                        }
                    )
                }
            }
        }

        stage('SonarQube — wave 3') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    parallel(
                        'Sonar-Prescription': {
                            dir('prescription-Service') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-prescription -Dsonar.projectName='KidneyCare - Prescription'"
                            }
                        },
                        'Sonar-Consultation': {
                            dir('projetconsultation') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-consultation -Dsonar.projectName='KidneyCare - Consultation'"
                            }
                        },
                        'Sonar-VitalParams': {
                            dir('projetparametrevital/projetparametrevital') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=${SONAR_PROJECT_KEY}-vitalparams -Dsonar.projectName='KidneyCare - VitalParams'"
                            }
                        }
                    )
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
        /* Ne pas effacer le workspace à chaque build : le dépôt .m2 sur l’agent + sources réutilisées accélèrent fortement les builds suivants. */
    }
}
