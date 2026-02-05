const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
require('./setup');

// Mock dependencies
jest.mock('../config/sui', () => ({
    suiClient: {
        signAndExecuteTransactionBlock: jest.fn(),
    },
    getAdminKeypair: jest.fn(() => ({ /* mock keypair */ })),
    PACKAGE_ID: 'mock-package-id',
    ADMIN_CAP_ID: 'mock-admin-cap',
    REGISTRY_ID: 'mock-registry',
}));

jest.mock('../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

jest.mock('../middleware/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = { userId: 'test-user', role: 'merchant' };
        next();
    },
    verifyApiKey: async (req, res, next) => {
        req.merchant = { merchantId: 'merchant-001' };
        next();
    },
    adminOrMerchant: (req, res, next) => next(),
}));

jest.mock('../middleware/rateLimiter', () => ({
    redemptionLimiter: (req, res, next) => next(),
    readLimiter: (req, res, next) => next(),
}));

const { suiClient } = require('../config/sui');
const redemptionsRouter = require('../routes/redemptions');

const app = express();
app.use(express.json());
app.use('/api/redemptions', redemptionsRouter);

const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || 'default-secret';

describe('Redemptions Routes - QR Code Functionality', () => {
    beforeEach(async () => {
        // Create a test merchant
        await Merchant.create({
            merchantId: 'merchant-001',
            name: 'Test Merchant',
            businessType: 'EDU',
            apiKey: 'test-api-key',
            totalRedemptions: 0,
        });
    });

    describe('POST /api/redemptions/redeem-qr', () => {
        it('should successfully redeem a valid QR code', async () => {
            const payload = {
                voucherId: 'voucher-qr-001',
                voucherType: 'EDU',
                amount: 1000,
                recipient: '0xrecipient001',
                merchantId: 'merchant-001',
                expiryTimestamp: Date.now() + 86400000,
            };

            const signature = crypto.createHmac('sha256', QR_SIGNING_SECRET)
                .update(JSON.stringify(payload))
                .digest('hex');

            const qrPayload = JSON.stringify({ ...payload, signature });

            suiClient.signAndExecuteTransactionBlock.mockResolvedValue({
                digest: 'redemption-txn-001',
            });

            const response = await request(app)
                .post('/api/redemptions/redeem-qr')
                .send({ qrPayload });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.transactionDigest).toBe('redemption-txn-001');

            // Verify redemption saved to database
            const redemption = await Redemption.findOne({ voucherObjectId: 'voucher-qr-001' });
            expect(redemption).toBeDefined();
            expect(redemption.merchantId).toBe('merchant-001');
            expect(redemption.voucherType).toBe('EDU');
            expect(redemption.amount).toBe(1000);

            // Verify merchant stats updated
            const merchant = await Merchant.findOne({ merchantId: 'merchant-001' });
            expect(merchant.totalRedemptions).toBe(1);
        });

        it('should reject QR code with invalid signature', async () => {
            const payload = {
                voucherId: 'voucher-qr-002',
                voucherType: 'HEALTH',
                amount: 2000,
                recipient: '0xrecipient002',
                merchantId: 'merchant-001',
                expiryTimestamp: Date.now() + 86400000,
            };

            const invalidSignature = 'invalid-signature-12345';
            const qrPayload = JSON.stringify({ ...payload, signature: invalidSignature });

            const response = await request(app)
                .post('/api/redemptions/redeem-qr')
                .send({ qrPayload });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid QR code signature.');

            // Verify no redemption created
            const redemption = await Redemption.findOne({ voucherObjectId: 'voucher-qr-002' });
            expect(redemption).toBeNull();
        });

        it('should reject QR code for different merchant', async () => {
            const payload = {
                voucherId: 'voucher-qr-003',
                voucherType: 'TRANSPORT',
                amount: 500,
                recipient: '0xrecipient003',
                merchantId: 'merchant-999', // Different merchant
                expiryTimestamp: Date.now() + 86400000,
            };

            const signature = crypto.createHmac('sha256', QR_SIGNING_SECRET)
                .update(JSON.stringify(payload))
                .digest('hex');

            const qrPayload = JSON.stringify({ ...payload, signature });

            const response = await request(app)
                .post('/api/redemptions/redeem-qr')
                .send({ qrPayload });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Voucher not valid for this merchant.');
        });

        it('should prevent double redemption', async () => {
            const payload = {
                voucherId: 'voucher-qr-004',
                voucherType: 'AGRI',
                amount: 1500,
                recipient: '0xrecipient004',
                merchantId: 'merchant-001',
                expiryTimestamp: Date.now() + 86400000,
            };

            const signature = crypto.createHmac('sha256', QR_SIGNING_SECRET)
                .update(JSON.stringify(payload))
                .digest('hex');

            const qrPayload = JSON.stringify({ ...payload, signature });

            // First redemption
            suiClient.signAndExecuteTransactionBlock.mockResolvedValue({
                digest: 'redemption-txn-004',
            });

            const firstResponse = await request(app)
                .post('/api/redemptions/redeem-qr')
                .send({ qrPayload });

            expect(firstResponse.status).toBe(200);

            // Attempt second redemption
            const secondResponse = await request(app)
                .post('/api/redemptions/redeem-qr')
                .send({ qrPayload });

            expect(secondResponse.status).toBe(400);
            expect(secondResponse.body.error).toBe('Voucher already redeemed.');

            // Verify only one redemption in database
            const redemptions = await Redemption.find({ voucherObjectId: 'voucher-qr-004' });
            expect(redemptions).toHaveLength(1);
        });

        it('should handle blockchain transaction failure', async () => {
            const payload = {
                voucherId: 'voucher-qr-005',
                voucherType: 'EDU',
                amount: 800,
                recipient: '0xrecipient005',
                merchantId: 'merchant-001',
                expiryTimestamp: Date.now() + 86400000,
            };

            const signature = crypto.createHmac('sha256', QR_SIGNING_SECRET)
                .update(JSON.stringify(payload))
                .digest('hex');

            const qrPayload = JSON.stringify({ ...payload, signature });

            suiClient.signAndExecuteTransactionBlock.mockRejectedValue(
                new Error('Blockchain transaction failed')
            );

            const response = await request(app)
                .post('/api/redemptions/redeem-qr')
                .send({ qrPayload });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Redemption failed');

            // Verify no redemption saved
            const redemption = await Redemption.findOne({ voucherObjectId: 'voucher-qr-005' });
            expect(redemption).toBeNull();
        });
    });

    describe('GET /api/redemptions/merchant/:merchantId', () => {
        beforeEach(async () => {
            await Redemption.create([
                {
                    voucherObjectId: 'v1',
                    transactionDigest: 'txn1',
                    merchantId: 'merchant-001',
                    voucherType: 'EDU',
                    amount: 1000,
                    redeemedBy: '0xuser1',
                },
                {
                    voucherObjectId: 'v2',
                    transactionDigest: 'txn2',
                    merchantId: 'merchant-001',
                    voucherType: 'HEALTH',
                    amount: 2000,
                    redeemedBy: '0xuser2',
                },
            ]);
        });

        it('should retrieve all redemptions for a merchant', async () => {
            const response = await request(app)
                .get('/api/redemptions/merchant/merchant-001');

            expect(response.status).toBe(200);
            expect(response.body.merchantId).toBe('merchant-001');
            expect(response.body.count).toBe(2);
            expect(response.body.redemptions).toHaveLength(2);
        });
    });

    describe('GET /api/redemptions/user/:walletAddress', () => {
        beforeEach(async () => {
            await Redemption.create([
                {
                    voucherObjectId: 'v3',
                    transactionDigest: 'txn3',
                    merchantId: 'merchant-001',
                    voucherType: 'TRANSPORT',
                    amount: 500,
                    redeemedBy: '0xuser123',
                },
            ]);
        });

        it('should retrieve all redemptions for a user', async () => {
            const response = await request(app)
                .get('/api/redemptions/user/0xuser123');

            expect(response.status).toBe(200);
            expect(response.body.walletAddress).toBe('0xuser123');
            expect(response.body.count).toBe(1);
            expect(response.body.redemptions).toHaveLength(1);
        });
    });
});
