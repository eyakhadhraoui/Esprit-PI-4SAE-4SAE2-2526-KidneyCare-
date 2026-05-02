pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY = 'kidneycare-platform'
        SONAR_HOST_URL    = 'http://localhost:9000'
        MAVEN_OPTS        = '-Xmx512m -XX:MaxMetaspaceSize=256m'
    }

    options {
        timeout(time: 120, unit: 'MINUTES')
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
            }
        }

        stage('Tests') {
            steps {
                sh 'cd EurekaServer && mvn test -B || true'
                sh 'cd API && mvn test -B || true'
                sh 'cd FoncGreffon && mvn test -B || true'
                sh 'cd InfectionEtVaccination && mvn test -B || true'
                sh 'cd NEPHRO && mvn test -B || true'
                sh 'cd Nutrition_Service/Nutrition_Service && mvn test -B || true'
                sh 'cd prescription-Service && mvn test -B || true'
                sh 'cd projetconsultation && mvn test -B || true'
                sh 'cd projetparametrevital/projetparametrevital && mvn test -B || true'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
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