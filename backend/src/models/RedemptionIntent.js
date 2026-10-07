const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    intentId: { type: String, required: true, unique: true },
    transactionBytes: { type: String, required: true }, digest: { type: String, required: true },
    owner: { type: String, required: true }, voucherId: { type: String, required: true },
    merchantObjectId: { type: String, required: true }, merchantId: { type: String, required: true },
    voucherType: Number, amount: Number, expiresAt: { type: Date, required: true },
}, { timestamps: true });
// Keep signed submission recovery available for a day after the signing window.
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
module.exports = mongoose.model('RedemptionIntent', schema);
