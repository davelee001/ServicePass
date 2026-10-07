const { NotificationManager } = require('../utils/notificationManager');
const NotificationPreferences = require('../models/NotificationPreferences');
const NotificationHistory = require('../models/NotificationHistory');
const User = require('../models/User');
const notificationService = require('../utils/notificationService');
const { clearDB } = require('./setup');

// Mock notification service
jest.mock('../utils/notificationService');

describe('Enhanced Notification Manager', () => {
    let notificationManager;


    beforeEach(async () => {
        notificationManager = new NotificationManager();
        await clearDB();
        jest.clearAllMocks();

        // Mock notification service methods
        notificationService.sendEmail.mockResolvedValue({ messageId: 'email-123' });
        notificationService.sendSMS.mockResolvedValue({ sid: 'sms-123' });
        notificationService.sendBulkPushNotifications.mockResolvedValue({ successCount: 1 });
    });

    describe('Retry Mechanism', () => {
        test('should add failed notifications to retry queue', async () => {
            const notificationData = {
                userId: 'test-user',
                type: 'voucher_received',
                data: { voucherId: 'voucher-123' },
                options: { priority: 'high' }
            };

            const result = await notificationManager.addToRetryQueue(notificationData);

            expect(result).toBe(true);
            expect(notificationManager.retryQueue.size).toBe(1);
        });

        test('should not retry beyond max attempts', async () => {
            const notificationData = {
                userId: 'test-user',
                type: 'voucher_received',
                data: { voucherId: 'voucher-123' },
                options: { priority: 'high' }
            };

            const result = await notificationManager.addToRetryQueue(notificationData, 4); // Exceeds max retries

            expect(result).toBe(false);
            expect(notificationManager.retryQueue.size).toBe(0);
        });

        test('should use exponential backoff for retry delays', async () => {
            const notificationData = {
                userId: 'test-user',
                type: 'voucher_received',
                data: { voucherId: 'voucher-123' },
                options: { priority: 'high' }
            };

            await notificationManager.addToRetryQueue(notificationData, 1);
            await notificationManager.addToRetryQueue(notificationData, 2);

            const retryItems = Array.from(notificationManager.retryQueue.values());

            expect(retryItems[0].retryTime).toBeLessThan(retryItems[1].retryTime);
        });
    });

    describe('Bulk Notifications', () => {
        test('should queue bulk notifications', async () => {
            const notifications = [
                {
                    userId: 'user-1',
                    type: 'voucher_received',
                    data: { voucherId: 'voucher-1' }
                },
                {
                    userId: 'user-2',
                    type: 'voucher_received',
                    data: { voucherId: 'voucher-2' }
                }
            ];

            const result = await notificationManager.sendBulkNotifications(notifications);

            expect(result.total).toBe(2);
            expect(result.status).toBe('queued');
            expect(result.batchId).toBeDefined();
            expect(notificationManager.batchQueue.size).toBe(1);
        });

        test('should respect custom batch size', async () => {
            const notifications = new Array(10).fill(null).map((_, i) => ({
                userId: `user-${i}`,
                type: 'voucher_received',
                data: { voucherId: `voucher-${i}` }
            }));

            const result = await notificationManager.sendBulkNotifications(notifications, { batchSize: 3 });

            expect(result.total).toBe(10);

            const batchData = notificationManager.batchQueue.get(result.batchId);
            expect(batchData.batchSize).toBe(3);
        });
    });

    describe('Scheduled Notifications', () => {
        test('should schedule notification for future delivery', async () => {
            const userId = 'test-user';
            const type = 'system_maintenance';
            const data = { maintenanceType: 'Database upgrade' };
            const scheduleTime = new Date(Date.now() + 60000); // 1 minute from now

            const result = await notificationManager.scheduleNotification(
                userId,
                type,
                data,
                scheduleTime
            );

            expect(result.scheduleId).toBeDefined();
            expect(result.status).toBe('scheduled');
            expect(notificationManager.scheduledNotifications.size).toBe(1);
        });

        test('should cancel scheduled notification', async () => {
            const scheduleResult = await notificationManager.scheduleNotification(
                'test-user',
                'system_maintenance',
                { maintenanceType: 'Test' },
                new Date(Date.now() + 60000)
            );

            const cancelResult = notificationManager.cancelScheduledNotification(scheduleResult.scheduleId);

            expect(cancelResult.success).toBe(true);
            expect(notificationManager.scheduledNotifications.size).toBe(0);
        });
    });

    describe('Rate Limiting', () => {
        test('should allow notifications within rate limits', async () => {
            const userId = 'test-user';
            const type = 'voucher_received';

            const allowed = await notificationManager.checkRateLimit(userId, type);

            expect(allowed).toBe(true);
        });

        test('should block notifications exceeding rate limits', async () => {
            const userId = 'test-user';
            const type = 'voucher_received';

            // Simulate multiple rapid requests
            for (let i = 0; i < 11; i++) {
                await notificationManager.checkRateLimit(userId, type);
            }

            const blocked = await notificationManager.checkRateLimit(userId, type);

            expect(blocked).toBe(false);
        });

        test('should provide rate limit status', async () => {
            const userId = 'test-user';

            // Make some requests
            await notificationManager.checkRateLimit(userId, 'voucher_received');
            await notificationManager.checkRateLimit(userId, 'voucher_received');

            const status = await notificationManager.getRateLimitStatus(userId);

            expect(status.voucher_received).toBeDefined();
            expect(status.voucher_received.requests).toBe(2);
            expect(status.voucher_received.remainingRequests).toBe(8);
        });
    });

    describe('Analytics', () => {
        test('should track notification metrics', async () => {
            // Simulate some successful notifications
            notificationManager.analytics.totalSent = 10;
            notificationManager.analytics.totalFailed = 2;
            notificationManager.analytics.channelStats.email = 5;
            notificationManager.analytics.channelStats.sms = 7;

            const analytics = notificationManager.getAnalytics();

            expect(analytics.totalNotifications).toBe(12);
            expect(analytics.successRate).toBe(83.33333333333334); // 10/12 * 100
            expect(analytics.channelStats.email).toBe(5);
        });

        test('should provide user-specific analytics', async () => {
            const userId = 'test-user';

            // Create test user
            await User.create({ password: 'test-password-123',  userId, email: 'test@example.com', name: 'Test User' });

            // Create notification history
            await NotificationHistory.create({
                userId,
                type: 'voucher_received',
                channel: 'email',
                status: 'sent',
                recipient: 'test@example.com'
            });

            await NotificationHistory.create({
                userId,
                type: 'voucher_expiring',
                channel: 'sms',
                status: 'failed',
                recipient: '+1234567890'
            });

            const analytics = await notificationManager.getUserAnalytics(userId);

            expect(analytics.totalNotifications).toBe(2);
            expect(analytics.statusStats.sent).toBe(1);
            expect(analytics.statusStats.failed).toBe(1);
            expect(analytics.channelStats.email).toBe(1);
            expect(analytics.channelStats.sms).toBe(1);
            expect(analytics.successRate).toBe(50);
        });
    });

    describe('Enhanced Templates', () => {
        test('should support custom variables in templates', async () => {
            const template = notificationManager.getTemplate(
                'voucher_received',
                { voucherType: 'Education', amount: 100 },
                'high',
                { customMessage: 'Special promotion!' }
            );

            expect(template).toBeDefined();
            expect(template.email.subject).toContain('ServicePass');
        });

        test('should include system variables', async () => {
            const template = notificationManager.getTemplate(
                'voucher_received',
                { voucherType: 'Education', amount: 100 }
            );

            // Templates should have access to system variables like frontendUrl
            expect(template).toBeDefined();
        });

        test('should support different priority levels', async () => {
            const highPriorityTemplate = notificationManager.getTemplate(
                'voucher_received',
                { voucherType: 'Education', amount: 100 },
                'high'
            );

            const lowPriorityTemplate = notificationManager.getTemplate(
                'voucher_received',
                { voucherType: 'Education', amount: 100 },
                'low'
            );

            expect(highPriorityTemplate).toBeDefined();
            expect(lowPriorityTemplate).toBeDefined();
        });

        test('should support new template types', async () => {
            const maintenanceTemplate = notificationManager.getTemplate(
                'system_maintenance',
                {
                    maintenanceType: 'Database upgrade',
                    startTime: '2024-02-15 02:00 UTC',
                    endTime: '2024-02-15 04:00 UTC',
                    affectedServices: 'User dashboard',
                    description: 'Upgrading database for better performance'
                }
            );

            expect(maintenanceTemplate).toBeDefined();
            expect(maintenanceTemplate.email.subject).toContain('Maintenance');
            expect(maintenanceTemplate.sms).toContain('maintenance');
            expect(maintenanceTemplate.push.title).toContain('Maintenance');
        });

        test('should support security alert template', async () => {
            const securityTemplate = notificationManager.getTemplate(
                'security_alert',
                {
                    alertType: 'Suspicious login',
                    timestamp: '2024-02-13 15:30:00',
                    ipAddress: '192.168.1.100',
                    action: 'Login attempt',
                    location: 'New York, USA'
                }
            );

            expect(securityTemplate).toBeDefined();
            expect(securityTemplate.email.subject).toContain('Security Alert');
            expect(securityTemplate.sms).toContain('Security Alert');
            expect(securityTemplate.push.title).toContain('Security Alert');
        });

        test('should support bulk operation completion template', async () => {
            const bulkTemplate = notificationManager.getTemplate(
                'bulk_operation_complete',
                {
                    operationType: 'Voucher Minting',
                    batchId: 'batch_123',
                    totalRecords: 100,
                    successCount: 95,
                    failureCount: 5,
                    duration: '2m 30s'
                }
            );

            expect(bulkTemplate).toBeDefined();
            expect(bulkTemplate.email.subject).toContain('Bulk');
            expect(bulkTemplate.email.subject).toContain('Complete');
            expect(bulkTemplate.sms).toContain('complete');
            expect(bulkTemplate.push.title).toContain('Operation Complete');
        });
    });
});
