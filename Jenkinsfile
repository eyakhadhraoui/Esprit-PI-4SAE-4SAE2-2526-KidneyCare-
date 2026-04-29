pipeline {
    agent any

    tools {
        maven 'maven3'
        jdk '17'
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
    }
}
