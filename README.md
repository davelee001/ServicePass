# ServicePass 🎫

> A blockchain-based voucher system where tokens represent prepaid credits that can be redeemed for real-world services or goods.

[![SUI](https://img.shields.io/badge/Blockchain-SUI-blue)](https://sui.io/)
[![Move](https://img.shields.io/badge/Language-Move-orange)](https://github.com/MystenLabs/sui)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-brightgreen)](https://nodejs.org/)

## 🌟 Overview

**ServicePass** is a revolutionary blockchain-based voucher system built on the **SUI blockchain** using the **Move programming language**. It enables organizations, NGOs, and donors to distribute targeted vouchers that can **only** be redeemed for specific services, ensuring funds are used for their intended purpose while maintaining complete transparency and accountability.

### Why ServicePass?

✅ **Transparent** - All transactions recorded on blockchain  
✅ **Targeted** - Vouchers restricted to specific service types  
✅ **Accountable** - Complete audit trail of all redemptions  
✅ **Secure** - Burn-on-redemption prevents double-spending  
✅ **Efficient** - Low transaction costs on SUI blockchain  
✅ **Flexible** - Support for multiple voucher categories

## 💎 Voucher Types

### 1️⃣ Education Credits (EDU)
- School fees vouchers
- Exam registration credits
- Training course access
- **Token meaning**: 1 EDU = $1 worth of education services

### 2️⃣ Healthcare Credits (HEALTH)
- Clinic visits
- Lab tests
- Maternal health services
- Pharmaceutical purchases

### 3️⃣ Transport/Fuel Credits (TRANSPORT)
- Bus passes
- Motorbike taxi rides
- Fuel vouchers
- High daily usage potential

### 4️⃣ Agriculture Input Credits (AGRI)
- Seeds
- Fertilizer
- Veterinary services
- Farm equipment rental

## 🏗️ System Architecture

### On-Chain Components (SUI/Move)
- **Voucher Smart Contract**: Manages minting, redemption, and burning
- **Admin Capabilities**: Controlled minting by authorized entities
- **Merchant Registry**: On-chain verification of service providers
- **Event Emissions**: Transparent audit trail

### Off-Chain Components (Node.js)
- **REST API**: Voucher management and merchant operations
- **MongoDB**: Merchant profiles and redemption history
- **Event Listener**: Monitors blockchain events
- **QR Code Generation**: For easy redemption

## 🔐 Token Design

| Feature | Implementation |
|---------|---------------|
| Token Type | Fungible vouchers with type classification |
| Minting | Admin-only via AdminCap |
| Transferable | Yes (between users) |
| Expiry | Configurable per voucher |
| Burn on Redemption | ✅ Yes |
| Refundable | No (prevents misuse) |

## 📁 Project Structure

```
ServicePass/
├── move/                          # SUI Move smart contracts
│   └── sources/
│       └── voucher_system.move    # Main voucher contract
├── backend/                       # Node.js backend service
│   └── src/
│       ├── config/               # Configuration files
│       ├── models/               # MongoDB models
│       ├── routes/               # API routes
│       └── utils/                # Utility functions
├── docs/                         # Documentation
├── scripts/                      # Deployment and utility scripts
└── Move.toml                     # SUI Move project config
```

## 🚀 Getting Started

### Prerequisites
- [SUI CLI](https://docs.sui.io/build/install)
- Node.js >= 18.x
- MongoDB
- SUI Wallet with testnet/mainnet tokens

### 1. Deploy Smart Contract

```bash
# Build the Move package
sui move build

# Deploy to testnet
sui client publish --gas-budget 100000000

# Save the Package ID, Admin Cap ID, and Registry ID
```

### 2. Configure Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add:
# - PACKAGE_ID (from deployment)
# - ADMIN_CAP_ID (from deployment)
# - REGISTRY_ID (from deployment)
# - ADMIN_PRIVATE_KEY (your admin wallet private key)
```

### 3. Run Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Vouchers
- `POST /api/vouchers/mint` - Mint new voucher
- `GET /api/vouchers/owner/:address` - Get vouchers by owner

### Merchants
- `POST /api/merchants/register` - Register new merchant
- `GET /api/merchants` - List all merchants
- `GET /api/merchants/:merchantId` - Get merchant details

### Redemptions
- `POST /api/redemptions` - Record redemption
- `GET /api/redemptions/merchant/:merchantId` - Merchant redemption history
- `GET /api/redemptions/user/:walletAddress` - User redemption history

## 🔧 Usage Examples

### Minting a Voucher

```bash
curl -X POST http://localhost:3000/api/vouchers/mint \
  -H "Content-Type: application/json" \
  -d '{
    "voucherType": 1,
    "amount": 5000,
    "recipient": "0x...",
    "merchantId": "SCHOOL_001",
    "expiryTimestamp": 1735689600,
    "metadata": "Grade 10 School Fees"
  }'
```

### Registering a Merchant

```bash
curl -X POST http://localhost:3000/api/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "CLINIC_001",
    "name": "Community Health Clinic",
    "walletAddress": "0x...",
    "voucherTypesAccepted": [2],
    "contactEmail": "clinic@example.com"
  }'
```

## 🎯 Use Cases

1. **NGO Educational Programs**: Distribute education vouchers that can only be used for school fees
2. **Healthcare Initiatives**: Provide healthcare credits for specific medical services
3. **Agricultural Support**: Enable farmers to access inputs without cash transactions
4. **Transport Subsidies**: Offer commuter assistance through transport vouchers

## 🛡️ Security Features

- Admin-only minting prevents unauthorized token creation
- Voucher expiry prevents indefinite liability
- Burn-on-redemption prevents double-spending
- Event emissions create immutable audit trail
- Type-specific redemption ensures intended use

## 📝 Smart Contract Functions

### Admin Functions
- `mint_voucher()` - Create new voucher
- `register_merchant()` - Add service provider

### User Functions
- `redeem_voucher()` - Redeem at registered merchant

### View Functions
- `is_valid_voucher_type()` - Validate voucher type
- `merchant_accepts_voucher_type()` - Check merchant compatibility

## 🧪 Testing

```bash
# Test Move contracts
sui move test

# Test backend
cd backend
npm test
```

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

**Project Maintainer**: [davelee001](https://github.com/davelee001)

For questions, issues, or support:
- 📫 Email: david.leekaleer@student.utamu.ac.ug
- 🐛 Issues: [GitHub Issues](https://github.com/davelee001/ServicePass/issues)

## 🙏 Acknowledgments

- Built on [SUI Blockchain](https://sui.io/)
- Powered by [Move Language](https://github.com/MystenLabs/sui)
- Inspired by real-world needs in education, healthcare, and agriculture

## 📊 Project Status

🚧 **Status**: Active Development  
📅 **Last Updated**: January 2026  
🎯 **Version**: 1.0.0

---

<div align="center">

**Built with ❤️ using SUI and Move**

[⭐ Star this repo](https://github.com/davelee001/ServicePass) | [📖 Documentation](docs/) | [🚀 Get Started](#-getting-started)

</div>
