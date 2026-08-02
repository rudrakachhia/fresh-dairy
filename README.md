# 🥛 Fresh Dairy - End-to-End DevSecOps Pipeline

A production-inspired **DevSecOps CI/CD Pipeline** built around a Dockerized **Node.js + MongoDB** application.

This project demonstrates how to build an end-to-end DevSecOps workflow by integrating continuous integration, automated deployment, security scanning, code quality analysis, reverse proxy management, and infrastructure monitoring.

---

# 📖 Project Overview

The goal of this project was to transform a simple Node.js application into a production-inspired environment by implementing modern DevOps and DevSecOps practices.

The pipeline automatically:

- Pulls the latest source code from GitHub
- Performs static code analysis using SonarQube
- Validates the Quality Gate
- Performs OWASP Dependency Check
- Runs Trivy vulnerability scans
- Publishes security reports
- Builds Docker images
- Deploys containers automatically
- Verifies deployment
- Monitors infrastructure and application health using Prometheus and Grafana

---

# 🏗️ Project Architecture

```
                    GitHub
                       │
                       ▼
                Jenkins Pipeline
                       │
      ┌────────────────┼────────────────┐
      │                │                │
      ▼                ▼                ▼
 SonarQube       OWASP Scan       Trivy Scan
      │                │                │
      └────────────────┼────────────────┘
                       ▼
              Docker Compose Build
                       │
                       ▼
              Fresh Dairy Container
                       │
                       ▼
          Nginx Proxy Manager
                       │
                       ▼
                 End Users


Monitoring Stack

Node Exporter
      │
      ▼
Prometheus ◄──────── cAdvisor
      │
      ▼
Grafana Dashboard

Blackbox Exporter
      │
      ▼
Website Monitoring
```

---

# 🚀 Features

- Dockerized Node.js Application
- MongoDB Database Container
- Docker Compose Deployment
- Jenkins CI/CD Pipeline
- GitHub Integration
- SonarQube Static Code Analysis
- SonarQube Quality Gate
- OWASP Dependency Check
- Trivy Filesystem Vulnerability Scan
- HTML Report Publishing
- Jenkins Report Archiving
- Reverse Proxy using Nginx Proxy Manager
- Prometheus Monitoring
- Grafana Dashboards
- Node Exporter Metrics
- cAdvisor Container Monitoring
- Blackbox Exporter Website Monitoring

---

# 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Backend | Node.js |
| Database | MongoDB |
| Containerization | Docker |
| Container Orchestration | Docker Compose |
| Reverse Proxy | Nginx Proxy Manager |
| CI/CD | Jenkins |
| Code Quality | SonarQube |
| Dependency Scanning | OWASP Dependency Check |
| Vulnerability Scanning | Trivy |
| Monitoring | Prometheus |
| Visualization | Grafana |
| Host Metrics | Node Exporter |
| Container Metrics | cAdvisor |
| Website Monitoring | Blackbox Exporter |

---

# 📂 Project Structure

```
fresh_dairy/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── public/
├── reports/
├── routes/
│
├── Dockerfile
├── docker-compose.yml
├── Jenkinsfile
├── sonar-project.properties
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

---

# ⚙️ CI/CD Pipeline

The Jenkins pipeline performs the following stages:

1. Update Code from GitHub
2. SonarQube Analysis
3. Quality Gate Validation
4. OWASP Dependency Check
5. Publish OWASP Report
6. Trivy Filesystem Scan
7. Publish Trivy Report
8. Archive Security Reports
9. Build Docker Image
10. Deploy Application
11. Verify Running Containers

---

# 🔒 Security

## SonarQube

- Static Code Analysis
- Bug Detection
- Code Smell Detection
- Vulnerability Detection
- Maintainability Analysis

---

## OWASP Dependency Check

Scans third-party libraries for known CVEs and vulnerable dependencies.

Generated reports are automatically published in Jenkins.

---

## Trivy

Performs vulnerability scanning against the application filesystem.

Scans include:

- HIGH Vulnerabilities
- CRITICAL Vulnerabilities
- Security Misconfigurations

---

# 📊 Monitoring Stack

Monitoring components include:

- Prometheus
- Grafana
- Node Exporter
- cAdvisor
- Blackbox Exporter

Current dashboards monitor:

- CPU Usage
- Memory Usage
- Disk Usage
- Docker Containers
- Website Availability
- HTTP Response Time

---

# 🌐 Reverse Proxy

All services are managed through **Nginx Proxy Manager**.

Configured Services:

- Fresh Dairy Application
- SonarQube
- Grafana

---

# 📸 Screenshots

> Screenshots will be added soon.


















---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/fresh_dairy.git
```

## Navigate to Project

```bash
cd fresh_dairy
```

## Start Application

```bash
docker compose up -d
```

---

# 📋 Reports

The pipeline automatically generates:

- SonarQube Code Analysis
- OWASP Dependency Check Report
- Trivy Vulnerability Report

Reports are published in Jenkins and archived for each successful build.

---

# 🗺️ Roadmap (Phase 2)

Upcoming improvements:

- Docker Image Versioning
- Docker Hub Integration
- Blue/Green Deployment
- Automated Rollback
- Kubernetes Deployment
- Helm Charts
- ArgoCD GitOps
- Grafana Alerting
- Loki Log Aggregation
- Slack/Telegram Notifications

---

# 👨‍💻 Author

**Rudra Kachhia**

System Administrator Trainee

Interested in:

- DevOps
- DevSecOps
- Linux
- Docker
- Cloud Computing
- Automation
- Cyber Security

---

## ⭐ Support

If you found this project useful or interesting, consider giving it a ⭐ on GitHub.
