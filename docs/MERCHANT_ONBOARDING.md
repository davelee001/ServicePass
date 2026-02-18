# ServicePass Merchant Onboarding Guide

**Version**: 1.0.0  
**Last Updated**: February 16, 2026

Welcome to ServicePass! This guide will help you get started as a merchant accepting blockchain-based vouchers.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Pre-Registration Requirements](#pre-registration-requirements)
3. [Registration Process](#registration-process)
4. [Setting Up Your Account](#setting-up-your-account)
5. [Understanding API Keys](#understanding-api-keys)
6. [Accepting Vouchers](#accepting-vouchers)
7. [Redemption Process](#redemption-process)
8. [Using the Merchant Dashboard](#using-the-merchant-dashboard)
9. [Advanced Features](#advanced-features)
10. [Compliance & Best Practices](#compliance--best-practices)
11. [Troubleshooting](#troubleshooting)
12. [Support & Resources](#support--resources)

---

## Introduction

### What is ServicePass?

ServicePass is a blockchain-based voucher system that enables organizations to distribute targeted vouchers that can only be redeemed for specific services. As a merchant, you'll be able to accept these vouchers as payment for your services.

### Benefits for Merchants

✅ **Guaranteed Payment** - Vouchers are pre-funded on the blockchain  
✅ **Instant Settlement** - Immediate payment confirmation  
✅ **Reduced Fraud** - Blockchain security and digital signatures  
✅ **Lower Costs** - Minimal transaction fees  
✅ **Expanded Customer Base** - Access to voucher programs  
✅ **Transparent Reporting** - Complete transaction history  
✅ **Flexible Integration** - Simple QR code or API integration

### Voucher Types You Can Accept

Merchants are authorized to accept specific voucher types based on their service category:

- **🎓 Education (EDU)** - Schools, training centers, exam centers
- **🏥 Healthcare (HEALTH)** - Clinics, hospitals, pharmacies, labs
- **🚌 Transport (TRANSPORT)** - Bus services, taxi companies, fuel stations
- **🌾 Agriculture (AGRI)** - Agro-vets, seed suppliers, equipment rentals

**Note:** You can only accept vouchers matching your registered service type.

---

## Pre-Registration Requirements

Before you can register as a ServicePass merchant, ensure you have:

### 1. Business Documentation

- [ ] **Business Registration Certificate** - Valid business license
- [ ] **Tax Identification Number (TIN)** - For tax compliance
- [ ] **Physical Business Address** - Not a P.O. Box
- [ ] **Business Bank Account** - For settlements (if applicable)
- [ ] **Owner ID** - Government-issued identification

### 2. Technical Requirements

- [ ] **SUI Wallet** - Install and set up a SUI wallet
  - Recommended: [Sui Wallet](https://wallet.sui.io/), [Ethos Wallet](https://ethoswallet.xyz/)
- [ ] **Internet Connection** - Stable broadband or mobile data
- [ ] **Device** - Smartphone, tablet, or computer
- [ ] **Email Address** - Professional business email
- [ ] **Phone Number** - Active mobile number

### 3. Service Location

- [ ] **Physical Location** - Where customers will redeem vouchers
- [ ] **Operating Hours** - Regular business hours
- [ ] **Service Description** - Clear description of services offered
- [ ] **Geographic Coverage** - Areas you serve

### 4. Compliance

- [ ] **Service Type Verification** - Proof of service category eligibility
  - Schools: Teaching license or education permit
  - Clinics: Medical practice license
  - Transport: Operating permit
  - Agriculture: Trading license
- [ ] **Zero Tolerance Policy Agreement** - No discrimination, fraud, or misuse
- [ ] **Privacy Policy Acceptance** - Data handling agreement

---

## Registration Process

### Step 1: Initial Application

1. **Contact ServicePass Admin**
   - Email: merchant-onboarding@servicepass.io
   - Subject: "New Merchant Application - [Your Business Name]"
   
2. **Provide Business Information**
   ```
   Business Name: ____________________
   Service Type: ____________________
   Location: ____________________
   Contact Person: ____________________
   Email: ____________________
   Phone: ____________________
   Wallet Address: ____________________
   ```

3. **Submit Documentation**
   - Upload all required documents
   - Ensure documents are clear and valid
   - Provide proof of service category

### Step 2: Application Review

**Timeline:** 3-5 business days

**What we verify:**
- ✓ Business legitimacy
- ✓ Service type authorization
- ✓ Document authenticity
- ✓ Compliance with regulations
- ✓ Location verification

**Possible Outcomes:**
- **Approved** - Proceed to Step 3
- **More Information Required** - Respond within 7 days
- **Rejected** - Reason provided, can reapply after 30 days

### Step 3: Account Creation

Once approved, you'll receive:

1. **Welcome Email** with:
   - Merchant ID (e.g., MERCHANT_ABC123)
   - Temporary admin email
   - Setup instructions
   - Next steps

2. **Account Activation Link**
   - Click the link in the email
   - Set up your password
   - Complete your profile

3. **Training Schedule**
   - Online training session invitation
   - Merchant portal walkthrough
   - Q&A session

### Step 4: Training & Certification

**Mandatory Training** (1-2 hours):

✓ **Module 1:** ServicePass Overview (15 min)
✓ **Module 2:** Voucher Types & Restrictions (20 min)
✓ **Module 3:** QR Code Redemption Process (30 min)
✓ **Module 4:** Fraud Prevention & Security (20 min)
✓ **Module 5:** Reporting & Compliance (15 min)

**Certification:**
- Complete all training modules
- Pass the final assessment (80% required)
- Receive Merchant Certification
- Activate redemption capabilities

### Step 5: Go Live

After certification:

1. **API Key Generation** - Receive your merchant API key
2. **Test Transactions** - Practice with test vouchers
3. **Live Redemptions** - Start accepting real vouchers
4. **Ongoing Support** - Access to merchant support team

---

## Setting Up Your Account

### Initial Setup Checklist

- [ ] **Complete Your Profile**
  - Upload business logo
  - Add business description
  - Set operating hours
  - Add location details
  
- [ ] **Configure Notification Preferences**
  - Enable email notifications
  - Set up SMS alerts
  - Configure redemption confirmations
  
- [ ] **Set Up Team Members** (if applicable)
  - Add staff accounts
  - Assign roles and permissions
  - Configure access levels
  
- [ ] **Test QR Code Redemption**
  - Practice with test vouchers
  - Verify device compatibility
  - Train staff on process
  
- [ ] **Review Policies**
  - Terms of Service
  - Redemption policies
  - Dispute resolution process

### Completing Your Merchant Profile

1. **Log into Merchant Portal**
   - Go to https://merchant.servicepass.io
   - Enter your email and password
   
2. **Business Information**
   - Business Name: ________________
   - Service Type: ________________
   - Registration Number: ________________
   - TIN: ________________
   
3. **Contact Details**
   - Primary Email: ________________
   - Phone: ________________
   - Support Email: ________________
   - Website (optional): ________________
   
4. **Location & Hours**
   - Physical Address: ________________
   - City/Region: ________________
   - Country: ________________
   - GPS Coordinates (optional): ________________
   - Operating Hours: ________________
   - Closed Days: ________________
   
5. **Service Description**
   - Describe your services (max 500 words)
   - List specific services vouchers can be used for
   - Add any restrictions or requirements
   
6. **Banking Information** (for settlements)
   - Bank Name: ________________
   - Account Number: ________________
   - Account Name: ________________
   - SWIFT/IBAN (if international): ________________

### Adding Team Members

If you have multiple staff members who will redeem vouchers:

1. **Navigate to Team Management**
   - Go to Settings > Team Members
   
2. **Add New Member**
   - Enter staff email
   - Assign role:
     - **Admin** - Full access
     - **Operator** - Can redeem vouchers
     - **Viewer** - Read-only access
   
3. **Set Permissions**
   - Redeem vouchers
   - View reports
   - Manage settings
   - Add team members
   
4. **Send Invitation**
   - Staff receives email invitation
   - They create their own password
   - Access granted after email verification

---

## Understanding API Keys

### What is an API Key?

An API key is a secure credential that authenticates your merchant account when redeeming vouchers. Think of it as a password specifically for voucher transactions.

### API Key Format

```
mpk_live_1234567890abcdefghijklmnopqrstuvwxyz
```

- `mpk` - Merchant Payment Key prefix
- `live` - Production environment (vs `test` for testing)
- Remaining characters - Unique identifier

### Generating Your API Key

1. **Log into Merchant Portal**
2. **Navigate to Settings > API Keys**
3. **Click "Generate New API Key"**
4. **Save your API key securely**
   - ⚠️ You'll only see it once!
   - Store in a secure password manager
   - Never share or commit to code repositories

### Testing vs Production Keys

| Environment | Prefix | Purpose |
|-------------|--------|---------|
| **Test** | `mpk_test_` | Practice and development |
| **Production** | `mpk_live_` | Real voucher redemptions |

**Always use test keys for:**
- Staff training
- System testing
- App development
- Integration testing

### API Key Security Best Practices

✅ **Do:**
- Store keys securely (use environment variables or secure vaults)
- Use different keys for testing and production
- Rotate keys periodically (every 90 days)
- Revoke keys immediately if compromised
- Use HTTPS for all API calls
- Implement rate limiting

❌ **Don't:**
- Share keys publicly or in code
- Email keys in plain text
- Store keys in browser localStorage
- Use production keys for testing
- Reuse keys across systems
- Ignore key expiration warnings

### Revoking an API Key

If your key is compromised:

1. **Immediate Action**
   - Go to Settings > API Keys
   - Click "Revoke" next to the compromised key
   - Confirm revocation
   
2. **Generate New Key**
   - Click "Generate New API Key"
   - Update all systems using the old key
   - Test with new key
   
3. **Report Incident**
   - Email security@servicepass.io
   - Provide incident details
   - Follow security team guidance

### Key Rotation Schedule

For optimal security, rotate your API keys:

- **Regular Rotation**: Every 90 days
- **Staff Changes**: When team members leave
- **Security Incidents**: Immediately if compromised
- **Compliance**: As required by regulations

**Auto-Rotation:**
- Enable auto-rotation in settings
- System generates new key automatically
- Old key remains valid for 7-day grace period
- Update systems during grace period

---

## Accepting Vouchers

### Voucher Acceptance Criteria

You can only accept vouchers that match:

✓ **Your Service Type** - Education, Health, Transport, or Agriculture  
✓ **Valid Status** - Active and not expired  
✓ **Sufficient Balance** - Amount requested ≤ remaining balance  
✓ **Authorized Merchant** - Voucher allows redemption at your location  
✓ **QR Code Signature** - Valid and not tampered

### Types of Redemptions

#### 1. Full Redemption

Use the entire voucher balance:

- **Customer Shows QR Code**
- **You Scan and Process**
- **Voucher Fully Redeemed**
- **Balance = 0**

**Example:**
```
Voucher Balance: $50
Redemption Amount: $50
Remaining Balance: $0
Status: Redeemed
```

#### 2. Partial Redemption

Use only part of the voucher balance:

- **Customer Shows QR Code**
- **You Enter Specific Amount**
- **Partial Amount Redeemed**
- **Remaining Balance Saved**

**Example:**
```
Voucher Balance: $50
Redemption Amount: $30
Remaining Balance: $20
Status: Partially Redeemed
```

### Voucher Restrictions

Some vouchers have restrictions:

**Transfer Limits:**
- Voucher may have been transferred
- Check transfer history if suspicious
- Report multiple transfers

**Expiry Dates:**
- Always check expiry before accepting
- Expired vouchers cannot be redeemed
- No exceptions for expired vouchers

**Merchant Restrictions:**
- Some vouchers are merchant-specific
- Error if you're not authorized
- Contact admin to request authorization

**Geographic Restrictions:**
- Vouchers may be location-specific
- Verify redemption location matches
- Update your location if moved

---

## Redemption Process

### Method 1: QR Code Redemption (Recommended)

**Step-by-Step Process:**

1. **Customer Presents QR Code**
   - Customer opens ServicePass app
   - Generates QR code for voucher
   - Shows code to you (valid 5 minutes)

2. **Scan QR Code**
   - Open merchant app or redemption device
   - Click "Scan QR Code"
   - Point camera at customer's screen
   - Wait for automatic scan

3. **Review Details**
   - Verify voucher type matches service
   - Check voucher balance
   - Confirm customer identity
   - Enter redemption amount

4. **Process Redemption**
   - Click "Redeem"
   - Wait for blockchain confirmation (10-30 seconds)
   - Show confirmation to customer

5. **Provide Service**
   - Service paid for by voucher
   - Customer receives service
   - Transaction complete

**QR Code Features:**
- Digital signature verification
- Time-limited (5 minutes)
- Single-use prevention
- Tamper detection

### Method 2: API Integration

For advanced merchants with POS systems:

**API Endpoint:**
```http
POST https://api.servicepass.io/api/redemptions/redeem-qr
X-API-Key: your-merchant-api-key
Content-Type: application/json

{
  "qrData": "base64-encoded-qr-data",
  "amount": 500,
  "location": "Main Branch",
  "serviceDescription": "Consultation and checkup"
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
    "transactionHash": "0xdef456",
    "timestamp": "2026-02-16T14:30:00Z"
  }
}
```

See [API Documentation](API_DOCUMENTATION.md) for complete integration guide.

### Method 3: Manual Entry (Backup)

If QR code scanning fails:

1. **Customer Provides Voucher ID**
   - Customer reads voucher ID from app
   - Format: 0xabc123def456...

2. **Manual Entry**
   - Click "Manual Entry"
   - Enter voucher ID carefully
   - Verify with customer

3. **Process as Normal**
   - Continue with standard redemption flow
   - Same verification and confirmation

**Note:** Manual entry is slower and more error-prone. Use QR codes whenever possible.

### Handling Redemption Errors

#### "Voucher Not Found"
- **Cause:** Invalid voucher ID
- **Solution:** Verify ID, ask customer to regenerate QR code

#### "Insufficient Balance"
- **Cause:** Redemption amount > remaining balance
- **Solution:** Check balance, reduce amount, or use partial redemption

#### "Voucher Expired"
- **Cause:** Past expiry date
- **Solution:** Inform customer, voucher cannot be used

#### "Unauthorized Merchant"
- **Cause:** You're not authorized for this voucher type
- **Solution:** Verify your service type, contact admin

#### "Invalid QR Signature"
- **Cause:** QR code tampered or corrupted
- **Solution:** Ask customer to regenerate QR code

#### "Network Error"
- **Cause:** Internet connection issue
- **Solution:** Check connection, retry after network restored

---

## Using the Merchant Dashboard

### Dashboard Overview

Your merchant dashboard provides:

**📊 Today's Summary**
- Total redemptions today
- Revenue today
- Number of unique customers
- Average transaction value

**📈 Performance Metrics**
- Daily/weekly/monthly trends
- Redemption by voucher type
- Peak hours analysis
- Customer retention rate

**🧾 Recent Transactions**
- Last 10 redemptions
- Status and amounts
- Customer wallet addresses
- Transaction hashes

**⚠️ Alerts & Notifications**
- Failed redemptions
- System updates
- Policy changes
- Training reminders

### Viewing Redemption History

1. **Navigate to Redemptions**
   - Click2. **Filter Transactions**
   - Date range
   - Voucher type
   - Amount range
   - Status

3. **Export Reports**
   - Select date range
   - Choose format (CSV, JSON, PDF)
   - Click "Export"
   - Download report

### Generating Reports

**Daily Report:**
- Total redemptions
- Total revenue
- Breakdown by voucher type
- Failed transactions

**Weekly Report:**
- Performance trends
- Customer analytics
- Peak times
- Comparison to previous week

**Monthly Report:**
- Financial summary
- Growth metrics
- Top services
- Recommendations

**Custom Report:**
- Define date range
- Select metrics
- Filter by criteria
- Schedule automatic generation

### Monitoring Performance

**Key Metrics to Track:**

📈 **Revenue Metrics**
- Total redemptions value
- Average transaction size
- Growth rate
- Voucher type distribution

👥 **Customer Metrics**
- Unique customers
- Repeat customers
- Customer acquisition rate
- Geographic distribution

⏱️ **Operational Metrics**
- Redemption success rate
- Average processing time
- Failed transactions
- Peak hours

🎯 **Efficiency Metrics**
- Transactions per day
- Staff utilization
- Error rate
- Settlement time

---

## Advanced Features

### Partial Redemption Management

**Enabling Partial Redemptions:**

1. Go to Settings > Redemption Preferences
2. Enable "Allow Partial Redemptions"
3. Set minimum redemption amount
4. Configure service descriptions

**Benefits:**
- Customers use exact amount needed
- Reduce voucher waste
- Increase customer satisfaction
- More flexible service pricing

**Best Practices:**
- Always enter service description
- Verify amount with customer
- Show remaining balance
- Provide itemized receipt

### Transfer Approval Workflow

Some merchants can approve voucher transfers:

**Approval Process:**

1. **Receive Transfer Request**
   - Notification of pending transfer
   - View transfer details
   
2. **Review Request**
   - Check voucher origin
   - Verify recipient
   - Review transfer reason
   
3. **Make Decision**
   - Approve transfer
   - Reject with reason
   - Request more information
   
4. **Transfer Executes**
   - If approved, transfer completes
   - Parties notified
   - Audit trail recorded

**When to Approve:**
- ✓ Valid reason provided
- ✓ Recipient verified
- ✓ Within policy guidelines
- ✓ No fraud indicators

**When to Reject:**
- ✗ Suspicious activity
- ✗ Policy violation
- ✗ Unverified recipient
- ✗ Missing information

### Multi-Signature Operations

For large merchants requiring additional security:

**What are Multi-Sig Operations?**
- Critical actions require multiple approvals
- Prevents unauthorized actions
- Adds accountability layer
- Protects against fraud

**Typical Use Cases:**
- Large batch redemptions (>$1,000)
- Staff member additions
- Policy changes
- Emergency actions

**How It Works:**

1. **Operation Created**
   - Manager initiates operation
   - Specifies required approvers
   
2. **Approval Collection**
   - Designated approvers review
   - Each signs approval
   - Comments recorded
   
3. **Automatic Execution**
   - Operation executes when threshold met
   - All parties notified
   - Complete audit trail

### Batch Operations

Process multiple vouchers efficiently:

**Creating a Batch:**

1. Go to Batch Operations
2. Click "New Batch"
3. Upload CSV file with:
   - Voucher IDs
   - Amounts
   - Service descriptions
4. Review and confirm
5. Monitor progress

**Supported Batch Types:**
- Bulk redemptions
- Recurring transactions
- Scheduled processing
- Import/export operations

**Benefits:**
- Save time on repetitive tasks
- Reduce manual errors
- Process during off-hours
- Complete audit trail

### API Integration

Integrate ServicePass with your existing systems:

**Integration Options:**

1. **REST API** - Direct API calls
2. **Webhooks** - Real-time event notifications
3. **SDKs** - Pre-built libraries (JavaScript, Python)
4. **Plugins** - WooCommerce, Shopify integrations

**Common Integrations:**
- Point of Sale (POS) systems
- Accounting software
- CRM systems
- Inventory management
- Booking systems

**Developer Resources:**
- API Documentation: https://docs.servicepass.io/api
- SDKs: https://github.com/servicepass/sdks
- Code Examples: https://docs.servicepass.io/examples
- Support: api-support@servicepass.io

---

## Compliance & Best Practices

### Legal Compliance

**Requirements:**

✓ **Know Your Customer (KYC)**
- Verify customer identity when required
- Keep records of high-value transactions
- Report suspicious activity

✓ **Anti-Money Laundering (AML)**
- Monitor unusual transaction patterns
- Report transactions above threshold
- Maintain transaction records

✓ **Tax Compliance**
- Report revenue accurately
- Maintain transaction records (7 years)
- Understand VAT/sales tax obligations
- Issue proper receipts

✓ **Data Protection**
- Protect customer data
- Follow GDPR/data privacy laws
- Secure storage of information
- Proper data disposal

✓ **Consumer Protection**
- Honor voucher terms
- Provide quality service
- Handle disputes fairly
- Transparent pricing

### Operational Best Practices

**✅ Do:**

1. **Verify Vouchers**
   - Check voucher type matches service
   - Verify sufficient balance
   - Confirm QR signature
   - Validate expiry date

2. **Train Staff**
   - Regular training sessions
   - Keep staff updated on policies
   - Practice redemption process
   - Security awareness

3. **Maintain Records**
   - Keep all transaction records
   - Document failed redemptions
   - Save customer communications
   - Regular data backups

4. **Secure Your Systems**
   - Rotate API keys regularly
   - Use strong passwords
   - Enable two-factor authentication
   - Update software promptly

5. **Provide Good Service**
   - Honor voucher terms
   - Be professional and courteous
   - Resolve issues quickly
   - Maintain service quality

**❌ Don't:**

1. **Never:**
   - Accept expired vouchers
   - Redeem wrong voucher types
   - Share API keys
   - Process without verification
   - Manipulate transaction amounts

2. **Avoid:**
   - Manual entry unless necessary
   - Processing during poor connectivity
   - Accepting suspicious vouchers
   - Ignoring failed transactions
   - Delaying issue reporting

### Fraud Prevention

**Warning Signs:**

🚩 **Watch for:**
- Multiple failed redemption attempts
- Unusual transaction patterns
- Customers rushing transactions
- Reluctance to provide information
- Vouchers with many transfers
- Requests for cash back
- Pressure to skip verification

**If You Suspect Fraud:**

1. **Don't Process** - Refuse the transaction politely
2. **Document Everything** - Note details, take screenshots
3. **Report Immediately** - Contact fraud@servicepass.io
4. **Preserve Evidence** - Keep all records
5. **Follow Up** - Respond to investigation requests

**Fraud Report Template:**
```
Date/Time: ________________
Voucher ID: ________________
Customer Details: ________________
Description: ________________
Supporting Evidence: ________________
Action Taken: ________________
```

### Dispute Resolution

**Common Disputes:**

1. **Customer Claims Overcharge**
   - Review transaction details
   - Check amount entered
   - Provide itemized receipt
   - Escalate if needed

2. **Customer Denies Transaction**
   - Show transaction record
   - Provide blockchain proof
   - Show QR code scan timestamp
   - Contact support if disputed

3. **Wrong Amount Redeemed**
   - Check transaction history
   - Verify amount entered
   - Contact support for reversal if error
   - Document for records

**Dispute Process:**

1. **Try to Resolve Directly**
   - Listen to customer concern
   - Review transaction details
   - Offer reasonable solution
   - Document agreement

2. **Escalate if Needed**
   - Email disputes@servicepass.io
   - Provide all relevant information
   - Wait for admin review (24-48 hours)
   - Follow admin decision

3. **Learn and Improve**
   - Identify root cause
   - Update procedures
   - Train staff
   - Prevent recurrence

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: Cannot Log into Merchant Portal

**Symptoms:** Login fails, password not accepted

**Solutions:**
1. Check email address is correct
2. Use "Forgot Password" to reset
3. Clear browser cache and cookies
4. Try different browser
5. Contact support if locked out

#### Issue: API Key Not Working

**Symptoms:** "Invalid API Key" error

**Solutions:**
1. Verify you're using production key (mpk_live_)
2. Check for extra spaces or characters
3. Ensure key hasn't been revoked
4. Generate new key if expired
5. Contact support for key verification

#### Issue: QR Code Scan Fails

**Symptoms:** Scanner doesn't recognize QR code

**Solutions:**
1. Ensure good lighting
2. Clean camera lens
3. Ask customer to increase screen brightness
4. Try manual entry as backup
5. Ask customer to regenerate QR code
6. Update scanner app/software

#### Issue: "Unauthorized Merchant" Error

**Symptoms:** Cannot redeem certain voucher types

**Solutions:**
1. Verify voucher type matches your service category
2. Check merchant account status
3. Confirm account is fully activated
4. Request authorization for voucher type
5. Contact admin for account review

#### Issue: Redemption Takes Too Long

**Symptoms:** Blockchain confirmation very slow

**Solutions:**
1. Check internet connection speed
2. Verify SUI network status: https://status.sui.io
3. Wait up to 2 minutes for confirmation
4. Don't retry multiple times
5. Contact support if consistently slow

#### Issue: Failed Redemption

**Symptoms:** Transaction fails to complete

**Solutions:**
1. Check error message details
2. Verify voucher is active and not expired
3. Confirm sufficient balance
4. Ensure network connectivity
5. Try again after 1 minute
6. Contact support with error details

### Getting Help

**Support Channels:**

📧 **Email Support**
- merchant-support@servicepass.io
- Response time: 4-24 hours
- Include: Merchant ID, issue description, screenshots

💬 **Live Chat**
- Available in merchant portal
- Monday-Friday, 9 AM - 5 PM EAT
- Instant responses during business hours

📞 **Phone Support**
- +256-700-SERVICEPASS
- Emergency issues only
- 24/7 availability

🎥 **Video Support**
- Schedule video call
- Screen sharing available
- Training refreshers
- Book at: https://support.servicepass.io/video

**Support Ticket Process:**

1. Submit ticket with details
2. Receive ticket number
3. Support agent assigned
4. Investigation and resolution
5. Confirmation and feedback

**Escalation Path:**

Level 1: Support Agent → Level 2: Senior Support → Level 3: Technical Team → Level 4: Management

---

## Support & Resources

### Documentation

📚 **Available Resources:**

- **API Documentation** - Complete API reference
- **User Guide** - For your customers
- **Video Tutorials** - Step-by-step guides
- **FAQ** - Common questions answered
- **Blog** - Updates and best practices
- **Changelog** - Recent platform updates

**Access at:** https://docs.servicepass.io

### Training & Certification

**Available Training:**

1. **Initial Onboarding** (Mandatory)
   - Platform overview
   - Redemption process
   - Security best practices
   - Certification exam

2. **Advanced Features** (Optional)
   - API integration
   - Batch operations
   - Analytics and reporting
   - Multi-sig operations

3. **Refresher Courses** (Quarterly)
   - Policy updates
   - New features
   - Best practices
   - Q&A sessions

**Certification Renewal:**
- Annual recertification required
- Online assessment (30 minutes)
- Minimum 80% passing score
- Free for all merchants

### Merchant Community

**Connect with Other Merchants:**

💬 **Forum** - https://forum.servicepass.io/merchants
- Ask questions
- Share experiences
- Best practices
- Feature requests

👥 **Meetups** (Quarterly)
- Regional merchant meetups
- Networking opportunities
- Platform updates
- Success stories

📧 **Newsletter** (Monthly)
- Platform updates
- Success stories
- Tips and tricks
- Industry news

### Technical Resources

**For Developers:**

```
GitHub: https://github.com/servicepass
API Docs: https://api.servicepass.io/docs
Postman Collection: https://postman.servicepass.io
SDK Documentation: https://sdk.servicepass.io
Status Page: https://status.servicepass.io
```

**Sample Code:**

JavaScript:
```javascript
const ServicePass = require('@servicepass/sdk');
const client = new ServicePass({
  apiKey: process.env.SERVICEPASS_API_KEY
});

const redemption = await client.redeemQR({
  qrData: scanResult,
  amount: 500
});
```

**Integration Testing:**
- Sandbox environment available
- Test vouchers provided
- Mock API responses
- No charges for testing

---

## Quick Reference

### Important URLs

| Resource | URL |
|----------|-----|
| Merchant Portal | https://merchant.servicepass.io |
| API Documentation | https://api.servicepass.io/docs |
| Status Page | https://status.servicepass.io |
| Support Center | https://support.servicepass.io |
| Developer Portal | https://developers.servicepass.io |

### Contact Information

| Department | Contact |
|------------|---------|
| General Support | merchant-support@servicepass.io |
| Technical Support | api-support@servicepass.io |
| Fraud Reports | fraud@servicepass.io |
| Disputes | disputes@servicepass.io |
| Onboarding | merchant-onboarding@servicepass.io |
| Emergency | +256-700-SERVICEPASS |

### Key Policies

| Policy | Summary |
|--------|---------|
| **Redemption Window** | QR codes valid for 5 minutes |
| **Settlement** | Instant on blockchain |
| **Refunds** | No refunds on redeemed vouchers |
| **Disputes** | 48-hour resolution target |
| **Key Rotation** | Every 90 days recommended |
| **Training** | Annual recertification required |

### Support Hours

| Channel | Hours | Response Time |
|---------|-------|---------------|
| **Email** | 24/7 | 4-24 hours |
| **Live Chat** | Mon-Fri, 9 AM - 5 PM EAT | Instant |
| **Phone** | 24/7 (Emergency only) | Immediate |
| **Video Call** | By appointment | Scheduled |

---

## Checklist: Your First Week

### Day 1: Account Setup
- [ ] Complete profile information
- [ ] Upload business documentation
- [ ] Generate API key
- [ ] Test redemption with test vouchers
- [ ] Configure notification preferences

### Day 2-3: Training
- [ ] Complete onboarding training
- [ ] Watch video tutorials
- [ ] Pass certification exam
- [ ] Practice with test vouchers
- [ ] Train your staff

### Day 4-5: Integration
- [ ] Set up redemption device/app
- [ ] Test QR code scanning
- [ ] Integrate with POS (if applicable)
- [ ] Configure reporting
- [ ] Test all features

### Day 6-7: Go Live
- [ ] Switch to production API key
- [ ] Process first real redemption
- [ ] Monitor dashboard
- [ ] Resolve any issues
- [ ] Request feedback from customers

### Ongoing
- [ ] Daily: Check dashboard and transactions
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Generate and analyze reports
- [ ] Quarterly: Attend training refreshers
- [ ] Annually: Renew certification

---

**Welcome to the ServicePass Merchant Network!**

We're excited to have you onboard. For any questions or assistance during your onboarding journey, don't hesitate to reach out to our support team.

**Success Team Contact:**
📧 merchant-success@servicepass.io  
📞 +256-700-SERVICEPASS  
💬 Live Chat in Merchant Portal

*Last Updated: February 16, 2026*
