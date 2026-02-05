const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { suiClient, getAdminKeypair, PACKAGE_ID, ADMIN_CAP_ID, REGISTRY_ID } = require('../config/sui');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly, optionalAuth } = require('../middleware/auth');
const { writeLimiter, readLimiter } = require('../middleware/rateLimiter');
const Voucher = require('../models/Voucher');
const qrcode = require('qrcode');
const crypto = require('crypto');
const { executeTransactionWithRetry, queryObjectsWithRetry, BlockchainError } = require('../utils/blockchainRetry');

const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || 'default-secret';

// Mint a new voucher
router.post('/mint', 
    verifyToken, 
    adminOnly, 
    writeLimiter,
    [
        body('voucherType').isString().trim().notEmpty().withMessage('Voucher type is required'),
        body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
        body('recipient').isString().trim().notEmpty().matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid recipient address format'),
        body('merchantId').isString().trim().notEmpty().withMessage('Merchant ID is required'),
        body('expiryTimestamp').optional().isInt({ min: Date.now() }).withMessage('Expiry must be a future timestamp'),
        body('metadata').optional().isString().trim(),
    ],
    async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array().map(e => ({ field: e.path, message: e.msg }))
            });
        }

        const { 
            voucherType, 
            amount, 
            recipient, 
            merchantId, 
            expiryTimestamp, 
            metadata 
        } = req.body;

        const adminKeypair = getAdminKeypair();
        const tx = new TransactionBlock();

        // Call mint_voucher function
        tx.moveCall({
            target: `${PACKAGE_ID}::voucher_system::mint_voucher`,
            arguments: [
                tx.object(ADMIN_CAP_ID),
                tx.object(REGISTRY_ID),
                tx.pure(voucherType),
                tx.pure(amount),
                tx.pure(recipient),
                tx.pure(Array.from(Buffer.from(merchantId))),
                tx.pure(expiryTimestamp),
                tx.pure(Array.from(Buffer.from(metadata || ''))),
            ],
        });

        const result = await executeTransactionWithRetry(suiClient, {
            signer: adminKeypair,
            transactionBlock: tx,
            options: {
                showObjectChanges: true,
            }
        });

        logger.info(`Voucher minted: ${result.digest}`);

        // Find the created voucher object
        const createdObject = result.objectChanges.find(
            (change) => change.type === 'created' && change.objectType.endsWith('::voucher_system::Voucher')
        );

        if (!createdObject) {
            logger.error('Voucher object not found in transaction result', { digest: result.digest });
            return res.status(500).json({ 
                error: 'Voucher creation failed', 
                message: 'Voucher was not created on blockchain',
                transactionDigest: result.digest
            });
        }

        const voucherId = createdObject.objectId;

        // Create a payload to sign
        const payload = {
            voucherId,
            voucherType,
            amount,
            recipient,
            merchantId,
            expiryTimestamp,
        };

        // Sign the payload
        const signature = crypto.createHmac('sha256', QR_SIGNING_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');

        const qrPayload = { ...payload, signature };

        // Generate QR code
        const qrCodeData = await qrcode.toDataURL(JSON.stringify(qrPayload));

        // Save to database
        const newVoucher = new Voucher({
            voucherId,
            voucherType,
            amount,
            recipient,
            merchantId,
            expiryTimestamp,
            qrCodeData,
            signature,
            transactionDigest: result.digest,
        });

        await newVoucher.save();

        res.json({
            success: true,
            transactionDigest: result.digest,
            voucherId,
            qrCodeData,
        });
    } catch (error) {
        logger.error(`Error minting voucher: ${error.message}`, { 
            stack: error.stack,
            isBlockchainError: error.isBlockchainError 
        });
        
        if (error.isBlockchainError) {
            return res.status(503).json({ 
                error: 'Blockchain operation failed', 
                message: 'Unable to mint voucher on blockchain. Please try again later.',
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
            message: 'Failed to mint voucher. Please contact support if the issue persists.' 
        });
    }
});

// Get vouchers owned by an address
router.get('/owner/:address', 
    optionalAuth, 
    readLimiter,
    [
        param('address').isString().trim().matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid address format'),
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

        const { address } = req.params;

        const ownedObjects = await queryObjectsWithRetry(suiClient, {
            owner: address,
            filter: {
                StructType: `${PACKAGE_ID}::voucher_system::Voucher`,
            },
            options: {
                showContent: true,
                showType: true,
            },
        });

        res.json({
            address,
            vouchers: ownedObjects.data,
        });
    } catch (error) {
        logger.error(`Error fetching vouchers: ${error.message}`, { address: req.params.address });
        
        if (error.isBlockchainError) {
            return res.status(503).json({ 
                error: 'Blockchain query failed', 
                message: 'Unable to fetch vouchers from blockchain. Please try again later.',
                retryable: true
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            message: 'Failed to fetch vouchers' 
        });
    }
});

// Get QR code for a voucher
router.get('/:voucherId/qrcode', 
    verifyToken, 
    readLimiter,
    [
        param('voucherId').isString().trim().notEmpty().withMessage('Voucher ID is required'),
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

        const { voucherId } = req.params;
        const voucher = await Voucher.findOne({ voucherId });

        if (!voucher) {
            return res.status(404).json({ 
                error: 'Voucher not found',
                message: 'No voucher exists with the specified ID'
            });
        }

        // Optional: Check if the requester owns the voucher
        // This would require getting the user's address from the token
        // and comparing it to the voucher's recipient field.

        res.json({
            voucherId,
            qrCodeData: voucher.qrCodeData,
        });

    } catch (error) {
        logger.error(`Error fetching QR code: ${error.message}`, { voucherId: req.params.voucherId });
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to fetch QR code'
        });
    }
});

module.exports = router;
