const express = require('express');
const { createQrRedemptionService } = require('../services/qrRedemption');

function createQrRouter({ service, verifyApiKey, redemptionLimiter }) {
    const router = express.Router();
    const handle = action => async (req, res) => {
        try { const result = await action(req); res.json(result); }
        catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to process redemption' }); }
    };
    router.post('/redeem-qr', verifyApiKey, redemptionLimiter, handle(req => service.prepare(req.body.qrPayload, req.merchant)));
    router.get('/qr-intents/:intentId', redemptionLimiter, handle(req => service.getIntent(req.params.intentId)));
    router.post('/qr-intents/:intentId/submit', redemptionLimiter, handle(req => service.submit(req.params.intentId, req.body.transactionBytes, req.body.signature)));
    return router;
}
function defaultRouter() {
    const Intent = require('../models/RedemptionIntent');
    const Redemption = require('../models/Redemption');
    const Merchant = require('../models/Merchant');
    const { suiClient, PACKAGE_ID, REGISTRY_ID } = require('../config/sui');
    const { verifyApiKey } = require('../middleware/auth');
    const { redemptionLimiter } = require('../middleware/rateLimiter');
    const store = {
        findRedemption: voucherObjectId => Redemption.findOne({ voucherObjectId }).lean(),
        saveIntent: intent => Intent.create(intent), getIntent: intentId => Intent.findOne({ intentId }).lean(),
        async recordConfirmed(intent) {
            // Unique voucher/digest indexes make recording idempotent on standalone MongoDB too.
            await Redemption.updateOne({ voucherObjectId: intent.voucherId, transactionDigest: intent.digest },
                { $setOnInsert: { voucherObjectId: intent.voucherId, transactionDigest: intent.digest,
                    merchantId: intent.merchantId, voucherType: intent.voucherType, amount: intent.amount,
                    redeemedBy: intent.owner } }, { upsert: true, runValidators: true });
            const count = await Redemption.countDocuments({ merchantId: intent.merchantId });
            // Monotonic reconciliation is safe under concurrent retries; never increment twice.
            await Merchant.updateOne({ merchantId: intent.merchantId }, { $max: { totalRedemptions: count } });
        },
    };
    return createQrRouter({ service: createQrRedemptionService({ client: suiClient, store,
        packageId: PACKAGE_ID, registryId: REGISTRY_ID, secret: process.env.QR_SIGNING_SECRET || 'default-secret' }),
        verifyApiKey, redemptionLimiter });
}
module.exports = { createQrRouter, defaultRouter };
