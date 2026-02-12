const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const NotificationPreferences = require('../models/NotificationPreferences');
const NotificationHistory = require('../models/NotificationHistory');
const ScheduledNotification = require('../models/ScheduledNotification');
const notificationService = require('../utils/notificationService');
const notificationManager = require('../utils/notificationManager');
const NotificationTemplates = require('../utils/notificationTemplates');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');

// Get user's notification preferences
router.get('/preferences', 
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const userId = req.user.userId;
            
            let preferences = await NotificationPreferences.findOne({ userId });
            if (!preferences) {
                // Create default preferences
                preferences = new NotificationPreferences({
                    userId
                });
                await preferences.save();
            }
            
            res.json({ preferences });
        } catch (error) {
            logger.error('Error fetching notification preferences:', error);
            res.status(500).json({ error: 'Failed to fetch notification preferences' });
        }
    }
);

// Update user's notification preferences
router.put('/preferences', 
    verifyToken,
    writeLimiter,
    [
        body('email.enabled').optional().isBoolean(),
        body('email.voucherReceived').optional().isBoolean(),
        body('email.voucherExpiring').optional().isBoolean(),
        body('email.redemptionConfirmation').optional().isBoolean(),
        body('sms.enabled').optional().isBoolean(),
        body('sms.phoneNumber').optional().isMobilePhone(),
        body('sms.voucherReceived').optional().isBoolean(),
        body('sms.voucherExpiring').optional().isBoolean(),
        body('sms.redemptionConfirmation').optional().isBoolean(),
        body('push.enabled').optional().isBoolean(),
        body('push.voucherReceived').optional().isBoolean(),
        body('push.voucherExpiring').optional().isBoolean(),
        body('push.redemptionConfirmation').optional().isBoolean()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array().map(e => ({ field: e.path, message: e.msg }))
                });
            }

            const userId = req.user.userId;
            const updates = req.body;

            const preferences = await NotificationPreferences.findOneAndUpdate(
                { userId },
                { $set: updates },
                { new: true, upsert: true }
            );

            res.json({ preferences, message: 'Notification preferences updated successfully' });
        } catch (error) {
            logger.error('Error updating notification preferences:', error);
            res.status(500).json({ error: 'Failed to update notification preferences' });
        }
    }
);

// Register push notification token
router.post('/push-token',
    verifyToken,
    writeLimiter,
    [
        body('token').isString().notEmpty().withMessage('Push token is required'),
        body('deviceInfo').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array().map(e => ({ field: e.path, message: e.msg }))
                });
            }

            const userId = req.user.userId;
            const { token, deviceInfo } = req.body;

            await NotificationPreferences.findOneAndUpdate(
                { userId },
                {
                    $addToSet: {
                        'push.tokens': {
                            token,
                            deviceInfo: deviceInfo || 'Unknown device',
                            addedAt: new Date()
                        }
                    }
                },
                { upsert: true }
            );

            res.json({ message: 'Push token registered successfully' });
        } catch (error) {
            logger.error('Error registering push token:', error);
            res.status(500).json({ error: 'Failed to register push token' });
        }
    }
);

// Get notification history
router.get('/history',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 20 } = req.query;

            const history = await NotificationHistory.find({ userId })
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const total = await NotificationHistory.countDocuments({ userId });

            res.json({
                history,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            });
        } catch (error) {
            logger.error('Error fetching notification history:', error);
            res.status(500).json({ error: 'Failed to fetch notification history' });
        }
    }
);

