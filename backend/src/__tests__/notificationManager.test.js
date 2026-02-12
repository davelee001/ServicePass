const notificationManager = require('../utils/notificationManager');
const NotificationPreferences = require('../models/NotificationPreferences');
const NotificationHistory = require('../models/NotificationHistory');
const User = require('../models/User');
const Voucher = require('../models/Voucher');
require('./setup');

// Mock the notification service
jest.mock('../utils/notificationService', () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-email-123' }),
    sendSMS: jest.fn().mockResolvedValue({ sid: 'test-sms-123' }),
    sendBulkPushNotifications: jest.fn().mockResolvedValue({ 
        successCount: 1, 
        failureCount: 0 
    })
}));

const notificationService = require('../utils/notificationService');

describe('Notification Manager', () => {
    beforeEach(async () => {
        // Clear test data
        await NotificationPreferences.deleteMany({});
        await NotificationHistory.deleteMany({});
        await User.deleteMany({});
        await Voucher.deleteMany({});
        
        // Reset mocks
        jest.clearAllMocks();
    });

    describe('sendNotification', () => {
        it('should send email notification when preferences allow', async () => {
            // Create test user
            await User.create({
                userId: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
            });

            // Create preferences
            await NotificationPreferences.create({
                userId: 'user-123',
                email: {
                    enabled: true,
                    voucherReceived: true
                }
            });

            const result = await notificationManager.sendNotification('user-123', 'voucher_received', {
                voucherId: 'voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            expect(notificationService.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'test@example.com',
                    subject: expect.stringContaining('New Voucher Received')
                })
            );

            expect(result).toHaveLength(1);
            expect(result[0].channel).toBe('email');
            expect(result[0].status).toBe('sent');
        });

        it('should send SMS notification when enabled and phone number provided', async () => {
            await User.create({
                userId: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
            });

            await NotificationPreferences.create({
                userId: 'user-123',
                sms: {
                    enabled: true,
                    phoneNumber: '+1234567890',
                    voucherReceived: true
                }
            });

            const result = await notificationManager.sendNotification('user-123', 'voucher_received', {
                voucherId: 'voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            expect(notificationService.sendSMS).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: '+1234567890',
                    message: expect.stringContaining('Education')
                })
            );

            expect(result).toHaveLength(1);
            expect(result[0].channel).toBe('sms');
            expect(result[0].status).toBe('sent');
        });

        it('should send push notification when enabled and tokens exist', async () => {
            await User.create({
                userId: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
            });

            await NotificationPreferences.create({
                userId: 'user-123',
                push: {
                    enabled: true,
                    voucherReceived: true,
                    tokens: [
                        { token: 'push-token-1', deviceInfo: 'Device 1' },
                        { token: 'push-token-2', deviceInfo: 'Device 2' }
                    ]
                }
            });

            const result = await notificationManager.sendNotification('user-123', 'voucher_received', {
                voucherId: 'voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            expect(notificationService.sendBulkPushNotifications).toHaveBeenCalledWith(
                expect.objectContaining({
                    tokens: ['push-token-1', 'push-token-2'],
                    title: 'New Voucher Received!'
                })
            );

            expect(result).toHaveLength(1);
            expect(result[0].channel).toBe('push');
            expect(result[0].status).toBe('sent');
        });

        it('should handle notification failures gracefully', async () => {
            // Mock failure
            notificationService.sendEmail.mockRejectedValue(new Error('Email service down'));

            await User.create({
                userId: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
            });

            await NotificationPreferences.create({
                userId: 'user-123',
                email: {
                    enabled: true,
                    voucherReceived: true
                }
            });

            const result = await notificationManager.sendNotification('user-123', 'voucher_received', {
                voucherId: 'voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            expect(result).toHaveLength(1);
            expect(result[0].status).toBe('failed');
            expect(result[0].error).toBe('Email service down');

            // Check that failure is recorded in history
            const history = await NotificationHistory.findOne({ userId: 'user-123' });
            expect(history.status).toBe('failed');
            expect(history.metadata.errorMessage).toBe('Email service down');
        });

        it('should create default preferences if they do not exist', async () => {
            await User.create({
                userId: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
            });

            const result = await notificationManager.sendNotification('user-123', 'voucher_received', {
                voucherId: 'voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            // Should have created default preferences and sent email
            const preferences = await NotificationPreferences.findOne({ userId: 'user-123' });
            expect(preferences).toBeTruthy();
            expect(preferences.email.enabled).toBe(true);
            expect(preferences.email.voucherReceived).toBe(true);

            expect(notificationService.sendEmail).toHaveBeenCalled();
        });
    });

    describe('checkExpiringVouchers', () => {
        it('should find and notify about expiring vouchers', async () => {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            // Create test user and preferences
            await User.create({
                userId: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
            });

            await NotificationPreferences.create({
                userId: 'user-123',
                email: {
                    enabled: true,
                    voucherExpiring: true
                }
            });

            // Create expiring voucher
            await Voucher.create({
                voucherObjectId: 'voucher-123',
                owner: 'user-123',
                voucherType: 'Education',
                amount: 100,
                merchantId: 'school-1',
                expiryTimestamp: threeDaysFromNow.getTime(),
                isRedeemed: false
            });

            const count = await notificationManager.checkExpiringVouchers();

            expect(count).toBe(1);
            expect(notificationService.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'test@example.com',
                    subject: expect.stringContaining('Voucher Expiring Soon')
                })
            );
        });

        it('should not notify about already redeemed vouchers', async () => {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            await User.create({
                userId: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
            });

            await NotificationPreferences.create({
                userId: 'user-123',
                email: {
                    enabled: true,
                    voucherExpiring: true
                }
            });

            // Create redeemed voucher
            await Voucher.create({
                voucherObjectId: 'voucher-123',
                owner: 'user-123',
                voucherType: 'Education',
                amount: 100,
                merchantId: 'school-1',
                expiryTimestamp: threeDaysFromNow.getTime(),
                isRedeemed: true
            });

            const count = await notificationManager.checkExpiringVouchers();

            expect(count).toBe(0);
            expect(notificationService.sendEmail).not.toHaveBeenCalled();
        });
    });

    describe('sendBulkNotifications', () => {
        it('should send notifications to multiple users', async () => {
            // Create multiple users
            await User.insertMany([
                { userId: 'user-1', email: 'user1@example.com', name: 'User 1' },
                { userId: 'user-2', email: 'user2@example.com', name: 'User 2' }
            ]);

            await NotificationPreferences.insertMany([
                { userId: 'user-1', email: { enabled: true, voucherReceived: true } },
                { userId: 'user-2', email: { enabled: true, voucherReceived: true } }
            ]);

            const dataCallback = async (userId) => ({
                voucherId: `voucher-${userId}`,
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: '2024-12-31'
            });

            const results = await notificationManager.sendBulkNotifications(
                ['user-1', 'user-2'], 
                'voucher_received', 
                dataCallback
            );

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('sent');
            expect(results[1].status).toBe('sent');
            expect(notificationService.sendEmail).toHaveBeenCalledTimes(2);
        });

        it('should handle individual failures in bulk operations', async () => {
            await User.insertMany([
                { userId: 'user-1', email: 'user1@example.com', name: 'User 1' },
                { userId: 'user-2', email: 'user2@example.com', name: 'User 2' }
            ]);

            await NotificationPreferences.create({
                userId: 'user-1',
                email: { enabled: true, voucherReceived: true }
            });

            // Don't create preferences for user-2 to simulate failure

            const dataCallback = async (userId) => {
                if (userId === 'user-2') {
                    throw new Error('User data not found');
                }
                return {
                    voucherId: `voucher-${userId}`,
                    voucherType: 'Education',
                    amount: 100,
                    merchantName: 'Test School',
                    expiryDate: '2024-12-31'
                };
            };

            const results = await notificationManager.sendBulkNotifications(
                ['user-1', 'user-2'], 
                'voucher_received', 
                dataCallback
            );

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('sent');
            expect(results[1].status).toBe('failed');
            expect(results[1].error).toBe('User data not found');
        });
    });
});

module.exports = {};