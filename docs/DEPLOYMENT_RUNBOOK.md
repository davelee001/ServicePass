#  ServicePass Deployment Runbook

**Version**: 1.0.0  
**Last Updated**: February 18, 2026  
**Owner**: DevOps Team - davelee001  
**Status**: Production Ready  
**GitHub**: [davelee001/ServicePass](https://github.com/davelee001/ServicePass)

---

## 🚀 Quick Deployment Guide

**For experienced DevOps engineers - Full deployment in 10 minutes:**

```bash
# 1. Clone and setup
git clone https://github.com/davelee001/ServicePass.git
cd ServicePass

# 2. Deploy smart contracts
cd move && sui client publish --gas-budget 100000000

# 3. Deploy backend
cd ../backend && ./scripts/deploy-production.sh

# 4. Deploy frontend
cd ../frontend && vercel --prod

# 5. Verify
./scripts/verify-deployment.sh
```

**Detailed instructions below** ↓

---

## Deployment Flow Diagram

```mermaid
graph TD
    A[Start Deployment] --> B[Pre-Deployment Checks]
    B --> C{All Checks Pass?}
    C -->|No| B
    C -->|Yes| D[Deploy Smart Contracts]
    D --> E[Verify Blockchain Deployment]
    E --> F{Success?}
    F -->|No| G[Rollback Smart Contracts]
    F -->|Yes| H[Deploy Backend API]
    H --> I[Database Migration]
    I --> J[Deploy Frontend]
    J --> K[Configure CDN]
    K --> L[Post-Deployment Tests]
    L --> M{All Tests Pass?}
    M -->|No| N[Rollback Deployment]
    M -->|Yes| O[Enable Monitoring]
    O --> P[Update DNS]
    P --> Q[Deployment Complete]
    
    G --> R[Investigation Required]
    N --> R
    
    style A fill:#4CAF50
    style Q fill:#2196F3
    style R fill:#f44336
```

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Comparison](#environment-comparison)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Environment Setup](#environment-setup)
5. [Smart Contract Deployment](#smart-contract-deployment)
6. [Backend Deployment](#backend-deployment)
7. [Frontend Deployment](#frontend-deployment)
8. [Database Setup](#database-setup)
9. [Configuration Management](#configuration-management)
10. [Monitoring & Alerting](#monitoring--alerting)
11. [Post-Deployment Verification](#post-deployment-verification)
12. [Rollback Procedures](#rollback-procedures)
13. [Maintenance & Updates](#maintenance--updates)
14. [Troubleshooting](#troubleshooting)
15. [Emergency Procedures](#emergency-procedures)

---

## Overview

This runbook provides comprehensive instructions for deploying and maintaining the ServicePass blockchain-based voucher system across all environments.

### System Components

| Component | Technology | Deployment Target | Scaling Strategy |
|-----------|-----------|-------------------|------------------|
| **Smart Contracts** | Move (SUI) | SUI Blockchain | N/A (Blockchain) |
| **Backend API** | Node.js 18+ | AWS EC2 / Heroku | Horizontal (Load Balanced) |
| **Frontend** | React 18 + Vite | Vercel / Netlify | Edge Network (Global CDN) |
| **Database** | MongoDB 6.0+ | MongoDB Atlas | Replica Set (3 nodes) |
| **Redis** | Redis 7.0+ | Redis Cloud / ElastiCache | Master-Replica |
| **CDN** | CloudFlare | Global Edge | Auto-scaling |

### Deployment Timeline

| Phase | Duration | Description | Team Size |
|-------|----------|-------------|-----------|
| **Pre-Deploy** | 4 hours | Setup, testing, preparations | 3-4 engineers |
| **Smart Contracts** | 1 hour | Blockchain deployment | 2 engineers |
| **Backend** | 2 hours | API server deployment | 2-3 engineers |
| **Frontend** | 1 hour | Web app deployment | 1-2 engineers |
| **Verification** | 2 hours | Testing & validation | Full team |
| **Total** | **10 hours** | Complete deployment | 4-6 engineers |

---

## Environment Comparison

### Infrastructure Matrix

| Environment | Purpose | Users | Uptime SLA | Data Persistence | Cost/Month |
|-------------|---------|-------|------------|------------------|------------|
| **Development** | Feature development | Engineers only | No SLA | Temporary | $50 |
| **Staging** | Pre-production testing | QA + Engineers | 95% | 30 days | $200 |
| **Production** | Live system | All users | 99.9% | Permanent | $1,500+ |

### Environment Configuration

| Component | Development | Staging | Production |
|-----------|------------|---------|------------|
| **Backend** | Single instance | 2 instances | 4+ instances (auto-scale) |
| **Database** | Single node | Replica set (2) | Replica set (3) + backup |
| **Redis** | Single instance | Single instance | Master + 2 replicas |
| **CDN** | Local only | Regional | Global |
| **SSL** | Self-signed | Let's Encrypt | Commercial cert |
| **Monitoring** | Basic logs | DataDog Free | DataDog Pro |
| **Backups** | None | Daily | Hourly + Point-in-time |

### Network Configuration

```mermaid
graph TB
    subgraph Production
        LB[Load Balancer] --> API1[API Server 1]
        LB --> API2[API Server 2]
        LB --> API3[API Server 3]
        API1 --> DB[(MongoDB Cluster)]
        API2 --> DB
        API3 --> DB
        API1 --> Cache[Redis Cluster]
        API2 --> Cache
        API3 --> Cache
    end
    
    subgraph Staging
        ST_API[API Server] --> ST_DB[(MongoDB)]
        ST_API --> ST_Cache[Redis]
    end
    
    subgraph Development
        DEV_API[API Server] --> DEV_DB[(Local MongoDB)]
    end
    
    CDN[CloudFlare CDN] --> LB
    CDN --> ST_API
```

---

## Pre-Deployment Checklist

### Administrative Tasks

- [ ] **Deployment Window Scheduled**
  - Date and time confirmed (off-peak hours)
  - Stakeholders notified (48 hours advance)
  - Maintenance window announced (user notification)
  - Change request ticket created
  
- [ ] **Team Assembled**
  - Deployment lead assigned
  - Technical team on standby
  - Support team briefed
  - Incident commander designated
  
- [ ] **Approvals Obtained**
  - Security audit approved
  - Compliance clearance
  - Executive sign-off
  - Budget approval for infrastructure
  
- [ ] **Documentation Updated**
  - API documentation current
  - User guides finalized
  - Merchant onboarding ready
  - Release notes prepared

### Technical Requirements

- [ ] **Infrastructure Provisioned**
  - Cloud accounts created
  - DNS configured
  - SSL certificates obtained
  
- [ ] **Credentials Secured**
  - API keys generated
  - Private keys secured
  - Passwords documented
  
- [ ] **Backups Verified**
  - Database backup tested
  - Configuration backup created
  - Rollback plan documented
  
- [ ] **Testing Complete**
  - Unit tests passing (100%)
  - Integration tests passing
  - Security scan clean
  - Performance tests passed

### Environment Access

- [ ] **SUI Blockchain**
  - Wallet funded with SUI tokens
  - CLI configured
  - Network access verified
  
- [ ] **AWS/Cloud Provider**
  - IAM roles configured
  - VPC and security groups set
  - Load balancer ready
  
- [ ] **MongoDB Atlas**
  - Cluster provisioned
  - Security configured
  - Backups enabled
  
- [ ] **Domain & CDN**
  - DNS records ready
  - SSL certificates installed
  - CDN configured

---

## Environment Setup

### Supported Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Development** | Active development | http://localhost:3000 |
| **Staging** | Pre-production testing | https://staging.servicepass.io |
| **Production** | Live system | https://app.servicepass.io |

### Environment Configuration

Each environment requires:

1. **Unique blockchain objects** (different Package IDs, Admin Caps)
2. **Separate databases** (isolated data)
3. **Distinct API keys** (environment-specific)
4. **Different credentials** (no shared secrets)

---

## Smart Contract Deployment

### Prerequisites

```bash
# Install SUI CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# Verify installation
sui --version
# Expected: sui 1.18.0 or higher

# Configure wallet
sui client
```

### Step 1: Network Configuration

**For Testnet:**
```bash
sui client new-env --alias testnet \
  --rpc https://fullnode.testnet.sui.io:443
  
sui client switch --env testnet
```

**For Mainnet:**
```bash
sui client new-env --alias mainnet \
  --rpc https://fullnode.mainnet.sui.io:443
  
sui client switch --env mainnet
```

### Step 2: Wallet Setup

```bash
# Check active address
sui client active-address

# Check gas balance (need at least 1 SUI)
sui client gas

# If insufficient, get testnet tokens
curl --location --request POST \
  'https://faucet.testnet.sui.io/gas' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "FixedAmountRequest": { "recipient": "<YOUR_ADDRESS>" }}'
```

### Step 3: Build Contract

```bash
cd move/

# Build the package
sui move build

# Expected output:
# BUILDING sui_voucher_system
# Successfully verified dependencies on-chain against source.
```

### Step 4: Test Contract

```bash
# Run all tests
sui move test

# Expected: All tests passing
# Test result: OK. Total tests: 48; passed: 48; failed: 0
```

### Step 5: Deploy to Blockchain

**Testnet Deployment:**
```bash
sui client publish --gas-budget 100000000

# Save the output - you'll need:
# - Package ID
# - Admin Cap ID
# - Merchant Registry ID
```

**Example Output:**
```
----- Transaction Effects ----
Status : Success
Created Objects:
  - ObjectID: 0xabc123def456... (Package)
  - ObjectID: 0x456def789abc... (AdminCap)
  - ObjectID: 0x789abc012def... (MerchantRegistry)

Transaction Digest: AbCdEf123456789...
```

**Mainnet Deployment:**
```bash
# Double-check you're on mainnet
sui client active-env

# Deploy with higher gas budget for safety
sui client publish --gas-budget 200000000 --gas <COIN_OBJECT_ID>

# IMMEDIATELY SAVE ALL OBJECT IDs
```

### Step 6: Verify Deployment

```bash
# Verify package exists
sui client object <PACKAGE_ID>

# Verify AdminCap
sui client object <ADMIN_CAP_ID>

# Verify MerchantRegistry
sui client object <REGISTRY_ID>

# Test minting a voucher
sui client call \
  --package <PACKAGE_ID> \
  --module voucher_system \
  --function mint_voucher \
  --args <ADMIN_CAP_ID> 1000 0 <RECIPIENT_ADDRESS> <EXPIRY_TIMESTAMP> \
  --gas-budget 10000000
```

### Step 7: Document Deployment

Create deployment record:

```yaml
# deployment-record.yml
deployment_date: "2026-02-16T10:00:00Z"
network: mainnet
package_id: "0xabc123def456..."
admin_cap_id: "0x456def789abc..."
registry_id: "0x789abc012def..."
deployer_address: "0x012def345abc..."
transaction_digest: "AbCdEf123456789..."
gas_used: 95234156
```

---

## Backend Deployment

### Prerequisites

```bash
# Node.js 18+
node --version

# npm or yarn
npm --version

# Git
git --version
```

### Step 1: Clone Repository

```bash
git clone https://github.com/davelee001/ServicePass.git
cd ServicePass/backend
```

### Step 2: Install Dependencies

```bash
npm install

# Or with yarn
yarn install

# Verify no vulnerabilities
npm audit
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Required Environment Variables:**

```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_URL=https://api.servicepass.io

# Blockchain Configuration
PACKAGE_ID=0xabc123def456...
ADMIN_CAP_ID=0x456def789abc...
REGISTRY_ID=0x789abc012def...
ADMIN_PRIVATE_KEY=suiprivkey1q...
SUI_NETWORK=mainnet
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443

# Database Configuration
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/servicepass
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000

# Redis Configuration
REDIS_URL=redis://user:pass@redis-host:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Security
ENCRYPTION_KEY=32-char-encryption-key-here
QR_SIGNING_SECRET=qr-code-signing-secret-key
ALLOWED_ORIGINS=https://app.servicepass.io,https://www.servicepass.io

# Notification Services (Optional)
# Email (Nodemailer)
EMAIL_SERVICE=gmail
SMTP_USER=support@servicepass.io
SMTP_PASS=app-specific-password
SMTP_FROM="ServicePass <support@servicepass.io>"

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=servicepass-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase@servicepass.iam.gserviceaccount.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Archival
REDEMPTION_ARCHIVE_AFTER_DAYS=90
REDEMPTION_ARCHIVE_BATCH_SIZE=1000

# Monitoring (Optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
```

### Step 4: Database Migration

```bash
# Run database initialization script
node scripts/initDatabase.js

# Create admin user
node scripts/createAdmin.js admin@servicepass.io SecurePass123 "System Admin"

# Verify database connection
npm run db:check
```

### Step 5: Build Application

```bash
# Run tests
npm test

# Build if using TypeScript
npm run build

# Verify build
ls dist/
```

### Step 6: Deploy to Server

**Option A: AWS EC2**

```bash
# SSH into server
ssh -i key.pem ubuntu@ec2-server.amazonaws.com

# Clone repository
git clone https://github.com/davelee001/ServicePass.git
cd ServicePass/backend

# Install dependencies
npm ci --production

# Copy environment file (upload separately)
nano .env

# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name servicepass-api

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup systemd

# Check status
pm2 status
```

**Option B: Heroku**

```bash
# Login to Heroku
heroku login

# Create app
heroku create servicepass-api-prod

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set PACKAGE_ID=0xabc123...
# ... set all other variables

# Deploy
git push heroku main

# Check logs
heroku logs --tail

# Scale dynos
heroku ps:scale web=2
```

**Option C: Docker**

```bash
# Build Docker image
docker build -t servicepass-api:latest .

# Run container
docker run -d \
  --name servicepass-api \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  servicepass-api:latest

# Check logs
docker logs -f servicepass-api
```

### Step 7: Configure Reverse Proxy

**Nginx Configuration:**

```nginx
# /etc/nginx/sites-available/servicepass-api

server {
    listen 80;
    server_name api.servicepass.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.servicepass.io;

    ssl_certificate /etc/letsencrypt/live/api.servicepass.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.servicepass.io/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/servicepass-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 8: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.servicepass.io

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Frontend Deployment

### Prerequisites

```bash
# Node.js 18+
node --version

# npm or yarn
npm --version
```

### Step 1: Clone & Install

```bash
cd ServicePass/frontend

npm install

# Or with yarn
yarn install
```

### Step 2: Configure Environment

```bash
# Create production environment file
cp .env.example .env.production
```

**Production Environment:**

```env
# API Configuration
VITE_API_URL=https://api.servicepass.io/api
VITE_API_TIMEOUT=30000

# Blockchain Configuration
VITE_SUI_NETWORK=mainnet
VITE_PACKAGE_ID=0xabc123def456...

# Application Configuration
VITE_APP_NAME=ServicePass
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# External Services
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Optional
VITE_CDN_URL=https://cdn.servicepass.io
```

### Step 3: Build Application

```bash
# Build for production
npm run build

# Verify build
ls dist/

# Expected: 
# dist/
# ├── assets/
# ├── index.html
# └── .vite manifest files
```

### Step 4: Deploy

**Option A: Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Expected output provides deployment URL
```

**Vercel Configuration (vercel.json):**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ],
  "env": {
    "VITE_API_URL": "@servicepass-api-url",
    "VITE_PACKAGE_ID": "@servicepass-package-id"
  }
}
```

**Option B: Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Netlify Configuration (netlify.toml):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  VITE_API_URL = "https://api.servicepass.io/api"
  VITE_PACKAGE_ID = "0xabc123def456..."
```

**Option C: AWS S3 + CloudFront**

```bash
# Build application
npm run build

# Install AWS CLI
pip install awscli

# Configure AWS CLI
aws configure

# Create S3 bucket
aws s3 mb s3://servicepass-frontend-prod

# Enable static website hosting
aws s3 website s3://servicepass-frontend-prod \
  --index-document index.html \
  --error-document index.html

# Upload files
aws s3 sync dist/ s3://servicepass-frontend-prod \
  --delete \
  --cache-control max-age=31536000,public \
  --exclude "index.html"

# Upload index.html without caching
aws s3 cp dist/index.html s3://servicepass-frontend-prod/index.html \
  --cache-control max-age=0,no-cache,no-store,must-revalidate

# Configure CloudFront distribution
# (Use AWS Console or CLI)
```

### Step 5: Configure CDN

**CloudFlare Setup:**

1. Add domain to CloudFlare
2. Configure DNS records:
   ```
   Type: CNAME
   Name: app
   Target: servicepass-frontend.vercel.app
   Proxy: Enabled (Orange Cloud)
   ```
3. Enable HTTPS/SSL
4. Configure caching rules:
   - Cache everything
   - Edge cache TTL: 1 month
   - Browser cache TTL: 4 hours
5. Enable minification (HTML, CSS, JS)

---

## Database Setup

### MongoDB Atlas Configuration

### Step 1: Create Cluster

1. Log into MongoDB Atlas
2. Create new cluster:
   ```
   Cloud Provider: AWS
   Region: us-east-1
   Tier: M10 (minimum for production)
   Cluster Name: servicepass-prod
   ```

### Step 2: Configure Security

**Network Access:**
```
# Add IP whitelist
0.0.0.0/0 (For global access)

# Or restrict to specific IPs
54.123.45.67/32 (Your server IP)
```

**Database User:**
```
Username: servicepass_app
Password: [Generate strong password]
Roles: readWrite on servicepass database
```

### Step 3: Create Database & Collections

```javascript
// Connect with MongoDB Compass or mongo shell

use servicepass;

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "role", "walletAddress"],
      properties: {
        email: { bsonType: "string" },
        password: { bsonType: "string" },
        role: { enum: ["user", "merchant", "admin"] }
       }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ walletAddress: 1 }, { unique: true });

db.vouchers.createIndex({ voucherId: 1 }, { unique: true });
db.vouchers.createIndex({ ownerAddress: 1 });
db.vouchers.createIndex({ status: 1 });
db.vouchers.createIndex({ expiryDate: 1 });

db.redemptions.createIndex({ voucherId: 1 });
db.redemptions.createIndex({ merchantId: 1 });
db.redemptions.createIndex({ createdAt: -1 });

db.merchants.createIndex({ merchantId: 1 }, { unique: true });
db.merchants.createIndex({ walletAddress: 1 }, { unique: true });
```

### Step 4: Enable Backups

```
# In MongoDB Atlas Console:
1. Go to Cluster > Backup
2. Enable Continuous Backups
3. Configure snapshot schedule:
   - Hourly: Keep 24
   - Daily: Keep 7
   - Weekly: Keep 4
   - Monthly: Keep 12
4. Set retention policy
```

### Step 5: Configure Monitoring

```
# Enable Atlas monitoring:
1. Real-time Performance Panel
2. Query Performance Advisor
3.Alerts:
   - High CPU usage (>80%)
   - High disk usage (>80%)
   - Connection spikes
   - Query performance degradation
```

---

## Configuration Management

### Environment Variables Management

**Production Checklist:**

```bash
# ✅ Verify all required variables set
env | grep -E "MONGODB_URI|PACKAGE_ID|JWT_SECRET|ADMIN_PRIVATE_KEY"

# ✅ Check no development values
env | grep -v "localhost|test|development"

# ✅ Verify secrets are secure (not in code)
grep -r "MONGODB_URI\|JWT_SECRET" .git || echo"No secrets in git"

# ✅ Backup environment configuration
cp .env .env.backup.$(date +%Y%m%d)
```

### Secrets Management

**AWS Secrets Manager:**

```bash
# Store admin private key
aws secretsmanager create-secret \
  --name servicepass/prod/admin-private-key \
  --secret-string "suiprivkey1q..."

# Store JWT secret
aws secretsmanager create-secret \
  --name servicepass/prod/jwt-secret \
  --secret-string "your-jwt-secret"

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id servicepass/prod/admin-private-key \
  --query SecretString \
  --output text
```

**HashiCorp Vault:**

```bash
# Store secrets
vault kv put secret/servicepass/prod \
  admin_private_key="suiprivkey1q..." \
  jwt_secret="your-jwt-secret"

# Retrieve secrets
vault kv get -field=admin_private_key secret/servicepass/prod
```

---

## Monitoring & Alerting

### Application Monitoring

**PM2 Monitoring:**

```bash
# View logs
pm2 logs servicepass-api

# Monitor resources
pm2 monit

# Generate report
pm2 report
```

**Custom Health Checks:**

```bash
# Create healthcheck script
cat > healthcheck.sh <<'EOF'
#!/bin/bash

API_URL="https://api.servicepass.io"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)

if [ $RESPONSE -eq 200 ]; then
  echo "✅ API is healthy"
  exit 0
else
  echo "❌ API is down (HTTP $RESPONSE)"
  exit 1
fi
EOF

chmod +x healthcheck.sh

# Run every 5 minutes with cron
crontab -e
*/5 * * * * /path/to/healthcheck.sh
```

### Blockchain Monitoring

**Event Monitor Script:**

```javascript
// monitor-events.js
const { SuiClient } = require('@mysten/sui.js/client');

const client = new SuiClient({ url: process.env.SUI_RPC_URL });
const packageId = process.env.PACKAGE_ID;

async function monitorEvents() {
  const events = await client.queryEvents({
    query: { MoveModule: { package: packageId, module: 'voucher_system' } },
    limit: 100
  });

  events.data.forEach(event => {
    console.log(`[${event.type}]`, event.parsedJson);
    
    // Send alerts for suspicious activity
    if (event.type.includes('VoucherMinted') && event.parsedJson.amount > 10000) {
      sendAlert('Large voucher minted: ' + event.parsedJson.amount);
    }
  });
}

setInterval(monitorEvents, 60000); // Every minute
```

### Alerting Setup

**Slack Integration:**

```javascript
// alerts.js
const axios = require('axios');

async function sendSlackAlert(message) {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `🚨 ServicePass Alert: ${message}`,
    channel: '#servicepass-alerts'
  });
}

// Usage
sendSlackAlert('Database connection lost');
```

**Email Alerts:**

```javascript
const nodemailer = require('nodemailer');

async function sendEmailAlert(subject, message) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_PASSWORD
    }
  });

  await transporter.sendMail({
    from: 'alerts@servicepass.io',
    to: 'admin@servicepass.io',
    subject: `[ServicePass] ${subject}`,
    text: message
  });
}
```

### Logging

**Structured Logging with Winston:**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'servicepass-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// In production, also log to CloudWatch or similar
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## Post-Deployment Verification

### Verification Checklist

```bash
# ✅ 1. Smart Contract Verification
sui client object $PACKAGE_ID
# Expected: Package object details

# ✅ 2. Backend API Verification
curl https://api.servicepass.io/health
# Expected: {"status":"ok","timestamp":"..."}

# ✅ 3. Frontend Verification
curl -I https://app.servicepass.io
# Expected: HTTP/2 200

# ✅ 4. Database Verification
mongo "$MONGODB_URI" --eval "db.runCommand({ ping: 1 })"
# Expected: { ok: 1 }

# ✅ 5. Redis Verification
redis-cli -u "$REDIS_URL" ping
# Expected: PONG

# ✅ 6. SSL Verification
echo | openssl s_client -connect api.servicepass.io:443 2>/dev/null | openssl x509 -noout -dates
# Expected: Valid certificate dates

# ✅ 7. DNS Verification
dig app.servicepass.io +short
nslookup api.servicepass.io

# ✅ 8. CDN Verification
curl -I https://cdn.servicepass.io/assets/logo.png
# Expected: CDN headers present
```

### Functional Testing

**Test Scenarios:**

```bash
# 1. User Registration
curl -X POST https://api.servicepass.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User",
    "walletAddress": "0x123..."
  }'

# 2. User Login
curl -X POST https://api.servicepass.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# 3. Get Vouchers (with auth token)
curl -X GET https://api.servicepass.io/api/vouchers/owner/0x123... \
  -H "Authorization: Bearer <token>"

# 4. Health Check
curl https://api.servicepass.io/health
```

### Performance Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API performance
ab -n 1000 -c 10 https://api.servicepass.io/health
# Expected: >100 requests/second

# Test with authentication
ab -n 100 -c 5 -H "Authorization: Bearer <token>" \
  https://api.servicepass.io/api/vouchers/owner/0x123...
```

### Load Testing

```javascript
// loadtest.js
const autocannon = require('autocannon');

autocannon({
  url: 'https://api.servicepass.io',
  connections: 100,
  duration: 30,
  requests: [
    {
      method: 'GET',
      path: '/health'
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'pass' })
    }
  ]
}, console.log);
```

---

## Rollback Procedures

### Rollback Decision Criteria

Execute rollback if:
- ❌ Critical functionality broken
- ❌ Data loss occurring
- ❌ Security vulnerability exposed
- ❌ Performance degraded >50%
- ❌ Error rate >5%

### Rollback Steps

#### 1. Backend Rollback

```bash
# PM2 rollback
pm2 stop servicepass-api
git checkout <previous_commit>
npm install
pm2 start servicepass-api
pm2 logs --err

# Or with backup
cp -r /backup/servicepass-api-YYYYMMDD/* /var/www/servicepass-api/
pm2 restart servicepass-api
```

#### 2. Frontend Rollback

**Vercel:**
```bash
# Find previous deployment
vercel list

# Rollback to specific deployment
vercel rollback <deployment-url>
```

**S3/CloudFront:**
```bash
# Restore from backup
aws s3 sync s3://servicepass-frontend-backup/YYYYMMDD/ \
  s3://servicepass-frontend-prod/ \
  --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123ABC456DEF \
  --paths "/*"
```

#### 3. Database Rollback

```bash
# Restore from Atlas snapshot
# 1. Go to Atlas Console
# 2. Select Cluster > Backup
# 3. Choose snapshot
# 4. Click "Restore"
# 5. Select "Download" or "Restore to Cluster"

# Or restore from backup file
mongorestore --uri="$MONGODB_URI" \
  --drop \
  /backup/mongodb-YYYYMMDD/
```

#### 4. Smart Contract **Cannot be Rolled Back**

⚠️ **Smart contracts are immutable!**

Alternative actions:
1. Deploy new version with fixes
2. Update backend to use new package ID
3. Migrate data to new contract
4. Communicate changes to users

---

## Maintenance & Updates

### Regular Maintenance Tasks

**Daily:**
```bash
# Check system health
./healthcheck.sh

# Review logs for errors
pm2 logs --err | grep -i error

# Monitor disk space
df -h

# Check database performance
mongo "$MONGODB_URI" --eval "db.currentOp()"
```

**Weekly:**
```bash
# Update dependencies
npm outdated
npm update

# Review security advisories
npm audit

# Analyze logs
journalctl -u servicepass-api --since "7 days ago" | grep ERROR

# Review analytics
# (Check dashboard for unusual patterns)
```

**Monthly:**
```bash
# Rotate logs
logrotate /etc/logrotate.d/servicepass-api

# Review and optimize database
mongo "$MONGODB_URI" --eval "db.collection.stats()"

# Update SSL certificates if needed
certbot renew

# Review and archive old data
node scripts/archiveRedemptions.js
```

**Quarterly:**
```bash
# Security audit
npm audit fix

# Performance review
# Analyze response times, optimize queries

# Backup verification
# Restore backup to staging, verify integrity

# Disaster recovery drill
# Practice full system restore
```

### Update Procedures

**Minor Updates (Bug Fixes):**

```bash
# 1. Test in staging
git checkout staging
git pull origin main
npm test
npm run deploy:staging

# 2. Verify in staging
curl https://staging.servicepass.io/health

# 3. Deploy to production
git checkout main
npm run deploy:production

# 4. Monitor logs
pm2 logs --lines 100
```

**Major Updates (New Features):**

```bash
# 1. Create maintenance window
# Announce to users 48 hours in advance

# 2. Backup everything
mongodump --uri="$MONGODB_URI" --out=/backup/pre-update-$(date +%Y%m%d)
cp -r /var/www/servicepass-api /backup/servicepass-api-$(date +%Y%m%d)

# 3. Test extensively in staging
npm run test:integration
npm run test:e2e

# 4. Deploy with monitoring
pm2 deploy ecosystem.config.js production

# 5. Verify and monitor
watch -n 1 'curl -s https://api.servicepass.io/health'

# 6. Announce completion
# Send notification to users
```

---

## Troubleshooting

### Common Issues

#### Issue: API Not Responding

**Symptoms:**
- 502 Bad Gateway
- Connection timeout
- No response from server

**Diagnosis:**
```bash
# Check if process is running
pm2 status

# Check logs
pm2 logs servicepass-api --err

# Check port availability
netstat -tulpn | grep 3000

# Check system resources
top
df -h
```

**Solutions:**
```bash
# Restart application
pm2 restart servicepass-api

# If crashed, check error logs
pm2 logs --err

# If out of memory, increase limit
pm2 start server.js --max-memory-restart 1G

# If port conflict, kill conflicting process
lsof -ti:3000 | xargs kill -9
```

#### Issue: Database Connection Failure

**Symptoms:**
- "MongoNetworkError"
- "connection timed out"
- Slow queries

**Diagnosis:**
```bash
# Test connection
mongo "$MONGODB_URI" --eval "db.runCommand({ ping: 1 })"

# Check network
ping cluster.mongodb.net

# Check IP whitelist (Atlas)
curl ipinfo.io/ip
```

**Solutions:**
```bash
# Update connection string
# Add current IP to Atlas whitelist
# Increase timeout in connection string:
MONGODB_URI="mongodb+srv://...?serverSelectionTimeoutMS=10000"

# Restart application
npm restart
```

#### Issue: Blockchain Transaction Failures

**Symptoms:**
- "Insufficient gas"
- "Transaction expired"
- "Object not found"

**Diagnosis:**
```bash
# Check wallet balance
sui client gas

# Check network status
curl https://fullnode.mainnet.sui.io:443 -d '{"jsonrpc":"2.0","method":"sui_getTotalTransactionNumber","params":[],"id":1}'

# Check transaction
sui client tx-history
```

**Solutions:**
```bash
# Add more gas
sui client gas --address <admin_wallet>

# Increase gas budget
# In code: --gas-budget 200000000

# Retry transaction
# Use exponential backoff
```

---

## Emergency Procedures

### Security Incidents

**If API Key Compromised:**

```bash
# 1. Immediately revoke all API keys
curl -X DELETE https://api.servicepass.io/api/merchants/ALL/api-keys \
  -H "Authorization: Bearer <admin_token>"

# 2. Generate new keys
# Contact all merchants with new keys

# 3. Review access logs
grep "suspicious_pattern" /var/log/servicepass/*.log

# 4. Change all secrets
# Update JWT_SECRET, ENCRYPTION_KEY, QR_SIGNING_SECRET

# 5. Force logout all users
redis-cli FLUSHDB

# 6. Notify affected parties
# Send security notification emails
```

**If Database Breach Suspected:**

```bash
# 1. Isolate database
# Remove from IP whitelist temporarily

# 2. Review recent activity
mongo "$MONGODB_URI" --eval "db.getCollectionNames().forEach(c => 
  print(c, db[c].find({}, {password:0}).sort({_id:-1}).limit(5)))"

# 3. Reset all passwords
# Force password reset for all users

# 4. Enable additional security
# Enable encryption at rest
# Enable audit logging
# Enable IP access controls

# 5. Forensics
# Preserve logs
# Contact security team
# File incident report
```

### High Traffic Events

**If Experiencing DDoS:**

```bash
# 1. Enable rate limiting
# Update NGINX configuration
limit_req_zone $binary_remote_addr zone=servicepass:10m rate=10r/m;

# 2. Enable CloudFlare DDoS protection
# Use "Under Attack" mode temporarily

# 3. Scale up resources
# Add more backend instances
pm2 scale servicepass-api +3

# 4. Enable caching
# Cache frequent requests

# 5. Block malicious IPs
# Use fail2ban or manual blocks
iptables -A INPUT -s malicious.ip.address -j DROP
```

### Data Loss Prevention

**If Experiencing Data Loss:**

```bash
# 1. STOP ALL WRITES immediately
pm2 stop servicepass-api

# 2. Assess damage
mongo "$MONGODB_URI" --eval "db.stats()"

# 3Restore from latest backup
mongorestore --uri="$MONGODB_URI" \
  --drop \
  /backup/latest/

# 4. Verify restoration
# Check critical data integrity

# 5. Resume operations
pm2 start servicepass-api

# 6. Post-incident review
# Identify root cause
# Implement preventive measures
```

###Contact Information

**Emergency Contacts:**

| Role | Name | Contact |
|------|------|---------|
| **DevOps Lead** | Alex Kimani | +256-700-111-222 |
| **CTO** | David Leekaleer | +256-700-333-444 |
| **Security** | Sarah Mutua | +256-700-555-666 |
| **Database Admin** | John Mburu | +256-700-777-888 |

**Escalation Path:**
1. Level 1: DevOps Team → Response within 15 minutes
2. Level 2: Engineering Lead → Response within 30 minutes
3. Level 3: CTO → Response within 1 hour
4. Level 4: Executive Team → Response within 2 hours

**24/7 Emergency Hotline:** +256-700-SERVICEPASS

---

## Appendices

### A. Environment Variables Reference

Complete list of all environment variables: [See Backend Deployment](#step-3-configure-environment)

### B. Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Backend API | 3000 | HTTP/HTTPS |
| MongoDB | 27017 | TCP |
| Redis | 6379 | TCP |
| Nginx | 80, 443 | HTTP/HTTPS |

### C. File Locations

```
Production Server:
├── /var/www/servicepass-api/       # Backend code
├── /var/log/servicepass/           # Application logs
├── /etc/nginx/sites-available/     # Nginx config
├── /backup/                        # Backup files
└── ~/.pm2/                         # PM2 configuration

Backups:
├── /backup/mongodb-YYYYMMDD/       # Database backups
├── /backup/servicepass-api-YYYYMMDD/  # Code backups
└── /backup/configs/                # Configuration backups
```

### D. Useful Commands Reference

```bash
# System Health
pm2 status
df -h
free -h
top

# Application
pm2 logs servicepass-api
pm2 monit
pm2 restart servicepass-api

# Database
mongo "$MONGODB_URI" --eval "db.stats()"
mongodump --uri="$MONGODB_URI"

# Blockchain
sui client gas
sui client object <OBJECT_ID>

# Logs
tail -f /var/log/servicepass/api.log
journalctl -u servicepass-api -f

# Network
netstat -tulpn
curl -I https://api.servicepass.io
```

---

## Document Maintenance

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | Feb 10, 2026 | A. Kimani | Initial draft |
| 0.5 | Feb 13, 2026 | D. Leekaleer | Added procedures |
| 1.0 | Feb 16, 2026 | DevOps Team | Final review |

**Next Review Date:** May 16, 2026

**Owner:** DevOps Team  
**Approver:** CTO

---

*This runbook is a living document and should be updated as the system evolves.*

*Last Updated: February 16, 2026*
