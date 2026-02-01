# Authentication Quick Reference

## Quick Start

### 1. Install & Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env - set JWT_SECRET
```

### 2. Create Admin
```bash
npm run create-admin
```

### 3. Start Server
```bash
npm run dev
```

## API Quick Reference

### Authentication

**Register**
```bash
POST /api/auth/register
Body: { email, password, name, role?, walletAddress? }
→ Returns: { user, accessToken, refreshToken }
```

**Login**
```bash
POST /api/auth/login
Body: { email, password }
→ Returns: { user, accessToken, refreshToken }
```

**Refresh Token**
```bash
POST /api/auth/refresh
Body: { refreshToken }
→ Returns: { accessToken }
```

### Using Authentication

**With JWT (All Users)**
```bash
GET /api/auth/me
Header: Authorization: Bearer <accessToken>
```

**With API Key (Merchants)**
```bash
POST /api/redemptions
Header: X-API-Key: <apiKey>
```

### API Key Management

**Generate**
```bash
POST /api/merchants/:merchantId/api-key
Header: Authorization: Bearer <token>
Body: { expiryDays: 365 }
→ Returns: { apiKey } (shown only once!)
```

**Check Info**
```bash
GET /api/merchants/:merchantId/api-key
Header: Authorization: Bearer <token>
```

**Revoke**
```bash
DELETE /api/merchants/:merchantId/api-key
Header: Authorization: Bearer <token>
```

## Roles & Permissions

| Endpoint | Public | User | Merchant | Admin |
|----------|--------|------|----------|-------|
| Register | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ |
| List Merchants | ✅ | ✅ | ✅ | ✅ |
| View Vouchers | ✅* | ✅ | ✅ | ✅ |
| My Profile | ❌ | ✅ | ✅ | ✅ |
| My Redemptions | ❌ | ✅ | ✅ | ✅ |
| Merchant Details | ❌ | ❌ | ✅** | ✅ |
| Merchant Redemptions | ❌ | ❌ | ✅** | ✅ |
| API Key Mgmt | ❌ | ❌ | ✅** | ✅ |
| Register Merchant | ❌ | ❌ | ❌ | ✅ |
| Mint Vouchers | ❌ | ❌ | ❌ | ✅ |

*Optional auth | **Own merchant only

## Rate Limits

| Operation | Limit |
|-----------|-------|
| General API | 100/15min |
| Login | 5/15min |
| Register | 3/hour |
| Redemptions | 10/min |
| API Key Usage | 30/min |
| Reads | 60/min |
| Writes | 20/min |

## Error Codes

| Code | Meaning |
|------|---------|
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 423 | Locked - Too many failed logins |
| 429 | Too Many Requests - Rate limit exceeded |

## Common Patterns

### Login Flow
```javascript
// 1. Login
const { accessToken, refreshToken } = await login(email, password);

// 2. Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 3. Use token
fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// 4. Handle expiration
if (response.status === 401) {
  const { accessToken } = await refresh(refreshToken);
  // Retry request
}
```

### Merchant API Integration
```javascript
// 1. Generate API key (one-time)
const { apiKey } = await generateApiKey(merchantId, token);
// Store securely!

// 2. Use for redemptions
fetch('/api/redemptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify(redemptionData)
});
```

## Environment Variables

**Required:**
```env
JWT_SECRET=<random-64-char-string>
MONGODB_URI=mongodb://localhost:27017/servicepass
```

**Optional:**
```env
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
PORT=3000
```

## Testing

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","name":"Test"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# Get Profile
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Troubleshooting

**"Invalid token"**
- Token expired → Use refresh endpoint
- Wrong JWT_SECRET → Check .env
- Malformed token → Check format: `Bearer <token>`

**"Account locked"**
- Wait 2 hours OR
- Contact admin to reset OR
- Check `lockUntil` in database

**"Too many requests"**
- Wait for rate limit window to reset
- Check rate limit headers in response
- Implement exponential backoff

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use HTTPS in production
- [ ] Store tokens securely (not localStorage)
- [ ] Implement token refresh logic
- [ ] Rotate API keys regularly
- [ ] Monitor failed login attempts
- [ ] Enable CORS with specific origins
- [ ] Use strong passwords (min 8 chars)
- [ ] Backup user database regularly
- [ ] Log security events

## More Info

📚 Full Documentation: [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md)
