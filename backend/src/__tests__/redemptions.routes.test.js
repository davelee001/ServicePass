const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
require('./setup');

// Mock dependencies
jest.mock('../config/sui', () => ({
    suiClient: {
        signAndExecuteTransaction: jest.fn(),
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

    // Owner-signed QR flow is covered by backend/test/qrRedemption.test.js using
    // real SDK transactions and signatures through the actual HTTP router.
    // This suite retains the redemption history query coverage.

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
