pipeline {
    agent any
	
	environment {
    IMAGE_NAME = "rud79/fresh-dairy"
}

	options {
    buildDiscarder(logRotator(
        numToKeepStr: '10',
        artifactNumToKeepStr: '10'
    ))
}
    stages {

        stage('Update Code') {
            steps {
                dir('/home/Ubuntu01/fresh_dairy') {
                    sh 'git pull origin main'
                }
            }
        }

        stage('Semantic Versioning') {
            steps {
                dir('/home/Ubuntu01/fresh_dairy') {
                    script {
                        def version = sh(
                            script: 'git describe --tags --abbrev=0 2>/dev/null || echo ""',
                            returnStdout: true
                        ).trim()
                        
                        if (version == '') {
                            version = "v${BUILD_NUMBER}"
                            echo "No git tags found, using build number: ${version}"
                        } else {
                            echo "Found git tag: ${version}"
                        }
                        
                        env.IMAGE_TAG = version
                        echo "IMAGE_TAG set to: ${env.IMAGE_TAG}"
                    }
                }
            }
        }

	  stage('Prepare Report Directory') {
            steps {
                dir('/home/Ubuntu01/fresh_dairy') {
                    sh '''
                        mkdir -p reports/build-${BUILD_NUMBER}
                        echo "Created reports/build-${BUILD_NUMBER}"
                    '''
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
	

	stage('Quality Gate') {
    steps {
        timeout(time: 5, unit: 'MINUTES') {
            script {
                def qg = waitForQualityGate abortPipeline: false

                if (qg.status == 'OK') {
                    echo "✅ Quality Gate Passed"
                } else {
                    echo "⚠ Quality Gate Failed: ${qg.status}"
                    echo "Continuing pipeline..."
                }
            }
        }
    }
}


stage('Save Sonar Summary') {
    steps {
        dir('/home/Ubuntu01/fresh_dairy') {
            sh '''
                cat > reports/build-${BUILD_NUMBER}/sonar-summary.txt <<EOF
SonarQube Project : Fresh Dairy
Build Number      : ${BUILD_NUMBER}
Analysis Date     : $(date)

Dashboard:
http://localhost:9000/dashboard?id=fresh-dairy
EOF
            '''
        }
    }
}



stage('OWASP Dependency Check') {
    steps {
        dir('/home/Ubuntu01/fresh_dairy') {
            dependencyCheck additionalArguments: '''
                --scan .
                --format HTML
                --out reports/build-${BUILD_NUMBER}
            ''',
            odcInstallation: 'DependencyCheck'
        }
    }
}

stage('Publish OWASP Report') {
    steps {
        publishHTML(target: [
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'reports',
            reportFiles: 'dependency-check-report.html',
            reportName: 'OWASP Dependency Report'
        ])
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
                  --output reports/build-${BUILD_NUMBER}/trivy-fs-report.html \
                  .

                echo "Trivy scan completed."
           '''
        }
    }
}

stage('Publish Reports') {
    steps {
        publishHTML(target: [
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: "reports/build-${BUILD_NUMBER}",
            reportFiles: 'trivy-fs-report.html',
            reportName: 'Trivy Security Report'
        ])
    }
}
stage('Archive Reports') {
    steps {
        archiveArtifacts(
    artifacts: "reports/build-${BUILD_NUMBER}/*",
    fingerprint: true
)
    }
}


        stage('Build Docker Image') {
    steps {
        dir('/home/Ubuntu01/fresh_dairy') {

            sh """
                docker compose build

                docker tag fresh_dairy-app:latest ${IMAGE_NAME}:${IMAGE_TAG}
                docker tag fresh_dairy-app:latest ${IMAGE_NAME}:latest
            """
        }
    }
}




	stage('Trivy Docker Image Scan') {
    steps {
        dir('/home/Ubuntu01/fresh_dairy') {
            sh '''
                trivy image \
                  --severity HIGH,CRITICAL \
                  --format template \
                  --template "@$HOME/trivy/templates/html.tpl" \
                  --output reports/build-${BUILD_NUMBER}/trivy-image-report.html \
                  ${IMAGE_NAME}:latest

                echo "Docker Image Scan Completed."
            '''
        }
    }
}


	stage('Publish Docker Image Report') {
    steps {
        publishHTML(target: [
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: "reports/build-${BUILD_NUMBER}",
            reportFiles: "trivy-image-report.html",
            reportName: "Trivy Docker Image Report"
        ])
    }
}

	stage('Push Docker Image') {
    steps {
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
        )]) {

            sh """
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

            docker push ${IMAGE_NAME}:${IMAGE_TAG}
            docker push ${IMAGE_NAME}:latest

            docker logout
            """
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
	

	        stage('Cleanup Old Versions') {
    steps {
        sh '''
            docker images "rud79/fresh-dairy" \
            --format "{{.Repository}}:{{.Tag}}" \
            | grep -v "latest" \
            | xargs -r docker rmi

            docker image prune -f
        '''
    }
}


      stage('Verify Deployment') {
    steps {

        sh '''
        echo "Current Images"
        docker images | grep fresh_dairy-app

        echo ""

        echo "Running Containers"

        docker ps
        '''
    }

}
}
}
