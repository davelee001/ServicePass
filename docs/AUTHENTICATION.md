# Authentication & Authorization System

## Overview

ServicePass implements a comprehensive JWT-based authentication and authorization system with role-based access control, API key management for merchants, and rate limiting on all endpoints.

## Features

### 1. JWT-Based Authentication

- **Access Tokens**: Short-lived tokens (24 hours default) for authenticating API requests
- **Refresh Tokens**: Long-lived tokens (7 days default) for obtaining new access tokens
- **Secure Storage**: Passwords hashed using bcrypt with salt rounds
- **Token Rotation**: Support for multiple refresh tokens per user (max 5)

### 2. Role-Based Access Control (RBAC)

Three distinct user roles with different permissions:

#### Admin Role
- Full system access
- Can mint vouchers
- Can register merchants
- Can view all data
- Can manage users

#### Merchant Role
- Can view their own merchant data
- Can access redemption history
- Can manage their API keys
- Can redeem vouchers (via API key)

#### User Role
- Can view their own vouchers
- Can view their redemption history
- Limited read access

### 3. API Key Management

Merchants can generate and manage API keys for programmatic access:

- **Secure Generation**: Cryptographically secure random keys (32 bytes)
- **Hashed Storage**: API keys stored as SHA-256 hashes
- **Expiration**: Configurable expiry (default 365 days)
- **Revocation**: Keys can be revoked at any time
- **One-time Display**: Keys shown only once during generation

### 4. Rate Limiting

Multiple rate limiters protect different endpoints:

- **General Limiter**: 100 requests per 15 minutes (all routes)
- **Auth Limiter**: 5 login attempts per 15 minutes
- **Register Limiter**: 3 registrations per hour per IP
- **Redemption Limiter**: 10 redemptions per minute
- **API Key Limiter**: 30 requests per minute per API key
- **Read Limiter**: 60 requests per minute (GET endpoints)
- **Write Limiter**: 20 requests per minute (POST/PUT/DELETE)
- **Password Reset Limiter**: 3 attempts per hour

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "user",  // optional: "user" or "merchant"
  "walletAddress": "0x..." // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc..."
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..." // optional
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

### Merchant API Key Routes

#### Generate API Key
```http
POST /api/merchants/:merchantId/api-key
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "expiryDays": 365 // optional, default 365
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key generated successfully. Store it securely - it will not be shown again.",
  "apiKey": "a1b2c3d4e5f6...",
  "expiryDate": "2027-02-01T00:00:00.000Z"
}
```

⚠️ **Important**: The API key is shown only once. Store it securely!

#### Get API Key Info
```http
GET /api/merchants/:merchantId/api-key
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "hasApiKey": true,
  "expiryDate": "2027-02-01T00:00:00.000Z",
  "createdAt": "2026-02-01T00:00:00.000Z",
  "isExpired": false
}
```

#### Revoke API Key
```http
DELETE /api/merchants/:merchantId/api-key
Authorization: Bearer <access_token>
```

## Using Authentication

### With JWT Token (Users, Merchants, Admins)

Include the access token in the Authorization header:

```http
GET /api/merchants/merchant-001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### With API Key (Merchants Only)

Include the API key in the X-API-Key header:

```http
POST /api/redemptions
X-API-Key: a1b2c3d4e5f6789...
Content-Type: application/json

{
  "voucherObjectId": "...",
  "transactionDigest": "...",
  "merchantId": "merchant-001",
  "voucherType": 1,
  "amount": 100
}
```

## Security Features

### Account Lockout
- **Failed Login Protection**: After 5 failed login attempts, account is locked for 2 hours
- **Automatic Reset**: Login attempts reset after successful login
- **Lockout Notification**: API returns lockout time in error response

### Password Requirements
- Minimum 8 characters
- Hashed using bcrypt with 12 salt rounds
- Validated on registration and password change

### Token Security
- **JWT Secret**: Configurable via environment variable
- **Token Expiration**: Automatic expiry of access and refresh tokens
- **Token Invalidation**: All refresh tokens cleared on password change
- **Type Checking**: Prevents using refresh tokens as access tokens

### API Key Security
- **Hashed Storage**: Keys stored as SHA-256 hashes
- **One-way Encryption**: Original keys cannot be recovered
- **Expiration**: Configurable expiry dates
- **Revocation**: Instant revocation support

## Environment Variables

Required environment variables for authentication:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Protected Routes

### Admin Only
- `POST /api/vouchers/mint` - Mint new vouchers
- `POST /api/merchants/register` - Register new merchants

### Admin or Merchant
- `GET /api/merchants/:merchantId` - View merchant details
- `GET /api/redemptions/merchant/:merchantId` - View merchant redemptions
- `POST /api/merchants/:merchantId/api-key` - Generate API key
- `GET /api/merchants/:merchantId/api-key` - View API key info
- `DELETE /api/merchants/:merchantId/api-key` - Revoke API key

### Authenticated Users
- `GET /api/redemptions/user/:walletAddress` - View user redemptions
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password

### Public (with Rate Limiting)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/merchants` - List merchants
- `GET /api/vouchers/owner/:address` - View vouchers (optional auth)

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "requiredRoles": ["admin"],
  "yourRole": "user"
}
```

### 423 Locked
```json
{
  "error": "Account is temporarily locked due to too many failed login attempts",
  "lockUntil": "2026-02-01T14:30:00.000Z"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later."
}
```

## Best Practices

1. **Store Tokens Securely**: Never store tokens in localStorage; use httpOnly cookies or secure storage
2. **Implement Token Refresh**: Automatically refresh expired access tokens using refresh tokens
3. **Handle 401 Errors**: Redirect to login on authentication failures
4. **Use HTTPS**: Always use HTTPS in production to protect tokens in transit
5. **Rotate API Keys**: Regularly rotate merchant API keys
6. **Monitor Rate Limits**: Track API usage to avoid hitting rate limits
7. **Secure JWT Secret**: Use a strong, unique JWT secret in production
8. **Log Security Events**: Monitor authentication failures and suspicious activity

## Integration Example

### Frontend Login Flow

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken, refreshToken, user } = await response.json();

// Store tokens securely
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Use token for authenticated requests
const merchantsResponse = await fetch('/api/merchants/merchant-001', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Handle token expiration
if (merchantsResponse.status === 401) {
  // Refresh token
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const { accessToken: newToken } = await refreshResponse.json();
  localStorage.setItem('accessToken', newToken);
  
  // Retry original request
  // ...
}
```

### Merchant API Integration

```javascript
// Using API key for merchant operations
const apiKey = 'your-merchant-api-key';

const response = await fetch('/api/redemptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify({
    voucherObjectId: '0x...',
    transactionDigest: '...',
    merchantId: 'merchant-001',
    voucherType: 1,
    amount: 100
  })
});
```

## Testing

To test the authentication system:

1. **Register a user**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234"}'
   ```

3. **Access protected route**:
   ```bash
   curl http://localhost:3000/api/auth/me \
     -H "Authorization: Bearer <access_token>"
   ```

## Troubleshooting

### "Invalid token" error
- Check if token has expired
- Verify JWT_SECRET matches between environments
- Ensure token format is correct (Bearer <token>)

### "Too many requests" error
- Wait for rate limit window to reset
- Implement exponential backoff in client
- Consider requesting rate limit increase for high-volume merchants

### Account locked
- Wait 2 hours for automatic unlock
- Contact admin for manual unlock
- Check login attempt tracking
