const mongoose = require('mongoose');

const archivedRedemptionSchema = new mongoose.Schema({
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
        type: String,
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

archivedRedemptionSchema.index({ merchantId: 1, redeemedAt: -1 });
archivedRedemptionSchema.index({ redeemedBy: 1, redeemedAt: -1 });
archivedRedemptionSchema.index({ voucherObjectId: 1 }, { unique: true });
archivedRedemptionSchema.index({ redeemedAt: 1 });

module.exports = mongoose.model('ArchivedRedemption', archivedRedemptionSchema);
