const express = require('express');
const router = express.Router();
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { suiClient, getAdminKeypair, PACKAGE_ID, ADMIN_CAP_ID, REGISTRY_ID } = require('../config/sui');
const { logger } = require('../utils/logger');

// Mint a new voucher
router.post('/mint', async (req, res) => {
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
        });

        logger.info(`Voucher minted: ${result.digest}`);

        res.json({
            success: true,
            transactionDigest: result.digest,
            voucherType,
            amount,
            recipient,
        });
    } catch (error) {
        logger.error(`Error minting voucher: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get vouchers owned by an address
router.get('/owner/:address', async (req, res) => {
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

module.exports = router;
