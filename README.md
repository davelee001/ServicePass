# ServicePass

> A blockchain-based voucher system where tokens represent prepaid credits that can be redeemed for real-world services or goods.

[![SUI](https://img.shields.io/badge/Blockchain-SUI-blue)](https://sui.io/)
[![Move](https://img.shields.io/badge/Language-Move-orange)](https://github.com/MystenLabs/sui)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF)](https://vitejs.dev/)

## Overview

**ServicePass** is a revolutionary blockchain-based voucher system built on the **SUI blockchain** using the **Move programming language**. It enables organizations, NGOs, and donors to distribute targeted vouchers that can **only** be redeemed for specific services, ensuring funds are used for their intended purpose while maintaining complete transparency and accountability.

### Why ServicePass?

- **Transparent** - All transactions recorded on blockchain  
- **Targeted** - Vouchers restricted to specific service types  
- **Accountable** - Complete audit trail of all redemptions  
- **Secure** - Burn-on-redemption prevents double-spending  
- **Efficient** - Low transaction costs on SUI blockchain  
- **Flexible** - Support for multiple voucher categories

## Voucher Types

### Education Credits (EDU)
- School fees vouchers
- Exam registration credits
- Training course access
- **Token meaning**: 1 EDU = $1 worth of education services

### Healthcare Credits (HEALTH)
- Clinic visits
- Lab tests
- Maternal health services
- Pharmaceutical purchases

### Transport/Fuel Credits (TRANSPORT)
- Bus passes
- Motorbike taxi rides
- Fuel vouchers
- High daily usage potential

### Agriculture Input Credits (AGRI)
- Seeds
- Fertilizer
- Veterinary services
- Farm equipment rental

## System Architecture

### On-Chain Components (SUI/Move)
- **Voucher Smart Contract**: Manages minting, redemption, and burning
- **Admin Capabilities**: Controlled minting by authorized entities
- **Merchant Registry**: On-chain verification of service providers
- **Event Emissions**: Transparent audit trail

### Off-Chain Components (Node.js + React)
- **REST API**: Voucher management and merchant operations with comprehensive input validation
- **MongoDB**: Merchant profiles and redemption history
- **Real-time Event Listener**: Monitors blockchain events in real-time using Sui's WebSocket subscription.
- **Reliable Event Processing**: Uses a BullMQ queue system with Redis to ensure every blockchain event is processed reliably, even in case of failures. Handles blockchain reorgs and failures gracefully.
- **Blockchain Retry Logic**: Automatic retry with exponential backoff for failed blockchain operations
- **Secure QR Code System**: Generates signed QR codes for vouchers, enabling secure, offline redemption at merchant points of sale.
- **Web Application**: User and merchant portals
- **Analytics Dashboard**: Real-time reporting and insights

## Token Design

| Feature | Implementation |
|---------|---------------|
| Token Type | Fungible vouchers with type classification |
| Minting | Admin-only via AdminCap |
| Transferable | Yes (between users) |
| Expiry | Configurable per voucher |
| Burn on Redemption | Yes |
| Refundable | No (prevents misuse) |

## Project Structure

```
ServicePass/
├── move/                          # SUI Move smart contracts
│   └── sources/
│       └── voucher_system.move    # Main voucher contract
├── backend/                       # Node.js backend service
│   └── src/
│       ├── __tests__/            # Test suites
│       ├── config/               # Configuration files
│       ├── models/               # MongoDB models
│       ├── queues/               # Event processing queues
│       ├── routes/               # API routes
│       ├── services/             # Business logic services
│       └── utils/                # Utility functions
├── frontend/                      # React web application
│   └── src/
│       ├── components/           # React components
│       ├── pages/                # Page components
│       ├── services/             # API services
│       └── utils/                # Helper functions
├── docs/                         # Documentation
├── scripts/                      # Deployment and utility scripts
└── Move.toml                     # SUI Move project config
```

## Getting Started

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
# - JWT_SECRET (a secure random string)
# - MONGODB_URI (your MongoDB connection string)
```

### 3. Create Admin User

```bash
# Create default admin user
node scripts/createAdmin.js

# Or create with custom credentials
node scripts/createAdmin.js admin@example.com SecurePass123 "Admin Name"
```

### 4. Run Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The backend API will be available at `http://localhost:3000`

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and configure API URL
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Frontend Features

### User Portal
- **Dashboard**: 
  - Total balance across all vouchers
  - Active and expired voucher counts
  - Vouchers grouped by type with visual indicators
  - Recent redemption activity feed
  
- **My Vouchers**: 
  - Filter by status (All, Active, Expired)
  - Detailed voucher cards with balance and expiry
  - Color-coded type indicators
  - Quick actions for active vouchers
  
- **Redemption History**: 
  - Complete transaction history
  - Sort by date, amount, or type
  - Blockchain explorer integration
  - Export capabilities

### Merchant Portal
- **Dashboard**: 
  - Total revenue and redemption statistics
  - Today's performance metrics
  - Redemptions breakdown by voucher type
  - Recent activity overview
  
- **Accept Redemptions**: 
  - Date range filtering
  - Detailed transaction table
  - User wallet verification
  - Real-time updates
  
- **Reports & Analytics**: 
  - Interactive revenue trend charts
  - Pie charts for type distribution
  - Bar charts for comparative analysis
  - Export reports as JSON
  - Custom date range selection

### Technology Stack
- **React 18** - Modern UI framework
- **React Router v6** - Client-side routing
- **TanStack Query** - Data fetching & caching
- **Recharts** - Data visualization
- **Vite** - Fast build tool
- **Axios** - HTTP client

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password

### Vouchers
- `POST /api/vouchers/mint` - Mint new voucher with QR code (Admin only)
- `GET /api/vouchers/owner/:address` - Get vouchers by owner
- `GET /api/vouchers/:voucherId/qrcode` - Get QR code for voucher (Auth required)

### Merchants
- `POST /api/merchants/register` - Register new merchant (Admin only)
- `GET /api/merchants` - List all merchants
- `GET /api/merchants/:merchantId` - Get merchant details (Auth required)
- `POST /api/merchants/:merchantId/api-key` - Generate API key (Auth required)
- `GET /api/merchants/:merchantId/api-key` - Get API key info (Auth required)
- `DELETE /api/merchants/:merchantId/api-key` - Revoke API key (Auth required)

### Redemptions
- `POST /api/redemptions/redeem-qr` - Redeem voucher via QR code (Merchant API key required)
- `POST /api/redemptions` - Record redemption (API key or Auth required)
- `GET /api/redemptions/merchant/:merchantId` - Merchant redemption history (Auth required)
- `GET /api/redemptions/user/:walletAddress` - User redemption history (Auth required)


## Key Features

- **Blockchain-Powered**: Built on SUI for security and transparency  
- **Type-Specific Vouchers**: Four categories (Education, Healthcare, Transport, Agriculture)  
- **QR Code Redemption**: Secure, signed QR codes for offline redemption at merchant points  
- **Real-Time Event Processing**: BullMQ queue system ensures reliable blockchain event handling  
- **Blockchain Retry Logic**: Automatic retry with exponential backoff for failed transactions  
- **Comprehensive Input Validation**: All endpoints validate inputs using express-validator  
- **Detailed Error Messages**: User-friendly, informative error responses  
- **Transaction Failure Handling**: Graceful handling of blockchain failures with retry capability  
- **JWT Authentication**: Secure role-based access control  
- **API Key Management**: Merchants can generate and manage API keys  
- **Rate Limiting**: Comprehensive protection on all endpoints  
- **Complete Web Interface**: User and merchant portals  
- **Real-Time Analytics**: Visual reports and business insights  
- **Secure Redemption**: Burn-on-use prevents double-spending  
- **Expiry Management**: Configurable voucher expiration  
- **Audit Trail**: Complete transaction history on blockchain  
- **Responsive Design**: Works on all devices  
- **Comprehensive Testing**: Full unit and integration test coverage  

## Security Features

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (Admin, Merchant, User)
- **API key management** for merchant integrations
- **Rate limiting** on all endpoints
- **Account lockout** after failed login attempts
- **Password hashing** with bcrypt

### Input Validation & Error Handling
- **Comprehensive input validation** using express-validator on all endpoints
- **Type checking** for all request parameters and body fields
- **Format validation** for addresses, emails, and other structured data
- **Detailed error messages** with field-specific validation feedback
- **Protection against malformed requests** and injection attacks

### Blockchain Resilience
- **Automatic retry logic** with exponential backoff for failed blockchain calls
- **Retry limits** to prevent infinite loops (max 3 retries by default)
- **Distinguishes retryable vs non-retryable errors** for intelligent retry behavior
- **Transaction failure handling** with proper error propagation
- **Graceful degradation** when blockchain is temporarily unavailable

See [Authentication Documentation](docs/AUTHENTICATION.md) for detailed information.

## Usage Examples

### Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "role": "user"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Minting a Voucher (Admin only)

```bash
curl -X POST http://localhost:3000/api/vouchers/mint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{
    "voucherType": 1,
    "amount": 5000,
    "recipient": "0x...",
    "merchantId": "SCHOOL_001",
    "expiryTimestamp": 1735689600,
    "metadata": "Grade 10 School Fees"
  }'
```

### Registering a Merchant (Admin only)

```bash
curl -X POST http://localhost:3000/api/merchants/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{
    "merchantId": "CLINIC_001",
    "name": "Community Health Clinic",
    "walletAddress": "0x...",
    "voucherTypesAccepted": [2],
    "contactEmail": "clinic@example.com"
  }'
```

### Generate API Key for Merchant

```bash
curl -X POST http://localhost:3000/api/merchants/CLINIC_001/api-key \
  -H "Authorization: Bearer <merchant_or_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"expiryDays": 365}'
```


# Test frontend (build)
cd frontend
npm run build
```

## Documentation

- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Authentication Guide](docs/AUTHENTICATION.md)** - Authentication and authorization details
- **[QR Code System](docs/QR_CODE_SYSTEM.md)** - QR code generation and redemption
- **[Architecture](docs/ARCHITECTURE.md)** - System design and architecture
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Backend deployment instructions
- **[Frontend Features](docs/FRONTEND_FEATURES.md)** - Detailed frontend features
- **[Frontend Deployment](docs/FRONTEND_DEPLOYMENT.md)** - Frontend deployment guide

## Screenshots

### User Dashboard
Modern, intuitive interface for users to manage their vouchers and track redemptions.

### Merchant Portal
Comprehensive analytics and reporting tools for service providers.

### Reports & Analytics
Visual charts and insights for business intelligence.

## Deployment

### Backend
See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for backend deployment instructions.

### Frontend
See [FRONTEND_DEPLOYMENT.md](docs/FRONTEND_DEPLOYMENT.md) for frontend deployment options:
- Vercel
- Netlify
- Traditional web servers
- Docker containersUse Cases

1. **NGO Educational Programs**: Distribute education vouchers that can only be used for school fees
2. **Healthcare Initiatives**: Provide healthcare credits for specific medical services
3. **Agricultural Support**: Enable farmers to access inputs without cash transactions
4. **Transport Subsidies**: Offer commuter assistance through transport vouchers

## Security Features

- Admin-only minting prevents unauthorized token creation
- Voucher expiry prevents indefinite liability
- Burn-on-redemption prevents double-spending
- Event emissions create immutable audit trail
- Type-specific redemption ensures intended use

## Smart Contract Functions

### Admin Functions
- `mint_voucher()` - Create new voucher
- `register_merchant()` - Add service provider

### User Functions
- `redeem_voucher()` - Redeem at registered merchant

### View Functions
- `is_valid_voucher_type()` - Validate voucher type
- `merchant_accepts_voucher_type()` - Check merchant compatibility

## Testing

ServicePass includes a comprehensive test suite covering unit tests, integration tests, and end-to-end scenarios.

### Run Tests

```bash
# Test Move contracts
sui move test

# Test backend with coverage
cd backend
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test voucher.model.test.js
```

### Test Coverage

- **Unit Tests**: Models, utilities, and business logic
- **Integration Tests**: API routes and database operations
- **QR Code Security**: Signature verification and anti-fraud tests
- **Redemption Flow**: Complete voucher lifecycle testing
- **Authentication**: JWT and API key validation

### Test Suite Includes

- Voucher model validation and database operations  
- QR code generation and signature verification  
- Secure redemption with fraud prevention  
- Double-redemption prevention  
- Merchant authorization and API key validation  
- Error handling and edge cases  
- Mock blockchain interactions for isolated testing  
- In-memory database for fast, reliable tests

## License

MIT License - See [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

**Project Maintainer**: [davelee001](https://github.com/davelee001)

For questions, issues, or support:
- Email: david.leekaleer@student.utamu.ac.ug
- Issues: [GitHub Issues](https://github.com/davelee001/ServicePass/issues)

## Acknowledgments

- Built on [SUI Blockchain](https://sui.io/)
- Powered by [Move Language](https://github.com/MystenLabs/sui)
- Inspired by real-world needs in education, healthcare, and agriculture

## Project Status

**Status**: Active Development  
**Last Updated**: January 2026  
**Version**: 1.0.0

---

<div align="center">

**Built using SUI and Move**

[Star this repo](https://github.com/davelee001/ServicePass) | [Documentation](docs/) | [Get Started](#getting-started)

</div>
