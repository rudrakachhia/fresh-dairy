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
                    script {
                        def scannerHome = tool 'SonarScanner'

                        withSonarQubeEnv('SonarScanner') {
                            sh """
                                ${scannerHome}/bin/sonar-scanner
                            """
                        }
                    }
                }
            }
        }

                stage('Trivy Filesystem Scan') {
    steps {
        dir('/home/Ubuntu01/fresh_dairy') {

            sh '''
            mkdir -p reports

            trivy fs \
              --severity HIGH,CRITICAL \
              --format template \
              --template "@$HOME/trivy/templates/html.tpl" \
              -o reports/trivy-fs-report.html \
              .
            '''
        }
    }
}

        stage('Build Docker Image') {
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
