
const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    voucherId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    voucherType: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    recipient: {
        type: String,
        required: true,
    },
    merchantId: {
        type: String,
        required: true,
    },
    expiryTimestamp: {
        type: Number,
    },
    qrCodeData: {
        type: String, // Will store the base64 encoded QR code image
    },
    signature: {
        type: String, // Will store the signature of the voucher data
    },
    transactionDigest: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Indexes to optimize common query patterns
voucherSchema.index({ recipient: 1, createdAt: -1 });
voucherSchema.index({ merchantId: 1, createdAt: -1 });
voucherSchema.index({ voucherType: 1, createdAt: -1 });
voucherSchema.index({ transactionDigest: 1 }, { unique: true });

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;