// Send test notification (admin only)
router.post('/test',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('userId').isString().notEmpty().withMessage('User ID is required'),
        body('type').isIn(['voucher_received', 'voucher_expiring', 'redemption_confirmation']).withMessage('Invalid notification type'),
        body('channel').isIn(['email', 'sms', 'push']).withMessage('Invalid notification channel')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array().map(e => ({ field: e.path, message: e.msg }))
                });
            }

            const { userId, type, channel } = req.body;

            // Mock data for test notification
            const testData = {
                voucherId: 'test-voucher-123',
                voucherType: 'Education',
                amount: 100,
                merchantName: 'Test School',
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                daysLeft: 7
            };

            const template = NotificationTemplates[type === 'voucher_received' ? 'voucherReceived' : 
                                                   type === 'voucher_expiring' ? 'voucherExpiringSoon' : 
                                                   'redemptionConfirmation'](testData);

            const preferences = await NotificationPreferences.findOne({ userId });
            if (!preferences) {
                return res.status(404).json({ error: 'User notification preferences not found' });
            }

            let result;
            if (channel === 'email' && preferences.email.enabled) {
                result = await notificationService.sendEmail({
                    to: req.user.email,
                    subject: template.email.subject,
                    htmlContent: template.email.html,
                    textContent: template.email.text
                });
            } else if (channel === 'sms' && preferences.sms.enabled && preferences.sms.phoneNumber) {
                result = await notificationService.sendSMS({
                    to: preferences.sms.phoneNumber,
                    message: template.sms
                });
            } else if (channel === 'push' && preferences.push.enabled && preferences.push.tokens.length > 0) {
                const tokens = preferences.push.tokens.map(t => t.token);
                result = await notificationService.sendBulkPushNotifications({
                    tokens,
                    title: template.push.title,
                    body: template.push.body,
                    data: template.push.data
                });
            } else {
                return res.status(400).json({ error: 'Notification channel not enabled or configured' });
            }

            res.json({ message: 'Test notification sent successfully', result });
        } catch (error) {
            logger.error('Error sending test notification:', error);
            res.status(500).json({ error: 'Failed to send test notification', details: error.message });
        }
    }
);

// Get notification statistics (admin only)
router.get('/stats',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const stats = await NotificationHistory.aggregate([
                {
                    $group: {
                        _id: {
                            type: '$type',
                            channel: '$channel',
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: { type: '$_id.type', channel: '$_id.channel' },
                        statuses: {
                            $push: {
                                status: '$_id.status',
                                count: '$count'
                            }
                        },
                        total: { $sum: '$count' }
                    }
                }
            ]);

            res.json({ stats });
        } catch (error) {
            logger.error('Error fetching notification stats:', error);
            res.status(500).json({ error: 'Failed to fetch notification statistics' });
        }
    }
);

// Send bulk notifications (admin only)
router.post('/bulk-send',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
        body('type').isIn(['voucher_received', 'voucher_redeemed', 'voucher_expiring', 'system_alert']).withMessage('Invalid notification type'),
        body('data').isObject().withMessage('Notification data is required'),
        body('options.batchSize').optional().isInt({ min: 1, max: 50 }).withMessage('Batch size must be between 1 and 50'),
        body('options.delay').optional().isInt({ min: 0, max: 5000 }).withMessage('Delay must be between 0 and 5000ms')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { userIds, type, data, options = {} } = req.body;

            const result = await notificationManager.sendBulkNotifications(userIds, type, data, options);

            res.json({
                message: 'Bulk notifications processed',
                ...result
            });
        } catch (error) {
            logger.error('Error sending bulk notifications:', error);
            res.status(500).json({ error: 'Failed to send bulk notifications', details: error.message });
        }
    }
);

// Schedule notification
router.post('/schedule',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('type').isIn(['voucher_received', 'voucher_redeemed', 'voucher_expiring', 'system_alert']).withMessage('Invalid notification type'),
        body('data').isObject().withMessage('Notification data is required'),
        body('scheduleTime').isISO8601().withMessage('Valid schedule time is required'),
        body('options.priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority level')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { userId, type, data, scheduleTime, options = {} } = req.body;
            
            const scheduledAt = new Date(scheduleTime);
            if (scheduledAt <= new Date()) {
                return res.status(400).json({ error: 'Schedule time must be in the future' });
            }

            const scheduledNotification = await notificationManager.scheduleNotification(
                userId, type, data, scheduledAt, options
            );

            res.json({
                message: 'Notification scheduled successfully',
                scheduledNotification: {
                    id: scheduledNotification._id,
                    userId: scheduledNotification.userId,
                    type: scheduledNotification.type,
                    scheduleTime: scheduledNotification.scheduleTime,
                    status: scheduledNotification.status
                }
            });
        } catch (error) {
            logger.error('Error scheduling notification:', error);
            res.status(500).json({ error: 'Failed to schedule notification', details: error.message });
        }
    }
);

// Get scheduled notifications (admin only)
router.get('/scheduled',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const { status, type } = req.query;
            
            const filter = {};
            if (status) filter.status = status;
            if (type) filter.type = type;

            const scheduledNotifications = await ScheduledNotification.find(filter)
                .sort({ scheduleTime: 1 })
                .limit(100);

            res.json({ scheduledNotifications });
        } catch (error) {
            logger.error('Error fetching scheduled notifications:', error);
            res.status(500).json({ error: 'Failed to fetch scheduled notifications' });
        }
    }
);

