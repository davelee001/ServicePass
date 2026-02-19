# ServicePass

> A blockchain-based voucher system where tokens represent prepaid credits that can be redeemed for real-world services or goods.

[![SUI](https://img.shields.io/badge/Blockchain-SUI-blue)](https://sui.io/)
[![Move](https://img.shields.io/badge/Language-Move-orange)](https://github.com/MystenLabs/sui)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-1500%2B%20Lines-success)](backend/src/__tests__/)
[![Test Coverage](https://img.shields.io/badge/Coverage-Comprehensive-brightgreen)](backend/src/__tests__/)

## Overview

**ServicePass** is a revolutionary blockchain-based voucher system built on the **SUI blockchain** using the **Move programming language**. It enables organizations, NGOs, and donors to distribute targeted vouchers that can **only** be redeemed for specific services, ensuring funds are used for their intended purpose while maintaining complete transparency and accountability.

### Why ServicePass?

- **Transparent** - All transactions recorded on blockchain  
- **Targeted** - Vouchers restricted to specific service types  
- **Accountable** - Complete audit trail of all redemptions  
- **Secure** - Burn-on-redemption prevents double-spending  
- **Efficient** - Low transaction costs on SUI blockchain  
- **Flexible** - Support for multiple voucher categories

### 🎯 What's Included?

ServicePass is a **production-ready** voucher system with:

✅ **5 Advanced Features**: Partial Redemption, Transfer Restrictions, Multi-Sig Operations, Scheduled Issuance, Voucher Templates  
✅ **85+ API Endpoints**: Complete REST API with authentication, validation, and rate limiting  
✅ **1,500+ Lines of Tests**: Comprehensive test coverage across models, routes, and workflows  
✅ **Analytics Dashboard**: Real-time metrics, trend analysis, and business intelligence  
✅ **Multi-Channel Notifications**: Email, SMS, and push notifications with retry logic  
✅ **Enterprise-Grade Security**: JWT authentication, API keys, QR signatures, and audit trails  
✅ **Complete Frontend UI**: 15+ React pages including Template Gallery, Scheduled Vouchers, Transfer Management, Multi-Sig Operations  
✅ **Responsive Web App**: User and merchant portals built with React 18 + Vite + TanStack Query  
✅ **Comprehensive Documentation**: API docs (Swagger/OpenAPI), user guides, merchant onboarding, smart contract audit, deployment runbook  
✅ **Production Ready**: CI/CD workflows, error handling, and enterprise-grade documentation

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
│       │   ├── Navigation.jsx   # Navigation bar with all routes
│       │   ├── NotificationPreferences.jsx  # Notification settings
│       │   └── PartialRedemptionModal.jsx   # Partial redemption UI
│       ├── pages/                # Page components
│       │   ├── UserDashboard.jsx           # User overview
│       │   ├── MerchantDashboard.jsx       # Merchant overview
│       │   ├── VoucherList.jsx             # Voucher management
│       │   ├── TemplateGallery.jsx         # Template browser
│       │   ├── ScheduledVouchers.jsx       # Scheduled issuance
│       │   ├── TransferManagement.jsx      # Transfer workflow
│       │   ├── MultiSigOperations.jsx      # Multi-sig approvals
│       │   ├── RedemptionHistory.jsx       # User transactions
│       │   ├── MerchantRedemptions.jsx     # Merchant transactions
│       │   ├── MerchantReports.jsx         # Merchant analytics
│       │   └── AnalyticsDashboard.jsx      # Business intelligence
│       ├── services/             # API services
│       │   └── api.js            # API client with 85+ endpoints
│       └── utils/                # Helper functions
│           └── helpers.js        # Utility functions
├── docs/                         # Comprehensive Documentation
│   ├── API_DOCUMENTATION.md     # Complete API reference with Swagger/OpenAPI
│   ├── USER_GUIDE.md            # End-user documentation and tutorials
│   ├── MERCHANT_ONBOARDING.md   # Merchant setup and operational guide
│   ├── SMART_CONTRACT_AUDIT.md  # Security audit report and findings
│   ├── DEPLOYMENT_RUNBOOK.md    # Production deployment procedures
│   ├── ARCHITECTURE.md          # System architecture and design
│   ├── AUTHENTICATION.md        # Auth flows and security
│   ├── QR_CODE_SYSTEM.md        # QR code implementation
│   └── FRONTEND_FEATURES.md     # Frontend capabilities
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

# Edit .env and configure:
# Blockchain Configuration:
# - PACKAGE_ID (from deployment)
# - ADMIN_CAP_ID (from deployment)
# - REGISTRY_ID (from deployment)
# - ADMIN_PRIVATE_KEY (your admin wallet private key)

# Database:
# - MONGODB_URI (your MongoDB connection string)
# - Optional: MONGODB_MAX_POOL_SIZE, MONGODB_MIN_POOL_SIZE,
#   MONGODB_SERVER_SELECTION_TIMEOUT_MS, MONGODB_SOCKET_TIMEOUT_MS

# Authentication:
# - JWT_SECRET (a secure random string)

# Security (Production Required):
# - ENCRYPTION_KEY (for encrypting sensitive data)
# - QR_SIGNING_SECRET (for QR code signatures)
# - ALLOWED_ORIGINS (comma-separated list of allowed origins)

# Notifications (Optional):
# Email (Nodemailer):
# - EMAIL_SERVICE (gmail, outlook, custom)
# - EMAIL_HOST (for custom service)
# - EMAIL_PORT (for custom service)
# - SMTP_USER (email service username)
# - SMTP_PASS (email service password)
# - SMTP_FROM (sender email address)
# SMS (Twilio):
# - TWILIO_ACCOUNT_SID (Twilio Account SID)
# - TWILIO_AUTH_TOKEN (Twilio Auth Token)
# - TWILIO_PHONE_NUMBER (Twilio phone number)
# Push Notifications (Firebase):
# - FIREBASE_PROJECT_ID (Firebase Project ID)
# - FIREBASE_PRIVATE_KEY (Firebase private key)
# - FIREBASE_CLIENT_EMAIL (Firebase client email)

# Optional:
# - REDIS_URL (for event queue)
# - RATE_LIMIT_WINDOW_MS (rate limit window)
# - RATE_LIMIT_MAX_REQUESTS (max requests per window)
# - REDEMPTION_ARCHIVE_AFTER_DAYS, REDEMPTION_ARCHIVE_BATCH_SIZE (archival)
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
  - **Partial Redemption Modal**: Redeem vouchers incrementally with remaining balance tracking
  
- **Template Gallery**: 
  - Browse all available voucher templates
  - Filter by category and status
  - View template details (value, expiry, type)
  - Admin controls for template management
  - Usage statistics and popularity metrics
  
- **Scheduled Vouchers**: 
  - Create automated voucher issuance schedules
  - Support for recurring patterns (daily/weekly/monthly/yearly)
  - View upcoming scheduled issuances
  - Filter by status (active, completed, cancelled)
  - Cancel or trigger schedules manually
  - Statistics dashboard with active/completed counts
  
- **Transfer Management**: 
  - Initiate voucher transfers to other users
  - Approval workflow for transfers requiring authorization
  - View transfer history with status tracking
  - Approve/reject pending transfer requests
  - Filter by status (pending, approved, rejected, completed)
  - Real-time transfer statistics
  
- **Multi-Sig Operations**: 
  - Create operations requiring multiple approvals
  - Sign/approve pending operations
  - Reject operations with optional comments
  - View signature progress and requirements
  - Execute approved operations
  - Filter by operation status
  - Complete audit trail of all signatures
  
- **Redemption History**: 
  - Complete transaction history
  - Sort by date, amount, or type
  - Blockchain explorer integration
  - Export capabilities

- **Notification Preferences**:
  - Toggle email, SMS, and push notifications
  - Customize notification triggers (voucher received, redemption, expiry)
  - Set expiry notification timing
  - Test notification channels
  - Push notification device registration

### Merchant Portal
- **Dashboard**: 
  - Total revenue and redemption statistics
  - Today's performance metrics
  - Redemptions breakdown by voucher type
  - Recent activity overview
  - Enhanced batch operations section with progress tracking, pause/resume controls, and real-time monitoring
  
- **Accept Redemptions**: 
  - Date range filtering
  - Detailed transaction table
  - User wallet verification
  - Real-time updates
  - Support for partial redemptions
  
- **Template Gallery**: 
  - Create and manage voucher templates
  - Configure partial redemption settings
  - Set transfer restrictions and limits
  - Template usage analytics
  - Duplicate existing templates
  
- **Scheduled Vouchers**: 
  - Set up automated voucher distribution
  - Monitor scheduled issuance progress
  - View execution history
  - Cancel or modify schedules
  
- **Transfer Management**: 
  - Review pending transfer requests
  - Approve or reject voucher transfers
  - View transfer analytics
  - Monitor transfer patterns
  
- **Multi-Sig Operations**: 
  - Create operations for critical actions
  - Participate in approval workflows
  - Track operation execution
  - View organization-wide multi-sig activity
  
- **Reports & Analytics**: 
  - Interactive revenue trend charts
  - Pie charts for type distribution
  - Bar charts for comparative analysis
  - Export reports as JSON
  - Custom date range selection
  - Batch operation analytics and performance metrics

- **Analytics Dashboard**:
  - Comprehensive business intelligence and reporting
  - Real-time summary cards with growth indicators
  - Voucher type distribution visualization
  - Top merchant performance rankings
  - Financial summaries with utilization tracking
  - Expiry alert system with color-coded warnings
  - Advanced filtering (date range, merchant, voucher type)
  - Data export capabilities (JSON/CSV)
  - Interactive charts and trend analysis
  - Mobile-responsive design

### Navigation & UX
- **Unified Navigation Bar**: Seamless switching between user and merchant views
- **Icon-Based Menu**: Clear visual indicators for each section
- **Quick Access**: All advanced features easily accessible from navigation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-Time Updates**: Live data refresh using TanStack Query
- **Loading States**: Smooth loading indicators and skeleton screens
- **Error Handling**: User-friendly error messages and retry mechanisms

### Technology Stack
- **React 18** - Modern UI framework with hooks
- **React Router v6** - Client-side routing with nested routes
- **TanStack Query (React Query)** - Data fetching, caching & synchronization
- **React Icons** - Comprehensive icon library
- **Recharts** - Data visualization and charts
- **Vite** - Lightning-fast build tool and dev server
- **Axios** - HTTP client with interceptors
- **CSS3** - Modern styling with responsive design

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
- `POST /api/vouchers/bulk-mint` - Mint multiple vouchers in batch (Admin only)
- `POST /api/vouchers/bulk-mint-enhanced` - Enhanced bulk mint with progress tracking (Admin only)
- `GET /api/vouchers/owner/:address` - Get vouchers by owner
- `GET /api/vouchers/:voucherId/qrcode` - Get QR code for voucher (Auth required)

### Merchants
- `POST /api/merchants/register` - Register new merchant (Admin only)
- `POST /api/merchants/batch-register` - Register multiple merchants in batch (Admin only)
- `GET /api/merchants` - List all merchants
- `GET /api/merchants/:merchantId` - Get merchant details (Auth required)
- `POST /api/merchants/:merchantId/api-key` - Generate API key (Auth required)
- `GET /api/merchants/:merchantId/api-key` - Get API key info (Auth required)
- `DELETE /api/merchants/:merchantId/api-key` - Revoke API key (Auth required)

### Redemptions
- `POST /api/redemptions/redeem-qr` - Redeem voucher via QR code (Merchant API key required)
- `POST /api/redemptions/redeem-partial` - Redeem partial voucher amount (Merchant API key required)
- `POST /api/redemptions` - Record redemption (API key or Auth required)
- `POST /api/redemptions/import-recipients` - Import recipients via CSV for batch voucher creation (Auth required)
- `GET /api/redemptions/merchant/:merchantId` - Merchant redemption history (Auth required)
- `GET /api/redemptions/user/:walletAddress` - User redemption history (Auth required)

### Notifications
- `GET /api/notifications/preferences` - Get user notification preferences (Auth required)
- `PUT /api/notifications/preferences` - Update notification preferences (Auth required)
- `POST /api/notifications/test-email` - Send test email notification (Auth required)
- `POST /api/notifications/test-sms` - Send test SMS notification (Auth required)
- `POST /api/notifications/test-push` - Send test push notification (Auth required)
- `POST /api/notifications/register-push` - Register device for push notifications (Auth required)
- `GET /api/notifications/history` - Get notification history (Auth required)
- `POST /api/notifications/check-expired` - Manually trigger expiry notifications (Admin only)
- `POST /api/notifications/bulk-send` - Send bulk notifications (Admin only)
- `GET /api/notifications/bulk-status/:batchId` - Check bulk notification status (Admin only)
- `POST /api/notifications/schedule` - Schedule notification for future delivery (Auth required)
- `DELETE /api/notifications/schedule/:scheduleId` - Cancel scheduled notification (Auth required)
- `GET /api/notifications/analytics` - Get notification analytics (Auth required)
- `POST /api/notifications/send-custom` - Send notification with custom variables (Auth required)
- `POST /api/notifications/test-retry` - Test notification retry mechanism (Admin only)
- `GET /api/notifications/rate-limits/:userId` - Get notification rate limits (Auth required)

### Batch Operations
- `POST /api/batch/create` - Create new batch operation (Auth required)
- `GET /api/batch/status/:batchId` - Get batch operation status (Auth required)
- `GET /api/batch/my-operations` - Get user's batch operations (Auth required)
- `POST /api/batch/pause/:batchId` - Pause batch operation (Auth required)
- `POST /api/batch/resume/:batchId` - Resume paused batch operation (Auth required)
- `DELETE /api/batch/cancel/:batchId` - Cancel batch operation (Auth required)
- `GET /api/batch/results/:batchId` - Get detailed batch results (Auth required)
- `GET /api/batch/metrics` - Get system batch metrics (Admin only)
- `POST /api/batch/retry/:batchId` - Retry failed batch items (Auth required)
- `GET /api/batch/export/:batchId` - Export batch results (Auth required)

### Analytics Dashboard
- `GET /api/analytics/dashboard` - Comprehensive dashboard overview with filters (Auth required)
- `GET /api/analytics/vouchers` - Voucher statistics by type and status (Auth required)
- `GET /api/analytics/redemptions` - Redemption analytics with time series data (Auth required)
- `GET /api/analytics/merchants` - Merchant performance metrics and rankings (Auth required)
- `GET /api/analytics/distribution` - Voucher type distribution analysis (Auth required)
- `GET /api/analytics/expiry` - Expiry tracking with alert thresholds (Auth required)
- `GET /api/analytics/financial` - Financial reports and utilization rates (Auth required)
- `GET /api/analytics/trends` - Time-based trend data for visualization (Auth required)
- `GET /api/analytics/realtime` - Real-time metrics for last 24 hours (Admin only)
- `GET /api/analytics/export` - Export analytics data in JSON/CSV format (Auth required)
- `POST /api/analytics/cache/clear` - Clear analytics cache (Admin only)

### Voucher Templates
- `POST /api/templates` - Create voucher template (Admin only)
- `GET /api/templates` - List all templates with search/filter (Auth required)
- `GET /api/templates/:templateId` - Get template details (Auth required)
- `PUT /api/templates/:templateId` - Update template (Admin only)
- `POST /api/templates/:templateId/deactivate` - Deactivate template (Admin only)
- `POST /api/templates/:templateId/activate` - Activate template (Admin only)
- `DELETE /api/templates/:templateId` - Delete template (Admin only)
- `POST /api/templates/:templateId/duplicate` - Duplicate template (Admin only)
- `GET /api/templates/:templateId/stats` - Get usage statistics (Auth required)
- `GET /api/templates/analytics/popular` - Get popular templates (Admin only)
- `GET /api/templates/analytics/recent` - Get recently used templates (Admin only)

### Scheduled Vouchers
- `POST /api/scheduled-vouchers` - Create scheduled voucher (Admin only)
- `GET /api/scheduled-vouchers` - List scheduled vouchers with filters (Auth required)
- `GET /api/scheduled-vouchers/:scheduleId` - Get schedule details (Auth required)
- `POST /api/scheduled-vouchers/:scheduleId/cancel` - Cancel schedule (Auth required)
- `POST /api/scheduled-vouchers/process/trigger` - Manually trigger processing (Admin only)
- `GET /api/scheduled-vouchers/analytics/stats` - Schedule statistics (Admin only)

### Multi-Signature Operations
- `POST /api/multisig` - Create multi-sig operation (Admin only)
- `GET /api/multisig/pending` - Get pending operations (Admin only)
- `GET /api/multisig` - List all operations with filters (Admin only)
- `GET /api/multisig/:operationId` - Get operation details (Admin only)
- `POST /api/multisig/:operationId/sign` - Sign/approve operation (Admin only)
- `POST /api/multisig/:operationId/reject` - Reject operation (Admin only)
- `POST /api/multisig/:operationId/execute` - Manually execute operation (Admin only)
- `POST /api/multisig/maintenance/expire` - Expire old operations (Admin only)
- `GET /api/multisig/analytics/stats` - Multi-sig statistics (Admin only)
- `GET /api/multisig/user/:userId/history` - User signature history (Admin only)

### Voucher Transfers
- `POST /api/transfers` - Create transfer request (Auth required)
- `GET /api/transfers` - List transfers with filters (Auth required)
- `GET /api/transfers/:transferId` - Get transfer details (Auth required)
- `POST /api/transfers/:transferId/approve` - Approve transfer (Admin/Merchant only)
- `POST /api/transfers/:transferId/reject` - Reject transfer (Admin/Merchant only)
- `GET /api/transfers/voucher/:voucherId/history` - Get transfer history (Auth required)
- `GET /api/transfers/pending/approvals` - Get pending approvals (Admin/Merchant only)
- `GET /api/transfers/analytics/stats` - Transfer statistics (Admin only)

## Key Features

### Core Capabilities
- **Blockchain-Powered**: Built on SUI for security and transparency  
- **Type-Specific Vouchers**: Four categories (Education, Healthcare, Transport, Agriculture)  
- **QR Code Redemption**: Secure, signed QR codes for offline redemption at merchant points  
- **Secure Authentication**: JWT-based authentication with role-based access control
- **API Key Management**: Merchants can generate and manage API keys securely
- **Real-Time Event Processing**: BullMQ queue system ensures reliable blockchain event handling  
- **Blockchain Retry Logic**: Automatic retry with exponential backoff for failed transactions  
- **Comprehensive Input Validation**: All endpoints validate inputs using express-validator  
- **Rate Limiting**: Comprehensive protection on all endpoints  
- **Audit Trail**: Complete transaction history on blockchain  

### Advanced Features
- **Partial Voucher Redemption**: Redeem vouchers incrementally with automatic balance tracking
- **Transfer Restrictions**: Control voucher transfers with limits, approvals, and recipient whitelists
- **Multi-Signature Operations**: Require multiple admin approvals for critical system operations (8 operation types)
- **Scheduled Voucher Issuance**: Automate future voucher creation with recurring schedule support (daily/weekly/monthly/yearly)
- **Voucher Templates**: Create reusable templates for consistent voucher issuance with usage tracking

### Enterprise Capabilities
- **Analytics Dashboard**: Comprehensive business intelligence with real-time metrics, trend analysis, and executive reporting  
- **Enhanced Batch Operations**: Advanced bulk processing with progress tracking, pause/resume, priority queues, parallel processing, and comprehensive error handling  
- **Intelligent Notification System**: Multi-channel notifications (Email/SMS/Push) with retry logic, bulk processing, scheduling, rate limiting, and analytics  
- **Real-Time Monitoring**: Live progress tracking, detailed operation metrics, and comprehensive system analytics  
- **Data Export**: Export analytics and reports in JSON/CSV formats
- **Performance Optimization**: Intelligent caching and query optimization for fast response times

### User Experience
- **Complete Web Interface**: User and merchant portals with responsive design
- **Real-Time Analytics**: Visual reports and business insights with interactive charts
- **Detailed Error Messages**: User-friendly, informative error responses  
- **Mobile Responsive**: Works seamlessly on all devices  
- **Transaction Failure Handling**: Graceful handling of blockchain failures with retry capability  

### Quality & Reliability
- **Comprehensive Testing**: 1,500+ lines of test code with full unit and integration coverage
- **Secure Redemption**: Burn-on-use prevents double-spending  
- **Expiry Management**: Configurable voucher expiration with automated tracking
- **Error Recovery**: Robust error handling and automatic recovery mechanisms
- **Continuous Integration**: Automated testing and deployment workflows

## Enhanced System Capabilities

### 🚀 Advanced Batch Processing
- **Progress Tracking**: Real-time progress monitoring with completion percentages and time estimates
- **Queue Management**: Priority-based processing (high, medium, low) with intelligent scheduling
- **Pause/Resume**: Full control over batch operations with graceful state management
- **Parallel Processing**: Configurable parallel vs sequential processing for optimal performance
- **Error Handling**: Comprehensive error tracking with partial success support and retry mechanisms
- **Export & Reporting**: Export results in JSON or CSV format with detailed operation logs

### 📧 Intelligent Notification System
- **Retry Logic**: Exponential backoff retry mechanism for failed notifications (up to 3 attempts)
- **Bulk Processing**: Send thousands of notifications efficiently with configurable batch sizes
- **Scheduled Delivery**: Schedule notifications for future delivery with precise timing
- **Rate Limiting**: Smart rate limiting (10 notifications per minute per type) to prevent abuse
- **Analytics**: Comprehensive notification analytics including delivery rates and channel performance
- **Custom Templates**: Extended template system with dynamic variables and priority-based styling
- **Multi-Channel Support**: Seamless integration of email, SMS, and push notifications

### 📊 Real-Time Monitoring & Analytics
- **Live Progress Updates**: Real-time status updates for all batch operations
- **Performance Metrics**: Track processing speeds, success rates, and system performance
- **User Analytics**: Individual user notification history and preferences tracking
- **System Metrics**: Comprehensive system-wide analytics for administrators

### 📈 Analytics Dashboard
- **Comprehensive Metrics**: Track total vouchers minted, redeemed, active, and expired across all types
- **Merchant Performance**: Real-time merchant rankings, success rates, and performance by voucher type
- **Voucher Distribution**: Visual breakdown of voucher types (Education/Healthcare/Transport/Agriculture)
- **Expiry Tracking**: Proactive alerts for vouchers expiring in 7/30 days with value tracking
- **Financial Reports**: Total value analysis, utilization rates, remaining balances, and ROI metrics
- **Trend Analysis**: Time-based trends (hourly/daily/weekly/monthly) for strategic planning
- **Advanced Filtering**: Filter by date range, merchant, and voucher type for granular insights
- **Real-Time Updates**: Live metrics for last 24 hours with active user tracking
- **Data Export**: Export all analytics in JSON or CSV format for external analysis
- **Interactive Visualizations**: Charts, graphs, and color-coded indicators for easy interpretation
- **Performance Optimization**: Intelligent caching system for fast dashboard load times
- **Role-Based Access**: Admin dashboard for system-wide view, merchant dashboard for specific data
- **Error Analysis**: Detailed error tracking and analysis for continuous improvement

### 🔧 Enhanced API Capabilities
- **Batch Operations API**: Complete CRUD operations for batch management
- **Enhanced Notification API**: Advanced notification features including scheduling and bulk processing
- **Progress Monitoring**: Real-time status endpoints for all operations
- **Export Functionality**: Built-in export capabilities for all data
- **Comprehensive Error Handling**: Detailed error responses with actionable information

## Advanced Features

### 💰 Partial Voucher Redemption
- **Flexible Redemption**: Redeem vouchers partially instead of all-at-once
- **Remaining Balance Tracking**: Automatic tracking of original amount and remaining balance
- **Redemption History**: Complete audit trail of all partial redemptions with timestamps
- **Status Management**: Automatic status updates (active → partially_redeemed → redeemed)
- **Merchant Validation**: Ensures only designated merchants can redeem vouchers
- **Template Support**: Configure partial redemption settings at template level
- **Amount Validation**: Prevents redemption of more than remaining balance
- **Real-time Updates**: Immediate balance updates after each redemption

**API Endpoints:**
- `POST /api/redemptions/redeem-partial` - Redeem partial voucher amount (Merchant API Key required)

**Use Cases:**
- Transportation vouchers used across multiple rides
- Healthcare vouchers for multiple clinic visits
- Education credits for incremental course fees
- Meal vouchers for multiple purchases

### 🔄 Voucher Transfer Restrictions
- **Transfer Limits**: Configure maximum number of transfers per voucher
- **Transfer Tracking**: Complete history of all voucher transfers
- **Approval Workflow**: Require admin/merchant approval for transfers
- **Allowed Recipients**: Whitelist specific recipients for transfers
- **Transfer Types**: Support for full and partial voucher transfers
- **Status Management**: Track transfer status (pending, approved, rejected, completed)
- **Merchant Control**: Merchants can approve/reject transfers for their vouchers
- **Security Validation**: Prevents unauthorized transfers and maintains integrity

**API Endpoints:**
- `POST /api/transfers` - Create new transfer request (Auth required)
- `GET /api/transfers` - List transfers with filters (Auth required)
- `GET /api/transfers/:transferId` - Get transfer details (Auth required)
- `POST /api/transfers/:transferId/approve` - Approve transfer (Admin/Merchant only)
- `POST /api/transfers/:transferId/reject` - Reject transfer (Admin/Merchant only)
- `GET /api/transfers/voucher/:voucherId/history` - Get transfer history (Auth required)
- `GET /api/transfers/pending/approvals` - Get pending approvals (Admin/Merchant only)
- `GET /api/transfers/analytics/stats` - Transfer statistics (Admin only)

**Transfer Restrictions:**
```javascript
{
  maxTransfers: 3,              // Maximum number of times voucher can be transferred
  transferCount: 0,             // Current transfer count
  requireApproval: true,        // Requires admin/merchant approval
  allowedRecipients: [...]      // Whitelist of allowed recipient addresses
}
```

### 🔐 Multi-Signature Admin Operations
- **Critical Operation Protection**: Require multiple admin approvals for sensitive operations
- **Operation Types**: 8 different operation types requiring multi-sig approval
  - `CREATE_VOUCHER_BATCH` - Bulk voucher creation
  - `MODIFY_CRITICAL_SETTINGS` - System configuration changes
  - `DELETE_MULTIPLE_VOUCHERS` - Bulk voucher deletion
  - `CHANGE_MERCHANT_STATUS` - Merchant account status changes
  - `BULK_TRANSFER` - Large-scale voucher transfers
  - `EMERGENCY_FREEZE` - System freeze/unfreeze
  - `SYSTEM_MAINTENANCE` - Maintenance mode operations
  - `SECURITY_UPDATE` - Security-related updates
- **Configurable Signatures**: Require 2-3 signatures based on operation type
- **Signature Tracking**: Complete audit trail of who signed and when
- **Expiry Management**: Operations expire after 24 hours if not approved
- **Comment Support**: Admins can leave comments when signing/rejecting
- **Automatic Execution**: Operations execute automatically when required signatures reached
- **Rejection Workflow**: Any admin can reject and cancel operation

**API Endpoints:**
- `POST /api/multisig` - Create multi-sig operation (Admin only)
- `GET /api/multisig/pending` - Get pending operations (Admin only)
- `GET /api/multisig` - List all operations with filters (Admin only)
- `GET /api/multisig/:operationId` - Get operation details (Admin only)
- `POST /api/multisig/:operationId/sign` - Sign/approve operation (Admin only)
- `POST /api/multisig/:operationId/reject` - Reject operation (Admin only)
- `POST /api/multisig/:operationId/execute` - Manually execute operation (Admin only)
- `POST /api/multisig/maintenance/expire` - Expire old operations (Admin only)
- `GET /api/multisig/analytics/stats` - Multi-sig statistics (Admin only)
- `GET /api/multisig/user/:userId/history` - User signature history (Admin only)

### ⏰ Scheduled Voucher Issuance
- **Time-Based Issuance**: Schedule vouchers for future creation
- **Recurring Schedules**: Support for daily, weekly, monthly, and yearly schedules
- **Template Integration**: Use templates for consistent scheduled vouchers
- **Automatic Processing**: Background processor handles scheduled issuance
- **Status Tracking**: Monitor status (pending, processing, completed, failed, cancelled)
- **Retry Logic**: Automatic retry on failures with exponential backoff
- **Next Schedule Calculation**: Automatic calculation of next issuance for recurring vouchers
- **Cancellation Support**: Cancel scheduled vouchers before processing
- **Notification Integration**: Optional notifications to recipients upon creation

**API Endpoints:**
- `POST /api/scheduled-vouchers` - Create scheduled voucher (Admin only)
- `GET /api/scheduled-vouchers` - List scheduled vouchers with filters (Auth required)
- `GET /api/scheduled-vouchers/:scheduleId` - Get schedule details (Auth required)
- `POST /api/scheduled-vouchers/:scheduleId/cancel` - Cancel schedule (Auth required)
- `POST /api/scheduled-vouchers/process/trigger` - Manually trigger processing (Admin only)
- `GET /api/scheduled-vouchers/analytics/stats` - Schedule statistics (Admin only)

**Recurring Schedule Example:**
```javascript
{
  scheduledFor: "2026-03-01T08:00:00Z",
  voucherType: 1,               // Education
  amount: 100,
  recipient: "0x...",
  merchantId: "school_123",
  recurringSchedule: {
    enabled: true,
    frequency: "monthly",        // daily, weekly, monthly, yearly
    endDate: "2026-12-31T23:59:59Z"
  }
}
```

### 📋 Voucher Templates
- **Reusable Templates**: Create templates for commonly issued vouchers
- **Default Values**: Set default amounts, expiry days, and metadata
- **Transfer Restrictions**: Configure transfer rules at template level
- **Partial Redemption**: Enable/disable partial redemption per template
- **Template Categories**: Organize templates by category (education, healthcare, etc.)
- **Usage Tracking**: Track how many vouchers created from each template
- **Active/Inactive Status**: Deactivate templates without deletion
- **Template Duplication**: Clone existing templates for quick setup
- **Template Analytics**: View usage statistics and popular templates

**API Endpoints:**
- `POST /api/templates` - Create template (Admin only)
- `GET /api/templates` - List templates with search/filter (Auth required)
- `GET /api/templates/:templateId` - Get template details (Auth required)
- `PUT /api/templates/:templateId` - Update template (Admin only)
- `POST /api/templates/:templateId/deactivate` - Deactivate template (Admin only)
- `POST /api/templates/:templateId/activate` - Activate template (Admin only)
- `DELETE /api/templates/:templateId` - Delete template (Admin only)
- `POST /api/templates/:templateId/duplicate` - Duplicate template (Admin only)
- `GET /api/templates/:templateId/stats` - Get usage statistics (Auth required)
- `GET /api/templates/analytics/popular` - Get popular templates (Admin only)
- `GET /api/templates/analytics/recent` - Get recently used templates (Admin only)

**Template Structure:**
```javascript
{
  name: "Monthly Student Stipend",
  description: "Standard monthly education voucher",
  category: "education",
  voucherType: 1,
  defaultValue: 500,
  defaultExpiryDays: 30,
  allowPartialRedemption: true,
  transferRestrictions: {
    maxTransfers: 2,
    requireApproval: false
  },
  metadata: {
    program: "Student Support Program",
    semester: "Spring 2026"
  }
}
```

## Security Features

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (Admin, Merchant, User)
- **API key management** for merchant integrations
- **Rate limiting** on all endpoints (configurable via environment variables)
- **Account lockout** after failed login attempts
- **Password hashing** with bcrypt

### Input Validation & Sanitization
- **Comprehensive input validation** using express-validator on all endpoints
- **NoSQL injection protection** using express-mongo-sanitize
- **XSS protection** with xss-clean middleware
- **HTTP Parameter Pollution (HPP) protection** with whitelist support
- **Type checking** for all request parameters and body fields
- **Format validation** for addresses, emails, and other structured data
- **Detailed error messages** with field-specific validation feedback
- **Custom sanitization** removing null bytes and malicious patterns

### Security Headers & CORS
- **Helmet.js integration** for comprehensive security headers
- **Content Security Policy (CSP)** with strict directives
- **HTTP Strict Transport Security (HSTS)** with 1-year max-age
- **X-Frame-Options** set to DENY to prevent clickjacking
- **X-Content-Type-Options** set to nosniff
- **Configurable CORS** with origin whitelist support
- **Credentials support** for authenticated cross-origin requests

### Data Protection
- **Environment variable encryption** using AES-256-GCM
- **Secure key management** with cryptographically secure random generation
- **Sensitive data masking** in logs and responses
- **Timing-safe comparison** for secrets to prevent timing attacks
- **Password hashing** using PBKDF2 with high iteration count
- **Private key protection** with proper environment variable handling

### QR Code Security
- **HMAC-SHA256 signatures** for QR code integrity verification
- **Signature validation** on redemption to prevent tampering
- **Double-redemption prevention** with database transaction locks
- **Expiry validation** before redemption
- **Merchant verification** before processing redemptions

### Error Handling & Monitoring
- **Environment-specific error responses** (detailed in dev, sanitized in production)
- **Comprehensive error logging** with request context
- **404 handler** with informative messages
- **Global error handler** with status code detection
- **Health check endpoint** with uptime monitoring
- **Safe environment variable logging** with sensitive data redaction
- **Application Performance Monitoring (APM)**: Real-time monitoring of application performance via `express-status-monitor` at the `/status` endpoint.
- **Error Tracking**: Integration with Sentry for real-time error tracking and reporting. Requires `SENTRY_DSN` environment variable.
- **Log Aggregation**: Support for log aggregation to an ELK stack (Elasticsearch, Logstash, Kibana) via Winston. Requires `ELASTICSEARCH_URL` environment variable.
- **Metrics Dashboard**: Exposes a `/metrics` endpoint with Prometheus-compatible metrics for use with Grafana.

### Blockchain Resilience
- **Automatic retry logic** with exponential backoff for failed blockchain calls
- **Retry limits** to prevent infinite loops (max 3 retries by default)
- **Distinguishes retryable vs non-retryable errors** for intelligent retry behavior
- **Transaction failure handling** with proper error propagation
- **Graceful degradation** when blockchain is temporarily unavailable
- **Real-time event monitoring** with automatic reconnection

### Production Security Recommendations
- Set `NODE_ENV=production` in production environments
- Use strong, unique values for `JWT_SECRET`, `QR_SIGNING_SECRET`, and `ENCRYPTION_KEY`
- Configure `ALLOWED_ORIGINS` to include only trusted domains
- Enable HTTPS/TLS for all production deployments
- Regularly rotate API keys and JWT secrets
- Monitor rate limit violations and suspicious activities
- Keep dependencies updated and scan for vulnerabilities
- Use environment-specific MongoDB instances with authentication enabled

See [Authentication Documentation](docs/AUTHENTICATION.md) for detailed information.

## Database & Performance

- **MongoDB connection pooling**: The backend uses Mongoose with configurable pool sizes and timeouts to handle concurrent traffic efficiently. You can tune these via environment variables:
  - `MONGODB_MAX_POOL_SIZE` / `MONGODB_MIN_POOL_SIZE` – upper and lower bounds for active connections.
  - `MONGODB_SERVER_SELECTION_TIMEOUT_MS` – how long the driver waits to discover a healthy node.
  - `MONGODB_SOCKET_TIMEOUT_MS` – how long idle sockets stay open.
- **Optimized indexes**: Voucher and redemption collections are indexed on the fields used most often in queries (owner, merchant, voucher type, redemption timestamps, and voucher object IDs) to keep dashboards and history views fast, even with large datasets.
- **Redemption archival**: Old redemption records can be moved from the hot `redemptions` collection into an `archived_redemptions` collection using the archival script:
  - Script: `node scripts/archiveRedemptions.js [days]` (optional `days` argument overrides the default cutoff).
  - Environment variables:
    - `REDEMPTION_ARCHIVE_AFTER_DAYS` – default age threshold for archival when no `days` argument is provided.
    - `REDEMPTION_ARCHIVE_BATCH_SIZE` – how many records to move per batch.
  - This keeps the primary redemption collection small and fast while preserving a complete historical record.
- **Backups**: Regular MongoDB backups (for example, using `mongodump`/`mongorestore`) are strongly recommended for production. See the deployment guide for operational recommendations.

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

### Batch Operations

#### Bulk Voucher Minting (Admin only)

```bash
curl -X POST http://localhost:3000/api/vouchers/bulk-mint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{
    "vouchers": [
      {
        "voucherType": 1,
        "amount": 5000,
        "recipient": "0x...",
        "merchantId": "SCHOOL_001",
        "expiryTimestamp": 1735689600,
        "metadata": "Grade 10 School Fees"
      },
      {
        "voucherType": 2,
        "amount": 3000,
        "recipient": "0x...",
        "merchantId": "CLINIC_001",
        "expiryTimestamp": 1735689600,
        "metadata": "Healthcare voucher"
      }
    ]
  }'
```

#### Batch Merchant Registration (Admin only)

```bash
curl -X POST http://localhost:3000/api/merchants/batch-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{
    "merchants": [
      {
        "merchantId": "CLINIC_002",
        "name": "Rural Health Center",
        "walletAddress": "0x...",
        "voucherTypesAccepted": [2],
        "contactEmail": "rural@health.com"
      },
      {
        "merchantId": "SCHOOL_002",
        "name": "Community Primary School",
        "walletAddress": "0x...",
        "voucherTypesAccepted": [1],
        "contactEmail": "admin@cps.edu"
      }
    ]
  }'
```

#### CSV Import for Recipients

```bash
# Import recipients from CSV file and create vouchers for each
curl -X POST http://localhost:3000/api/redemptions/import-recipients \
  -H "Authorization: Bearer <admin_or_merchant_token>" \
  -F "file=@recipients.csv"

# CSV format example:
# voucherType,amount,recipient,merchantId,expiryTimestamp,metadata
# 1,5000,0x1234...,SCHOOL_001,1735689600,Grade 10 School Fees
# 2,3000,0x5678...,CLINIC_001,1735689600,Healthcare voucher
```

### Notifications

#### Get Notification Preferences

```bash
curl -X GET http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer <access_token>"
```

#### Update Notification Preferences

```bash
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": false,
    "pushEnabled": true,
    "notifyOnVoucherReceived": true,
    "notifyOnVoucherRedemption": true,
    "notifyOnVoucherExpiry": true,
    "expiryNotificationDays": 7
  }'
```

#### Send Test Notifications

```bash
# Test email notification
curl -X POST http://localhost:3000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"subject": "Test Email", "message": "This is a test notification"}'

# Test SMS notification
curl -X POST http://localhost:3000/api/notifications/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"phoneNumber": "+1234567890", "message": "Test SMS notification"}'

# Test push notification
curl -X POST http://localhost:3000/api/notifications/test-push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"title": "Test Push", "body": "This is a test push notification"}'
```

#### Register for Push Notifications

```bash
curl -X POST http://localhost:3000/api/notifications/register-push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"token": "device_fcm_token"}'
```

#### Enhanced Bulk Notifications

```bash
# Send bulk notifications
curl -X POST http://localhost:3000/api/notifications/bulk-send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{
    "notifications": [
      {
        "userId": "user-123",
        "type": "system_maintenance",
        "data": {
          "maintenanceType": "Database upgrade",
          "startTime": "2024-02-15 02:00 UTC",
          "endTime": "2024-02-15 04:00 UTC",
          "affectedServices": "User dashboard",
          "description": "Upgrading database for better performance"
        }
      }
    ],
    "batchSize": 50
  }'

# Check bulk notification status
curl -X GET http://localhost:3000/api/notifications/bulk-status/batch_123456 \
  -H "Authorization: Bearer <admin_access_token>"
```

#### Scheduled Notifications

```bash
# Schedule notification
curl -X POST http://localhost:3000/api/notifications/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "userId": "user-123",
    "type": "system_maintenance",
    "data": {
      "maintenanceType": "Scheduled maintenance",
      "startTime": "2024-02-15 02:00 UTC",
      "endTime": "2024-02-15 04:00 UTC"
    },
    "scheduleTime": "2024-02-14T20:00:00Z",
    "priority": "high"
  }'

# Cancel scheduled notification
curl -X DELETE http://localhost:3000/api/notifications/schedule/schedule_123456 \
  -H "Authorization: Bearer <access_token>"
```

### Enhanced Batch Operations

#### Create Enhanced Batch Operation

```bash
curl -X POST http://localhost:3000/api/batch/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{
    "operationType": "bulk_mint_vouchers",
    "data": [
      {
        "voucherType": "1",
        "amount": 5000,
        "recipient": "0x...",
        "merchantId": "SCHOOL_001",
        "expiryTimestamp": 1735689600,
        "metadata": "Grade 10 School Fees"
      }
    ],
    "batchSize": 25,
    "priority": "high",
    "parallelProcessing": true
  }'
```

#### Monitor Batch Operation

```bash
# Get batch status
curl -X GET http://localhost:3000/api/batch/status/batch_123456 \
  -H "Authorization: Bearer <access_token>"

# Get user's batch operations
curl -X GET http://localhost:3000/api/batch/my-operations?limit=10&status=processing \
  -H "Authorization: Bearer <access_token>"

# Pause batch operation
curl -X POST http://localhost:3000/api/batch/pause/batch_123456 \
  -H "Authorization: Bearer <access_token>"

# Resume batch operation
curl -X POST http://localhost:3000/api/batch/resume/batch_123456 \
  -H "Authorization: Bearer <access_token>"
```

#### Export Batch Results

```bash
# Export as JSON
curl -X GET http://localhost:3000/api/batch/export/batch_123456?format=json \
  -H "Authorization: Bearer <access_token>" \
  -o batch_results.json

# Export as CSV
curl -X GET http://localhost:3000/api/batch/export/batch_123456?format=csv \
  -H "Authorization: Bearer <access_token>" \
  -o batch_results.csv
```

#### Enhanced Bulk Voucher Minting

```bash
curl -X POST http://localhost:3000/api/vouchers/bulk-mint-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{
    "vouchers": [
      {
        "voucherType": "1",
        "amount": 5000,
        "recipient": "0x...",
        "merchantId": "SCHOOL_001",
        "expiryTimestamp": 1735689600,
        "metadata": "Grade 10 School Fees"
      }
    ],
    "batchSize": 25,
    "priority": "high",
    "parallelProcessing": true
  }'
```

### Analytics Dashboard

#### Get Dashboard Overview

```bash
# Get comprehensive dashboard with filters
curl -X GET "http://localhost:3000/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31&voucherType=1" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Voucher Statistics

```bash
# Get voucher stats by type
curl -X GET "http://localhost:3000/api/analytics/vouchers?voucherType=2&merchantId=CLINIC_001" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Merchant Performance

```bash
# Get merchant analytics
curl -X GET "http://localhost:3000/api/analytics/merchants?startDate=2024-01-01" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Financial Reports

```bash
# Get financial summary
curl -X GET "http://localhost:3000/api/analytics/financial?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <access_token>"
```

#### Get Trend Data

```bash
# Get daily trends
curl -X GET "http://localhost:3000/api/analytics/trends?period=daily&voucherType=1" \
  -H "Authorization: Bearer <access_token>"

# Get weekly trends
curl -X GET "http://localhost:3000/api/analytics/trends?period=weekly" \
  -H "Authorization: Bearer <access_token>"
```

#### Export Analytics Data

```bash
# Export dashboard data as JSON
curl -X GET "http://localhost:3000/api/analytics/export?type=dashboard&format=json" \
  -H "Authorization: Bearer <access_token>" \
  -o analytics_export.json

# Export voucher stats as CSV
curl -X GET "http://localhost:3000/api/analytics/export?type=vouchers&format=csv" \
  -H "Authorization: Bearer <access_token>" \
  -o vouchers_stats.csv

# Export financial report
curl -X GET "http://localhost:3000/api/analytics/export?type=financial&format=json&startDate=2024-01-01" \
  -H "Authorization: Bearer <access_token>" \
  -o financial_report.json
```

#### Real-Time Metrics (Admin)

```bash
# Get real-time metrics for last 24 hours
curl -X GET http://localhost:3000/api/analytics/realtime \
  -H "Authorization: Bearer <admin_access_token>"
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

ServicePass includes a comprehensive test suite with **1,500+ lines of test code** covering unit tests, integration tests, and end-to-end scenarios across all core and advanced features.

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

# Run all advanced feature tests
npm test -- --testPathPattern="(voucherTemplate|scheduledVoucher|multiSig|voucherTransfer|templates).*.test.js"
```

### Test Coverage Overview

ServicePass maintains comprehensive test coverage across:
- ✅ **Model Layer**: Database schemas, validation logic, and query methods
- ✅ **API Routes**: All REST endpoints with authentication and authorization
- ✅ **Business Logic**: Core voucher operations and advanced features
- ✅ **Security**: QR code signatures, anti-fraud measures, JWT validation
- ✅ **Redemption Flow**: Complete voucher lifecycle from creation to redemption
- ✅ **Error Handling**: Edge cases, validation failures, and recovery scenarios

### Test Suite Details

#### Core Functionality Tests
**Voucher Model** (`voucher.model.test.js`)
- Model validation and database operations
- Voucher type constraints (1-4 for EDU/HEALTH/TRANSPORT/AGRI)
- Expiry date handling and timezone management
- Balance tracking for partial redemptions

**Redemption Routes** (`redemptions.routes.test.js`)
- QR code generation with cryptographic signatures
- Secure redemption with signature verification
- Double-redemption prevention with database locking
- Anti-fraud detection mechanisms

**Voucher Routes** (`vouchers.routes.test.js`)
- Voucher creation and management endpoints
- Search and filtering capabilities
- Merchant authorization via API keys
- Role-based access control (Admin/Merchant/User)

#### Advanced Features Tests (1,485+ lines)

**Voucher Templates** (`voucherTemplate.model.test.js` - 232 lines, 8 test suites)
- Template creation with comprehensive validation (name, category, voucher type 1-4)
- Default values for amount, expiry days, and redemption settings
- Usage tracking with increment counters
- Query helpers: `findActive()`, `findByCategory()`
- Transfer restriction configurations
- Metadata storage for custom fields
- Template duplication and deactivation workflows

**Scheduled Vouchers** (`scheduledVoucher.model.test.js` - 254 lines, 7 test suites)
- Scheduled voucher creation with future execution dates
- Recurring schedules: daily, weekly, monthly, yearly patterns
- Status management: pending → processing → completed/failed
- Schedule cancellation with state validation
- Query methods: `findReady()`, `findPending()` with timestamp filtering
- Template integration for automated voucher creation
- Complete lifecycle tracking from schedule to execution

**Multi-Signature Operations** (`multiSigOperation.model.test.js` - 334 lines, 8 test suites)
- All 8 critical operation types: voucher issuance, template changes, merchant management, system configuration, transfer approvals, batch operations, analytics access, emergency actions
- Signature collection with duplicate prevention logic
- Auto-approval when required signatures (2-3) are reached
- Status transitions: pending → approved → executed/rejected/expired
- Query helpers: `findPending()`, `findExpired()` for admin workflows
- Complete operation lifecycle with approval tracking
- Expiry handling for time-sensitive operations

**Voucher Transfers** (`voucherTransfer.model.test.js` - 319 lines, 8 test suites)
- Transfer request creation (full and partial types)
- Approval workflow: pending → approved → completed
- Rejection handling with reason tracking
- Partial transfer amount validation against voucher balance
- Transfer history queries via `getVoucherHistory()`
- Metadata storage for transfer notes and context
- Complete lifecycle: creation → approval → execution → completion/failure

**Template API Routes** (`templates.routes.test.js` - 340+ lines, 9 test suites)
- All 11 template endpoints with full coverage
- Authentication: JWT token validation for all requests
- Authorization: Admin-only endpoints vs user-accessible endpoints
- Template CRUD operations with validation
- Search and filtering: by name, category, active status
- Analytics endpoints: popular templates, usage statistics
- Template duplication with unique ID generation
- Edge cases: non-existent templates, invalid data, permission denials

#### Enhanced Systems Tests
**Notification System**
- Multi-channel delivery (Email/SMS/Push)
- Retry logic with exponential backoff (up to 3 attempts)
- Bulk notification processing with batch sizes
- Scheduled delivery with precise timing
- Rate limiting (10 notifications/minute per type)
- Analytics tracking for delivery success rates

**Batch Operations**
- Progress tracking with completion percentages
- Queue management with priority levels
- Pause/resume functionality with state persistence
- Parallel vs sequential processing modes
- Error handling with partial success support
- Export results in JSON/CSV formats

**Analytics & Reporting**
- Real-time metrics aggregation
- Trend analysis (hourly/daily/weekly/monthly)
- Performance metrics and success rates
- Data export functionality

### Test Infrastructure

**Testing Tools**
- **Jest**: Primary testing framework
- **Supertest**: HTTP endpoint testing
- **MongoDB Memory Server**: In-memory database for fast, isolated tests
- **JWT**: Token generation for authentication testing
- **Mock Blockchain**: Simulated SUI blockchain interactions

**Test Patterns**
- `beforeAll()`: Database connection and test user creation
- `beforeEach()`: Test isolation with collection cleanup
- `describe()`: Logical grouping of related tests
- Comprehensive edge case coverage
- Integration tests for complete workflows
- Unit tests for individual functions

**Continuous Integration**
- Automated test execution on every push
- Pull request validation with test results
- Code coverage reporting
- Test failure notifications

## 📚 Documentation

ServicePass includes comprehensive documentation to support developers, users, merchants, and operators:

### [API Documentation](docs/API_DOCUMENTATION.md)
Complete API reference with Swagger/OpenAPI specifications covering:
- 85+ documented endpoints with request/response examples
- Authentication flows (JWT tokens, API keys)
- OpenAPI 3.0 specification for API integration
- Rate limiting and security guidelines
- Error handling and status codes
- Code examples in multiple languages (cURL, JavaScript, Python)
- **NEW**: Quick Start Guide with practical examples
- **NEW**: Architecture diagrams (request flow, system components)
- **NEW**: Performance optimization tips (caching, batching, compression)
- **NEW**: Security best practices (token management, API key protection)
- **NEW**: SDK examples for JavaScript and Python

### [User Guide](docs/USER_GUIDE.md)
End-user documentation including:
- Getting started with ServicePass
- Managing your vouchers and wallet
- Redemption process and partial redemptions
- Using advanced features (templates, scheduled vouchers, transfers)
- Notification preferences and settings
- Troubleshooting common issues
- FAQ and support resources
- **NEW**: 5-Minute Quick Start with visual flowchart
- **NEW**: Video tutorials section covering all features
- **NEW**: Dashboard navigation map for easy reference
- **NEW**: Quick Reference Cards (status guide, keyboard shortcuts)
- **NEW**: Interactive troubleshooting guide with flowchart

### [Merchant Onboarding Guide](docs/MERCHANT_ONBOARDING.md)
Comprehensive merchant setup and operations guide:
- Merchant registration process
- API key generation and security
- Accepting voucher redemptions
- QR code scanning and verification
- Partial redemption handling
- Transfer approvals and management
- Analytics dashboard usage
- Batch operations and reporting
- Regulatory compliance and best practices

### [Smart Contract Audit Report](docs/SMART_CONTRACT_AUDIT.md)
Security audit findings and recommendations:
- Smart contract security analysis
- Vulnerability assessment and findings
- Code quality evaluation
- Gas optimization recommendations
- Access control review
- Testing coverage analysis
- Deployment verification
- Security best practices

### [Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md)
Production deployment procedures and operations:
- Infrastructure requirements and setup
- Smart contract deployment process
- Backend service deployment
- Frontend application deployment
- Database configuration and migration
- Environment variables and secrets management
- Monitoring and observability setup
- Backup and disaster recovery procedures
- Scaling strategies and performance tuning
- Troubleshooting and incident response
- **NEW**: Quick Deployment Guide (10-minute setup)
- **NEW**: Deployment flow diagrams with rollback paths
- **NEW**: Environment comparison matrices
- **NEW**: Network configuration diagrams

### Additional Documentation
- **[Architecture](docs/ARCHITECTURE.md)**: System design and component interactions
- **[Authentication](docs/AUTHENTICATION.md)**: Auth flows, JWT, API keys, and security
- **[QR Code System](docs/QR_CODE_SYSTEM.md)**: QR code generation, signing, and verification
- **[Frontend Features](docs/FRONTEND_FEATURES.md)**: Complete UI capabilities and components

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

**Status**: ✅ Active Development  
**Last Updated**: February 19, 2026  
**Version**: 1.0.0  
**Test Coverage**: Comprehensive (1,500+ lines of test code)  
**Documentation**: Complete with enhanced API docs, user guides, merchant onboarding, audit reports, and deployment runbooks (includes diagrams, quick starts, and performance tips)  
**Frontend**: Complete UI with 15+ React pages including all advanced features  
**Backend**: 85+ API endpoints with full authentication and authorization  
**Database**: MongoDB with 13+ data models  
**Blockchain**: SUI Move smart contracts deployed and tested  
**Features**: Core + 5 Advanced Features (Partial Redemption, Transfer Restrictions, Multi-Sig, Scheduled Issuance, Templates)

---

<div align="center">

**Built using SUI and Move**

[Star this repo](https://github.com/davelee001/ServicePass) | [Documentation](docs/) | [Get Started](#getting-started)

</div>

## CI/CD Workflows

ServicePass uses GitHub Actions to automate the development and deployment process. The following workflows are implemented:

1. **Automated Testing**: Ensures code quality by running tests on every push and pull request.
2. **Code Linting**: Enforces coding standards by running a linter on the codebase.
3. **Smart Contract Compilation**: Compiles Move smart contracts to ensure they are error-free.
4. **Automated Deployment**: Deploys the backend and frontend to production environments.
5. **Environment Management**: Handles deployments to development, staging, and production environments.
6. **Nice-to-Have Enhancements**: Includes Slack notifications, dependency caching, and security audits.

These workflows ensure a robust and efficient development lifecycle, reducing manual effort and improving reliability.
