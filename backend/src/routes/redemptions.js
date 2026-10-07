const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const { logger } = require('../utils/logger');
const { verifyToken, verifyApiKey, adminOrMerchant } = require('../middleware/auth');
const { redemptionLimiter, readLimiter, apiKeyLimiter } = require('../middleware/rateLimiter');
const { Transaction } = require('@mysten/sui/transactions');
const { SUI_CLOCK_OBJECT_ID } = require('@mysten/sui/utils');
const { suiClient, getAdminKeypair, PACKAGE_ID, ADMIN_CAP_ID, REGISTRY_ID } = require('../config/sui');
const { executeTransactionWithRetry } = require('../utils/blockchainRetry');
const { parseCSV } = require('../utils/csvParser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const notificationManager = require('../utils/notificationManager');

// Merchant prepares; voucher owner signs; only confirmed chain effects are recorded.
router.use(require('./qrRedemptions').defaultRouter());

// Partial redemption of voucher
router.post('/redeem-partial',
    verifyApiKey,
    redemptionLimiter,
    [
        body('voucherId').isString().notEmpty().withMessage('Voucher ID is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
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

        const { voucherId, amount } = req.body;
        const merchantId = req.merchant.merchantId;

        const Voucher = require('../models/Voucher');
        const voucher = await Voucher.findOne({ voucherId });

        if (!voucher) {
            return res.status(404).json({
                error: 'Voucher not found',
                message: 'The specified voucher does not exist.'
            });
        }

        // Check if voucher allows partial redemption
        if (!voucher.allowPartialRedemption) {
            return res.status(400).json({
                error: 'Partial redemption not allowed',
                message: 'This voucher must be redeemed in full.'
            });
        }

        // Check if voucher is fully redeemed
        if (voucher.status === 'redeemed') {
            return res.status(400).json({
                error: 'Voucher fully redeemed',
                message: 'This voucher has been completely used.',
                remainingAmount: 0
            });
        }

        // Check if merchant matches
        if (voucher.merchantId !== merchantId) {
            return res.status(403).json({
                error: 'Voucher not valid for this merchant',
                message: 'This voucher can only be redeemed at the designated merchant.'
            });
        }

        // Validate redemption amount
        if (amount > voucher.remainingAmount) {
            return res.status(400).json({
                error: 'Insufficient voucher balance',
                message: `Only ${voucher.remainingAmount} remaining on this voucher.`,
                remainingAmount: voucher.remainingAmount
            });
        }

        // Process partial redemption
        await voucher.redeemPartially(amount, merchantId);

        // Create partial redemption record
        const redemption = new Redemption({
            voucherObjectId: voucherId,
            transactionDigest: `partial-${Date.now()}`, // Placeholder
            merchantId,
            voucherType: voucher.voucherType,
            amount: amount,
            redeemedBy: voucher.recipient,
            metadata: JSON.stringify({ partial: true, remainingAmount: voucher.remainingAmount })
        });
        await redemption.save();

        // Update merchant stats
        await Merchant.findOneAndUpdate(
            { merchantId },
            { $inc: { totalRedemptions: 1 } }
        );

        // Send notification
        try {
            await notificationManager.sendNotification(voucher.recipient, 'partial_redemption', {
                voucherId: voucherId,
                redeemedAmount: amount,
                remainingAmount: voucher.remainingAmount,
                merchantName: merchantId,
                redemptionDate: new Date().toLocaleDateString()
            });
        } catch (notificationError) {
            logger.error('Failed to send partial redemption notification:', notificationError);
        }

        logger.info(`Partial redemption: ${voucherId}`, {
            merchantId,
            amount,
            remainingAmount: voucher.remainingAmount
        });

        res.json({
            success: true,
            message: 'Partial redemption successful',
            redeemedAmount: amount,
            remainingAmount: voucher.remainingAmount,
            fullyRedeemed: voucher.status === 'redeemed'
        });

    } catch (error) {
        logger.error(`Partial redemption error: ${error.message}`, {
            stack: error.stack,
            merchantId: req.merchant?.merchantId
        });

        res.status(500).json({
            error: 'Partial redemption failed',
            message: error.message || 'An error occurred during partial redemption.'
        });
    }
});

// Record a redemption (webhook from blockchain event listener or merchant API)
router.post('/',
    redemptionLimiter,
    [
        body('voucherObjectId').isString().trim().notEmpty().withMessage('Voucher object ID is required'),
        body('transactionDigest').isString().trim().notEmpty().withMessage('Transaction digest is required'),
        body('merchantId').isString().trim().notEmpty().withMessage('Merchant ID is required'),
        body('voucherType').isString().trim().notEmpty().withMessage('Voucher type is required'),
        body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
        body('redeemedBy').isString().trim().notEmpty().withMessage('Redeemed by address is required'),
        body('metadata').optional().isString(),
    ],
    async (req, res) => {
    // Accept either API key or admin token
    const hasApiKey = req.headers['x-api-key'];
    const hasToken = req.headers.authorization;

    if (!hasApiKey && !hasToken) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please provide API key or authentication token'
        });
    }

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array().map(e => ({ field: e.path, message: e.msg }))
            });
        }

        const { voucherObjectId, transactionDigest, merchantId, voucherType, amount, redeemedBy, metadata } = req.body;

        // Create redemption record
        const redemption = new Redemption({
            voucherObjectId,
            transactionDigest,
            merchantId,
            voucherType,
            amount,
            redeemedBy,
            metadata,
        });

        await redemption.save();

        // Update merchant stats
        await Merchant.findOneAndUpdate(
            { merchantId },
            { $inc: { totalRedemptions: 1 } }
        );

        logger.info(`Redemption recorded: ${transactionDigest}`, { merchantId, voucherObjectId });

        res.status(201).json({ 
            success: true, 
            redemption,
            message: 'Redemption recorded successfully'
        });
    } catch (error) {
        logger.error(`Error recording redemption: ${error.message}`, { stack: error.stack });
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Invalid data',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to record redemption'
        });
    }
});

