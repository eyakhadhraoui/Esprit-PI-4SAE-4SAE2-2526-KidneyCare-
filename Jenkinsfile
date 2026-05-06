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
            -Dsonar.password=adminadmin \
            -Dsonar.projectKey=kidney-care
        '''
      }
    }

    stage('Docker Build') {
      steps {
        sh 'cd ${WORKSPACE} && pwd && ls -la docker-compose.yml && docker-compose build'
      }
    }

    stage('Deploy') {
      steps {
        sh 'cd ${WORKSPACE} && docker-compose up -d'
      }
    }

    stage('Deploy K8s') {        // ✅ Moved INSIDE stages { }
      steps {
        sh 'cd ${WORKSPACE} && kubectl apply -f Nutrition_Service/nutrition-deployment.yaml'
      }
    }

  }  // end stages

  post {
    success { echo 'Pipeline réussi !' }
    failure { echo 'Pipeline échoué !' }
  }
}
