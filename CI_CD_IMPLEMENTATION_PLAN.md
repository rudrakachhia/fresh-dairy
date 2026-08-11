# Fresh Dairy - CI/CD Implementation Plan

## Current Setup Analysis

### Jenkins Pipeline (`Jenkinsfile`)
- **13 stages**: Code pull → SonarQube → Quality Gate → OWASP → Trivy FS → Trivy Image → Docker Build → Push → Deploy → Cleanup → Verify
- **Image tagging**: `v${BUILD_NUMBER}` + `latest` → Docker Hub (`rud79/fresh-dairy`)
- **Deployment**: `docker compose up -d` on single VM
- **Security**: SonarQube, OWASP Dependency Check, Trivy (filesystem + image)
- **Reports**: HTML reports published + archived per build

### Docker Setup
- **Dockerfile**: Node 20 Alpine, npm ci, exposes 3000
- **docker-compose.yml**: App + MongoDB 7, external reverse-proxy network, named volume for MongoDB

### Application
- **Node.js/Express** with MongoDB (mongoose)
- **Auth**: bcryptjs, express-session, connect-mongo
- **Config**: dotenv for environment variables

---

## Implementation Decisions

| Decision | Choice |
|----------|--------|
| **Kubernetes Target** | Local dev only (kind/k3d) |
| **Secrets Management** | Sealed Secrets (Bitnami) |
| **Migration Strategy** | Blue/Green cutover |
| **GitOps Tool** | ArgoCD |
| **Observability** | Grafana + Prometheus + Loki + AlertManager |
| **Notifications** | Slack/Telegram webhooks |

---

## Phased Implementation Plan

### Phase 1: Versioning & Docker Hub (Week 1)
- [x] Semantic versioning via git tags (`git describe --tags`)
- [ ] Multi-arch builds with `docker buildx`
- [ ] Cosign image signing (optional for local)
- [ ] Docker Hub: vulnerability scanning, retention policies (keep last 50 tags)

### Phase 2: K8s on kind/k3d (Week 1-2)
- [ ] Create `kind-config.yaml` with:
  - ingress-nginx
  - local-path-provisioner (storage)
  - cert-manager (self-signed TLS)
- [ ] Base manifests:
  - `Deployment` (app + liveness/readiness probes)
  - `Service` (ClusterIP)
  - `Ingress` (TLS)
  - `ConfigMap` (app config)
  - `Secret` (sealed via Sealed Secrets)
  - `StatefulSet` for MongoDB (or Bitnami subchart)

### Phase 3: Helm Chart (Week 2)
```
helm/fresh-dairy/
  Chart.yaml
  values.yaml              # defaults
  values-dev.yaml          # kind/k3d overrides
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    configmap.yaml
    secret.yaml
    mongodb.yaml
```

### Phase 4: Blue/Green Deployment (Week 2-3)
- [ ] Two namespaces: `fresh-dairy-blue`, `fresh-dairy-green`
- [ ] Jenkins deploys to **inactive** namespace
- [ ] Health checks → switch Ingress to new namespace
- [ ] Rollback: switch Ingress back on failure

### Phase 5: ArgoCD GitOps (Week 3)
- [ ] Install ArgoCD via Helm
- [ ] Create `Application` resource pointing to Git repo
- [ ] Enable auto-sync + prune + self-heal
- [ ] Jenkins triggers ArgoCD sync via CLI/webhook

### Phase 6: Observability Stack (Week 4)
| Component | Helm Chart | Purpose |
|-----------|------------|---------|
| **Prometheus + Grafana** | `kube-prometheus-stack` | Metrics + dashboards |
| **Loki** | `grafana/loki` | Log aggregation (single binary) |
| **Promtail** | `grafana/promtail` | DaemonSet log shipper |
| **AlertManager** | Included in kube-prometheus-stack | Alert routing |

**Key Alerts**: Pod crash loops, high CPU/memory, error rate > 5%, deploy failures

