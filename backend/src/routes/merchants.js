const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Merchant = require('../models/Merchant');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { suiClient, getAdminKeypair, PACKAGE_ID, ADMIN_CAP_ID } = require('../config/sui');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly, adminOrMerchant } = require('../middleware/auth');
const { writeLimiter, readLimiter } = require('../middleware/rateLimiter');
const { createApiKey, revokeApiKey, getApiKeyInfo } = require('../utils/apiKeyManager');
const { executeTransactionWithRetry } = require('../utils/blockchainRetry');

// Register a new merchant
router.post('/register', 
    verifyToken, 
    adminOnly, 
    writeLimiter,
    [
        body('merchantId').isString().trim().notEmpty().withMessage('Merchant ID is required'),
        body('name').isString().trim().notEmpty().withMessage('Merchant name is required'),
        body('walletAddress').isString().trim().matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid wallet address format'),
        body('voucherTypesAccepted').isArray({ min: 1 }).withMessage('At least one voucher type must be accepted'),
        body('contactEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('contactPhone').optional().isString().trim(),
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

        const { merchantId, name, walletAddress, voucherTypesAccepted, contactEmail, contactPhone } = req.body;

        // Check if merchant already exists
        const existingMerchant = await Merchant.findOne({ merchantId });
        if (existingMerchant) {
            return res.status(400).json({ 
                error: 'Merchant already exists',
                message: 'A merchant with this ID is already registered'
            });
        }

        // Register on-chain
        const adminKeypair = getAdminKeypair();
        const tx = new TransactionBlock();

        tx.moveCall({
            target: `${PACKAGE_ID}::voucher_system::register_merchant`,
            arguments: [
                tx.object(ADMIN_CAP_ID),
                tx.pure(Array.from(Buffer.from(merchantId))),
                tx.pure(Array.from(Buffer.from(name))),
                tx.pure(voucherTypesAccepted),
            ],
        });

        const result = await executeTransactionWithRetry(suiClient, {
            signer: adminKeypair,
            transactionBlock: tx,
        });

        // Save to database
        const merchant = new Merchant({
            merchantId,
            name,
            walletAddress,
            voucherTypesAccepted,
            contactEmail,
            contactPhone,
            onChainObjectId: result.digest, // Store transaction digest for reference
        });

        await merchant.save();

        logger.info(`Merchant registered: ${merchantId}`, { transactionDigest: result.digest });

        res.status(201).json({
            success: true,
            merchant,
            transactionDigest: result.digest,
            message: 'Merchant registered successfully'
        });
    } catch (error) {
        logger.error(`Error registering merchant: ${error.message}`, { 
            stack: error.stack,
            isBlockchainError: error.isBlockchainError
        });
        
        if (error.isBlockchainError) {
            return res.status(503).json({ 
                error: 'Blockchain operation failed',
                message: 'Unable to register merchant on blockchain. Please try again.',
                retryable: true
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Invalid data',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to register merchant'
        });
    }
});

// Get all merchants
router.get('/', readLimiter, async (req, res) => {
    try {
        const merchants = await Merchant.find({ isActive: true });
        res.json({ 
            merchants,
            count: merchants.length
        });
    } catch (error) {
        logger.error(`Error fetching merchants: ${error.message}`);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to fetch merchants'
        });
    }
});

// Get merchant by ID
router.get('/:merchantId', 
    verifyToken, 
    adminOrMerchant, 
    readLimiter,
    [
        param('merchantId').isString().trim().notEmpty().withMessage('Merchant ID is required'),
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

        const merchant = await Merchant.findOne({ merchantId: req.params.merchantId });
        if (!merchant) {
            return res.status(404).json({ 
                error: 'Merchant not found',
                message: 'No merchant exists with this ID'
            });
        }
        res.json({ merchant });
    } catch (error) {
        logger.error(`Error fetching merchant: ${error.message}`, { merchantId: req.params.merchantId });
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to fetch merchant'
        });
    }
});

