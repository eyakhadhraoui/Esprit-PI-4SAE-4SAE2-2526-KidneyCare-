pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Tests') {
            steps {
                sh 'npm run test -- --watch=false'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build -- --configuration production'
            }
        }
    }
}
