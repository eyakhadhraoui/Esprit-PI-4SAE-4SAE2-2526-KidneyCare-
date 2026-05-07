pipeline {
    agent any
    tools {
        nodejs 'node20'
    }
    environment {
        SONAR_TOKEN = credentials('sonar-token-id')
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
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube-server') {
                    sh """
                        npx sonar-scanner \
                          -Dsonar.projectKey=InfEtFoncFrontend \
                          -Dsonar.host.url=http://host.docker.internal:9000 \
                          -Dsonar.login=$SONAR_TOKEN \
                          -Dsonar.typescript.tsconfigPath=tsconfig.app.json \
                          -Dsonar.javascript.detectBundles=false
                    """
                }
            }
        }
        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }
    }
}
