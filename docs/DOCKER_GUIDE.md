# Docker Deployment Guide

This guide covers deploying ServicePass using Docker and Docker Compose for local development and testing.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Images](#docker-images)
- [Docker Compose](#docker-compose)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 20GB free disk space

### Install Docker

**Windows:**
```powershell
# Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
```

**Linux:**
```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**macOS:**
```bash
# Install using Homebrew
brew install --cask docker
```

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/davelee001/ServicePass.git
cd ServicePass
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.docker.example .env

# Edit .env with your configuration
nano .env
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access Services

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **MongoDB Express**: http://localhost:8081 (dev profile)

### 5. Stop Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Docker Images

### Backend Image

Built from `backend/Dockerfile`:

**Features:**
- Multi-stage build for optimized size
- Node.js 18 Alpine base
- Non-root user for security
- Health check endpoint
- Automatic signal handling with dumb-init

**Build manually:**
```bash
cd backend
docker build -t servicepass/backend:latest .
```

### Frontend Image

Built from `frontend/Dockerfile`:

**Features:**
- Multi-stage build (build + nginx)
- Vite production build
- Nginx Alpine for serving
- Custom nginx configuration
- Security headers enabled
- Gzip compression

**Build manually:**
```bash
cd frontend
docker build -t servicepass/frontend:latest .
```

## Docker Compose

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| mongodb | 27017 | MongoDB database |
| redis | 6379 | Redis cache/queue |
| backend | 3000 | Node.js API server |
| frontend | 3001 (80) | React frontend (nginx) |
| frontend-dev | 5173 | Development server with hot reload |
| mongo-express | 8081 | Database admin UI (dev only) |

### Service Dependencies

```
frontend → backend → mongodb
                  → redis
```

### Volume Mounts

**Persistent Data:**
- `mongodb_data` - Database files
- `mongodb_config` - MongoDB configuration
- `redis_data` - Redis persistence

**Development Mounts:**
- `./backend/src` → `/app/src` - Hot reload backend
- `./frontend` → `/app` - Hot reload frontend

## Configuration

### Environment Variables

Create `.env` file from `.env.docker.example`:

```bash
# Required Variables
MONGODB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-min-32-characters
ENCRYPTION_KEY=your-encryption-key-32-chars-min
QR_SIGNING_SECRET=your-qr-signing-secret
PACKAGE_ID=0x...
ADMIN_CAP_ID=0x...
REGISTRY_ID=0x...
ADMIN_PRIVATE_KEY=suiprivkey...

# Optional Notification Services
EMAIL_SERVICE=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Development Tools
MONGO_EXPRESS_USER=admin
MONGO_EXPRESS_PASSWORD=pass
```

### Custom Configuration

Edit `docker-compose.yml` to customize:

```yaml
services:
  backend:
    environment:
      RATE_LIMIT_MAX_REQUESTS: 200  # Adjust rate limits
      MONGODB_MAX_POOL_SIZE: 20     # Increase pool size
```

## Development Workflow

### Development Mode

Use the `frontend-dev` profile for hot reload:

```bash
# Start with development frontend
docker-compose --profile dev up -d

# Access development server
# Frontend Dev: http://localhost:5173
# MongoDB Express: http://localhost:8081
```

### Watch Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Execute Commands

```bash
# Backend shell
docker-compose exec backend sh

# Run npm commands
docker-compose exec backend npm test

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p $MONGODB_PASSWORD

# Redis CLI
docker-compose exec redis redis-cli
```

### Rebuild Services

```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Database Operations

**Backup:**
```bash
# Create backup
docker-compose exec mongodb mongodump -u admin -p $MONGODB_PASSWORD -o /tmp/backup

# Copy to host
docker cp servicepass-mongodb:/tmp/backup ./mongodb-backup
```

**Restore:**
```bash
# Copy backup to container
docker cp ./mongodb-backup servicepass-mongodb:/tmp/backup

# Restore
docker-compose exec mongodb mongorestore -u admin -p $MONGODB_PASSWORD /tmp/backup
```

### Reset Development Environment

```bash
# Stop and remove everything
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## Production Deployment

### Build Production Images

```bash
# Build backend
docker build -t your-registry/servicepass-backend:v1.0.0 ./backend

# Build frontend
docker build -t your-registry/servicepass-frontend:v1.0.0 ./frontend

# Push to registry
docker push your-registry/servicepass-backend:v1.0.0
docker push your-registry/servicepass-frontend:v1.0.0
```

### Production Compose File

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/servicepass-backend:v1.0.0
    restart: always
    environment:
      NODE_ENV: production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  frontend:
    image: your-registry/servicepass-frontend:v1.0.0
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

### Deploy to Production

```bash
# Deploy with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale backend=5 --scale frontend=3
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
- Missing environment variables
- Port conflicts (check with `netstat -tulpn`)
- Insufficient resources (check with `docker stats`)

### Database Connection Issues

**Test MongoDB connectivity:**
```bash
docker-compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
"
```

**Check MongoDB status:**
```bash
docker-compose exec mongodb mongosh -u admin -p $MONGODB_PASSWORD --eval "db.adminCommand('ping')"
```

### Frontend Can't Reach Backend

**Check network:**
```bash
# List networks
docker network ls

# Inspect network
docker network inspect servicepass_servicepass-network

# Test from frontend container
docker-compose exec frontend curl http://backend:3000/health
```

### High Memory Usage

**Check resource usage:**
```bash
docker stats
```

**Limit resources in docker-compose.yml:**
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Permission Issues

**Fix file permissions:**
```bash
# Backend
sudo chown -R $(id -u):$(id -g) backend/

# Frontend
sudo chown -R $(id -u):$(id -g) frontend/
```

### Clear Cache and Rebuild

```bash
# Remove all stopped containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Remove volumes
docker-compose down -v

# Clear build cache
docker builder prune -a

# Rebuild everything
docker-compose build --no-cache
docker-compose up -d
```

### Health Check Failures

**Manually test health endpoint:**
```bash
docker-compose exec backend curl http://localhost:3000/health
```

**Check health status:**
```bash
docker inspect --format='{{.State.Health.Status}}' servicepass-backend
```

### View Container Details

```bash
# Detailed container info
docker inspect servicepass-backend

# Process list
docker-compose top

# Resource usage
docker stats servicepass-backend
```

## Best Practices

### Security

1. **Never commit `.env` files**
2. **Use secrets management in production** (Docker secrets, Vault)
3. **Run containers as non-root user**
4. **Scan images for vulnerabilities:**
   ```bash
   docker scan servicepass/backend:latest
   ```
5. **Keep base images updated**

### Performance

1. **Use multi-stage builds** (already implemented)
2. **Minimize image layers**
3. **Use `.dockerignore` files** (already implemented)
4. **Enable BuildKit** for faster builds:
   ```bash
   export DOCKER_BUILDKIT=1
   ```

### Monitoring

1. **Enable container logs:**
   ```bash
   docker-compose logs -f --tail=100
   ```

2. **Monitor resource usage:**
   ```bash
   docker stats
   ```

3. **Set up health checks** (already implemented)

### Maintenance

1. **Regular backups:**
   ```bash
   # Automated backup script
   ./scripts/docker-backup.sh
   ```

2. **Update images regularly:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

3. **Clean up unused resources:**
   ```bash
   docker system prune -a
   ```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [ServicePass Kubernetes Guide](../k8s/README.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/davelee001/ServicePass/issues
- Email: david.leekaleer@student.utamu.ac.ug
