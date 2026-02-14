const cron = require('node-cron');
const notificationManager = require('./notificationManager');
const { logger } = require('./logger');

class NotificationScheduler {
    constructor() {
        this.jobs = {};
        this.initializeJobs();
    }

    initializeJobs() {
        // Check for expiring vouchers every day at 9:00 AM
        this.jobs.expiryCheck = cron.schedule('0 9 * * *', async () => {
            try {
                logger.info('Starting scheduled expiry notification check...');
                const count = await notificationManager.checkExpiringVouchers();
                logger.info(`Expiry notification check completed. Processed ${count} expiring vouchers.`);
            } catch (error) {
                logger.error('Error in scheduled expiry notification check:', error);
            }
        }, {
            scheduled: false // Don't start automatically
        });

        // Check for expiring vouchers every 6 hours (for more urgent notifications)
        this.jobs.urgentExpiryCheck = cron.schedule('0 */6 * * *', async () => {
            try {
                logger.info('Starting urgent expiry notification check...');
                
                // Check for vouchers expiring in the next 24 hours
                const oneDayFromNow = new Date();
                oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

                const Voucher = require('../models/Voucher');
                const urgentlyExpiringVouchers = await Voucher.find({
                    expiryTimestamp: {
                        $gte: Date.now(),
                        $lte: oneDayFromNow.getTime()
                    },
                    isRedeemed: false
                });

                for (const voucher of urgentlyExpiringVouchers) {
                    const hoursLeft = Math.ceil((voucher.expiryTimestamp - Date.now()) / (1000 * 60 * 60));
                    
                    const notificationData = {
                        voucherId: voucher.voucherObjectId,
                        voucherType: voucher.voucherType,
                        amount: voucher.amount,
                        merchantName: voucher.merchantId,
                        expiryDate: new Date(voucher.expiryTimestamp).toLocaleDateString(),
                        daysLeft: hoursLeft < 24 ? 1 : Math.ceil(hoursLeft / 24)
                    };

                    await notificationManager.sendNotification(voucher.owner, 'voucher_expiring', notificationData);
                }

                logger.info(`Urgent expiry notification check completed. Processed ${urgentlyExpiringVouchers.length} urgently expiring vouchers.`);
            } catch (error) {
                logger.error('Error in urgent expiry notification check:', error);
            }
        }, {
            scheduled: false
        });

        // Process scheduled notifications every 5 minutes
        this.jobs.processScheduled = cron.schedule('*/5 * * * *', async () => {
            try {
                logger.info('Processing scheduled notifications...');
                const processed = await notificationManager.processScheduledNotifications();
                if (processed > 0) {
                    logger.info(`Processed ${processed} scheduled notifications`);
                }
            } catch (error) {
                logger.error('Error processing scheduled notifications:', error);
            }
        }, {
            scheduled: false
        });

        // Daily notification summary (optional) - sends a summary email to admins
        this.jobs.dailySummary = cron.schedule('0 18 * * *', async () => {
            try {
                logger.info('Starting daily notification summary...');
                
                const NotificationHistory = require('../models/NotificationHistory');
                
                // Get today's notification stats
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);
                
                const todaysNotifications = await NotificationHistory.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: startOfDay,
                                $lte: endOfDay
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                type: '$type',
                                channel: '$channel',
                                status: '$status'
                            },
                            count: { $sum: 1 }
                        }
                    }
                ]);
                
                logger.info('Daily notification summary:', { stats: todaysNotifications });
                
                // You can implement admin email notification here
                // with the daily summary if needed
                
            } catch (error) {
                logger.error('Error in daily notification summary:', error);
            }
        }, {
            scheduled: false
        });
    }

    startJobs() {
        Object.values(this.jobs).forEach(job => {
            if (!job.running) {
                job.start();
            }
        });
        logger.info('Notification scheduler jobs started');
    }

    stopJobs() {
        Object.values(this.jobs).forEach(job => {
            if (job.running) {
                job.stop();
            }
        });
        logger.info('Notification scheduler jobs stopped');
    }

    // Manual trigger for testing
    async runExpiryCheck() {
        try {
            logger.info('Running manual expiry notification check...');
            const count = await notificationManager.checkExpiringVouchers();
            logger.info(`Manual expiry check completed. Processed ${count} expiring vouchers.`);
            return count;
        } catch (error) {
            logger.error('Error in manual expiry check:', error);
            throw error;
        }
    }

    // Manual trigger for processing scheduled notifications
    async runScheduledNotificationProcessor() {
        try {
            logger.info('Running manual scheduled notification processor...');
            const processed = await notificationManager.processScheduledNotifications();
            logger.info(`Manual scheduled notification processing completed. Processed ${processed} notifications.`);
            return processed;
        } catch (error) {
            logger.error('Error in manual scheduled notification processing:', error);
            throw error;
        }
    }

    getJobStatus() {
        return Object.keys(this.jobs).reduce((status, jobName) => {
            status[jobName] = {
                running: this.jobs[jobName].running,
                lastRun: this.jobs[jobName].lastDate,
                nextRun: this.jobs[jobName].nextDates(1)[0]
            };
            return status;
        }, {});
    }
}

module.exports = new NotificationScheduler();