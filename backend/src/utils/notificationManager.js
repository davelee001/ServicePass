const NotificationPreferences = require('../models/NotificationPreferences');
const NotificationHistory = require('../models/NotificationHistory');
const User = require('../models/User');
const notificationService = require('./notificationService');
const NotificationTemplates = require('./notificationTemplates');
const cron = require('node-cron');
const { logger } = require('./logger');

class NotificationManager {
    constructor() {
        this.retryQueue = new Map();
        this.batchQueue = new Map();
        this.scheduledNotifications = new Map();
        this.analytics = {
            totalSent: 0,
            totalFailed: 0,
            channelStats: { email: 0, sms: 0, push: 0 },
            deliveryRates: { email: 0, sms: 0, push: 0 }
        };
        
        // Start retry processor
        this.startRetryProcessor();
        
        // Start batch processor
        this.startBatchProcessor();
        
        // Start scheduled notification processor
        this.startScheduledProcessor();
    }

    async sendNotification(userId, type, data, options = {}) {
        try {
            // Set default priority if not provided
            const priority = options.priority || 'medium';
            
            // Get user and preferences
            const user = await User.findOne({ userId });
            const preferences = await NotificationPreferences.findOne({ userId });

            if (!user) {
                throw new Error(`User ${userId} not found`);
            }

            if (!preferences) {
                // Create default preferences if they don't exist
                const newPreferences = new NotificationPreferences({ userId });
                await newPreferences.save();
                return this.sendNotification(userId, type, data, options);
            }

            // Generate content from template
            const template = this.getTemplate(type, data, priority);
            if (!template) {
                throw new Error(`No template found for notification type: ${type}`);
            }

            const results = [];

            // Send email notification
            if (this.shouldSendEmail(preferences, type)) {
                try {
                    const emailResult = await notificationService.sendEmail({
                        to: user.email,
                        subject: template.email.subject,
                        htmlContent: template.email.html,
                        textContent: template.email.text,
                        priority: priority,
                        attachments: options.attachments
                    });

                    const historyRecord = new NotificationHistory({
                        userId,
                        type,
                        channel: 'email',
                        priority: priority,
                        status: 'sent',
                        recipient: user.email,
                        subject: template.email.subject,
                        content: template.email.text,
                        metadata: {
                            voucherId: data.voucherId,
                            transactionId: data.transactionId,
                            merchantId: data.merchantId
                        },
                        sentAt: new Date()
                    });
                    await historyRecord.save();

                    results.push({ channel: 'email', status: 'sent', result: emailResult });
                } catch (error) {
                    logger.error(`Failed to send email notification to ${user.email}:`, error);
                    
                    const historyRecord = new NotificationHistory({
                        userId,
                        type,
                        channel: 'email',
                        priority: priority,
                        status: 'failed',
                        recipient: user.email,
                        subject: template.email.subject,
                        content: template.email.text,
                        metadata: {
                            voucherId: data.voucherId,
                            transactionId: data.transactionId,
                            merchantId: data.merchantId,
                            errorMessage: error.message
                        }
                    });
                    await historyRecord.save();

                    results.push({ channel: 'email', status: 'failed', error: error.message });
                }
            }

            // Send SMS notification
            if (this.shouldSendSMS(preferences, type)) {
                try {
                    const smsResult = await notificationService.sendSMS({
                        to: preferences.sms.phoneNumber,
                        message: template.sms,
                        priority: priority
                    });

                    const historyRecord = new NotificationHistory({
                        userId,
                        type,
                        channel: 'sms',
                        priority: priority,
                        status: 'sent',
                        recipient: preferences.sms.phoneNumber,
                        content: template.sms,
                        metadata: {
                            voucherId: data.voucherId,
                            transactionId: data.transactionId,
                            merchantId: data.merchantId
                        },
                        sentAt: new Date()
                    });
                    await historyRecord.save();

                    results.push({ channel: 'sms', status: 'sent', result: smsResult });
                } catch (error) {
                    logger.error(`Failed to send SMS notification to ${preferences.sms.phoneNumber}:`, error);
                    
                    const historyRecord = new NotificationHistory({
                        userId,
                        type,
                        channel: 'sms',
                        priority: priority,
                        status: 'failed',
                        recipient: preferences.sms.phoneNumber,
                        content: template.sms,
                        metadata: {
                            voucherId: data.voucherId,
                            transactionId: data.transactionId,
                            merchantId: data.merchantId,
                            errorMessage: error.message
                        }
                    });
                    await historyRecord.save();

                    results.push({ channel: 'sms', status: 'failed', error: error.message });
                }
            }

            // Send push notification
            if (this.shouldSendPush(preferences, type)) {
                try {
                    const tokens = preferences.push.tokens.map(t => t.token);
                    const pushResult = await notificationService.sendBulkPushNotifications({
                        tokens,
                        title: template.push.title,
                        body: template.push.body,
                        data: template.push.data,
                        priority: priority
                    });

                    const historyRecord = new NotificationHistory({
                        userId,
                        type,
                        channel: 'push',
                        priority: priority,
                        status: 'sent',
                        recipient: `${tokens.length} devices`,
                        content: template.push.body,
                        metadata: {
                            voucherId: data.voucherId,
                            transactionId: data.transactionId,
                            merchantId: data.merchantId,
                            tokensCount: tokens.length
                        },
                        sentAt: new Date()
                    });
                    await historyRecord.save();

                    results.push({ channel: 'push', status: 'sent', result: pushResult });
                } catch (error) {                        priority: priority,                    logger.error(`Failed to send push notification:`, error);
                    
                    const historyRecord = new NotificationHistory({
                        userId,
                        type,
                        channel: 'push',
                        status: 'failed',
                        recipient: `${preferences.push.tokens.length} devices`,
                        content: template.push.body,
                        metadata: {
                            voucherId: data.voucherId,
                            transactionId: data.transactionId,
                            merchantId: data.merchantId,
                            errorMessage: error.message
                        }
                    });
                    await historyRecord.save();

                    results.push({ channel: 'push', status: 'failed', error: error.message });
                }
            }

            return results;
        } catch (error) {
            logger.error('Error in notification manager:', error);
            throw error;
        }
    }

