const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
    voucherObjectId: {
        type: String,
        required: true,
    },
    transactionDigest: {
        type: String,
        required: true,
        unique: true,
    },
    merchantId: {
        type: String,
        required: true,
        ref: 'Merchant',
    },
    voucherType: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4],
    },
    amount: {
        type: Number,
        required: true,
    },
    redeemedBy: {
        type: String, // wallet address
        required: true,
    },
    redeemedAt: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        type: Map,
        of: String,
    },
}, {
    timestamps: true,
});

redemptionSchema.index({ merchantId: 1, redeemedAt: -1 });
redemptionSchema.index({ redeemedBy: 1, redeemedAt: -1 });

module.exports = mongoose.model('Redemption', redemptionSchema);
