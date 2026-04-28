pipeline {
    agent any

    tools {
        maven 'M2_HOME'
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_NAME = 'kidneycare-nephro'
        IMAGE_TAG  = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Clone — Dossiersmedicale') {
            steps {
                git branch: 'Dossiersmedicale',
                    url: 'https://github.com/eyakhadhraoui/Esprit-PI-4SAE-4SAE2-2526-KidneyCare-.git'
            }
        }

        stage('Build') {
            steps {
                // pom.xml est a la RACINE de la branche (pas dans un sous-dossier)
                sh 'mvn clean package -DskipTests -B'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'mvn test -B'
            }
            post {
                always {
                    junit testResults: 'target/surefire-reports/*.xml',
                          allowEmptyResults: true
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-nephro'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag  ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:${IMAGE_TAG} \
                                ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest"
            }
        }

        stage('Push Docker Hub') {
            steps {
                sh 'echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin'
                sh "docker push ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${DOCKERHUB_CREDENTIALS_USR}/${IMAGE_NAME}:latest"
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} — NEPHRO deploye avec succes."
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} — Echec. Consultez les logs."
        }
        always {
            sh 'docker logout || true'
            cleanWs()
        }
    }
}
