pipeline {
  agent any

  stages {

    stage('Checkout') {
      steps {
        echo 'Code récupéré depuis GitHub'
      }
    }

    stage('Build') {
      steps {
        sh 'cd ${WORKSPACE}/Nutrition_Service && mvn clean package -DskipTests'
      }
    }

    stage('SonarQube') {
      steps {
        sh '''
          cd ${WORKSPACE}/Nutrition_Service && mvn sonar:sonar \
            -Dsonar.host.url=http://172.17.0.1:9000 \
            -Dsonar.login=admin \
            -Dsonar.password=admin \
            -Dsonar.projectKey=kidney-care \
            -Dsonar.exclusions=**/Dockerfile,docker-compose.yml
        '''
      }
    }

    stage('Docker Build') {
      steps {
        sh 'cd ${WORKSPACE} && pwd && ls -la docker-compose.yml && docker-compose build'
      }
    }

    stage('Push Docker Image') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-cred',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          retry(3) {
            sh '''
              echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
              
              docker tag vagrant_nutrition-service:latest $DOCKER_USER/nutrition-service:1.0
              
              docker push $DOCKER_USER/nutrition-service:1.0
            '''
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        sh 'cd ${WORKSPACE} && docker-compose up -d'
      }
    }

    stage('Deploy K8s') {
      steps {
        script {
          echo '========================================='
          echo 'Déploiement Kubernetes'
          echo '========================================='
          
          // Charger et exécuter le JenkinsfileK8s
          sh '''
            cd ${WORKSPACE}
            kubectl apply -f Nutrition_Service/nutrition-deployment.yaml
            
            echo "Attente du déploiement..."
            sleep 10
            
            echo "Statut des pods:"
            kubectl get pods -n default
          '''
        }
      }
    }

  }

  post {
    success { echo 'Pipeline réussi !' }
    failure { echo 'Pipeline échoué !' }
  }
}
