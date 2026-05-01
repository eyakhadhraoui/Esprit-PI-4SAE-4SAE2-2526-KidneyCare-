pipeline {
    agent any

    tools {
        maven 'maven3'
        jdk '17'
    }

    environment {
        SONAR_TOKEN = credentials('sonar-token-id')
    }

    stages {

        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }

        stage('Tests') {
            steps {
                sh 'mvn test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube-server') {
                    sh """
                    mvn clean verify sonar:sonar \
                    -Dsonar.projectKey=my-springboot-app \
                    -Dsonar.host.url=http://host.docker.internal:9000
                    -Dsonar.login=$SONAR_TOKEN
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}