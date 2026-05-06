pipeline {
  agent any

  environment {
    MAVEN_REPO = '/var/lib/jenkins/.m2/repository'
    LOCAL_IMAGE = 'vagrant_nutrition-service:latest'
    DOCKER_REPOSITORY = 'nutrition-service'
    SONAR_HOST_URL = 'http://localhost:9000'
  }

  stages {

    stage('Checkout') {
      steps {
        echo 'Code available in Jenkins workspace'
      }
    }

    stage('Build') {
      steps {
        dir('Nutrition_Service') {
          sh '''
            chmod +x ./mvnw
            ./mvnw -B -ntp clean package -Dmaven.test.skip=true -Dmaven.repo.local="${MAVEN_REPO}"
          '''
        }
      }
    }

    stage('SonarQube') {
      steps {
        dir('Nutrition_Service') {
          sh '''
            chmod +x ./mvnw
            ./mvnw -B -ntp sonar:sonar \
              -Dsonar.host.url="${SONAR_HOST_URL}" \
              -Dsonar.login=admin \
              -Dsonar.password=adminadmin \
              -Dsonar.projectKey=kidney-care \
              -Dmaven.repo.local="${MAVEN_REPO}"
          '''
        }
      }
    }

    stage('Docker Build') {
      steps {
        sh '''
          set -e
          if docker compose version >/dev/null 2>&1; then
            COMPOSE_CMD="docker compose"
          else
            COMPOSE_CMD="docker-compose"
          fi

          $COMPOSE_CMD build
        '''
      }
    }

    stage('Push Docker Image') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-cred',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
            set -e
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

            docker tag "$LOCAL_IMAGE" "$DOCKER_USER/$DOCKER_REPOSITORY:$BUILD_NUMBER"
            docker tag "$LOCAL_IMAGE" "$DOCKER_USER/$DOCKER_REPOSITORY:latest"

            docker push "$DOCKER_USER/$DOCKER_REPOSITORY:$BUILD_NUMBER"
            docker push "$DOCKER_USER/$DOCKER_REPOSITORY:latest"
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          set -e
          if docker compose version >/dev/null 2>&1; then
            COMPOSE_CMD="docker compose"
          else
            COMPOSE_CMD="docker-compose"
          fi

          $COMPOSE_CMD up -d --remove-orphans
        '''
      }
    }

    stage('Deploy K8s') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-cred',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
            set -e
            set +x
            kubectl create secret docker-registry dockerhub-cred \
              --docker-server=https://index.docker.io/v1/ \
              --docker-username="$DOCKER_USER" \
              --docker-password="$DOCKER_PASS" \
              --dry-run=client -o yaml | kubectl apply -f -

            sed "s|$LOCAL_IMAGE|$DOCKER_USER/$DOCKER_REPOSITORY:$BUILD_NUMBER|g" Nutrition_Service/nutrition-deployment.yaml | kubectl apply -f -
            kubectl rollout status deployment/mysql --timeout=180s
            kubectl rollout status deployment/nutrition-service --timeout=180s
          '''
        }
      }
    }

  }

  post {
    success { echo 'Pipeline succeeded!' }
    failure { echo 'Pipeline failed!' }
  }
}
