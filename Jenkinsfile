pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY    = ‘kidneycare-platform’
        MAVEN_OPTS           = ‘-Xmx512m -XX:MaxMetaspaceSize=256m’
        DOCKER_BUILDKIT      = ‘1’
        MAVEN_VERIFY_EXTRA   = ‘-B -DforkedProcessTimeoutInSeconds=900’
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