// Generate API key for merchant
router.post('/:merchantId/api-key', 
    verifyToken, 
    adminOrMerchant, 
    writeLimiter,
    [
        param('merchantId').isString().trim().notEmpty().withMessage('Merchant ID is required'),
        body('expiryDays').optional().isInt({ min: 1, max: 365 }).withMessage('Expiry days must be between 1 and 365'),
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
        const { expiryDays } = req.body;

        // Check if user is admin or the merchant owner
        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ error: 'Merchant not found' });
        }

        if (req.userRole !== 'admin' && merchant.userId?.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const result = await createApiKey(merchant._id, expiryDays || 365);

        logger.info(`API key generated for merchant: ${merchantId}`);

        res.json({
            success: true,
            message: 'API key generated successfully. Store it securely - it will not be shown again.',
            apiKey: result.apiKey,
            expiryDate: result.expiryDate,
        });
    } catch (error) {
        logger.error(`Error generating API key: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get API key info (without revealing the key)
router.get('/:merchantId/api-key', verifyToken, adminOrMerchant, async (req, res) => {
    try {
        const { merchantId } = req.params;

        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ error: 'Merchant not found' });
        }

        if (req.userRole !== 'admin' && merchant.userId?.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const keyInfo = await getApiKeyInfo(merchant._id);

        res.json({
            success: true,
            ...keyInfo,
        });
    } catch (error) {
        logger.error(`Error getting API key info: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Revoke API key
router.delete('/:merchantId/api-key', verifyToken, adminOrMerchant, async (req, res) => {
    try {
        const { merchantId } = req.params;

        const merchant = await Merchant.findOne({ merchantId });
        if (!merchant) {
            return res.status(404).json({ error: 'Merchant not found' });
        }

        if (req.userRole !== 'admin' && merchant.userId?.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await revokeApiKey(merchant._id);

        logger.info(`API key revoked for merchant: ${merchantId}`);

        res.json({
            success: true,
            message: 'API key revoked successfully',
        });
    } catch (error) {
        logger.error(`Error revoking API key: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Batch register merchants
router.post('/batch-register', 
    verifyToken, 
    adminOnly, 
    writeLimiter,
    async (req, res) => {
        try {
            const { merchants } = req.body; // Expecting an array of merchant details

            if (!Array.isArray(merchants) || merchants.length === 0) {
                return res.status(400).json({ error: 'Merchants array is required and cannot be empty' });
            }

            const adminKeypair = getAdminKeypair();
            const tx = new TransactionBlock();

            for (const { merchantId, name, walletAddress, voucherTypesAccepted, contactEmail, contactPhone } of merchants) {
                // Check if merchant already exists
                const existingMerchant = await Merchant.findOne({ merchantId });
                if (existingMerchant) {
                    return res.status(400).json({ 
                        error: `Merchant with ID ${merchantId} already exists`,
                        message: 'A merchant with this ID is already registered'
                    });
                }

                tx.moveCall({
                    target: `${PACKAGE_ID}::voucher_system::register_merchant`,
                    arguments: [
                        tx.object(ADMIN_CAP_ID),
                        tx.pure(Array.from(Buffer.from(merchantId))),
                        tx.pure(Array.from(Buffer.from(name))),
                        tx.pure(voucherTypesAccepted),
                    ],
                });

                // Save to database
                const merchant = new Merchant({
                    merchantId,
                    name,
                    walletAddress,
                    voucherTypesAccepted,
                    contactEmail,
                    contactPhone,
                });

                await merchant.save();
            }

            const result = await executeTransactionWithRetry(suiClient, {
                signer: adminKeypair,
                transactionBlock: tx,
            });

            res.status(200).json({
                message: 'Batch merchants registered successfully',
                transactionDigest: result.digest,
            });
        } catch (error) {
            logger.error('Error during batch merchant registration:', error);
            res.status(500).json({ error: 'Batch registration failed', details: error.message });
        }
    }
);

module.exports = router;
