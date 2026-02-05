const express = require('express');
const router = express.Router();
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { suiClient, getAdminKeypair, PACKAGE_ID, ADMIN_CAP_ID, REGISTRY_ID } = require('../config/sui');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly, optionalAuth } = require('../middleware/auth');
const { writeLimiter, readLimiter } = require('../middleware/rateLimiter');
const Voucher = require('../models/Voucher');
const qrcode = require('qrcode');
const crypto = require('crypto');

const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || 'default-secret';

// Mint a new voucher
router.post('/mint', verifyToken, adminOnly, writeLimiter, async (req, res) => {
    try {
        const { 
            voucherType, 
            amount, 
            recipient, 
            merchantId, 
            expiryTimestamp, 
            metadata 
        } = req.body;

        // Validate input
        if (!voucherType || !amount || !recipient) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

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

        const result = await suiClient.signAndExecuteTransactionBlock({
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
            throw new Error('Voucher object not found in transaction result');
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
        logger.error(`Error minting voucher: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get vouchers owned by an address
router.get('/owner/:address', optionalAuth, readLimiter, async (req, res) => {
    try {
        const { address } = req.params;

        const ownedObjects = await suiClient.getOwnedObjects({
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
        logger.error(`Error fetching vouchers: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get QR code for a voucher
router.get('/:voucherId/qrcode', verifyToken, readLimiter, async (req, res) => {
    try {
        const { voucherId } = req.params;
        const voucher = await Voucher.findOne({ voucherId });

        if (!voucher) {
            return res.status(404).json({ error: 'Voucher not found' });
        }

        // Optional: Check if the requester owns the voucher
        // This would require getting the user's address from the token
        // and comparing it to the voucher's recipient field.

        res.json({
            voucherId,
            qrCodeData: voucher.qrCodeData,
        });

    } catch (error) {
        logger.error(`Error fetching QR code: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch QR code' });
    }
});

module.exports = router;
