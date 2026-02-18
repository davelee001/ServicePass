# ServicePass API Documentation

**Version**: 1.0.0  
**Base URL**: `https://api.servicepass.io` (Production) | `http://localhost:3000` (Development)  
**Protocol**: REST/JSON  
**Authentication**: JWT Bearer Token & API Keys

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [OpenAPI Specification](#openapi-specification)

---

## Overview

The ServicePass API provides comprehensive endpoints for managing blockchain-based voucher operations. The API follows REST principles and returns JSON responses.

### Key Features
- **85+ Endpoints** across 10 resource categories
- **JWT Authentication** for user/admin operations
- **API Key Authentication** for merchant operations
- **Rate Limiting** on all endpoints
- **Comprehensive Error Handling** with detailed messages
- **Real-time Event Processing** with blockchain integration

### API Categories
- Authentication & User Management
- Voucher Operations
- Merchant Management
- Redemption Processing
- Analytics & Reporting
- Notification Management
- Batch Operations
- Template Management
- Scheduled Vouchers
- Multi-Signature Operations
- Transfer Management

---

## Authentication

### JWT Authentication (Users & Admins)

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

**Obtaining a Token:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65f7a8b9c1234567890abcde",
      "email": "user@example.com",
      "role": "user",
      "walletAddress": "0x1234...5678"
    }
  }
}
```

**Token Refresh:**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### API Key Authentication (Merchants)

**Header Format:**
```
X-API-Key: <merchant_api_key>
```

**Generating an API Key:**
```http
POST /api/merchants/{merchantId}/api-key
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": "mpk_live_1234567890abcdef",
    "merchantId": "MERCHANT_123",
    "expiresAt": "2027-02-16T00:00:00.000Z"
  }
}
```

---

## Common Patterns

### Request Format

All POST/PUT requests should use JSON format:

```http
POST /api/vouchers/mint
Content-Type: application/json
Authorization: Bearer <token>

{
  "recipientAddress": "0x1234567890abcdef",
  "voucherType": "EDUCATION",
  "amount": 1000,
  "expiryDate": "2026-12-31T23:59:59Z"
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "voucherId": "0xabcdef1234567890",
    "amount": 1000,
    "status": "active"
  },
  "message": "Voucher minted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance to complete redemption",
    "details": {
      "required": 500,
      "available": 300
    }
  }
}
```

### Pagination

Endpoints returning lists support pagination:

```http
GET /api/vouchers/owner/0x123?page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

## API Endpoints

### 1. Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "walletAddress": "0x1234567890abcdef"
}
```

**Response:** `201 Created`

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK` with tokens

#### Refresh Token
```http
POST /api/auth/refresh
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

---

### 2. Vouchers (`/api/vouchers`)

#### Mint Voucher (Admin)
```http
POST /api/vouchers/mint
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "recipientAddress": "0x1234567890abcdef",
  "voucherType": "EDUCATION",
  "amount": 1000,
  "expiryDate": "2026-12-31T23:59:59Z",
  "merchantId": "MERCHANT_123",
  "metadata": {
    "purpose": "School fees for semester 1",
    "studentId": "STU-2026-001"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "voucherId": "0xabcdef1234567890",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "amount": 1000,
    "type": "EDUCATION",
    "status": "active"
  }
}
```

#### Bulk Mint Vouchers
```http
POST /api/vouchers/bulk-mint
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "vouchers": [
    {
      "recipientAddress": "0x123...",
      "voucherType": "HEALTH",
      "amount": 500
    },
    {
      "recipientAddress": "0x456...",
      "voucherType": "EDUCATION",
      "amount": 1000
    }
  ]
}
```

#### Get Vouchers by Owner
```http
GET /api/vouchers/owner/:address
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (active, expired, redeemed)
- `type` - Filter by voucher type
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "voucherId": "0xabc123",
      "amount": 1000,
      "remainingBalance": 1000,
      "voucherType": "EDUCATION",
      "status": "active",
      "expiryDate": "2026-12-31T23:59:59Z",
      "merchantId": "MERCHANT_123",
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

#### Get Voucher QR Code
```http
GET /api/vouchers/:voucherId/qrcode
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "voucherId": "0xabc123",
    "signature": "0x9876543210fedcba"
  }
}
```

---

### 3. Merchants (`/api/merchants`)

#### Register Merchant (Admin)
```http
POST /api/merchants/register
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Green Valley Clinic",
  "walletAddress": "0x9876543210fedcba",
  "serviceType": "HEALTH",
  "location": {
    "address": "123 Main St",
    "city": "Kampala",
    "country": "Uganda"
  },
  "contact": {
    "email": "contact@greenvalley.com",
    "phone": "+256-700-123456"
  }
}
```

