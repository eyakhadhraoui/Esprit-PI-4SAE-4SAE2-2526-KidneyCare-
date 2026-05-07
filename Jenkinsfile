pipeline {
    agent any

    tools {
        maven 'M2_HOME'
    }

    environment {
        NOTIFY_EMAIL = 'eyakhadhraoui28@gmail.com'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build + Tests unitaires') {
            steps {
                sh 'mvn -B clean test'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Package JAR') {
            steps {
                sh 'mvn -B package -DskipTests'
            }
        }

        stage('SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn -B sonar:sonar -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml'
                }
            }
        }

        stage('OWASP Dependency Check (DevSecOps)') {
            steps {
                script {
                    def hasDocker = sh(script: 'command -v docker >/dev/null 2>&1', returnStatus: true) == 0
                    if (!hasDocker) {
                        echo 'Docker indisponible: scan OWASP ignore.'
                    } else {
                        sh '''
                            set +e
                            mkdir -p dependency-check-report dependency-check-data
                            docker run --rm \
                              -v "$PWD:/src" \
                              -v "$PWD/dependency-check-data:/usr/share/dependency-check/data" \
                              -v "$PWD/dependency-check-report:/report" \
                              owasp/dependency-check:latest \
                              --scan /src \
                              --format "HTML" \
                              --format "JSON" \
                              --out /report \
                              --project "DossierMedicale" \
                              --noupdate \
                              --exitCode 0 || true
                        '''
                    }
                }
            }
        }

        stage('Trivy Scan (DevSecOps)') {
            steps {
                script {
                    def hasDocker = sh(script: 'command -v docker >/dev/null 2>&1', returnStatus: true) == 0
                    if (!hasDocker) {
                        echo 'Docker indisponible: scan Trivy ignore.'
                    } else {
                        sh '''
                            set +e
                            mkdir -p trivy-report
                            docker run --rm \
                              -v "$PWD:/scan" \
                              -v "$HOME/.cache/trivy:/root/.cache/" \
                              aquasec/trivy:latest fs \
                              --scanners vuln,secret,config \
                              --severity HIGH,CRITICAL \
                              --format json \
                              --output /scan/trivy-report/trivy-dossiermedicale.json \
                              --exit-code 0 \
                              /scan || true
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts allowEmptyArchive: true,
                artifacts: 'dependency-check-report/**/*,trivy-report/**/*'
        }
        success {
            script {
                try {
                    emailext(
                        to: "${env.NOTIFY_EMAIL}",
                        subject: "[SUCCESS] DossierMedicale - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: """Le pipeline DossierMedicale est passe avec succes.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
URL: ${env.BUILD_URL}
"""
                    )
                } catch (err) {
                    echo "Echec envoi email (SUCCESS): ${err}"
                }
            }
        }
        failure {
            script {
                try {
                    emailext(
                        to: "${env.NOTIFY_EMAIL}",
                        subject: "[FAILURE] DossierMedicale - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: """Le pipeline DossierMedicale a echoue.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
URL: ${env.BUILD_URL}
"""
                    )
                } catch (err) {
                    echo "Echec envoi email (FAILURE): ${err}"
                }
            }
        }
    }
}