// Cancel scheduled notification (admin only)
router.delete('/scheduled/:notificationId',
    verifyToken,
    adminOnly,
    writeLimiter,
    async (req, res) => {
        try {
            const { notificationId } = req.params;

            const notification = await ScheduledNotification.findById(notificationId);
            if (!notification) {
                return res.status(404).json({ error: 'Scheduled notification not found' });
            }

            if (notification.status !== 'scheduled') {
                return res.status(400).json({ error: 'Cannot cancel notification that is not scheduled' });
            }

            notification.status = 'cancelled';
            await notification.save();

            res.json({ message: 'Scheduled notification cancelled successfully' });
        } catch (error) {
            logger.error('Error cancelling scheduled notification:', error);
            res.status(500).json({ error: 'Failed to cancel scheduled notification' });
        }
    }
);

// Get notification analytics (admin only)
router.get('/analytics',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            
            const matchFilter = {};
            if (startDate && endDate) {
                matchFilter.sentAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const analytics = await NotificationHistory.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: {
                            type: '$type',
                            channel: '$channel',
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: { type: '$_id.type', channel: '$_id.channel' },
                        statuses: {
                            $push: {
                                status: '$_id.status',
                                count: '$count'
                            }
                        },
                        total: { $sum: '$count' }
                    }
                }
            ]);

            // Calculate success rates
            const successRates = analytics.map(item => {
                const sent = item.statuses.find(s => s.status === 'sent')?.count || 0;
                const failed = item.statuses.find(s => s.status === 'failed')?.count || 0;
                const total = sent + failed;
                
                return {
                    type: item._id.type,
                    channel: item._id.channel,
                    total,
                    sent,
                    failed,
                    successRate: total > 0 ? (sent / total * 100).toFixed(2) : 0
                };
            });

            // Get daily stats for the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const dailyStats = await NotificationHistory.aggregate([
                { 
                    $match: { 
                        sentAt: { $gte: thirtyDaysAgo } 
                    } 
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: '$_id.date',
                        data: {
                            $push: {
                                status: '$_id.status',
                                count: '$count'
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            res.json({ 
                successRates,
                dailyStats,
                totalNotifications: analytics.reduce((sum, item) => sum + item.total, 0)
            });
        } catch (error) {
            logger.error('Error fetching notification analytics:', error);
            res.status(500).json({ error: 'Failed to fetch notification analytics' });
        }
    }
);

// Process scheduled notifications manually (admin only)
router.post('/process-scheduled',
    verifyToken,
    adminOnly,
    writeLimiter,
    async (req, res) => {
        try {
            const processed = await notificationManager.processScheduledNotifications();
            
            res.json({ 
                message: 'Scheduled notifications processed',
                processed
            });
        } catch (error) {
            logger.error('Error processing scheduled notifications:', error);
            res.status(500).json({ error: 'Failed to process scheduled notifications' });
        }
    }
);

// Batch send notifications
router.post('/bulk-send',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('notifications').isArray().notEmpty().withMessage('Notifications array is required'),
        body('notifications.*.userId').notEmpty().withMessage('User ID is required for each notification'),
        body('notifications.*.type').isIn(['voucher_received', 'voucher_expiring', 'redemption_confirmation', 'bulk_operation_complete', 'system_maintenance', 'security_alert']).withMessage('Valid notification type is required'),
        body('notifications.*.data').isObject().withMessage('Notification data is required'),
        body('batchSize').optional().isInt({ min: 1, max: 100 }).withMessage('Batch size must be between 1 and 100')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { notifications, batchSize } = req.body;
            
            const batchResult = await notificationManager.sendBulkNotifications(notifications, { batchSize });
            
            res.json({ 
                message: 'Bulk notifications queued successfully',
                batchId: batchResult.batchId,
                total: batchResult.total,
                status: batchResult.status
            });
        } catch (error) {
            logger.error('Error sending bulk notifications:', error);
            res.status(500).json({ error: 'Failed to send bulk notifications' });
        }
    }
);

// Get batch notification status
router.get('/bulk-status/:batchId',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const { batchId } = req.params;
            const status = await notificationManager.getBatchStatus(batchId);
            
            if (status.error) {
                return res.status(404).json({ error: status.error });
            }
            
            res.json({ batchStatus: status });
        } catch (error) {
            logger.error('Error fetching batch status:', error);
            res.status(500).json({ error: 'Failed to fetch batch status' });
        }
    }
);

