const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const transferValidator = require('../utils/transferValidator');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { writeLimiter, readLimiter } = require('../middleware/rateLimiter');

// Create voucher transfer
router.post('/',
    verifyToken,
    writeLimiter,
    [
        body('voucherId').notEmpty().withMessage('Voucher ID required'),
        body('toAddress').notEmpty().withMessage('Recipient address required'),
        body('transferType').isIn(['full', 'partial']).withMessage('Valid transfer type required'),
        body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
        body('reason').optional().isString()
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

            // Validate partial transfer has amount
            if (req.body.transferType === 'partial' && !req.body.amount) {
                return res.status(400).json({
                    error: 'Amount required for partial transfers'
                });
            }

            const transfer = await transferValidator.createTransfer({
                voucherId: req.body.voucherId,
                fromAddress: req.user.walletAddress,
                toAddress: req.body.toAddress,
                transferType: req.body.transferType,
                amount: req.body.amount,
                reason: req.body.reason,
                initiatedBy: req.user._id
            });

            res.status(201).json({
                message: transfer.requiresApproval 
                    ? 'Transfer created and pending approval'
                    : 'Transfer completed successfully',
                transfer
            });
        } catch (error) {
            logger.error('Error creating transfer:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Get transfers
router.get('/',
    verifyToken,
    readLimiter,
    [
        query('status').optional().isIn(['pending', 'approved', 'rejected', 'completed', 'failed']),
        query('voucherId').optional().isString(),
        query('fromAddress').optional().isString(),
        query('toAddress').optional().isString()
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

            const VoucherTransfer = require('../models/VoucherTransfer');
            const filter = {};

            if (req.query.status) filter.status = req.query.status;
            if (req.query.voucherId) filter.voucherId = req.query.voucherId;
            if (req.query.fromAddress) filter.fromAddress = req.query.fromAddress;
            if (req.query.toAddress) filter.toAddress = req.query.toAddress;

            // Non-admin users can only see their own transfers
            if (req.user.role !== 'admin') {
                filter.$or = [
                    { fromAddress: req.user.walletAddress },
                    { toAddress: req.user.walletAddress }
                ];
            }

            const transfers = await VoucherTransfer.find(filter)
                .sort({ createdAt: -1 })
                .limit(100);

            res.json({ transfers });
        } catch (error) {
            logger.error('Error fetching transfers:', error);
            res.status(500).json({ error: 'Failed to fetch transfers' });
        }
    }
);

// Get transfer by ID
router.get('/:transferId',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const VoucherTransfer = require('../models/VoucherTransfer');
            const transfer = await VoucherTransfer.findOne({
                transferId: req.params.transferId
            });

            if (!transfer) {
                return res.status(404).json({ error: 'Transfer not found' });
            }

            // Check permissions
            if (req.user.role !== 'admin' && 
                transfer.fromAddress !== req.user.walletAddress &&
                transfer.toAddress !== req.user.walletAddress) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json({ transfer });
        } catch (error) {
            logger.error('Error fetching transfer:', error);
            res.status(500).json({ error: 'Failed to fetch transfer' });
        }
    }
);

