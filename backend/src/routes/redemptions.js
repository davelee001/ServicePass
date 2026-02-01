const express = require('express');
const router = express.Router();
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const { logger } = require('../utils/logger');
const { verifyToken, verifyApiKey, adminOrMerchant } = require('../middleware/auth');
const { redemptionLimiter, readLimiter, apiKeyLimiter } = require('../middleware/rateLimiter');

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