// Schedule a notification
router.post('/schedule',
    verifyToken,
    writeLimiter,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('type').isIn(['voucher_received', 'voucher_expiring', 'redemption_confirmation', 'system_maintenance']).withMessage('Valid notification type is required'),
        body('data').isObject().withMessage('Notification data is required'),
        body('scheduleTime').isISO8601().withMessage('Valid schedule time is required'),
        body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { userId, type, data, scheduleTime, priority = 'medium' } = req.body;
            
            // Check if user can schedule notifications for other users
            if (userId !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Insufficient permissions to schedule notifications for other users' });
            }
            
            const scheduleResult = await notificationManager.scheduleNotification(
                userId, 
                type, 
                data, 
                scheduleTime, 
                { priority }
            );
            
            res.json({ 
                message: 'Notification scheduled successfully',
                scheduleId: scheduleResult.scheduleId,
                scheduleTime: scheduleResult.scheduleTime,
                status: scheduleResult.status
            });
        } catch (error) {
            logger.error('Error scheduling notification:', error);
            res.status(500).json({ error: 'Failed to schedule notification' });
        }
    }
);

// Cancel scheduled notification
router.delete('/schedule/:scheduleId',
    verifyToken,
    writeLimiter,
    async (req, res) => {
        try {
            const { scheduleId } = req.params;
            
            const result = await notificationManager.cancelScheduledNotification(scheduleId);
            
            if (!result.success) {
                return res.status(404).json({ error: result.message });
            }
            
            res.json({ message: result.message });
        } catch (error) {
            logger.error('Error cancelling scheduled notification:', error);
            res.status(500).json({ error: 'Failed to cancel scheduled notification' });
        }
    }
);

// Get notification analytics
router.get('/analytics',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const isAdmin = req.user.role === 'admin';
            let analytics;
            
            if (isAdmin) {
                analytics = await notificationManager.getAnalytics();
            } else {
                // Regular users get their own analytics only
                const userId = req.user.userId;
                analytics = await notificationManager.getUserAnalytics(userId);
            }
            
            res.json({ analytics });
        } catch (error) {
            logger.error('Error fetching notification analytics:', error);
            res.status(500).json({ error: 'Failed to fetch notification analytics' });
        }
    }
);

// Test notification delivery retry
router.post('/test-retry',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('type').notEmpty().withMessage('Notification type is required'),
        body('data').isObject().withMessage('Notification data is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { userId, type, data } = req.body;
            
            // Simulate a failure to test retry mechanism
            const result = await notificationManager.addToRetryQueue({
                userId,
                type,
                data,
                options: { priority: 'high' }
            });
            
            res.json({ 
                message: 'Notification added to retry queue for testing',
                success: result
            });
        } catch (error) {
            logger.error('Error testing retry mechanism:', error);
            res.status(500).json({ error: 'Failed to test retry mechanism' });
        }
    }
);

// Get notification rate limits status
router.get('/rate-limits/:userId',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const { userId } = req.params;
            
            // Check if user can view rate limits for other users
            if (userId !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            
            const rateLimitsStatus = await notificationManager.getRateLimitStatus(userId);
            
            res.json({ rateLimits: rateLimitsStatus });
        } catch (error) {
            logger.error('Error fetching rate limits:', error);
            res.status(500).json({ error: 'Failed to fetch rate limits' });
        }
    }
);

// Send notification with custom template variables
router.post('/send-custom',
    verifyToken,
    writeLimiter,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('type').isIn(['voucher_received', 'voucher_expiring', 'redemption_confirmation', 'bulk_operation_complete', 'system_maintenance', 'security_alert']).withMessage('Valid notification type is required'),
        body('data').isObject().withMessage('Notification data is required'),
        body('customVariables').optional().isObject().withMessage('Custom variables must be an object'),
        body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { userId, type, data, customVariables = {}, priority = 'medium' } = req.body;
            
            // Check permissions for sending to other users
            if (userId !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Insufficient permissions to send notifications to other users' });
            }
            
            const result = await notificationManager.sendNotification(
                userId, 
                type, 
                data, 
                { priority, customVariables }
            );
            
            res.json({ 
                message: 'Notification sent successfully',
                result
            });
        } catch (error) {
            logger.error('Error sending custom notification:', error);
            res.status(500).json({ error: 'Failed to send notification' });
        }
    }
);

module.exports = router;