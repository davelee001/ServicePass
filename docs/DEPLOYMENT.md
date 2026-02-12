# ServicePass Deployment Guide

## Prerequisites

1. **SUI Wallet Setup**
   - Install SUI CLI: `cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui`
   - Create new wallet: `sui client new-address ed25519`
   - Get testnet tokens: https://discord.com/channels/916379725201563759/971488439931392130

2. **Environment Setup**
   - Node.js >= 18.x
   - MongoDB (local or cloud)
   - Git

## Step 1: Deploy Smart Contract to SUI

### Build the Contract

```bash
cd ServicePass
sui move build
```

### Test the Contract

```bash
sui move test
```

### Deploy to Testnet

```bash
sui client publish --gas-budget 100000000
```

**Save these values from the output:**
- Package ID
- AdminCap Object ID
- VoucherRegistry Object ID

Example output:
```
╭─────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                        │
│  ┌──                                                                    │
│  │ ObjectID: 0xADMIN_CAP_ID                                            │
│  │ Sender: 0x...                                                       │
│  │ ObjectType: 0xPACKAGE_ID::voucher_system::AdminCap                 │
│  └──                                                                    │
│  ┌──                                                                    │
│  │ ObjectID: 0xREGISTRY_ID                                             │
│  │ Sender: 0x...                                                       │
│  │ ObjectType: 0xPACKAGE_ID::voucher_system::VoucherRegistry          │
│  └──                                                                    │
╰─────────────────────────────────────────────────────────────────────────╯
```

## Step 2: Configure Backend

### Install Dependencies

```bash
cd backend
npm install
```

### Create Environment File

```bash
cp .env.example .env
```

### Edit .env

```env
PORT=3000
NODE_ENV=production

# From SUI deployment
SUI_NETWORK=testnet
PACKAGE_ID=0xYOUR_PACKAGE_ID
ADMIN_CAP_ID=0xYOUR_ADMIN_CAP_ID
REGISTRY_ID=0xYOUR_REGISTRY_ID
ADMIN_PRIVATE_KEY=YOUR_BASE64_PRIVATE_KEY

# Database
MONGODB_URI=mongodb://localhost:27017/servicepass

LOG_LEVEL=info
```

### Get Admin Private Key

```bash
# Export keystore
sui keytool export --key-identity YOUR_ADDRESS

# This will output base64 encoded private key
# Copy this to ADMIN_PRIVATE_KEY in .env
```

## Step 3: Start MongoDB

### Local MongoDB

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongodb
```

### Or use MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update MONGODB_URI in .env

## Step 4: Run Backend Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## Step 5: Test the System

### 1. Register a Test Merchant

```bash
curl -X POST http://localhost:3000/api/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "TEST_MERCHANT_001",
    "name": "Test Merchant",
    "walletAddress": "0xYOUR_TEST_WALLET",
    "voucherTypesAccepted": [1, 2, 3, 4],
    "contactEmail": "test@merchant.com"
  }'
```

### 2. Mint a Test Voucher

```bash
curl -X POST http://localhost:3000/api/vouchers/mint \
  -H "Content-Type: application/json" \
  -d '{
    "voucherType": 1,
    "amount": 1000,
    "recipient": "0xRECIPIENT_ADDRESS",
    "merchantId": "TEST_MERCHANT_001",
    "expiryTimestamp": 9999999999,
    "metadata": "Test voucher"
  }'
```

### 3. Check Voucher on SUI Explorer

Visit: https://suiexplorer.com/?network=testnet
Search for the transaction digest from step 2

## Step 6: Production Deployment

### Option A: Deploy on VPS (DigitalOcean, AWS, etc.)

1. Clone repository
2. Install dependencies
3. Configure environment
4. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start src/server.js --name servicepass-backend
pm2 save
pm2 startup
```

### Option B: Deploy using Docker

```bash
# Create Dockerfile
docker build -t servicepass-backend .
docker run -d -p 3000:3000 --env-file .env servicepass-backend
```

### Option C: Deploy on Vercel/Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy

## Monitoring & Maintenance

### Check Backend Logs

```bash
# Using PM2
pm2 logs servicepass-backend

# Using Docker
docker logs -f container_id
```

### Monitor Blockchain Events

Set up event listener to track:
- Voucher minting events
- Redemption events
- Merchant registrations

### Database Backups

For production deployments you should automate regular MongoDB backups and
store them in a secure, off-site location.

```bash
# On-demand MongoDB backup (local example)
mongodump --uri="mongodb://localhost:27017/servicepass" --out=./backup

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/servicepass" ./backup/servicepass
```

Recommended practices:
- Use your cloud provider or MongoDB Atlas automated backups where possible.
- Schedule nightly backups (e.g. via cron) and keep at least 7–30 days of history.
- Store backups in encrypted object storage (S3, GCS, Azure Blob, etc.).
- Regularly test restore procedures in a non-production environment.

### Data Archival (Redemptions)

Over time, the redemptions collection can grow very large. To keep the
primary database lean while preserving history, you can archive old
redemptions to a separate collection.

This repository includes a helper script:

```bash
# Archive redemptions older than the default (180 days)
node scripts/archiveRedemptions.js

# Or specify the cutoff in days explicitly
node scripts/archiveRedemptions.js 365
```

Configuration (optional, via backend/.env):
- `REDEMPTION_ARCHIVE_AFTER_DAYS` – default cutoff in days (e.g. 180).
- `REDEMPTION_ARCHIVE_BATCH_SIZE` – batch size for each archival pass (default 500).

The script moves matching documents from `Redemption` to `ArchivedRedemption`
and then deletes them from the primary collection. You can schedule this
script (e.g. weekly via cron) as part of your maintenance routine.

## Troubleshooting

### Issue: "Insufficient gas"
- Solution: Request more testnet tokens from faucet

### Issue: "Object not found"
- Solution: Verify Package ID, Admin Cap ID, and Registry ID are correct

### Issue: "Connection refused to MongoDB"
- Solution: Ensure MongoDB is running and connection string is correct

### Issue: "Invalid private key"
- Solution: Re-export private key and ensure it's base64 encoded

## Next Steps

1. Build frontend application
2. Implement QR code redemption
3. Add analytics dashboard
4. Set up monitoring alerts
5. Deploy to mainnet (when ready)

## Security Checklist

- [ ] Never commit .env file
- [ ] Rotate admin private key regularly
- [ ] Use environment-specific wallets
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Set up firewall rules
- [ ] Regular security audits

## Support

For issues or questions:
1. Check logs first
2. Review this documentation
3. Open GitHub issue
4. Contact development team
