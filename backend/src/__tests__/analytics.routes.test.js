const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const analyticsRouter = require('../routes/analytics');
const Voucher = require('../models/Voucher');
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const User = require('../models/User');
const { connectDB, disconnectDB } = require('../config/database');

// Create test app
const app = express();
app.use(express.json());

// Mock middleware
const mockAuth = (req, res, next) => {
    req.user = {
        _id: new mongoose.Types.ObjectId(),
        role: 'admin',
        merchantId: null
    };
    next();
};

const mockRateLimit = (req, res, next) => {
    next();
};

// Mock all middleware dependencies
jest.mock('../middleware/auth', () => ({
    verifyToken: mockAuth,
    adminOnly: mockAuth
}));

jest.mock('../middleware/rateLimiter', () => ({
    readLimiter: mockRateLimit
}));

jest.mock('../utils/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn()
    }
}));

app.use('/api/analytics', analyticsRouter);

describe('Analytics Routes', () => {
    let testVoucher;
    let testMerchant;
    let testRedemption;

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        // Clear collections
        await Voucher.deleteMany({});
        await Redemption.deleteMany({});
        await Merchant.deleteMany({});
        await User.deleteMany({});

        // Create test data
        testMerchant = await Merchant.create({
            address: '0x123456789abcdef',
            name: 'Test Merchant',
            email: 'test@merchant.com',
            category: 'Healthcare',
            isVerified: true
        });

        testVoucher = await Voucher.create({
            voucherId: 'V123456789',
            merchantId: testMerchant.address,
            merchantName: testMerchant.name,
            value: 100,
            voucherType: 2,
            description: 'Test voucher',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'active'
        });

        testRedemption = await Redemption.create({
            voucherId: testVoucher.voucherId,
            userAddress: '0xuser123',
            merchantAddress: testMerchant.address,
            voucherType: 2,
            value: 100,
            timestamp: new Date(),
            status: 'completed',
            metadata: {
                location: 'Test Location',
                description: 'Test redemption'
            }
        });

        // Update voucher status to redeemed
        await Voucher.findOneAndUpdate(
            { voucherId: testVoucher.voucherId },
            { status: 'redeemed' }
        );
    });

    describe('GET /api/analytics/dashboard', () => {
        test('should return dashboard overview', async () => {
            const response = await request(app)
                .get('/api/analytics/dashboard')
                .expect(200);

            expect(response.body.dashboard).toBeDefined();
            expect(response.body.dashboard.summary).toBeDefined();
            expect(response.body.dashboard.recentMetrics).toBeDefined();
        });

        test('should filter by date range', async () => {
            const startDate = new Date().toISOString();
            const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const response = await request(app)
                .get('/api/analytics/dashboard')
                .query({ startDate, endDate })
                .expect(200);

            expect(response.body.dashboard).toBeDefined();
        });

        test('should validate date parameters', async () => {
            const response = await request(app)
                .get('/api/analytics/dashboard')
                .query({ startDate: 'invalid-date' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/analytics/vouchers', () => {
        test('should return voucher statistics', async () => {
            const response = await request(app)
                .get('/api/analytics/vouchers')
                .expect(200);

            expect(response.body.voucherStats).toBeDefined();
            expect(response.body.voucherStats.total).toBeGreaterThan(0);
            expect(response.body.voucherStats.byType).toBeDefined();
        });

        test('should filter by voucher type', async () => {
            const response = await request(app)
                .get('/api/analytics/vouchers')
                .query({ voucherType: '2' })
                .expect(200);

            expect(response.body.voucherStats).toBeDefined();
        });

        test('should validate voucher type parameter', async () => {
            const response = await request(app)
                .get('/api/analytics/vouchers')
                .query({ voucherType: '5' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/analytics/redemptions', () => {
        test('should return redemption statistics', async () => {
            const response = await request(app)
                .get('/api/analytics/redemptions')
                .expect(200);

            expect(response.body.redemptionStats).toBeDefined();
            expect(response.body.redemptionStats.total).toBeGreaterThan(0);
            expect(response.body.redemptionStats.totalValue).toBeGreaterThan(0);
        });

        test('should filter by merchant', async () => {
            const response = await request(app)
                .get('/api/analytics/redemptions')
                .query({ merchantId: testMerchant.address })
                .expect(200);

            expect(response.body.redemptionStats).toBeDefined();
        });
    });

    describe('GET /api/analytics/merchants', () => {
        test('should return merchant statistics for admin', async () => {
            const response = await request(app)
                .get('/api/analytics/merchants')
                .expect(200);

            expect(response.body.merchantStats).toBeDefined();
        });

        test('should require merchant ID for non-admin users', async () => {
            // Mock non-admin user
            const mockMerchantAuth = (req, res, next) => {
                req.user = {
                    _id: new mongoose.Types.ObjectId(),
                    role: 'merchant',
                    merchantId: testMerchant.address
                };
                next();
            };

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => mockMerchantAuth(req, res, next));
            testApp.use('/api/analytics', analyticsRouter);

            const response = await request(testApp)
                .get('/api/analytics/merchants')
                .expect(403);

            expect(response.body.error).toBe('Merchant ID required for non-admin users');
        });
    });

    describe('GET /api/analytics/distribution', () => {
        test('should return voucher type distribution', async () => {
            const response = await request(app)
                .get('/api/analytics/distribution')
                .expect(200);

            expect(response.body.distribution).toBeDefined();
            expect(Array.isArray(response.body.distribution)).toBe(true);
        });
    });

    describe('GET /api/analytics/expiry', () => {
        test('should return expiry statistics', async () => {
            const response = await request(app)
                .get('/api/analytics/expiry')
                .expect(200);

            expect(response.body.expiryStats).toBeDefined();
            expect(response.body.expiryStats.expiringIn7Days).toBeDefined();
            expect(response.body.expiryStats.expiringIn30Days).toBeDefined();
        });
    });

    describe('GET /api/analytics/financial', () => {
        test('should return financial summary', async () => {
            const response = await request(app)
                .get('/api/analytics/financial')
                .expect(200);

            expect(response.body.financialSummary).toBeDefined();
            expect(response.body.financialSummary.totalValue).toBeGreaterThanOrEqual(0);
            expect(response.body.financialSummary.utilizationRate).toBeDefined();
        });
    });

    describe('GET /api/analytics/trends', () => {
        test('should return trend data', async () => {
            const response = await request(app)
                .get('/api/analytics/trends')
                .expect(200);

            expect(response.body.trendData).toBeDefined();
            expect(response.body.trendData.vouchers).toBeDefined();
            expect(response.body.trendData.redemptions).toBeDefined();
        });

        test('should validate period parameter', async () => {
            const response = await request(app)
                .get('/api/analytics/trends')
                .query({ period: 'invalid' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/analytics/realtime', () => {
        test('should return real-time metrics for admin', async () => {
            const response = await request(app)
                .get('/api/analytics/realtime')
                .expect(200);

            expect(response.body.realtime).toBeDefined();
            expect(response.body.realtime.last24Hours).toBeDefined();
            expect(response.body.realtime.timestamp).toBeDefined();
        });
    });

    describe('GET /api/analytics/export', () => {
        test('should export data in JSON format', async () => {
            const response = await request(app)
                .get('/api/analytics/export')
                .query({ type: 'vouchers', format: 'json' })
                .expect(200);

            expect(response.headers['content-type']).toContain('application/json');
        });

        test('should export data in CSV format', async () => {
            const response = await request(app)
                .get('/api/analytics/export')
                .query({ type: 'vouchers', format: 'csv' })
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
        });

        test('should validate export type', async () => {
            const response = await request(app)
                .get('/api/analytics/export')
                .query({ type: 'invalid' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });

        test('should require type parameter', async () => {
            const response = await request(app)
                .get('/api/analytics/export')
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('POST /api/analytics/cache/clear', () => {
        test('should clear analytics cache for admin', async () => {
            const response = await request(app)
                .post('/api/analytics/cache/clear')
                .expect(200);

            expect(response.body.message).toBe('Analytics cache cleared successfully');
        });
    });

    describe('Access Control', () => {
        test('should restrict merchant data access', async () => {
            const mockMerchantAuth = (req, res, next) => {
                req.user = {
                    _id: new mongoose.Types.ObjectId(),
                    role: 'merchant',
                    merchantId: 'different-merchant'
                };
                next();
            };

            const testApp = express();
            testApp.use(express.json());
            testApp.use((req, res, next) => mockMerchantAuth(req, res, next));
            testApp.use('/api/analytics', analyticsRouter);

            const response = await request(testApp)
                .get('/api/analytics/vouchers')
                .query({ merchantId: testMerchant.address })
                .expect(403);

            expect(response.body.error).toBe('Access denied to merchant data');
        });
    });
});