    getTemplate(type, data) {
        switch (type) {
            case 'voucher_received':
                return NotificationTemplates.voucherReceived(data);
            case 'voucher_expiring':
                return NotificationTemplates.voucherExpiringSoon(data);
            case 'redemption_confirmation':
                return NotificationTemplates.redemptionConfirmation(data);
            case 'merchant_notification':
                return NotificationTemplates.merchantNotification(data);
            default:
                return null;
        }
    }

    shouldSendEmail(preferences, type) {
        return preferences.email.enabled && preferences.email[this.getPreferenceKey(type)];
    }

    shouldSendSMS(preferences, type) {
        return preferences.sms.enabled && 
               preferences.sms.phoneNumber && 
               preferences.sms[this.getPreferenceKey(type)];
    }

    shouldSendPush(preferences, type) {
        return preferences.push.enabled && 
               preferences.push.tokens.length > 0 && 
               preferences.push[this.getPreferenceKey(type)];
    }

    getPreferenceKey(type) {
        switch (type) {
            case 'voucher_received':
                return 'voucherReceived';
            case 'voucher_expiring':
                return 'voucherExpiring';
            case 'redemption_confirmation':
                return 'redemptionConfirmation';
            default:
                return 'voucherReceived';
        }
    }

    // Bulk send notifications to multiple users
    async sendBulkNotifications(userIds, type, dataCallback) {
        const results = [];
        
        for (const userId of userIds) {
            try {
                const data = await dataCallback(userId);
                const result = await this.sendNotification(userId, type, data);
                results.push({ userId, status: 'sent', result });
            } catch (error) {
                logger.error(`Failed to send notification to user ${userId}:`, error);
                results.push({ userId, status: 'failed', error: error.message });
            }
        }

        return results;
    }

