const ScheduledVoucher = require('../models/ScheduledVoucher');
const VoucherTemplate = require('../models/VoucherTemplate');
const Voucher = require('../models/Voucher');
const { logger } = require('./logger');
const crypto = require('crypto');

class ScheduledVoucherProcessor {
    constructor() {
        this.isProcessing = false;
        this.processInterval = null;
    }

    /**
     * Start the scheduled voucher processor
     * @param {number} intervalMs - Interval in milliseconds (default: 60000 = 1 minute)
     */
    start(intervalMs = 60000) {
        if (this.processInterval) {
            logger.warn('Scheduled voucher processor already running');
            return;
        }

        logger.info(`Starting scheduled voucher processor (interval: ${intervalMs}ms)`);
        
        // Process immediately on start
        this.processReadyVouchers();

        // Then process at intervals
        this.processInterval = setInterval(() => {
            this.processReadyVouchers();
        }, intervalMs);
    }

    /**
     * Stop the processor
     */
    stop() {
        if (this.processInterval) {
            clearInterval(this.processInterval);
            this.processInterval = null;
            logger.info('Stopped scheduled voucher processor');
        }
    }

    /**
     * Process all ready scheduled vouchers
     */
    async processReadyVouchers() {
        if (this.isProcessing) {
            logger.debug('Already processing scheduled vouchers, skipping...');
            return;
        }

        this.isProcessing = true;

        try {
            const readyVouchers = await ScheduledVoucher.findReady();
            
            if (readyVouchers.length === 0) {
                logger.debug('No scheduled vouchers ready to process');
                return;
            }

            logger.info(`Processing ${readyVouchers.length} scheduled vouchers`);

            for (const scheduledVoucher of readyVouchers) {
                await this.processScheduledVoucher(scheduledVoucher);
            }

            logger.info(`Completed processing ${readyVouchers.length} scheduled vouchers`);
        } catch (error) {
            logger.error('Error processing scheduled vouchers:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process a single scheduled voucher
     * @param {Object} scheduledVoucher - The scheduled voucher document
     */
    async processScheduledVoucher(scheduledVoucher) {
        try {
            await scheduledVoucher.markProcessing();

            // Get template if specified
            let voucherData = {
                voucherType: scheduledVoucher.voucherType,
                amount: scheduledVoucher.amount,
                recipient: scheduledVoucher.recipient,
                merchantId: scheduledVoucher.merchantId,
                expiryTimestamp: scheduledVoucher.expiryTimestamp,
                metadata: scheduledVoucher.metadata
            };

            if (scheduledVoucher.templateId) {
                const template = await VoucherTemplate.findOne({
                    templateId: scheduledVoucher.templateId,
                    isActive: true
                });

                if (template) {
                    // Apply template settings
                    voucherData.allowPartialRedemption = template.allowPartialRedemption;
                    voucherData.transferRestrictions = template.transferRestrictions;
                    voucherData.templateId = template.templateId;

                    // Increment template usage
                    await template.incrementUsage();
                }
            }

            // TODO: Call actual blockchain minting function here
            // For now, create a mock voucher in database
            const voucherId = `SCH_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
            
            const voucher = await Voucher.create({
                voucherId,
                ...voucherData,
                originalAmount: voucherData.amount,
                remainingAmount: voucherData.amount,
                transactionDigest: `scheduled_${Date.now()}`,
                qrCodeData: '', // TODO: Generate QR code
                signature: '' // TODO: Generate signature
            });

            await scheduledVoucher.markCompleted(voucherId);

            logger.info(`Successfully processed scheduled voucher ${scheduledVoucher.scheduleId}, created voucher ${voucherId}`);

            // Handle recurring schedules
            if (scheduledVoucher.recurringSchedule?.enabled) {
                await this.createNextRecurringSchedule(scheduledVoucher);
            }

        } catch (error) {
            logger.error(`Error processing scheduled voucher ${scheduledVoucher.scheduleId}:`, error);

            // Check if we should retry
            if (scheduledVoucher.retryCount < scheduledVoucher.maxRetries) {
                await scheduledVoucher.markFailed(error);
                logger.info(`Scheduled voucher ${scheduledVoucher.scheduleId} will be retried (${scheduledVoucher.retryCount}/${scheduledVoucher.maxRetries})`);
            } else {
                await scheduledVoucher.markFailed(error);
                logger.error(`Scheduled voucher ${scheduledVoucher.scheduleId} failed after ${scheduledVoucher.maxRetries} retries`);
            }
        }
    }

    /**
     * Create next recurring schedule
     * @param {Object} completedSchedule - The completed schedule
     */
    async createNextRecurringSchedule(completedSchedule) {
        try {
            const { recurringSchedule } = completedSchedule;
            
            if (!recurringSchedule.enabled || !recurringSchedule.frequency) {
                return;
            }

            // Calculate next scheduled date
            const nextDate = this.calculateNextDate(
                completedSchedule.scheduledFor,
                recurringSchedule.frequency
            );

            // Check if we should continue (end date check)
            if (recurringSchedule.endDate && nextDate > recurringSchedule.endDate) {
                logger.info(`Recurring schedule ${completedSchedule.scheduleId} has ended`);
                return;
            }

            // Create new schedule
            const newScheduleId = `REC_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
            
            await ScheduledVoucher.create({
                scheduleId: newScheduleId,
                scheduledFor: nextDate,
                voucherType: completedSchedule.voucherType,
                amount: completedSchedule.amount,
                recipient: completedSchedule.recipient,
                merchantId: completedSchedule.merchantId,
                expiryTimestamp: completedSchedule.expiryTimestamp,
                metadata: completedSchedule.metadata,
                templateId: completedSchedule.templateId,
                createdBy: completedSchedule.createdBy,
                notifyRecipient: completedSchedule.notifyRecipient,
                recurringSchedule: recurringSchedule
            });

            logger.info(`Created next recurring schedule ${newScheduleId} for ${nextDate}`);
        } catch (error) {
            logger.error('Error creating next recurring schedule:', error);
        }
    }

    /**
     * Calculate next scheduled date based on frequency
     * @param {Date} currentDate - Current scheduled date
     * @param {string} frequency - Frequency (daily, weekly, monthly, yearly)
     * @returns {Date} Next scheduled date
     */
    calculateNextDate(currentDate, frequency) {
        const next = new Date(currentDate);

        switch (frequency) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'yearly':
                next.setFullYear(next.getFullYear() + 1);
                break;
            default:
                throw new Error(`Invalid frequency: ${frequency}`);
        }

        return next;
    }

    /**
     * Create a scheduled voucher
     * @param {Object} data - Voucher data
     * @returns {Promise<Object>} Created scheduled voucher
     */
    async createScheduledVoucher(data) {
        const scheduleId = `SCH_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        const scheduledVoucher = await ScheduledVoucher.create({
            scheduleId,
            ...data
        });

        logger.info(`Created scheduled voucher ${scheduleId} for ${data.scheduledFor}`);

        return scheduledVoucher;
    }

    /**
     * Cancel a scheduled voucher
     * @param {string} scheduleId - Schedule ID
     * @returns {Promise<Object>} Cancelled schedule
     */
    async cancelScheduledVoucher(scheduleId) {
        const schedule = await ScheduledVoucher.findOne({ scheduleId });

        if (!schedule) {
            throw new Error('Scheduled voucher not found');
        }

        if (schedule.status !== 'pending') {
            throw new Error(`Cannot cancel schedule with status: ${schedule.status}`);
        }

        await schedule.cancel();
        logger.info(`Cancelled scheduled voucher ${scheduleId}`);

        return schedule;
    }

    /**
     * Get scheduled vouchers with filters
     * @param {Object} filter - Query filter
     * @returns {Promise<Array>} Scheduled vouchers
     */
    async getScheduledVouchers(filter = {}) {
        return ScheduledVoucher.find(filter).sort({ scheduledFor: 1 });
    }
}

// Export singleton instance
module.exports = new ScheduledVoucherProcessor();