// Get redemptions for a merchant
router.get('/merchant/:merchantId', 
    verifyToken, 
    adminOrMerchant, 
    readLimiter,
    [
        param('merchantId').isString().trim().notEmpty().withMessage('Merchant ID is required'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
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

        const { merchantId } = req.params;
        const { startDate, endDate } = req.query;

        const query = { merchantId };
        if (startDate || endDate) {
            query.redeemedAt = {};
            if (startDate) query.redeemedAt.$gte = new Date(startDate);
            if (endDate) query.redeemedAt.$lte = new Date(endDate);
        }

        const redemptions = await Redemption.find(query).sort({ redeemedAt: -1 });
        
        res.json({ 
            merchantId, 
            count: redemptions.length,
            redemptions,
            filters: { startDate, endDate }
        });
    } catch (error) {
        logger.error(`Error fetching redemptions: ${error.message}`, { merchantId: req.params.merchantId });
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to fetch redemptions'
        });
    }
});

// Get redemptions by user wallet
router.get('/user/:walletAddress', 
    verifyToken, 
    readLimiter,
    [
        param('walletAddress').isString().trim().notEmpty().withMessage('Wallet address is required'),
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

        const { walletAddress } = req.params;
        
        const redemptions = await Redemption.find({ redeemedBy: walletAddress })
            .sort({ redeemedAt: -1 });
        
        res.json({ 
            walletAddress, 
            count: redemptions.length,
            redemptions 
        });
    } catch (error) {
        logger.error(`Error fetching user redemptions: ${error.message}`, { walletAddress: req.params.walletAddress });
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to fetch user redemptions'
        });
    }
});

// Import recipients via CSV
router.post('/import-recipients', 
    verifyToken, 
    adminOrMerchant, 
    upload.single('file'), 
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'CSV file is required' });
            }

            const recipients = await parseCSV(req.file.path);

            // Process recipients (example: create vouchers for each recipient)
            const adminKeypair = getAdminKeypair();
            const tx = new Transaction();

            recipients.forEach(({ voucherType, amount, recipient, merchantId, expiryTimestamp, metadata }) => {
                tx.moveCall({
                    target: `${PACKAGE_ID}::voucher_system::mint_voucher`,
                    arguments: [
                        tx.object(ADMIN_CAP_ID),
                        tx.object(REGISTRY_ID),
                        tx.pure.u8(Number(voucherType)),
                        tx.pure.u64(amount),
                        tx.pure.address(recipient),
                        tx.pure.vector('u8', Array.from(Buffer.from(merchantId))),
                        tx.pure.u64(expiryTimestamp ?? 0),
                        tx.pure.vector('u8', Array.from(Buffer.from(metadata || ''))),
                    ],
                });
            });

            const result = await executeTransactionWithRetry(suiClient, {
                signer: adminKeypair,
                transaction: tx,
                options: {
                    showObjectChanges: true,
                }
            });

            res.status(200).json({
                message: 'Recipients imported and vouchers created successfully',
                createdVouchers: result.objectChanges.filter(
                    (change) => change.type === 'created' && change.objectType.endsWith('::voucher_system::Voucher')
                ),
            });
        } catch (error) {
            logger.error('Error during CSV import:', error);
            res.status(500).json({ error: 'CSV import failed', details: error.message });
        }
    }
);

module.exports = router;
