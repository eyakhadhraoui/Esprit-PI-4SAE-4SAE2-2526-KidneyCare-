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
                sh 'npm install --save-dev @vitest/coverage-v8'
            }
        }
        stage('Tests') {
            steps {
                sh 'npx vitest run --coverage'
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
                    sh '''
                        cat > tsconfig.sonar.json << 'EOF'
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "module": "es2022",
    "moduleResolution": "node"
  }
}
EOF
                        npx sonar-scanner \
                          -Dsonar.projectKey=InfEtFoncFrontend \
                          -Dsonar.host.url=http://host.docker.internal:9000 \
                          -Dsonar.login=$SONAR_TOKEN \
                          -Dsonar.sources=src \
                          -Dsonar.tests=src \
                          -Dsonar.test.inclusions=**/*.spec.ts \
                          -Dsonar.exclusions=**/node_modules/**,**/*.spec.ts \
                          -Dsonar.typescript.tsconfigPath=tsconfig.sonar.json \
                          -Dsonar.javascript.detectBundles=false \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    '''
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