    // Bulk send notifications to multiple users
    async sendBulkNotifications(userIds, type, data, options = {}) {
        try {
            const results = [];
            const batchSize = options.batchSize || 10; // Process in batches to avoid overwhelming the system
            const delay = options.delay || 100; // Delay between batches in ms

            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                
                const batchResults = await Promise.allSettled(
                    batch.map(async (userId) => {
                        try {
                            return await this.sendNotification(userId, type, data, options);
                        } catch (error) {
                            return { userId, error: error.message };
                        }
                    })
                );

                batchResults.forEach((result, index) => {
                    const userId = batch[index];
                    if (result.status === 'fulfilled') {
                        results.push({ userId, result: result.value });
                    } else {
                        results.push({ userId, error: result.reason });
                    }
                });

                // Add delay between batches if specified
                if (delay > 0 && i + batchSize < userIds.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            logger.info(`Bulk notifications sent to ${userIds.length} users`);
            return {
                totalUsers: userIds.length,
                successful: results.filter(r => !r.error).length,
                failed: results.filter(r => r.error).length,
                results
            };
        } catch (error) {
            logger.error('Error sending bulk notifications:', error);
            throw error;
        }
    }

    // Send scheduled notification (store for later processing)
    async scheduleNotification(userId, type, data, scheduleTime, options = {}) {
        try {
            const ScheduledNotification = require('../models/ScheduledNotification');
            
            const scheduledNotification = new ScheduledNotification({
                userId,
                type,
                data,
                scheduleTime,
                options,
                status: 'scheduled',
                createdAt: new Date()
            });

            await scheduledNotification.save();
            
            logger.info(`Notification scheduled for user ${userId} at ${scheduleTime}`);
            return scheduledNotification;
        } catch (error) {
            logger.error('Error scheduling notification:', error);
            throw error;
        }
    }

    // Process scheduled notifications
    async processScheduledNotifications() {
        try {
            const ScheduledNotification = require('../models/ScheduledNotification');
            const now = new Date();

            const dueNotifications = await ScheduledNotification.find({
                scheduleTime: { $lte: now },
                status: 'scheduled'
            });

            let processed = 0;
            for (const notification of dueNotifications) {
                try {
                    await this.sendNotification(
                        notification.userId,
                        notification.type,
                        notification.data,
                        notification.options
                    );

                    notification.status = 'sent';
                    notification.sentAt = new Date();
                } catch (error) {
                    notification.status = 'failed';
                    notification.error = error.message;
                }
                
                await notification.save();
                processed++;
            }

            logger.info(`Processed ${processed} scheduled notifications`);
            return processed;
        } catch (error) {
            logger.error('Error processing scheduled notifications:', error);
            throw error;
        }
    }

    // Enhanced notification methods
    
    // Retry failed notifications with exponential backoff
    async addToRetryQueue(notificationData, attempt = 1) {
        const maxRetries = 3;
        const retryId = `${notificationData.userId}_${notificationData.type}_${Date.now()}`;
        
        if (attempt > maxRetries) {
            logger.error(`Max retries exceeded for notification ${retryId}`);
            return false;
        }
        
        const retryDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
        const retryTime = Date.now() + retryDelay;
        
        this.retryQueue.set(retryId, {
            ...notificationData,
            attempt,
            retryTime,
            retryId
        });
        
        logger.info(`Added notification ${retryId} to retry queue (attempt ${attempt})`);
        return true;
    }
    
    // Process retry queue
    startRetryProcessor() {
        setInterval(async () => {
            const now = Date.now();
            const toRetry = [];
            
            for (const [retryId, data] of this.retryQueue.entries()) {
                if (data.retryTime <= now) {
                    toRetry.push(data);
                    this.retryQueue.delete(retryId);
                }
            }
            
            for (const data of toRetry) {
                try {
                    await this.sendNotification(data.userId, data.type, data.data, data.options);
                } catch (error) {
                    logger.error(`Retry failed for ${data.retryId}:`, error);
                    await this.addToRetryQueue(data, data.attempt + 1);
                }
            }
        }, 5000); // Check every 5 seconds
    }
    
    // Send notifications in batches
    async sendBulkNotifications(notifications, options = {}) {
        const batchSize = options.batchSize || 50;
        const batchId = `batch_${Date.now()}`;
        
        // Add to batch queue
        this.batchQueue.set(batchId, {
            notifications,
            batchSize,
            processed: 0,
            total: notifications.length,
            status: 'queued',
            startTime: null,
            endTime: null,
            results: []
        });
        
        return {
            batchId,
            total: notifications.length,
            status: 'queued'
        };
    }
    
    // Process batch queue
    startBatchProcessor() {
        setInterval(async () => {
            for (const [batchId, batchData] of this.batchQueue.entries()) {
                if (batchData.status === 'queued') {
                    batchData.status = 'processing';
                    batchData.startTime = Date.now();
                    
                    try {
                        await this.processBatch(batchId, batchData);
                    } catch (error) {
                        logger.error(`Batch processing failed for ${batchId}:`, error);
                        batchData.status = 'failed';
                        batchData.endTime = Date.now();
                    }
                }
            }
        }, 1000); // Check every second
    }
    
    async processBatch(batchId, batchData) {
        const { notifications, batchSize } = batchData;
        const chunks = [];
        
        // Split into chunks
        for (let i = 0; i < notifications.length; i += batchSize) {
            chunks.push(notifications.slice(i, i + batchSize));
        }
        
        for (const chunk of chunks) {
            const chunkResults = await Promise.allSettled(
                chunk.map(notification => 
                    this.sendNotification(
                        notification.userId, 
                        notification.type, 
                        notification.data, 
                        notification.options
                    )
                )
            );
            
            batchData.results.push(...chunkResults);
            batchData.processed += chunk.length;
        }
        
        batchData.status = 'completed';
        batchData.endTime = Date.now();
        
        // Update analytics
        const successful = batchData.results.filter(r => r.status === 'fulfilled').length;
        const failed = batchData.results.filter(r => r.status === 'rejected').length;
        
        this.analytics.totalSent += successful;
        this.analytics.totalFailed += failed;
        
        logger.info(`Batch ${batchId} completed: ${successful} successful, ${failed} failed`);
    }
    
    // Schedule notifications for future delivery
    async scheduleNotification(userId, type, data, scheduleTime, options = {}) {\n        const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n        \n        this.scheduledNotifications.set(scheduleId, {\n            userId,\n            type,\n            data,\n            options,\n            scheduleTime: new Date(scheduleTime).getTime(),\n            scheduleId,\n            status: 'scheduled'\n        });\n        \n        logger.info(`Notification scheduled for ${new Date(scheduleTime)} with ID ${scheduleId}`);\n        \n        return {\n            scheduleId,\n            scheduleTime: new Date(scheduleTime),\n            status: 'scheduled'\n        };\n    }\n    \n    // Process scheduled notifications\n    startScheduledProcessor() {\n        setInterval(async () => {\n            const now = Date.now();\n            const toSend = [];\n            \n            for (const [scheduleId, data] of this.scheduledNotifications.entries()) {\n                if (data.status === 'scheduled' && data.scheduleTime <= now) {\n                    toSend.push(data);\n                    this.scheduledNotifications.delete(scheduleId);\n                }\n            }\n            \n            for (const data of toSend) {\n                try {\n                    await this.sendNotification(data.userId, data.type, data.data, data.options);\n                    logger.info(`Scheduled notification ${data.scheduleId} sent successfully`);\n                } catch (error) {\n                    logger.error(`Failed to send scheduled notification ${data.scheduleId}:`, error);\n                }\n            }\n        }, 10000); // Check every 10 seconds\n    }\n    \n    // Get batch status\n    getBatchStatus(batchId) {\n        return this.batchQueue.get(batchId) || { error: 'Batch not found' };\n    }\n    \n    // Cancel scheduled notification\n    cancelScheduledNotification(scheduleId) {\n        const notification = this.scheduledNotifications.get(scheduleId);\n        if (notification) {\n            this.scheduledNotifications.delete(scheduleId);\n            return { success: true, message: 'Notification cancelled' };\n        }\n        return { success: false, message: 'Notification not found' };\n    }\n    \n    // Get notification analytics\n    getAnalytics() {\n        const totalNotifications = this.analytics.totalSent + this.analytics.totalFailed;\n        \n        return {\n            ...this.analytics,\n            successRate: totalNotifications > 0 ? (this.analytics.totalSent / totalNotifications) * 100 : 0,\n            totalNotifications,\n            retryQueueSize: this.retryQueue.size,\n            batchQueueSize: this.batchQueue.size,\n            scheduledCount: this.scheduledNotifications.size\n        };\n    }\n    \n    // Get notification analytics\n    getAnalytics() {\n        const totalNotifications = this.analytics.totalSent + this.analytics.totalFailed;\n        \n        return {\n            ...this.analytics,\n            successRate: totalNotifications > 0 ? (this.analytics.totalSent / totalNotifications) * 100 : 0,\n            totalNotifications,\n            retryQueueSize: this.retryQueue.size,\n            batchQueueSize: this.batchQueue.size,\n            scheduledCount: this.scheduledNotifications.size\n        };\n    }\n    \n    // Get user-specific analytics\n    async getUserAnalytics(userId) {\n        try {\n            const thirtyDaysAgo = new Date();\n            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);\n            \n            const userHistory = await NotificationHistory.find({\n                userId,\n                createdAt: { $gte: thirtyDaysAgo }\n            });\n            \n            const channelStats = { email: 0, sms: 0, push: 0 };\n            const statusStats = { sent: 0, failed: 0 };\n            const typeStats = {};\n            \n            userHistory.forEach(record => {\n                channelStats[record.channel] = (channelStats[record.channel] || 0) + 1;\n                statusStats[record.status] = (statusStats[record.status] || 0) + 1;\n                typeStats[record.type] = (typeStats[record.type] || 0) + 1;\n            });\n            \n            return {\n                totalNotifications: userHistory.length,\n                channelStats,\n                statusStats,\n                typeStats,\n                successRate: userHistory.length > 0 ? (statusStats.sent / userHistory.length) * 100 : 0,\n                lastNotification: userHistory.length > 0 ? userHistory[userHistory.length - 1].createdAt : null\n            };\n        } catch (error) {\n            logger.error(`Error fetching user analytics for ${userId}:`, error);\n            throw error;\n        }\n    }\n    \n    // Get rate limit status for user\n    async getRateLimitStatus(userId) {\n        if (!this.rateLimits) {\n            return { status: 'No rate limits applied' };\n        }\n        \n        const now = Date.now();\n        const windowMs = 60 * 1000; // 1 minute window\n        const maxRequests = 10;\n        \n        const rateLimitData = {};\n        \n        for (const [key, requests] of this.rateLimits.entries()) {\n            if (key.startsWith(userId)) {\n                const type = key.split('_')[1];\n                const validRequests = requests.filter(time => now - time < windowMs);\n                rateLimitData[type] = {\n                    requests: validRequests.length,\n                    maxRequests,\n                    remainingRequests: maxRequests - validRequests.length,\n                    resetTime: validRequests.length > 0 ? new Date(Math.min(...validRequests) + windowMs) : null\n                };\n            }\n        }\n        \n        return rateLimitData;\n    }\n    \n    // Process scheduled notifications manually\n    async processScheduledNotifications() {\n        const now = Date.now();\n        const toSend = [];\n        \n        for (const [scheduleId, data] of this.scheduledNotifications.entries()) {\n            if (data.status === 'scheduled' && data.scheduleTime <= now) {\n                toSend.push(data);\n            }\n        }\n        \n        const results = [];\n        \n        for (const data of toSend) {\n            try {\n                await this.sendNotification(data.userId, data.type, data.data, data.options);\n                this.scheduledNotifications.delete(data.scheduleId);\n                results.push({ scheduleId: data.scheduleId, status: 'sent' });\n            } catch (error) {\n                logger.error(`Failed to send scheduled notification ${data.scheduleId}:`, error);\n                results.push({ scheduleId: data.scheduleId, status: 'failed', error: error.message });\n            }\n        }\n        \n        return results;\n    }\n    \n    // Rate limiting for notifications\n    async checkRateLimit(userId, type) {\n        const rateLimitKey = `${userId}_${type}`;\n        const now = Date.now();\n        const windowMs = 60 * 1000; // 1 minute window\n        const maxRequests = 10; // max 10 notifications per minute per type\n        \n        if (!this.rateLimits) {\n            this.rateLimits = new Map();\n        }\n        \n        const userLimits = this.rateLimits.get(rateLimitKey) || [];\n        \n        // Remove expired entries\n        const validRequests = userLimits.filter(time => now - time < windowMs);\n        \n        if (validRequests.length >= maxRequests) {\n            return false;\n        }\n        \n        validRequests.push(now);\n        this.rateLimits.set(rateLimitKey, validRequests);\n        \n        return true;\n    }\n    \n    // Enhanced template system with dynamic variables\n    getTemplate(type, data, priority = 'medium', customVariables = {}) {\n        const templateData = { ...data, ...customVariables };\n        \n        // Add system variables\n        templateData.currentDate = new Date().toLocaleDateString();\n        templateData.systemName = 'ServicePass';\n        templateData.supportEmail = process.env.SUPPORT_EMAIL || 'support@servicepass.com';\n        templateData.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';\n        \n        // Priority-based styling\n        const priorityStyles = {\n            high: { color: '#F44336', urgency: 'URGENT' },\n            medium: { color: '#FF9800', urgency: 'Important' },\n            low: { color: '#4CAF50', urgency: 'Information' }\n        };\n        \n        templateData.priorityStyle = priorityStyles[priority] || priorityStyles.medium;\n        \n        switch (type) {\n            case 'voucher_received':\n                return NotificationTemplates.voucherReceived(templateData);\n            case 'voucher_expiring':\n                return NotificationTemplates.voucherExpiringSoon(templateData);\n            case 'redemption_confirmation':\n                return NotificationTemplates.redemptionConfirmation(templateData);\n            case 'bulk_operation_complete':\n                return NotificationTemplates.bulkOperationComplete(templateData);\n            case 'system_maintenance':\n                return NotificationTemplates.systemMaintenance(templateData);\n            case 'security_alert':\n                return NotificationTemplates.securityAlert(templateData);\n            default:\n                return null;\n        }\n    }

    // Check for expiring vouchers and send notifications
    async checkExpiringVouchers() {
        try {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            const oneDayFromNow = new Date();
            oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

            // Find vouchers expiring in 3 days or 1 day
            const Voucher = require('../models/Voucher');
            const expiringVouchers = await Voucher.find({
                expiryTimestamp: {
                    $gte: oneDayFromNow.getTime(),
                    $lte: threeDaysFromNow.getTime()
                },
                isRedeemed: false
            });

            for (const voucher of expiringVouchers) {
                const daysLeft = Math.ceil((voucher.expiryTimestamp - Date.now()) / (1000 * 60 * 60 * 24));
                
                const notificationData = {
                    voucherId: voucher.voucherObjectId,
                    voucherType: voucher.voucherType,
                    amount: voucher.amount,
                    merchantName: voucher.merchantId, // You might want to fetch actual merchant name
                    expiryDate: new Date(voucher.expiryTimestamp).toLocaleDateString(),
                    daysLeft
                };

                await this.sendNotification(voucher.owner, 'voucher_expiring', notificationData);
            }

            logger.info(`Checked ${expiringVouchers.length} expiring vouchers`);
            return expiringVouchers.length;
        } catch (error) {
            logger.error('Error checking expiring vouchers:', error);
            throw error;
        }
    }
}

module.exports = new NotificationManager();