### Phase 7: Notifications (Week 4)
- [ ] Jenkins: Slack/Telegram webhook for build status
- [ ] ArgoCD: Notification templates for sync/rollback events
- [ ] AlertManager: Route critical alerts to Slack/Telegram

---

## Target File Structure

```
fresh_dairy/
├── .github/workflows/           # Optional: GitHub Actions comparison
├── argocd/
│   └── application.yaml         # ArgoCD Application manifest
├── helm/
│   └── fresh-dairy/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       └── templates/
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── ingress.yaml
│           ├── configmap.yaml
│           ├── secret.yaml
│           └── mongodb.yaml
├── k8s/
│   ├── base/
│   └── overlays/
│       ├── dev/
│       └── prod/
├── kind-config.yaml             # Kind cluster config
├── sealed-secrets/              # Generated sealed secrets
├── Jenkinsfile                  # Updated pipeline
├── docker-compose.yml           # Current (keep for reference)
├── Dockerfile                   # Current
└── CI_CD_IMPLEMENTATION_PLAN.md # This file
```

---

## Jenkinsfile Updates Needed

### New Stages to Add
1. **Semantic Versioning** - Determine version from git tags
2. **Helm Lint/Test** - `helm lint`, `helm template`
3. **Deploy to Inactive Namespace** - Helm upgrade --install to blue/green
4. **Health Check** - Probe endpoints before cutover
5. **Cutover** - Patch Ingress to point to new namespace
6. **ArgoCD Sync** - Trigger ArgoCD application sync
7. **Notify** - Slack/Telegram deployment status

### Stages to Modify
- **Build Docker Image** → Use `docker buildx`, push multi-arch
- **Push Docker Image** → Add cosign signing
- **Deploy** → Replace docker-compose with Helm deploy to inactive namespace
- **Cleanup** → Add Helm release cleanup for old versions

---

## Commands Reference

### Kind Cluster Setup
```bash
kind create cluster --config kind-config.yaml
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

### Sealed Secrets
```bash
# Install controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.25.0/controller.yaml

# Generate sealed secret
kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format=yaml < secret.yaml > sealed-secret.yaml
```

### ArgoCD
```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm install argocd argo/argo-cd -n argocd --create-namespace
kubectl apply -f argocd/application.yaml
```

### Observability
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki -n monitoring
helm install promtail grafana/promtail -n monitoring
```

---

## Rollback Procedures

### Blue/Green Rollback (Jenkins)
```groovy
// In Jenkinsfile - on health check failure
sh "kubectl patch ingress fresh-dairy -n fresh-dairy-${ACTIVE_COLOR} -p '{\"spec\":{\"rules\":[{\"host\":\"fresh-dairy.local\",\"http\":{\"paths\":[{\"path\":\"/\",\"pathType\":\"Prefix\",\"backend\":{\"service\":{\"name\":\"fresh-dairy\",\"port\":{\"number\":3000}}}}]}}]}}'"
```

### ArgoCD Rollback
```bash
argocd app rollback fresh-dairy <REVISION>
# Or via UI: Applications → fresh-dairy → History → Rollback
```

---

## Success Criteria

- [ ] Zero-downtime deployments via Blue/Green
- [ ] Automated rollback on health check failure
- [ ] Full GitOps: Git → ArgoCD → Cluster
- [ ] Observability: metrics, logs, alerts in Grafana
- [ ] Notifications: deploy status + critical alerts in Slack/Telegram
- [ ] All secrets encrypted in Git (Sealed Secrets)
- [ ] Semantic versioning with traceable Docker images

---

## Next Steps

1. Create `kind-config.yaml`
2. Build Helm chart from docker-compose
3. Install Sealed Secrets + generate sealed secret for `.env`
4. Update Jenkinsfile with new stages
5. Deploy observability stack
6. Test Blue/Green cutover manually
7. Configure ArgoCD + notifications