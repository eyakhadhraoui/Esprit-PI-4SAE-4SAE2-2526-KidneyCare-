pipeline {
    agent any

    tools {
        maven 'M2_HOME'
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USER        = "${DOCKERHUB_CREDENTIALS_USR}"
        IMAGE_TAG             = "${env.BUILD_NUMBER}"
        IMAGE_NAME            = 'kidneycare-nephro'
        GIT_REPO_URL          = 'https://github.com/eyakhadhraoui/Esprit-PI-4SAE-4SAE2-2526-KidneyCare-.git'
    }

    stages {

        stage('Clean Workspace') {
            steps { cleanWs() }
        }

        stage('Clone — Dossiersmedicale') {
            steps {
                git branch: 'Dossiersmedicale',
                    url: "${GIT_REPO_URL}"
            }
        }

        stage('Build') {
            steps {
                dir('NEPHRO') {
                    sh 'mvn clean package -DskipTests -B'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                dir('NEPHRO') { sh 'mvn test -B' }
            }
            post {
                always {
                    junit testResults: 'NEPHRO/target/surefire-reports/*.xml',
                          allowEmptyResults: true
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('NEPHRO') {
                        sh 'mvn sonar:sonar -B -Dsonar.projectKey=kidneycare-nephro -Dsonar.projectName="KidneyCare - NEPHRO"'
                    }
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
                dir('NEPHRO') {
                    sh "docker build -t ${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} ."
                    sh "docker tag ${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKERHUB_USER}/${IMAGE_NAME}:latest"
                }
            }
        }

    stage('Push to Docker Hub') {
    steps {
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub-credentials',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
        )]) {

            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'

            sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
            sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:latest"
        }
    }
}
    }

    post {
        success { echo "NEPHRO — Build #${env.BUILD_NUMBER} reussi." }
        failure { echo "NEPHRO — Build #${env.BUILD_NUMBER} echoue." }
        always  { sh 'docker logout || true'; cleanWs() }
    }
}
