pipeline {
    agent any

    stages {

        stage('Update Code') {
            steps {
                dir('/home/Ubuntu01/fresh_dairy') {
                    sh 'git pull origin main'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('/home/Ubuntu01/fresh_dairy') {

                    withSonarQubeEnv('SonarScanner') {

                        sh '''
                            sonar-scanner \
                              -Dsonar.login=$SONAR_AUTH_TOKEN
                        '''
                    }

                }
            }
        }

        stage('Build Image') {
            steps {
                dir('/home/Ubuntu01/fresh_dairy') {
                    sh 'docker compose build'
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('/home/Ubuntu01/fresh_dairy') {
                    sh 'docker compose up -d'
                }
            }
        }

        stage('Verify') {
            steps {
                sh 'docker ps'
            }
        }

    }
}