#### List Merchants
```http
GET /api/merchants
```

**Query Parameters:**
- `serviceType` - Filter by service type
- `status` - Filter by status (active, inactive)
- `search` - Search by name

#### Get Merchant Details
```http
GET /api/merchants/:merchantId
Authorization: Bearer <token>
```

#### Generate API Key
```http
POST /api/merchants/:merchantId/api-key
Authorization: Bearer <admin_token>
```

#### Revoke API Key
```http
DELETE /api/merchants/:merchantId/api-key
Authorization: Bearer <admin_token>
```

---

### 4. Redemptions (`/api/redemptions`)

#### Redeem via QR Code
```http
POST /api/redemptions/redeem-qr
X-API-Key: <merchant_api_key>
```

**Request Body:**
```json
{
  "qrData": "eyJ2b3VjaGVySWQiOiIweDEyMyIsInNpZ25hdHVyZSI6IjB4NDU2In0=",
  "amount": 500,
  "location": "Green Valley Clinic - Main Branch"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "redemptionId": "RED-123456",
    "voucherId": "0xabc123",
    "amount": 500,
    "remainingBalance": 500,
    "status": "completed",
    "transactionHash": "0xdef456789",
    "timestamp": "2026-02-16T14:30:00Z"
  }
}
```

#### Partial Redemption
```http
POST /api/redemptions/redeem-partial
X-API-Key: <merchant_api_key>
```

**Request Body:**
```json
{
  "voucherId": "0xabc123",
  "amount": 250,
  "serviceDescription": "Consultation and basic checkup"
}
```

#### Get Merchant Redemption History
```http
GET /api/redemptions/merchant/:merchantId
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` - Start date filter (ISO 8601)
- `endDate` - End date filter (ISO 8601)
- `voucherType` - Filter by voucher type
- `page` - Page number
- `limit` - Items per page

#### Get User Redemption History
```http
GET /api/redemptions/user/:walletAddress
Authorization: Bearer <token>
```

---

### 5. Analytics (`/api/analytics`)

