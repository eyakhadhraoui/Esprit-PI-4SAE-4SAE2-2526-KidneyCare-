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

        stage('Fix Docker Socket') {
            steps {
                sh 'chmod 666 /var/run/docker.sock || true'
            }
        }

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

       stage('Load Test (k6)') {
           steps {
               sh '''
               docker run --rm \
                 --volumes-from jenkins \
                 grafana/k6 run \
                 --out influxdb=http://host.docker.internal:8086/k6 \
                 /var/jenkins_home/workspace/FoncGreffonCI/test.js
               '''
           }
       }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube-server') {
                    sh "mvn clean verify sonar:sonar -Dsonar.projectKey=my-springboot-app -Dsonar.host.url=http://host.docker.internal:9000 -Dsonar.login=$SONAR_TOKEN"
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