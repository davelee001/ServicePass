const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const Voucher = require('../models/Voucher');
require('./setup');

// Mock dependencies
jest.mock('../config/sui', () => ({
    suiClient: {
        signAndExecuteTransactionBlock: jest.fn(),
        getOwnedObjects: jest.fn(),
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
        req.user = { userId: 'test-user', role: 'admin' };
        next();
    },
    adminOnly: (req, res, next) => next(),
    optionalAuth: (req, res, next) => next(),
}));

jest.mock('../middleware/rateLimiter', () => ({
    writeLimiter: (req, res, next) => next(),
    readLimiter: (req, res, next) => next(),
}));

const { suiClient } = require('../config/sui');
const vouchersRouter = require('../routes/vouchers');

const app = express();
app.use(express.json());
app.use('/api/vouchers', vouchersRouter);

describe('Vouchers Routes - QR Code Functionality', () => {
    describe('POST /api/vouchers/mint', () => {
        it('should mint a voucher and generate QR code', async () => {
            const mockObjectId = '0xvoucher123';
            suiClient.signAndExecuteTransactionBlock.mockResolvedValue({
                digest: 'txn-digest-123',
                objectChanges: [
                    {
                        type: 'created',
                        objectType: 'mock-package-id::voucher_system::Voucher',
                        objectId: mockObjectId,
                    },
                ],
            });

            const response = await request(app)
                .post('/api/vouchers/mint')
                .send({
                    voucherType: 'EDU',
                    amount: 1000,
                    recipient: '0xrecipient123',
                    merchantId: 'merchant-001',
                    expiryTimestamp: Date.now() + 86400000,
                    metadata: 'Test voucher',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.voucherId).toBe(mockObjectId);
            expect(response.body.qrCodeData).toBeDefined();
            expect(response.body.qrCodeData).toMatch(/^data:image\/png;base64,/);

            // Verify voucher saved to database
            const savedVoucher = await Voucher.findOne({ voucherId: mockObjectId });
            expect(savedVoucher).toBeDefined();
            expect(savedVoucher.voucherType).toBe('EDU');
            expect(savedVoucher.amount).toBe(1000);
            expect(savedVoucher.qrCodeData).toBeDefined();
            expect(savedVoucher.signature).toBeDefined();
        });

        it('should fail without required fields', async () => {
            const response = await request(app)
                .post('/api/vouchers/mint')
                .send({
                    voucherType: 'EDU',
                    // Missing amount and recipient
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        it('should generate valid signature for QR code', async () => {
            const mockObjectId = '0xvoucher456';
            suiClient.signAndExecuteTransactionBlock.mockResolvedValue({
                digest: 'txn-digest-456',
                objectChanges: [
                    {
                        type: 'created',
                        objectType: 'mock-package-id::voucher_system::Voucher',
                        objectId: mockObjectId,
                    },
                ],
            });

            const voucherData = {
                voucherType: 'HEALTH',
                amount: 2000,
                recipient: '0xrecipient456',
                merchantId: 'merchant-002',
                expiryTimestamp: Date.now() + 86400000,
            };

            const response = await request(app)
                .post('/api/vouchers/mint')
                .send(voucherData);

            const savedVoucher = await Voucher.findOne({ voucherId: mockObjectId });
            
            // Verify signature
            const payload = {
                voucherId: mockObjectId,
                voucherType: voucherData.voucherType,
                amount: voucherData.amount,
                recipient: voucherData.recipient,
                merchantId: voucherData.merchantId,
                expiryTimestamp: voucherData.expiryTimestamp,
            };

            const expectedSignature = crypto.createHmac('sha256', process.env.QR_SIGNING_SECRET || 'default-secret')
                .update(JSON.stringify(payload))
                .digest('hex');

            expect(savedVoucher.signature).toBe(expectedSignature);
        });
    });

    describe('GET /api/vouchers/:voucherId/qrcode', () => {
        it('should retrieve QR code for existing voucher', async () => {
            const voucherId = 'test-voucher-789';
            const qrCodeData = 'data:image/png;base64,mockQRCodeData';

            await Voucher.create({
                voucherId,
                voucherType: 'TRANSPORT',
                amount: 500,
                recipient: '0xrecipient789',
                merchantId: 'merchant-003',
                qrCodeData,
                signature: 'test-signature',
                transactionDigest: 'txn-789',
            });

            const response = await request(app)
                .get(`/api/vouchers/${voucherId}/qrcode`);

            expect(response.status).toBe(200);
            expect(response.body.voucherId).toBe(voucherId);
            expect(response.body.qrCodeData).toBe(qrCodeData);
        });

        it('should return 404 for non-existent voucher', async () => {
            const response = await request(app)
                .get('/api/vouchers/non-existent-id/qrcode');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Voucher not found');
        });
    });

    describe('GET /api/vouchers/owner/:address', () => {
        it('should retrieve vouchers owned by an address', async () => {
            const mockAddress = '0xowner123';
            suiClient.getOwnedObjects.mockResolvedValue({
                data: [
                    { objectId: 'voucher1', type: 'voucher' },
                    { objectId: 'voucher2', type: 'voucher' },
                ],
            });

            const response = await request(app)
                .get(`/api/vouchers/owner/${mockAddress}`);

            expect(response.status).toBe(200);
            expect(response.body.address).toBe(mockAddress);
            expect(response.body.vouchers).toHaveLength(2);
        });
    });
});