#### Dashboard Overview
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `merchantId` - Filter by merchant
- `voucherType` - Filter by type

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalVouchers": 1500,
      "totalRedemptions": 850,
      "activeVouchers": 450,
      "totalValue": 1500000,
      "redeemedValue": 850000
    },
    "voucherDistribution": [
      { "type": "EDUCATION", "count": 600, "value": 600000 },
      { "type": "HEALTH", "count": 500, "value": 500000 },
      { "type": "TRANSPORT", "count": 250, "value": 250000 },
      { "type": "AGRI", "count": 150, "value": 150000 }
    ],
    "topMerchants": [
      {
        "merchantId": "MERCHANT_123",
        "name": "Green Valley Clinic",
        "redemptions": 250,
        "value": 250000
      }
    ],
    "trends": {
      "daily": [...],
      "weekly": [...],
      "monthly": [...]
    }
  }
}
```

#### Voucher Analytics
```http
GET /api/analytics/vouchers
Authorization: Bearer <token>
```

#### Redemption Analytics
```http
GET /api/analytics/redemptions
Authorization: Bearer <token>
```

#### Merchant Performance
```http
GET /api/analytics/merchants
Authorization: Bearer <token>
```

#### Financial Reports
```http
GET /api/analytics/financial
Authorization: Bearer <token>
```

#### Export Analytics
```http
GET /api/analytics/export?format=csv
Authorization: Bearer <token>
```

**Query Parameter:**
- `format` - Export format (json, csv)

---

### 6. Notifications (`/api/notifications`)

#### Get Preferences
```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```

#### Update Preferences
```http
PUT /api/notifications/preferences
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": {
    "enabled": true,
    "voucherReceived": true,
    "redemptionConfirmed": true,
    "expiryReminder": true
  },
  "sms": {
    "enabled": true,
    "voucherReceived": true,
    "expiryReminder": false
  },
  "push": {
    "enabled": true,
    "voucherReceived": true,
    "redemptionConfirmed": true
  },
  "expiryReminderDays": 7
}
```

#### Send Test Notification
```http
POST /api/notifications/test-email
Authorization: Bearer <token>
```

#### Get Notification History
```http
GET /api/notifications/history
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` - Filter by type (email, sms, push)
- `status` - Filter by status (sent, failed, pending)
- `page` - Page number
- `limit` - Items per page

---

### 7. Batch Operations (`/api/batch`)

#### Create Batch Operation
```http
POST /api/batch/create
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "operationType": "BULK_MINT",
  "items": [
    {
      "recipientAddress": "0x123...",
      "voucherType": "EDUCATION",
      "amount": 1000
    }
  ],
  "priority": "high",
  "processingMode": "parallel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "BATCH-123456",
    "status": "pending",
    "totalItems": 100,
    "estimatedTime": 300
  }
}
```

#### Get Batch Status
```http
GET /api/batch/status/:batchId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "BATCH-123456",
    "status": "processing",
    "progress": {
      "completed": 45,
      "failed": 2,
      "pending": 53,
      "percentage": 45
    },
    "estimatedTimeRemaining": 165,
    "createdAt": "2026-02-16T10:00:00Z"
  }
}
```

#### Pause Batch
```http
POST /api/batch/pause/:batchId
Authorization: Bearer <admin_token>
```

#### Resume Batch
```http
POST /api/batch/resume/:batchId
Authorization: Bearer <admin_token>
```

#### Cancel Batch
```http
DELETE /api/batch/cancel/:batchId
Authorization: Bearer <admin_token>
```

#### Get Batch Results
```http
GET /api/batch/results/:batchId
Authorization: Bearer <token>
```

#### Export Batch Results
```http
GET /api/batch/export/:batchId?format=csv
Authorization: Bearer <token>
```

---

### 8. Templates (`/api/templates`)

#### Create Template
```http
POST /api/templates
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Student Semester Pass",
  "category": "EDUCATION",
  "defaultAmount": 1000,
  "defaultExpiry": 90,
  "allowPartialRedemption": true,
  "transferRestrictions": {
    "maxTransfers": 2,
    "requireApproval": false
  },
  "metadata": {
    "description": "Standard voucher for semester fees",
    "terms": "Valid for registered institutions only"
  }
}
```

#### List Templates
```http
GET /api/templates
Authorization: Bearer <token>
```

**Query Parameters:**
- `category` - Filter by category
- `active` - Filter by active status
- `search` - Search by name

#### Get Template Details
```http
GET /api/templates/:templateId
Authorization: Bearer <token>
```

#### Update Template
```http
PUT /api/templates/:templateId
Authorization: Bearer <admin_token>
```

#### Duplicate Template
```http
POST /api/templates/:templateId/duplicate
Authorization: Bearer <admin_token>
```

#### Get Template Statistics
```http
GET /api/templates/:templateId/stats
Authorization: Bearer <token>
```

---

### 9. Scheduled Vouchers (`/api/scheduled-vouchers`)

#### Create Schedule
```http
POST /api/scheduled-vouchers
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "templateId": "TEMPLATE-123",
  "recipientAddress": "0x123...",
  "scheduledDate": "2026-03-01T09:00:00Z",
  "recurrence": {
    "enabled": true,
    "frequency": "monthly",
    "interval": 1,
    "endDate": "2026-12-31T23:59:59Z"
  },
  "amount": 1000
}
```

#### List Schedules
```http
GET /api/scheduled-vouchers
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (active, completed, cancelled)
- `upcomingOnly` - Show only upcoming schedules

#### Cancel Schedule
```http
POST /api/scheduled-vouchers/:scheduleId/cancel
Authorization: Bearer <token>
```

#### Trigger Schedule Manually
```http
POST /api/scheduled-vouchers/process/trigger
Authorization: Bearer <admin_token>
```

---

### 10. Multi-Signature Operations (`/api/multisig`)

#### Create Multi-Sig Operation
```http
POST /api/multisig
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "operationType": "CREATE_VOUCHER_BATCH",
  "voucherId": "0xabc123",
  "requiredSignatures": 2,
  "expiresAt": "2026-02-17T23:59:59Z",
  "metadata": {
    "reason": "Large batch creation for school program",
    "batchSize": 500
  }
}
```

#### Get Pending Operations
```http
GET /api/multisig/pending
Authorization: Bearer <admin_token>
```

#### List All Operations
```http
GET /api/multisig
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` - Filter by status (pending, approved, executed, rejected)
- `operationType` - Filter by operation type

#### Sign Operation
```http
POST /api/multisig/:operationId/sign
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "comment": "Approved after review of batch details"
}
```

#### Reject Operation
```http
POST /api/multisig/:operationId/reject
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Insufficient documentation provided"
}
```

#### Execute Operation
```http
POST /api/multisig/:operationId/execute
Authorization: Bearer <admin_token>
```

---

### 11. Transfers (`/api/transfers`)

#### Create Transfer
```http
POST /api/transfers
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "voucherId": "0xabc123",
  "recipientAddress": "0x456def",
  "amount": 500,
  "requiresApproval": true,
  "reason": "Transfer to family member"
}
```

