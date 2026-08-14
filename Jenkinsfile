pipeline {

    agent any

    environment {
        IMAGE_NAME = "rud79/fresh-dairy"

        NPM_URL = "http://localhost:81"
        NPM_PROXY_HOST_ID = "1"
        DOMAIN_NAME = "dairy.local.com"

        APP_PORT = "3000"
    }

    options {
        buildDiscarder(
            logRotator(
                numToKeepStr: '10',
                artifactNumToKeepStr: '10'
            )
        )

        timestamps()
    }

    stages {

        // =========================================================
        // 1. UPDATE SOURCE CODE
        // =========================================================

        stage('Update Code') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    sh '''
                        git pull origin main
                    '''
                }
            }
        }


        // =========================================================
        // 2. DETERMINE IMAGE VERSION
        // =========================================================

        stage('Semantic Versioning') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    script {

                        def version = sh(
                            script: '''
                                git describe --tags --abbrev=0 2>/dev/null || true
                            ''',
                            returnStdout: true
                        ).trim()

                        if (!version) {

                            version = "v${BUILD_NUMBER}"

                            echo "No Git tag found."
                            echo "Using Jenkins build version: ${version}"

                        } else {

                            echo "Git tag found: ${version}"
                        }

                        env.IMAGE_TAG = version

                        echo "===================================="
                        echo "IMAGE TAG = ${env.IMAGE_TAG}"
                        echo "===================================="
                    }
                }
            }
        }


        // =========================================================
        // 3. PREPARE REPORT DIRECTORY
        // =========================================================

        stage('Prepare Report Directory') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    sh '''
                        mkdir -p reports/build-${BUILD_NUMBER}
                    '''
                }
            }
        }


        // =========================================================
        // 4. SONARQUBE
        // =========================================================

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


        // =========================================================
        // 5. QUALITY GATE
        // =========================================================

        stage('Quality Gate') {

            steps {

                timeout(
                    time: 5,
                    unit: 'MINUTES'
                ) {

                    script {

                        def qg = waitForQualityGate(
                            abortPipeline: false
                        )

                        if (qg.status == 'OK') {

                            echo "Quality Gate PASSED"

                        } else {

                            echo "Quality Gate FAILED: ${qg.status}"
                            echo "Continuing pipeline..."
                        }
                    }
                }
            }
        }


        // =========================================================
        // 6. SONAR SUMMARY
        // =========================================================

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


        // =========================================================
        // 7. OWASP
        // =========================================================

        stage('OWASP Dependency Check') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    dependencyCheck(

                        additionalArguments: '''
                            --scan .
                            --format HTML
                            --out reports/build-${BUILD_NUMBER}
                        ''',

                        odcInstallation: 'DependencyCheck'
                    )
                }
            }
        }


        // =========================================================
        // 8. PUBLISH OWASP
        // =========================================================

        stage('Publish OWASP Report') {

            steps {

                publishHTML(
                    target: [

                        allowMissing: false,

                        alwaysLinkToLastBuild: true,

                        keepAll: true,

                        reportDir:
                            "reports/build-${BUILD_NUMBER}",

                        reportFiles:
                            'dependency-check-report.html',

                        reportName:
                            'OWASP Dependency Report'
                    ]
                )
            }
        }


        // =========================================================
        // 9. TRIVY FILESYSTEM
        // =========================================================

        stage('Trivy Filesystem Scan') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    sh '''
                        trivy fs \
                          --severity HIGH,CRITICAL \
                          --format template \
                          --template "@$HOME/trivy/templates/html.tpl" \
                          --output reports/build-${BUILD_NUMBER}/trivy-fs-report.html \
                          .
                    '''
                }
            }
        }


        // =========================================================
        // 10. PUBLISH TRIVY FILESYSTEM
        // =========================================================

        stage('Publish Trivy Filesystem Report') {

            steps {

                publishHTML(
                    target: [

                        allowMissing: false,

                        alwaysLinkToLastBuild: true,

                        keepAll: true,

                        reportDir:
                            "reports/build-${BUILD_NUMBER}",

                        reportFiles:
                            'trivy-fs-report.html',

                        reportName:
                            'Trivy Filesystem Security Report'
                    ]
                )
            }
        }


        // =========================================================
        // 11. BUILD DOCKER IMAGE
        // =========================================================

        stage('Build Docker Image') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    sh """

                        echo "Building Docker image..."

                        docker compose build

                        echo "Tagging image..."

                        docker tag \
                            fresh_dairy-app:latest \
                            ${IMAGE_NAME}:${IMAGE_TAG}

                        echo "Image created:"

                        docker image inspect \
                            ${IMAGE_NAME}:${IMAGE_TAG} \
                            --format '{{.RepoTags}}'
                    """
                }
            }
        }


        // =========================================================
        // 12. TRIVY DOCKER IMAGE
        // =========================================================

        stage('Trivy Docker Image Scan') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    sh """

                        trivy image \
                          --severity HIGH,CRITICAL \
                          --format template \
                          --template "@\\$HOME/trivy/templates/html.tpl" \
                          --output reports/build-${BUILD_NUMBER}/trivy-image-report.html \
                          ${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }


        // =========================================================
        // 13. PUBLISH IMAGE REPORT
        // =========================================================

        stage('Publish Docker Image Report') {

            steps {

                publishHTML(
                    target: [

                        allowMissing: false,

                        alwaysLinkToLastBuild: true,

                        keepAll: true,

                        reportDir:
                            "reports/build-${BUILD_NUMBER}",

                        reportFiles:
                            "trivy-image-report.html",

                        reportName:
                            "Trivy Docker Image Report"
                    ]
                )
            }
        }


        // =========================================================
        // 14. PUSH IMAGE TO DOCKER HUB
        // =========================================================

        stage('Push Docker Image') {

            steps {

                withCredentials(
                    [
                        usernamePassword(
                            credentialsId: 'dockerhub',

                            usernameVariable:
                                'DOCKER_USER',

                            passwordVariable:
                                'DOCKER_PASS'
                        )
                    ]
                ) {

                    sh '''
                        set +x

                        echo "$DOCKER_PASS" |
                            docker login \
                            -u "$DOCKER_USER" \
                            --password-stdin

                        docker push "${IMAGE_NAME}:${IMAGE_TAG}"

                        docker logout
                    '''
                }
            }
        }


        // =========================================================
        // 15. DETERMINE BLUE / GREEN
        // =========================================================

        stage('Determine Active Environment') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    script {

                        def active = sh(

                            script: '''
                                if [ -f .active_environment ]; then
                                    cat .active_environment
                                else
                                    echo "blue"
                                fi
                            ''',

                            returnStdout: true
                        ).trim()

                        if (
                            active != 'blue' &&
                            active != 'green'
                        ) {

                            error(
                                "Invalid active environment: ${active}"
                            )
                        }

                        def target

                        if (active == 'blue') {

                            target = 'green'

                        } else {

                            target = 'blue'
                        }

                        env.ACTIVE_ENV = active
                        env.TARGET_ENV = target

                        echo "===================================="
                        echo "ACTIVE ENVIRONMENT : ${active}"
                        echo "TARGET ENVIRONMENT : ${target}"
                        echo "NEW IMAGE          : ${IMAGE_TAG}"
                        echo "===================================="
                    }
                }
            }
        }


        // =========================================================
        // 16. DEPLOY NEW IMAGE TO INACTIVE ENV
        // =========================================================

        stage('Deploy Inactive Environment') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    script {

                        if (env.TARGET_ENV == 'green') {

                            sh """

                                export GREEN_IMAGE_TAG=${IMAGE_TAG}

                                docker pull \
                                    ${IMAGE_NAME}:${IMAGE_TAG}

                                docker compose \
                                    -f docker-compose.bluegreen.yml \
                                    up -d green

                            """

                        } else {

                            sh """

                                export BLUE_IMAGE_TAG=${IMAGE_TAG}

                                docker pull \
                                    ${IMAGE_NAME}:${IMAGE_TAG}

                                docker compose \
                                    -f docker-compose.bluegreen.yml \
                                    up -d blue

                            """
                        }
                    }
                }
            }
        }


        // =========================================================
        // 17. WAIT FOR CONTAINER
        // =========================================================

        stage('Wait For New Container') {

            steps {

                script {

                    def container =
                        env.TARGET_ENV == 'green'
                        ? 'fresh-dairy-green'
                        : 'fresh-dairy-blue'

                    timeout(
                        time: 2,
                        unit: 'MINUTES'
                    ) {

                        waitUntil {

                            def running = sh(

                                script: """
                                    docker inspect \
                                      --format='{{.State.Running}}' \
                                      ${container} \
                                      2>/dev/null || echo false
                                """,

                                returnStdout: true
                            ).trim()

                            if (running == 'true') {

                                echo "${container} is RUNNING"

                                return true

                            } else {

                                echo "Waiting for ${container}..."

                                sleep 5

                                return false
                            }
                        }
                    }
                }
            }
        }


        // =========================================================
        // 18. APPLICATION HEALTH CHECK
        // =========================================================

        stage('Application Health Check') {

            steps {

                script {

                    def container =
                        env.TARGET_ENV == 'green'
                        ? 'fresh-dairy-green'
                        : 'fresh-dairy-blue'

                    timeout(
                        time: 2,
                        unit: 'MINUTES'
                    ) {

                        waitUntil {

                            def result = sh(

                                script: """

                                    docker exec \
                                      ${container} \
                                      node -e '
                                        const http = require("http");

                                        const req =
                                          http.get(
                                            "http://localhost:3000/health",
                                            res => {
                                              process.exit(
                                                res.statusCode === 200
                                                ? 0
                                                : 1
                                              );
                                            }
                                          );

                                        req.on(
                                          "error",
                                          () => process.exit(1)
                                        );

                                        req.setTimeout(
                                          5000,
                                          () => process.exit(1)
                                        );
                                      '
                                """,

                                returnStatus: true
                            )

                            if (result == 0) {

                                echo "Application health check PASSED"

                                return true

                            } else {

                                echo "Application not ready..."

                                sleep 5

                                return false
                            }
                        }
                    }
                }
            }
        }


        // =========================================================
        // 19. SHOW NEW CONTAINER LOGS
        // =========================================================

        stage('Verify New Environment') {

            steps {

                script {

                    def container =
                        env.TARGET_ENV == 'green'
                        ? 'fresh-dairy-green'
                        : 'fresh-dairy-blue'

                    sh """

                        echo "===================================="
                        echo "Container: ${container}"
                        echo "===================================="

                        docker inspect \
                            ${container} \
                            --format='Image: {{.Config.Image}}'

                        docker logs \
                            --tail 30 \
                            ${container}
                    """
                }
            }
        }


        // =========================================================
        // 20. SWITCH NGINX PROXY MANAGER
        // =========================================================

        stage('Switch Nginx Proxy Manager') {

            steps {

                withCredentials(
                    [
                        usernamePassword(
                            credentialsId: 'npm-admin',

                            usernameVariable:
                                'NPM_USERNAME',

                            passwordVariable:
                                'NPM_PASSWORD'
                        )
                    ]
                ) {

                    script {

                        def targetHost =
                            env.TARGET_ENV == 'green'
                            ? 'fresh-dairy-green'
                            : 'fresh-dairy-blue'

                        sh """

                            set +x

                            echo "Getting NPM API token..."

                            TOKEN=\\$(curl -s \
                                -X POST \
                                "${NPM_URL}/api/tokens" \
                                -H "Content-Type: application/json" \
                                -d "{\\\"identity\\\":\\\"\\$NPM_USERNAME\\\",\\\"secret\\\":\\\"\\$NPM_PASSWORD\\\"}" \
                                | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])"
                            )

                            if [ -z "\\$TOKEN" ]; then

                                echo "ERROR: Could not obtain NPM token"

                                exit 1
                            fi


                            echo "Reading current proxy configuration..."

                            curl -fsS \
                                -H "Authorization: Bearer \\$TOKEN" \
                                "${NPM_URL}/api/nginx/proxy-hosts/${NPM_PROXY_HOST_ID}" \
                                > /tmp/npm-proxy.json


                            echo "Switching traffic to ${targetHost}..."


                            python3 - <<'PY'
