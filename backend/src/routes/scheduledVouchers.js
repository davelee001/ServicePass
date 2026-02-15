const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const scheduledVoucherProcessor = require('../utils/scheduledVoucherProcessor');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { writeLimiter, readLimiter } = require('../middleware/rateLimiter');

// Create scheduled voucher (Admin only)
router.post('/',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('scheduledFor').isISO8601().withMessage('Valid schedule date required'),
        body('voucherType').isInt({ min: 1, max: 4 }).withMessage('Valid voucher type (1-4) required'),
        body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
        body('recipient').notEmpty().withMessage('Recipient address required'),
        body('merchantId').notEmpty().withMessage('Merchant ID required'),
        body('expiryTimestamp').isInt({ min: 0 }).withMessage('Valid expiry timestamp required'),
        body('metadata').optional().isString(),
        body('templateId').optional().isString(),
        body('notifyRecipient').optional().isBoolean(),
        body('recurringSchedule').optional().isObject(),
        body('recurringSchedule.enabled').optional().isBoolean(),
        body('recurringSchedule.frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
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

            // Validate scheduled date is in the future
            const scheduledDate = new Date(req.body.scheduledFor);
            if (scheduledDate <= new Date()) {
                return res.status(400).json({
                    error: 'Scheduled date must be in the future'
                });
            }

            const scheduledVoucher = await scheduledVoucherProcessor.createScheduledVoucher({
                ...req.body,
                createdBy: req.user._id
            });

            res.status(201).json({
                message: 'Voucher scheduled successfully',
                scheduledVoucher
            });
        } catch (error) {
            logger.error('Error creating scheduled voucher:', error);
            res.status(500).json({ error: 'Failed to schedule voucher' });
        }
    }
);

// Get scheduled vouchers
router.get('/',
    verifyToken,
    readLimiter,
    [
        query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
        query('recipient').optional().isString(),
        query('merchantId').optional().isString()
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

            const filter = {};
            if (req.query.status) filter.status = req.query.status;
            if (req.query.recipient) filter.recipient = req.query.recipient;
            if (req.query.merchantId) filter.merchantId = req.query.merchantId;

            // Non-admin users can only see their own scheduled vouchers
            if (req.user.role !== 'admin') {
                filter.createdBy = req.user._id;
            }

            const scheduledVouchers = await scheduledVoucherProcessor.getScheduledVouchers(filter);

            res.json({ scheduledVouchers });
        } catch (error) {
            logger.error('Error fetching scheduled vouchers:', error);
            res.status(500).json({ error: 'Failed to fetch scheduled vouchers' });
        }
    }
);

// Get scheduled voucher by ID
router.get('/:scheduleId',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const ScheduledVoucher = require('../models/ScheduledVoucher');
            const scheduledVoucher = await ScheduledVoucher.findOne({
                scheduleId: req.params.scheduleId
            });

            if (!scheduledVoucher) {
                return res.status(404).json({ error: 'Scheduled voucher not found' });
            }

            // Check permissions
            if (req.user.role !== 'admin' && scheduledVoucher.createdBy !== req.user._id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({ scheduledVoucher });
        } catch (error) {
            logger.error('Error fetching scheduled voucher:', error);
            res.status(500).json({ error: 'Failed to fetch scheduled voucher' });
        }
    }
);

// Cancel scheduled voucher
router.post('/:scheduleId/cancel',
    verifyToken,
    writeLimiter,
    async (req, res) => {
        try {
            const ScheduledVoucher = require('../models/ScheduledVoucher');
            const scheduledVoucher = await ScheduledVoucher.findOne({
                scheduleId: req.params.scheduleId
            });

            if (!scheduledVoucher) {
                return res.status(404).json({ error: 'Scheduled voucher not found' });
            }

            // Check permissions
            if (req.user.role !== 'admin' && scheduledVoucher.createdBy !== req.user._id) {
                return res.status(403).json({ error: 'Access denied' });
            }

            await scheduledVoucherProcessor.cancelScheduledVoucher(req.params.scheduleId);

            res.json({
                message: 'Scheduled voucher cancelled successfully',
                scheduledVoucher
            });
        } catch (error) {
            logger.error('Error cancelling scheduled voucher:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Manually trigger processing (Admin only)
router.post('/process/trigger',
    verifyToken,
    adminOnly,
    writeLimiter,
    async (req, res) => {
        try {
            await scheduledVoucherProcessor.processReadyVouchers();
            res.json({ message: 'Processing triggered successfully' });
        } catch (error) {
            logger.error('Error triggering processing:', error);
            res.status(500).json({ error: 'Failed to trigger processing' });
        }
    }
);

// Get statistics (Admin only)
router.get('/analytics/stats',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const ScheduledVoucher = require('../models/ScheduledVoucher');
            
            const [pending, processing, completed, failed, cancelled, total] = await Promise.all([
                ScheduledVoucher.countDocuments({ status: 'pending' }),
                ScheduledVoucher.countDocuments({ status: 'processing' }),
                ScheduledVoucher.countDocuments({ status: 'completed' }),
                ScheduledVoucher.countDocuments({ status: 'failed' }),
                ScheduledVoucher.countDocuments({ status: 'cancelled' }),
                ScheduledVoucher.countDocuments()
            ]);

            res.json({
                stats: {
                    pending,
                    processing,
                    completed,
                    failed,
                    cancelled,
                    total
                }
            });
        } catch (error) {
            logger.error('Error fetching stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }
);

module.exports = router;
