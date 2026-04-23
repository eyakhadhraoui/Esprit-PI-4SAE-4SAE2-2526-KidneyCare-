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
        sh 'cd Nutrition_Service && mvn clean package -DskipTests'
      }
    }
  stage('SonarQube') {
  steps {
    sh '''
      cd Nutrition_Service && mvn sonar:sonar \
        -Dsonar.host.url=http://172.17.0.1:9000 \
        -Dsonar.login=admin \
        -Dsonar.password=adminadmin \
        -Dsonar.projectKey=kidney-care
    '''
  }
}
    stage('Docker Build') {
      steps {
        sh 'docker-compose build'
      }
    }
    stage('Deploy') {
      steps {
        sh 'docker-compose up -d'
      }
    }
  }
   stage('Deploy K8s') {
      steps {
        sh 'kubectl apply -f nutrition-deployment.yaml'
      }
    }
  }
  post {
    success { echo 'Pipeline réussi !' }
    failure { echo 'Pipeline échoué !' }
  }
}
