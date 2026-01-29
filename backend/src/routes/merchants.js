const express = require('express');
const router = express.Router();
const Merchant = require('../models/Merchant');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { suiClient, getAdminKeypair, PACKAGE_ID, ADMIN_CAP_ID } = require('../config/sui');
const { logger } = require('../utils/logger');

// Register a new merchant
router.post('/register', async (req, res) => {
    try {
        const { merchantId, name, walletAddress, voucherTypesAccepted, contactEmail, contactPhone } = req.body;

        // Check if merchant already exists
        const existingMerchant = await Merchant.findOne({ merchantId });
        if (existingMerchant) {
            return res.status(400).json({ error: 'Merchant ID already exists' });
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

        const result = await suiClient.signAndExecuteTransactionBlock({
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

        logger.info(`Merchant registered: ${merchantId}`);

        res.status(201).json({
            success: true,
            merchant,
            transactionDigest: result.digest,
        });
    } catch (error) {
        logger.error(`Error registering merchant: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get all merchants
router.get('/', async (req, res) => {
    try {
        const merchants = await Merchant.find({ isActive: true });
        res.json({ merchants });
    } catch (error) {
        logger.error(`Error fetching merchants: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get merchant by ID
router.get('/:merchantId', async (req, res) => {
    try {
        const merchant = await Merchant.findOne({ merchantId: req.params.merchantId });
        if (!merchant) {
            return res.status(404).json({ error: 'Merchant not found' });
        }
        res.json({ merchant });
    } catch (error) {
        logger.error(`Error fetching merchant: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
