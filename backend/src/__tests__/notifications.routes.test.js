const request = require('supertest');
const express = require('express');
const NotificationPreferences = require('../models/NotificationPreferences');
const NotificationHistory = require('../models/NotificationHistory');
const notificationManager = require('../utils/notificationManager');
require('./setup');

// Mock dependencies
jest.mock('../utils/notificationService', () => ({
    sendEmail: jest.fn(),
    sendSMS: jest.fn(),
    sendBulkPushNotifications: jest.fn()
}));

jest.mock('../middleware/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = { userId: 'test-user-123', email: 'test@example.com' };
        next();
    },
    adminOnly: (req, res, next) => next()
}));

jest.mock('../middleware/rateLimiter', () => ({
    readLimiter: (req, res, next) => next(),
    writeLimiter: (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/notifications', require('../routes/notifications'));

describe('Notification System Tests', () => {
    beforeEach(async () => {
        // Clear test data
        await NotificationPreferences.deleteMany({});
        await NotificationHistory.deleteMany({});
    });

    describe('GET /api/notifications/preferences', () => {
        it('should return default preferences for new user', async () => {
            const response = await request(app)
                .get('/api/notifications/preferences');

            expect(response.status).toBe(200);
            expect(response.body.preferences).toBeDefined();
            expect(response.body.preferences.email.enabled).toBe(true);
            expect(response.body.preferences.sms.enabled).toBe(false);
            expect(response.body.preferences.push.enabled).toBe(true);
        });

        it('should return existing preferences', async () => {
            // Create test preferences
            const testPreferences = new NotificationPreferences({
                userId: 'test-user-123',
                email: {
                    enabled: false,
                    voucherReceived: false,
                    voucherExpiring: true,
                    redemptionConfirmation: true
                }
            });
            await testPreferences.save();

            const response = await request(app)
                .get('/api/notifications/preferences');

            expect(response.status).toBe(200);
            expect(response.body.preferences.email.enabled).toBe(false);
            expect(response.body.preferences.email.voucherReceived).toBe(false);
        });
    });

    describe('PUT /api/notifications/preferences', () => {
        it('should update notification preferences', async () => {
            const updateData = {
                email: {
                    enabled: false,
                    voucherReceived: false,
                    voucherExpiring: false,
                    redemptionConfirmation: true
                },
                sms: {
                    enabled: true,
                    phoneNumber: '+1234567890',
                    voucherExpiring: true
                }
            };

            const response = await request(app)
                .put('/api/notifications/preferences')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.preferences.email.enabled).toBe(false);
            expect(response.body.preferences.sms.enabled).toBe(true);
            expect(response.body.preferences.sms.phoneNumber).toBe('+1234567890');
        });

        it('should validate phone number format', async () => {
            const updateData = {
                sms: {
                    enabled: true,
                    phoneNumber: 'invalid-phone'
                }
            };

            const response = await request(app)
                .put('/api/notifications/preferences')
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
        });
    });

    describe('POST /api/notifications/push-token', () => {
        it('should register a push token', async () => {
            const tokenData = {
                token: 'test-push-token-123',
                deviceInfo: 'Test Device'
            };

            const response = await request(app)
                .post('/api/notifications/push-token')
                .send(tokenData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Push token registered successfully');

            // Check if token was saved
            const preferences = await NotificationPreferences.findOne({ userId: 'test-user-123' });
            expect(preferences.push.tokens).toHaveLength(1);
            expect(preferences.push.tokens[0].token).toBe('test-push-token-123');
        });

        it('should not register duplicate tokens', async () => {
            const tokenData = {
                token: 'test-push-token-123',
                deviceInfo: 'Test Device'
            };

            // Register token twice
            await request(app).post('/api/notifications/push-token').send(tokenData);
            await request(app).post('/api/notifications/push-token').send(tokenData);

            const preferences = await NotificationPreferences.findOne({ userId: 'test-user-123' });
            expect(preferences.push.tokens).toHaveLength(1);
        });
    });

    describe('GET /api/notifications/history', () => {
        it('should return notification history', async () => {
            // Create test history
            const testHistory = new NotificationHistory({
                userId: 'test-user-123',
                type: 'voucher_received',
                channel: 'email',
                status: 'sent',
                recipient: 'test@example.com',
                content: 'Test notification'
            });
            await testHistory.save();

            const response = await request(app)
                .get('/api/notifications/history');

            expect(response.status).toBe(200);
            expect(response.body.history).toHaveLength(1);
            expect(response.body.history[0].type).toBe('voucher_received');
            expect(response.body.history[0].status).toBe('sent');
        });

        it('should paginate notification history', async () => {
            // Create multiple test notifications
            for (let i = 0; i < 25; i++) {
                const testHistory = new NotificationHistory({
                    userId: 'test-user-123',
                    type: 'voucher_received',
                    channel: 'email',
                    status: 'sent',
                    recipient: 'test@example.com',
                    content: `Test notification ${i}`
                });
                await testHistory.save();
            }

            const response = await request(app)
                .get('/api/notifications/history?page=2&limit=10');

            expect(response.status).toBe(200);
            expect(response.body.history).toHaveLength(10);
            expect(response.body.currentPage).toBe('2');
            expect(response.body.totalPages).toBe(3);
        });
    });

    describe('Notification Manager', () => {
        it('should send email notification when enabled', async () => {
            const notificationService = require('../utils/notificationService');
            
            // Create user preferences
            await NotificationPreferences.create({
                userId: 'test-user-123',
                email: { enabled: true, voucherReceived: true }
            });

            const result = await notificationManager.sendNotification('test-user-123', 'voucher_received', {
                voucherId: 'test-voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            expect(notificationService.sendEmail).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0].channel).toBe('email');
            expect(result[0].status).toBe('sent');
        });

        it('should not send notification when disabled', async () => {
            const notificationService = require('../utils/notificationService');
            
            // Create user preferences with email disabled
            await NotificationPreferences.create({
                userId: 'test-user-123',
                email: { enabled: false, voucherReceived: true }
            });

            const result = await notificationManager.sendNotification('test-user-123', 'voucher_received', {
                voucherId: 'test-voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            expect(notificationService.sendEmail).not.toHaveBeenCalled();
            expect(result).toHaveLength(0);
        });

        it('should save notification history', async () => {
            await NotificationPreferences.create({
                userId: 'test-user-123',
                email: { enabled: true, voucherReceived: true }
            });

            await notificationManager.sendNotification('test-user-123', 'voucher_received', {
                voucherId: 'test-voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            const history = await NotificationHistory.find({ userId: 'test-user-123' });
            expect(history).toHaveLength(1);
            expect(history[0].type).toBe('voucher_received');
            expect(history[0].channel).toBe('email');
            expect(history[0].status).toBe('sent');
        });
    });

    describe('Notification Templates', () => {
        const NotificationTemplates = require('../utils/notificationTemplates');

        it('should generate voucher received template', () => {
            const template = NotificationTemplates.voucherReceived({
                voucherId: 'test-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School', 
                expiryDate: '2024-12-31'
            });

            expect(template.email.subject).toContain('New Voucher Received');
            expect(template.email.html).toContain('Education');
            expect(template.email.html).toContain('$100');
            expect(template.sms).toContain('Education');
            expect(template.push.title).toBe('New Voucher Received!');
        });

        it('should generate voucher expiring template', () => {
            const template = NotificationTemplates.voucherExpiringSoon({
                voucherId: 'test-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31',
                daysLeft: 3
            });

            expect(template.email.subject).toContain('Voucher Expiring Soon');
            expect(template.email.html).toContain('3 days');
            expect(template.sms).toContain('3 days');
            expect(template.push.body).toContain('3 days');
        });

        it('should generate redemption confirmation template', () => {
            const template = NotificationTemplates.redemptionConfirmation({
                voucherId: 'test-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                redemptionDate: '2024-01-15',
                transactionId: 'tx-123'
            });

            expect(template.email.subject).toContain('Voucher Redeemed Successfully');
            expect(template.email.html).toContain('tx-123');
            expect(template.sms).toContain('tx-123');
            expect(template.push.title).toBe('Voucher Redeemed!');
        });
    });
});

module.exports = {};