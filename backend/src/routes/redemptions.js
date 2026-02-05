const express = require('express');
const router = express.Router();
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const { logger } = require('../utils/logger');
const { verifyToken, verifyApiKey, adminOrMerchant } = require('../middleware/auth');
const { redemptionLimiter, readLimiter, apiKeyLimiter } = require('../middleware/rateLimiter');
const crypto = require('crypto');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { suiClient, getAdminKeypair, PACKAGE_ID, ADMIN_CAP_ID, REGISTRY_ID } = require('../config/sui');

const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || 'default-secret';

// Redeem voucher via QR code
router.post('/redeem-qr', verifyApiKey, redemptionLimiter, async (req, res) => {
    try {
        const { qrPayload } = req.body;
        const merchantId = req.merchant.merchantId; // From verifyApiKey middleware

        const { signature, ...payload } = JSON.parse(qrPayload);

        // 1. Verify signature
        const expectedSignature = crypto.createHmac('sha256', QR_SIGNING_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ error: 'Invalid QR code signature.' });
        }

        // 2. Check if voucher is valid for this merchant
        if (payload.merchantId !== merchantId) {
            return res.status(403).json({ error: 'Voucher not valid for this merchant.' });
        }

        // 3. Check for existing redemption
        const existingRedemption = await Redemption.findOne({ voucherObjectId: payload.voucherId });
        if (existingRedemption) {
            return res.status(400).json({ error: 'Voucher already redeemed.' });
        }

        // 4. Execute on-chain redemption
        const merchantKeypair = getAdminKeypair(); // Placeholder for merchant's keypair
        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${PACKAGE_ID}::voucher_system::redeem_voucher`,
            arguments: [
                tx.object(REGISTRY_ID),
                tx.object(payload.voucherId),
                tx.pure(Array.from(Buffer.from(merchantId))),
            ],
        });

        const result = await suiClient.signAndExecuteTransactionBlock({
            signer: merchantKeypair,
            transactionBlock: tx,
        });

        // 5. Create redemption record
        const redemption = new Redemption({
            voucherObjectId: payload.voucherId,
            transactionDigest: result.digest,
            merchantId,
            voucherType: payload.voucherType,
            amount: payload.amount,
            redeemedBy: payload.recipient,
        });
        await redemption.save();

        // 6. Update merchant stats
        await Merchant.findOneAndUpdate(
            { merchantId },
            { $inc: { totalRedemptions: 1 } }
        );

        logger.info(`Voucher redeemed via QR: ${payload.voucherId}`);
        res.json({ success: true, transactionDigest: result.digest });

    } catch (error) {
        logger.error(`QR Redemption Error: ${error.message}`);
        res.status(500).json({ error: 'Redemption failed' });
    }
});

// Record a redemption (webhook from blockchain event listener or merchant API)
router.post('/', redemptionLimiter, async (req, res) => {
    // Accept either API key or admin token
    const hasApiKey = req.headers['x-api-key'];
    const hasToken = req.headers.authorization;
    
    if (!hasApiKey && !hasToken) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
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

        logger.info(`Redemption recorded: ${transactionDigest}`);

        res.status(201).json({ success: true, redemption });
    } catch (error) {
        logger.error(`Error recording redemption: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get redemptions for a merchant
router.get('/merchant/:merchantId', verifyToken, adminOrMerchant, readLimiter, async (req, res) => {
    try {
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
            redemptions 
        });
    } catch (error) {
        logger.error(`Error fetching redemptions: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get redemptions by user wallet
router.get('/user/:walletAddress', verifyToken, readLimiter, async (req, res) => {
    try {
        const { walletAddress } = req.params;
        
        const redemptions = await Redemption.find({ redeemedBy: walletAddress })
            .sort({ redeemedAt: -1 });
        
        res.json({ 
            walletAddress, 
            count: redemptions.length,
            redemptions 
        });
    } catch (error) {
        logger.error(`Error fetching user redemptions: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
