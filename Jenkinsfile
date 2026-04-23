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
  post {
    success { echo 'Pipeline réussi !' }
    failure { echo 'Pipeline échoué !' }
  }
}
