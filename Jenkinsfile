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
                git branch: 'Dossiersmedicale',
                    url: 'https://github.com/eyakhadhraoui/Esprit-PI-4SAE-4SAE2-2526-KidneyCare-.git'
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean install -DskipTests'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'mvn test'
            }
        }

        stage('Package JAR') {
            steps {
                sh 'mvn package -DskipTests'
            }
        }

    }
}
