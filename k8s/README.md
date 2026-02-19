# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying ServicePass to a production Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured to access your cluster
- Docker images built and pushed to a container registry
- Ingress controller installed (e.g., nginx-ingress)
- cert-manager installed (for TLS certificates)
- Sufficient cluster resources

## Quick Start

### 1. Build and Push Docker Images

```bash
# Build backend
cd backend
docker build -t your-registry/servicepass-backend:latest .
docker push your-registry/servicepass-backend:latest

# Build frontend
cd ../frontend
docker build -t your-registry/servicepass-frontend:latest .
docker push your-registry/servicepass-frontend:latest
```

### 2. Update Image References

Edit `backend.yaml` and `frontend.yaml` to use your registry:

```yaml
spec:
  containers:
  - name: backend
    image: your-registry/servicepass-backend:latest
```

### 3. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 4. Create Secrets

Create secrets with your actual values:

```bash
kubectl create secret generic servicepass-secrets \
  --from-literal=MONGODB_URI='mongodb://admin:password@mongodb-service:27017/servicepass' \
  --from-literal=REDIS_URL='redis://redis-service:6379' \
  --from-literal=JWT_SECRET='your-jwt-secret-min-32-chars' \
  --from-literal=ENCRYPTION_KEY='your-encryption-key-32-chars-min' \
  --from-literal=QR_SIGNING_SECRET='your-qr-signing-secret' \
  --from-literal=PACKAGE_ID='0x...' \
  --from-literal=ADMIN_CAP_ID='0x...' \
  --from-literal=REGISTRY_ID='0x...' \
  --from-literal=ADMIN_PRIVATE_KEY='suiprivkey...' \
  -n servicepass

# Update MongoDB password
kubectl create secret generic mongodb-secret \
  --from-literal=mongodb-password='your-secure-password' \
  -n servicepass
```

### 5. Create ConfigMap

```bash
kubectl apply -f configmap.yaml
```

### 6. Deploy Database and Cache

```bash
# Deploy MongoDB
kubectl apply -f mongodb.yaml

# Deploy Redis
kubectl apply -f redis.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n servicepass --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n servicepass --timeout=300s
```

### 7. Deploy Backend

```bash
kubectl apply -f backend.yaml

# Verify deployment
kubectl get pods -n servicepass -l app=servicepass-backend
kubectl logs -f deployment/servicepass-backend -n servicepass
```

### 8. Deploy Frontend

```bash
kubectl apply -f frontend.yaml

# Verify deployment
kubectl get pods -n servicepass -l app=servicepass-frontend
```

### 9. Configure Ingress

Update `ingress.yaml` with your domain names and apply:

```bash
kubectl apply -f ingress.yaml

# Verify ingress
kubectl get ingress -n servicepass
kubectl describe ingress servicepass-ingress -n servicepass
```

## Deployment Order

Always deploy in this order to ensure dependencies are met:

1. Namespace
2. Secrets and ConfigMap
3. Databases (MongoDB, Redis)
4. Backend
5. Frontend
6. Ingress

## Verification

### Check All Resources

```bash
# View all resources
kubectl get all -n servicepass

# Check pods status
kubectl get pods -n servicepass -o wide

# Check services
kubectl get svc -n servicepass

# Check ingress
kubectl get ingress -n servicepass
```

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/servicepass-backend -n servicepass

# Frontend logs
kubectl logs -f deployment/servicepass-frontend -n servicepass

# MongoDB logs
kubectl logs -f deployment/mongodb -n servicepass

# View logs from all backend pods
kubectl logs -l app=servicepass-backend -n servicepass --tail=100
```

### Test Connectivity

```bash
# Test backend health
kubectl exec -it deployment/servicepass-backend -n servicepass -- curl http://localhost:3000/health

# Test MongoDB connection
kubectl exec -it deployment/mongodb -n servicepass -- mongosh --eval "db.adminCommand('ping')"

# Test Redis connection
kubectl exec -it deployment/redis -n servicepass -- redis-cli ping
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment servicepass-backend --replicas=5 -n servicepass

# Scale frontend
kubectl scale deployment servicepass-frontend --replicas=3 -n servicepass
```

### Auto-scaling

The HorizontalPodAutoscaler is configured in the deployment manifests:

- Backend: 3-10 replicas based on CPU (70%) and Memory (80%)
- Frontend: 2-5 replicas based on CPU (70%)

View autoscaler status:

```bash
kubectl get hpa -n servicepass
kubectl describe hpa servicepass-backend-hpa -n servicepass
```

## Updates and Rollouts

### Update Application

```bash
# Update backend image
kubectl set image deployment/servicepass-backend backend=your-registry/servicepass-backend:v2.0.0 -n servicepass

