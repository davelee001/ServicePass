const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const multiSigManager = require('../utils/multiSigManager');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { writeLimiter, readLimiter } = require('../middleware/rateLimiter');

// Create multi-signature operation (Admin only)
router.post('/',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('operationType').isIn([
            'CREATE_VOUCHER_BATCH',
            'MODIFY_CRITICAL_SETTINGS',
            'DELETE_MULTIPLE_VOUCHERS',
            'CHANGE_MERCHANT_STATUS',
            'BULK_TRANSFER',
            'EMERGENCY_FREEZE',
            'SYSTEM_MAINTENANCE',
            'SECURITY_UPDATE'
        ]).withMessage('Invalid operation type'),
        body('operationData').isObject().withMessage('Operation data required'),
        body('requiredSignatures').optional().isInt({ min: 2, max: 10 }),
        body('expiresAt').optional().isISO8601()
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

            const operation = await multiSigManager.createOperation({
                operationType: req.body.operationType,
                operationData: req.body.operationData,
                initiatedBy: req.user._id,
                requiredSignatures: req.body.requiredSignatures,
                expiresAt: req.body.expiresAt
            });

            res.status(201).json({
                message: 'Multi-signature operation created successfully',
                operation
            });
        } catch (error) {
            logger.error('Error creating multi-sig operation:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Get pending operations (Admin only)
router.get('/pending',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const operations = await multiSigManager.getPendingOperations();
            res.json({ operations });
        } catch (error) {
            logger.error('Error fetching pending operations:', error);
            res.status(500).json({ error: 'Failed to fetch pending operations' });
        }
    }
);

// Get all operations (Admin only)
router.get('/',
    verifyToken,
    adminOnly,
    readLimiter,
    [
        query('status').optional().isIn(['pending', 'approved', 'rejected', 'executed', 'expired']),
        query('operationType').optional().isString()
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

            const MultiSigOperation = require('../models/MultiSigOperation');
            const filter = {};
            
            if (req.query.status) filter.status = req.query.status;
            if (req.query.operationType) filter.operationType = req.query.operationType;

            const operations = await MultiSigOperation.find(filter)
                .sort({ createdAt: -1 })
                .limit(100);

            res.json({ operations });
        } catch (error) {
            logger.error('Error fetching operations:', error);
            res.status(500).json({ error: 'Failed to fetch operations' });
        }
    }
);

// Get operation by ID (Admin only)
router.get('/:operationId',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const MultiSigOperation = require('../models/MultiSigOperation');
            const operation = await MultiSigOperation.findOne({
                operationId: req.params.operationId
            });

            if (!operation) {
                return res.status(404).json({ error: 'Operation not found' });
            }

            res.json({ operation });
        } catch (error) {
            logger.error('Error fetching operation:', error);
            res.status(500).json({ error: 'Failed to fetch operation' });
        }
    }
);

// Sign (approve) an operation (Admin only)
router.post('/:operationId/sign',
    verifyToken,
    adminOnly,
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

            const result = await multiSigManager.addSignature(
                req.params.operationId,
                req.user._id,
                req.body.comment
            );

            res.json(result);
        } catch (error) {
            logger.error('Error signing operation:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Reject an operation (Admin only)
router.post('/:operationId/reject',
    verifyToken,
    adminOnly,
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

            const operation = await multiSigManager.rejectOperation(
                req.params.operationId,
                req.user._id,
                req.body.reason
            );

            res.json({
                message: 'Operation rejected successfully',
                operation
            });
        } catch (error) {
            logger.error('Error rejecting operation:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Execute an operation (Admin only) - typically called automatically
router.post('/:operationId/execute',
    verifyToken,
    adminOnly,
    writeLimiter,
    async (req, res) => {
        try {
            const result = await multiSigManager.executeOperation(req.params.operationId);

            res.json({
                message: 'Operation executed successfully',
                result
            });
        } catch (error) {
            logger.error('Error executing operation:', error);
            res.status(400).json({ error: error.message });
        }
    }
);

// Expire old operations (Admin only)
router.post('/maintenance/expire',
    verifyToken,
    adminOnly,
    writeLimiter,
    async (req, res) => {
        try {
            const count = await multiSigManager.expireOldOperations();

            res.json({
                message: `${count} operations expired successfully`,
                expiredCount: count
            });
        } catch (error) {
            logger.error('Error expiring operations:', error);
            res.status(500).json({ error: 'Failed to expire operations' });
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
            const MultiSigOperation = require('../models/MultiSigOperation');
            
            const [pending, approved, rejected, executed, expired, total] = await Promise.all([
                MultiSigOperation.countDocuments({ status: 'pending' }),
                MultiSigOperation.countDocuments({ status: 'approved' }),
                MultiSigOperation.countDocuments({ status: 'rejected' }),
                MultiSigOperation.countDocuments({ status: 'executed' }),
                MultiSigOperation.countDocuments({ status: 'expired' }),
                MultiSigOperation.countDocuments()
            ]);

            // Get average time to approval
            const completedOps = await MultiSigOperation.find({
                status: { $in: ['approved', 'executed'] }
            }).select('createdAt approvedAt');

            let avgApprovalTime = 0;
            if (completedOps.length > 0) {
                const totalTime = completedOps.reduce((sum, op) => {
                    if (op.approvedAt) {
                        return sum + (op.approvedAt - op.createdAt);
                    }
                    return sum;
                }, 0);
                avgApprovalTime = Math.round(totalTime / completedOps.length / 1000 / 60); // minutes
            }

            res.json({
                stats: {
                    pending,
                    approved,
                    rejected,
                    executed,
                    expired,
                    total,
                    avgApprovalTimeMinutes: avgApprovalTime
                }
            });
        } catch (error) {
            logger.error('Error fetching stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }
);

// Get signature history for user (Admin only)
router.get('/user/:userId/history',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const MultiSigOperation = require('../models/MultiSigOperation');
            
            const operations = await MultiSigOperation.find({
                'signatures.signedBy': req.params.userId
            }).sort({ createdAt: -1 }).limit(50);

            res.json({ operations });
        } catch (error) {
            logger.error('Error fetching user signature history:', error);
            res.status(500).json({ error: 'Failed to fetch signature history' });
        }
    }
);

module.exports = router;