import json

with open('/tmp/npm-proxy.json') as f:
    data = json.load(f)

data["domain_names"] = ["${DOMAIN_NAME}"]
data["forward_host"] = "${targetHost}"
data["forward_port"] = 3000
data["forward_scheme"] = "http"

with open('/tmp/npm-update.json', 'w') as f:
    json.dump(data, f)
PY


                            curl -fsS \
                                -X PUT \
                                "${NPM_URL}/api/nginx/proxy-hosts/${NPM_PROXY_HOST_ID}" \
                                -H "Authorization: Bearer \\$TOKEN" \
                                -H "Content-Type: application/json" \
                                --data-binary @/tmp/npm-update.json


                            echo ""

                            echo "NPM traffic switched to ${targetHost}"

                            rm -f \
                                /tmp/npm-proxy.json \
                                /tmp/npm-update.json
                        """
                    }
                }
            }
        }


        // =========================================================
        // 21. VERIFY TRAFFIC SWITCH
        // =========================================================

        stage('Verify Traffic Switch') {

            steps {

                script {

                    def targetHost =
                        env.TARGET_ENV == 'green'
                        ? 'fresh-dairy-green'
                        : 'fresh-dairy-blue'

                    withCredentials(
                        [
                            usernamePassword(
                                credentialsId: 'npm-admin',

                                usernameVariable:
                                    'NPM_USERNAME',

                                passwordVariable:
                                    'NPM_PASSWORD'
                            )
                        ]
                    ) {

                        sh """

                            set +x

                            TOKEN=\\$(curl -s \
                                -X POST \
                                "${NPM_URL}/api/tokens" \
                                -H "Content-Type: application/json" \
                                -d "{\\\"identity\\\":\\\"\\$NPM_USERNAME\\\",\\\"secret\\\":\\\"\\$NPM_PASSWORD\\\"}" \
                                | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])"
                            )

                            CURRENT=\\$(curl -fsS \
                                -H "Authorization: Bearer \\$TOKEN" \
                                "${NPM_URL}/api/nginx/proxy-hosts/${NPM_PROXY_HOST_ID}" \
                                | python3 -c "import sys,json; print(json.load(sys.stdin)['forward_host'])"
                            )

                            echo "NPM currently points to: \\$CURRENT"

                            if [ "\\$CURRENT" != "${targetHost}" ]; then

                                echo "ERROR: NPM switch verification failed"

                                exit 1
                            fi

                            echo "NPM switch VERIFIED"
                        """
                    }
                }
            }
        }


        // =========================================================
        // 22. SAVE ACTIVE ENVIRONMENT
        // =========================================================

        stage('Save Active Environment') {

            steps {

                dir('/home/Ubuntu01/fresh_dairy') {

                    sh """

                        echo "${TARGET_ENV}" > .active_environment

                        echo "Active environment: ${TARGET_ENV}"
                    """
                }
            }
        }


        // =========================================================
        // 23. STOP OLD ENVIRONMENT
        // =========================================================

        stage('Stop Old Environment') {

            steps {

                script {

                    def oldContainer =
                        env.ACTIVE_ENV == 'blue'
                        ? 'fresh-dairy-blue'
                        : 'fresh-dairy-green'

                    sh """

                        echo "Stopping old environment: ${oldContainer}"

                        docker stop \
                            ${oldContainer} \
                            2>/dev/null || true

                        docker rm \
                            ${oldContainer} \
                            2>/dev/null || true
                    """
                }
            }
        }


        // =========================================================
        // 24. ARCHIVE REPORTS
        // =========================================================

        stage('Archive Reports') {

            steps {

                archiveArtifacts(

                    artifacts:
                        "reports/build-${BUILD_NUMBER}/*",

                    fingerprint: true
                )
            }
        }


        // =========================================================
        // 25. FINAL VERIFICATION
        // =========================================================

        stage('Verify Deployment') {

            steps {

                sh '''

                    echo ""
                    echo "======================================"
                    echo "FINAL DEPLOYMENT STATUS"
                    echo "======================================"

                    echo ""
                    echo "Active Environment:"
                    cat /home/Ubuntu01/fresh_dairy/.active_environment

                    echo ""
                    echo "Running Containers:"
                    docker ps

                    echo ""
                    echo "Fresh Dairy Images:"
                    docker images "rud79/fresh-dairy"
                '''
            }
        }
    }


    // =============================================================
    // POST ACTIONS
    // =============================================================

    post {

        failure {

            echo "======================================"
            echo "DEPLOYMENT FAILED"
            echo "======================================"

            sh '''

                docker ps

                echo ""
                echo "Blue logs:"
                docker logs --tail 30 fresh-dairy-blue 2>/dev/null || true

                echo ""
                echo "Green logs:"
                docker logs --tail 30 fresh-dairy-green 2>/dev/null || true
            '''
        }

        success {

            echo "======================================"
            echo "BLUE-GREEN DEPLOYMENT SUCCESSFUL"
            echo "======================================"

            echo "Active environment: ${env.TARGET_ENV}"
            echo "Image: ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
        }
    }
}