# Update frontend image
kubectl set image deployment/servicepass-frontend frontend=your-registry/servicepass-frontend:v2.0.0 -n servicepass

# Check rollout status
kubectl rollout status deployment/servicepass-backend -n servicepass
kubectl rollout status deployment/servicepass-frontend -n servicepass
```

### Rollback

```bash
# Rollback backend
kubectl rollout undo deployment/servicepass-backend -n servicepass

# Rollback to specific revision
kubectl rollout undo deployment/servicepass-backend --to-revision=2 -n servicepass

# View rollout history
kubectl rollout history deployment/servicepass-backend -n servicepass
```

## Monitoring

### Resource Usage

```bash
# View resource usage
kubectl top pods -n servicepass
kubectl top nodes

# Describe pod for events
kubectl describe pod <pod-name> -n servicepass
```

### Events

```bash
# View recent events
kubectl get events -n servicepass --sort-by='.lastTimestamp'

# Watch events in real-time
kubectl get events -n servicepass --watch
```

## Backup

### MongoDB Backup

```bash
# Create backup
kubectl exec -it deployment/mongodb -n servicepass -- mongodump --out=/tmp/backup

# Copy backup to local machine
kubectl cp servicepass/mongodb-pod:/tmp/backup ./mongodb-backup
```

### Persistent Volume Snapshots

If using a cloud provider that supports volume snapshots:

```bash
# Create snapshot (example for GKE)
kubectl create volumesnapshot mongodb-snapshot \
  --volume-snapshot-class=pd-snapshot \
  --source=mongodb-pvc \
  -n servicepass
```

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n servicepass

# Check pod logs
kubectl logs <pod-name> -n servicepass

# Get previous container logs if pod crashed
kubectl logs <pod-name> -n servicepass --previous
```

### Database Connection Issues

```bash
# Test MongoDB connectivity
kubectl run -it --rm debug --image=mongo:6.0 --restart=Never -n servicepass -- \
  mongosh mongodb://admin:password@mongodb-service:27017

# Test Redis connectivity
kubectl run -it --rm debug --image=redis:7-alpine --restart=Never -n servicepass -- \
  redis-cli -h redis-service ping
```

### Ingress Issues

```bash
# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/nginx-ingress-controller

# Test service connectivity from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n servicepass -- \
  curl http://servicepass-backend-service:3000/health
```

### Performance Issues

```bash
# Check resource limits
kubectl describe deployment servicepass-backend -n servicepass

# View current resource usage
kubectl top pods -n servicepass

# Check HPA status
kubectl describe hpa servicepass-backend-hpa -n servicepass
```

## Security Best Practices

1. **Secrets Management**: Use external secret management (e.g., HashiCorp Vault, AWS Secrets Manager)
2. **Network Policies**: Implement network policies to restrict pod-to-pod communication
3. **RBAC**: Configure role-based access control for cluster access
4. **Image Security**: Scan images for vulnerabilities before deployment
5. **Resource Limits**: Always set resource requests and limits
6. **Pod Security**: Use Pod Security Policies or Pod Security Standards
7. **TLS Everywhere**: Enable TLS for all services, including internal communication

## Production Recommendations

1. **High Availability**: Run at least 3 replicas of backend
2. **Database**: Use managed database services (e.g., MongoDB Atlas, AWS DocumentDB)
3. **Monitoring**: Set up Prometheus and Grafana for monitoring
4. **Logging**: Use centralized logging (e.g., ELK stack, Loki)
5. **Backup**: Automate regular backups of databases
6. **CI/CD**: Implement automated deployment pipelines
7. **Health Checks**: Ensure all health checks are properly configured
8. **Resource Planning**: Monitor and adjust resource requests/limits based on actual usage

## Clean Up

To remove all ServicePass resources:

```bash
# Delete all resources in namespace
kubectl delete namespace servicepass

# Or delete resources individually
kubectl delete -f ingress.yaml
kubectl delete -f frontend.yaml
kubectl delete -f backend.yaml
kubectl delete -f redis.yaml
kubectl delete -f mongodb.yaml
kubectl delete -f configmap.yaml
kubectl delete secret servicepass-secrets -n servicepass
kubectl delete secret mongodb-secret -n servicepass
kubectl delete -f namespace.yaml
```

## Support

For issues or questions:
- Check logs: `kubectl logs -f deployment/servicepass-backend -n servicepass`
- View events: `kubectl get events -n servicepass`
- GitHub Issues: https://github.com/davelee001/ServicePass/issues
