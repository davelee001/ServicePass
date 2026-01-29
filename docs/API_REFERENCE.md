# ServicePass API Reference

Base URL: `http://localhost:3000/api`

## Authentication

Currently, the API does not require authentication for read operations. Write operations (mint, register) are protected by requiring the admin private key configured in the backend.

---

## Vouchers

### Mint Voucher

Create a new voucher and assign it to a recipient.

**Endpoint:** `POST /vouchers/mint`

**Request Body:**
```json
{
  "voucherType": 1,
  "amount": 5000,
  "recipient": "0x1234567890abcdef...",
  "merchantId": "MERCHANT_001",
  "expiryTimestamp": 1735689600,
  "metadata": "School fees for Q1 2025"
}
```

**Parameters:**
- `voucherType` (number, required): Type of voucher
  - 1 = Education
  - 2 = Healthcare
  - 3 = Transport
  - 4 = Agriculture
- `amount` (number, required): Amount in smallest unit (e.g., cents)
- `recipient` (string, required): SUI wallet address of recipient
- `merchantId` (string, required): ID of authorized merchant
- `expiryTimestamp` (number, required): Unix timestamp for expiry
- `metadata` (string, optional): Additional information

**Response:**
```json
{
  "success": true,
  "transactionDigest": "0xabcd1234...",
  "voucherType": 1,
  "amount": 5000,
  "recipient": "0x1234567890abcdef..."
}
```

---

### Get Vouchers by Owner

Retrieve all vouchers owned by a specific address.

**Endpoint:** `GET /vouchers/owner/:address`

**Parameters:**
- `address` (path): SUI wallet address

**Example:**
```
GET /vouchers/owner/0x1234567890abcdef...
```

**Response:**
```json
{
  "address": "0x1234567890abcdef...",
  "vouchers": [
    {
      "data": {
        "objectId": "0xvoucher1...",
        "content": {
          "type": "0xpackage::voucher_system::Voucher",
          "fields": {
            "voucher_type": 1,
            "amount": 5000,
            "issued_to": "0x1234567890abcdef...",
            "merchant_id": "MERCHANT_001",
            "expiry_timestamp": 1735689600,
            "is_redeemed": false,
            "metadata": "School fees"
          }
        }
      }
    }
  ]
}
```

---

## Merchants

### Register Merchant

Register a new merchant who can accept voucher redemptions.

**Endpoint:** `POST /merchants/register`

**Request Body:**
```json
{
  "merchantId": "CLINIC_001",
  "name": "Community Health Clinic",
  "walletAddress": "0xmerchant123...",
  "voucherTypesAccepted": [2],
  "contactEmail": "clinic@example.com",
  "contactPhone": "+1234567890"
}
```

**Parameters:**
- `merchantId` (string, required): Unique merchant identifier
- `name` (string, required): Business name
- `walletAddress` (string, required): SUI wallet address
- `voucherTypesAccepted` (array, required): Array of accepted voucher types [1-4]
- `contactEmail` (string, optional): Contact email
- `contactPhone` (string, optional): Contact phone

**Response:**
```json
{
  "success": true,
  "merchant": {
    "merchantId": "CLINIC_001",
    "name": "Community Health Clinic",
    "walletAddress": "0xmerchant123...",
    "voucherTypesAccepted": [2],
    "isActive": true,
    "totalRedemptions": 0,
    "registeredAt": "2025-01-29T10:00:00.000Z"
  },
  "transactionDigest": "0xtxhash..."
}
```

---

### Get All Merchants

Retrieve list of all active merchants.

**Endpoint:** `GET /merchants`

**Response:**
```json
{
  "merchants": [
    {
      "merchantId": "CLINIC_001",
      "name": "Community Health Clinic",
      "walletAddress": "0xmerchant123...",
      "voucherTypesAccepted": [2],
      "totalRedemptions": 15,
      "isActive": true
    }
  ]
}
```

---

### Get Merchant by ID

Retrieve details of a specific merchant.

**Endpoint:** `GET /merchants/:merchantId`

**Example:**
```
GET /merchants/CLINIC_001
```

**Response:**
```json
{
  "merchant": {
    "merchantId": "CLINIC_001",
    "name": "Community Health Clinic",
    "walletAddress": "0xmerchant123...",
    "voucherTypesAccepted": [2],
    "totalRedemptions": 15,
    "contactEmail": "clinic@example.com",
    "isActive": true,
    "registeredAt": "2025-01-29T10:00:00.000Z"
  }
}
```

---

## Redemptions

### Record Redemption

Record a voucher redemption (typically called by event listener).

**Endpoint:** `POST /redemptions`

**Request Body:**
```json
{
  "voucherObjectId": "0xvoucher123...",
  "transactionDigest": "0xtx123...",
  "merchantId": "CLINIC_001",
  "voucherType": 2,
  "amount": 3000,
  "redeemedBy": "0xuser123...",
  "metadata": {
    "service": "Lab test",
    "location": "Main branch"
  }
}
```

**Response:**
```json
{
  "success": true,
  "redemption": {
    "voucherObjectId": "0xvoucher123...",
    "transactionDigest": "0xtx123...",
    "merchantId": "CLINIC_001",
    "voucherType": 2,
    "amount": 3000,
    "redeemedAt": "2025-01-29T14:30:00.000Z"
  }
}
```

---

### Get Merchant Redemptions

Retrieve redemption history for a merchant.

**Endpoint:** `GET /redemptions/merchant/:merchantId`

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Example:**
```
GET /redemptions/merchant/CLINIC_001?startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "merchantId": "CLINIC_001",
  "count": 15,
  "redemptions": [
    {
      "voucherObjectId": "0xvoucher123...",
      "transactionDigest": "0xtx123...",
      "voucherType": 2,
      "amount": 3000,
      "redeemedBy": "0xuser123...",
      "redeemedAt": "2025-01-29T14:30:00.000Z"
    }
  ]
}
```

---

### Get User Redemptions

Retrieve redemption history for a user wallet.

**Endpoint:** `GET /redemptions/user/:walletAddress`

**Example:**
```
GET /redemptions/user/0xuser123...
```

**Response:**
```json
{
  "walletAddress": "0xuser123...",
  "count": 3,
  "redemptions": [
    {
      "voucherObjectId": "0xvoucher123...",
      "merchantId": "CLINIC_001",
      "voucherType": 2,
      "amount": 3000,
      "redeemedAt": "2025-01-29T14:30:00.000Z"
    }
  ]
}
```

---

## Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-29T10:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

---

## Voucher Type Reference

| Type | Code | Description | Example Use Cases |
|------|------|-------------|-------------------|
| Education | 1 | Educational services | School fees, exams, courses |
| Healthcare | 2 | Medical services | Clinic visits, lab tests, maternal care |
| Transport | 3 | Transportation | Bus passes, taxi rides, fuel |
| Agriculture | 4 | Agricultural inputs | Seeds, fertilizer, vet services |

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider implementing rate limiting on:
- Minting endpoints (prevent spam)
- Public query endpoints (prevent abuse)

Recommended: 100 requests per 15 minutes per IP address.