#### List Transfers
```http
GET /api/transfers
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (pending, approved, rejected, completed)
- `voucherId` - Filter by voucher

#### Approve Transfer
```http
POST /api/transfers/:transferId/approve
Authorization: Bearer <admin_token>
```

#### Reject Transfer
```http
POST /api/transfers/:transferId/reject
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Recipient not in approved list"
}
```

#### Get Transfer History
```http
GET /api/transfers/voucher/:voucherId/history
Authorization: Bearer <token>
```

#### Get Pending Approvals
```http
GET /api/transfers/pending/approvals
Authorization: Bearer <admin_token>
```

---

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid authentication token |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INSUFFICIENT_BALANCE` | 400 | Voucher balance too low |
| `VOUCHER_EXPIRED` | 400 | Voucher has expired |
| `BLOCKCHAIN_ERROR` | 500 | Blockchain transaction failed |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `INVALID_QR_CODE` | 400 | QR code invalid or tampered |

### Validation Errors

Validation errors include field-specific details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "amount",
          "message": "Amount must be greater than 0"
        },
        {
          "field": "expiryDate",
          "message": "Expiry date must be in the future"
        }
      ]
    }
  }
}
```

---

## Rate Limiting

### Limits

All endpoints are rate-limited to prevent abuse:

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Voucher Creation | 100 requests | 1 hour |
| Redemption | 200 requests | 1 hour |
| Analytics | 60 requests | 1 minute |
| General | 1000 requests | 1 hour |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708099200
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "reset": "2026-02-16T15:00:00Z"
    }
  }
}
```

---

## OpenAPI Specification

### Complete OpenAPI 3.0 Schema

```yaml
openapi: 3.0.3
info:
  title: ServicePass API
  description: Blockchain-based voucher management system
  version: 1.0.0
  contact:
    name: ServicePass Support
    email: support@servicepass.io
    url: https://servicepass.io
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.servicepass.io
    description: Production server
  - url: http://localhost:3000
    description: Development server

security:
  - BearerAuth: []
  - ApiKeyAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from /api/auth/login
    
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: Merchant API key obtained from admin
  
  schemas:
    Voucher:
      type: object
      properties:
        voucherId:
          type: string
          example: "0xabcdef1234567890"
        amount:
          type: number
          example: 1000
        remainingBalance:
          type: number
          example: 1000
        voucherType:
          type: string
          enum: [EDUCATION, HEALTH, TRANSPORT, AGRI]
        status:
          type: string
          enum: [active, expired, redeemed, partially_redeemed]
        expiryDate:
          type: string
          format: date-time
        merchantId:
          type: string
        createdAt:
          type: string
          format: date-time
    
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object

paths:
  /api/auth/login:
    post:
      tags:
        - Authentication
      summary: User login
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  format: password
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      accessToken:
                        type: string
                      refreshToken:
                        type: string
                      user:
                        type: object
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  
  /api/vouchers/mint:
    post:
      tags:
        - Vouchers
      summary: Mint new voucher
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - recipientAddress
                - voucherType
                - amount
              properties:
                recipientAddress:
                  type: string
                voucherType:
                  type: string
                  enum: [EDUCATION, HEALTH, TRANSPORT, AGRI]
                amount:
                  type: number
                expiryDate:
                  type: string
                  format: date-time
                merchantId:
                  type: string
      responses:
        '201':
          description: Voucher minted successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/Voucher'
        '400':
          description: Invalid request
        '401':
          description: Unauthorized
  
  /api/redemptions/redeem-qr:
    post:
      tags:
        - Redemptions
      summary: Redeem voucher via QR code
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - qrData
                - amount
              properties:
                qrData:
                  type: string
                amount:
                  type: number
                location:
                  type: string
      responses:
        '200':
          description: Redemption successful
        '400':
          description: Invalid QR or insufficient balance
        '401':
          description: Invalid API key
```

---

## SDKs & Client Libraries

### JavaScript/TypeScript

```bash
npm install @servicepass/sdk
```

```typescript
import { ServicePassClient } from '@servicepass/sdk';

const client = new ServicePassClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Redeem voucher
const redemption = await client.redemptions.redeemQR({
  qrData: 'base64-qr-data',
  amount: 500
});
```

### Python

```bash
pip install servicepass-sdk
```

```python
from servicepass import ServicePassClient

client = ServicePassClient(api_key='your-api-key')

# Get vouchers
vouchers = client.vouchers.get_by_owner('0x123...')
```

---

## Changelog

### Version 1.0.0 (2026-02-16)
- Initial API release
- 85+ endpoints across 11 categories
- JWT and API Key authentication
- Comprehensive error handling
- Rate limiting implementation

---

## Support

For API support and questions:
- **Email**: api-support@servicepass.io
- **Documentation**: https://docs.servicepass.io
- **Status Page**: https://status.servicepass.io
- **GitHub Issues**: https://github.com/davelee001/ServicePass/issues

---

*Last Updated: February 16, 2026*