// Approve transfer (Admin or Merchant only)
router.post('/:transferId/approve',
    verifyToken,
    writeLimiter,
    [
        body('comment').optional().isString()
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

            const VoucherTransfer = require('../models/VoucherTransfer');
            const transfer = await VoucherTransfer.findOne({
                transferId: req.params.transferId
            });

            if (!transfer) {
                return res.status(404).json({ error: 'Transfer not found' });
            }

            // Check permissions (admin or merchant who issued the voucher)
            if (req.user.role !== 'admin') {
                const Voucher = require('../models/Voucher');
                const voucher = await Voucher.findOne({ voucherId: transfer.voucherId });
                
                if (!voucher || voucher.merchantId !== req.user.merchantId) {
                    return res.status(403).json({ 
                        error: 'Only admin or issuing merchant can approve transfers' 
                    });
                }
            }

            const updatedTransfer = await transferValidator.approveTransfer(
                req.params.transferId,
                req.user._id,
                req.body.comment
            );

            res.json({
                message: 'Transfer approved successfully',
                transfer: updatedTransfer
            });
        } catch (error) {
            logger.error('Error approving transfer:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Reject transfer (Admin or Merchant only)
router.post('/:transferId/reject',
    verifyToken,
    writeLimiter,
    [
        body('reason').notEmpty().withMessage('Rejection reason required')
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

            const VoucherTransfer = require('../models/VoucherTransfer');
            const transfer = await VoucherTransfer.findOne({
                transferId: req.params.transferId
            });

            if (!transfer) {
                return res.status(404).json({ error: 'Transfer not found' });
            }

            // Check permissions
            if (req.user.role !== 'admin') {
                const Voucher = require('../models/Voucher');
                const voucher = await Voucher.findOne({ voucherId: transfer.voucherId });
                
                if (!voucher || voucher.merchantId !== req.user.merchantId) {
                    return res.status(403).json({ 
                        error: 'Only admin or issuing merchant can reject transfers' 
                    });
                }
            }

            const updatedTransfer = await transferValidator.rejectTransfer(
                req.params.transferId,
                req.user._id,
                req.body.reason
            );

            res.json({
                message: 'Transfer rejected successfully',
                transfer: updatedTransfer
            });
        } catch (error) {
            logger.error('Error rejecting transfer:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Get transfer history for a voucher
router.get('/voucher/:voucherId/history',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const history = await transferValidator.getTransferHistory(req.params.voucherId);
            res.json({ history });
        } catch (error) {
            logger.error('Error fetching transfer history:', error);
            res.status(500).json({ error: 'Failed to fetch transfer history' });
        }
    }
);

// Get pending approvals (Admin and Merchant)
router.get('/pending/approvals',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const VoucherTransfer = require('../models/VoucherTransfer');
            let filter = { 
                status: 'pending',
                requiresApproval: true
            };

            // Merchants can only see pending transfers for their vouchers
            if (req.user.role !== 'admin') {
                const Voucher = require('../models/Voucher');
                const merchantVouchers = await Voucher.find({ 
                    merchantId: req.user.merchantId 
                }).select('voucherId');
                
                const voucherIds = merchantVouchers.map(v => v.voucherId);
                filter.voucherId = { $in: voucherIds };
            }

            const pendingTransfers = await VoucherTransfer.find(filter)
                .sort({ createdAt: -1 });

            res.json({ pendingTransfers });
        } catch (error) {
            logger.error('Error fetching pending approvals:', error);
            res.status(500).json({ error: 'Failed to fetch pending approvals' });
        }
    }
);

// Get transfer statistics (Admin only)
router.get('/analytics/stats',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const VoucherTransfer = require('../models/VoucherTransfer');
            
            const [pending, approved, rejected, completed, failed, total] = await Promise.all([
                VoucherTransfer.countDocuments({ status: 'pending' }),
                VoucherTransfer.countDocuments({ status: 'approved' }),
                VoucherTransfer.countDocuments({ status: 'rejected' }),
                VoucherTransfer.countDocuments({ status: 'completed' }),
                VoucherTransfer.countDocuments({ status: 'failed' }),
                VoucherTransfer.countDocuments()
            ]);

            const [fullTransfers, partialTransfers] = await Promise.all([
                VoucherTransfer.countDocuments({ transferType: 'full' }),
                VoucherTransfer.countDocuments({ transferType: 'partial' })
            ]);

            res.json({
                stats: {
                    pending,
                    approved,
                    rejected,
                    completed,
                    failed,
                    total,
                    byType: {
                        full: fullTransfers,
                        partial: partialTransfers
                    }
                }
            });
        } catch (error) {
            logger.error('Error fetching transfer stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }
);

module.exports = router;
