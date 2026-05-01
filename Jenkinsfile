pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY = 'kidneycare-platform'
        SONAR_HOST_URL    = 'http://localhost:9000'
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.GIT_BRANCH} | Commit: ${env.GIT_COMMIT?.take(8)}"
            }
        }

        stage('Build') {
            parallel {
                stage('EurekaServer') {
                    steps { dir('EurekaServer') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('Gateway') {
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
                stage('Nutrition') {
                    steps { dir('Nutrition_Service/Nutrition_Service') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('Prescription') {
                    steps { dir('prescription-Service') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('Consultation') {
                    steps { dir('projetconsultation') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('VitalParams') {
                    steps { dir('projetparametrevital/projetparametrevital') { sh 'mvn clean package -DskipTests -B' } }
                }
                stage('Frontend') {
                    steps {
                        dir('mon-projet') {
                            sh 'npm ci --prefer-offline'
                            sh 'npm run build -- --configuration production'
                        }
                    }
                }
            }
        }

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

        stage('SonarQube Analysis') {
            parallel {
                stage('Sonar-EurekaServer') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('EurekaServer') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-eureka -Dsonar.projectName='KidneyCare - EurekaServer'"
                            }
                        }
                    }
                }
                stage('Sonar-Gateway') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('API') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-gateway -Dsonar.projectName='KidneyCare - Gateway'"
                            }
                        }
                    }
                }
                stage('Sonar-FoncGreffon') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('FoncGreffon') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-graft -Dsonar.projectName='KidneyCare - FoncGreffon'"
                            }
                        }
                    }
                }
                stage('Sonar-Infection') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('InfectionEtVaccination') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-infection -Dsonar.projectName='KidneyCare - Infection'"
                            }
                        }
                    }
                }
                stage('Sonar-NEPHRO') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('NEPHRO') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-nephro -Dsonar.projectName='KidneyCare - NEPHRO'"
                            }
                        }
                    }
                }
                stage('Sonar-Nutrition') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('Nutrition_Service/Nutrition_Service') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-nutrition -Dsonar.projectName='KidneyCare - Nutrition'"
                            }
                        }
                    }
                }
                stage('Sonar-Prescription') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('prescription-Service') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-prescription -Dsonar.projectName='KidneyCare - Prescription'"
                            }
                        }
                    }
                }
                stage('Sonar-Consultation') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('projetconsultation') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-consultation -Dsonar.projectName='KidneyCare - Consultation'"
                            }
                        }
                    }
                }
                stage('Sonar-VitalParams') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            dir('projetparametrevital/projetparametrevital') {
                                sh "mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-platform-vitalparams -Dsonar.projectName='KidneyCare - VitalParams'"
                            }
                        }
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
            echo "Pipeline termine - statut : ${currentBuild.currentResult}"
        }
        success {
            echo "Tous les services deployes avec succes !"
        }
        failure {
            echo "Pipeline echoue - consultez les logs ci-dessus."
        }
        cleanup {
            cleanWs()
        }
    }
}
