
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
    originalAmount: {
        type: Number, // Original value when created
        required: true
    },
    remainingAmount: {
        type: Number, // Remaining value after partial redemptions
        required: true
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
    allowPartialRedemption: {
        type: Boolean,
        default: false
    },
    partialRedemptions: [{
        amount: Number,
        merchantId: String,
        redeemedAt: Date,
        transactionHash: String
    }],
    transferRestrictions: {
        maxTransfers: {
            type: Number,
            default: -1 // -1 means unlimited
        },
        transferCount: {
            type: Number,
            default: 0
        },
        requireApproval: {
            type: Boolean,
            default: false
        }
    },
    templateId: {
        type: String,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'partially_redeemed', 'fully_redeemed', 'expired', 'cancelled'],
        default: 'active',
        index: true
    }
}, { timestamps: true });

// Indexes to optimize common query patterns
voucherSchema.index({ recipient: 1, createdAt: -1 });
voucherSchema.index({ merchantId: 1, createdAt: -1 });
voucherSchema.index({ voucherType: 1, createdAt: -1 });
voucherSchema.index({ transactionDigest: 1 }, { unique: true });
voucherSchema.index({ status: 1, expiryTimestamp: 1 });
voucherSchema.index({ templateId: 1 });

// Virtual to check if voucher is expired
voucherSchema.virtual('isExpired').get(function() {
    return this.expiryTimestamp && Date.now() > this.expiryTimestamp * 1000;
});

// Virtual to check if partially redeemed
voucherSchema.virtual('isPartiallyRedeemed').get(function() {
    return this.remainingAmount < this.originalAmount && this.remainingAmount > 0;
});

// Method to record partial redemption
voucherSchema.methods.redeemPartially = async function(amount, merchantId, transactionHash) {
    if (!this.allowPartialRedemption) {
        throw new Error('Partial redemption not allowed for this voucher');
    }

    if (amount > this.remainingAmount) {
        throw new Error(`Insufficient balance. Remaining: ${this.remainingAmount}`);
    }

    if (amount <= 0) {
        throw new Error('Redemption amount must be positive');
    }

    this.partialRedemptions.push({
        amount,
        merchantId,
        redeemedAt: new Date(),
        transactionHash
    });

    this.remainingAmount -= amount;

    if (this.remainingAmount === 0) {
        this.status = 'fully_redeemed';
    } else {
        this.status = 'partially_redeemed';
    }

    return this.save();
};

// Method to check transfer restrictions
voucherSchema.methods.canTransfer = function() {
    const restrictions = this.transferRestrictions;
    
    if (restrictions.maxTransfers === -1) {
        return { allowed: true };
    }

    if (restrictions.transferCount >= restrictions.maxTransfers) {
        return {
            allowed: false,
            reason: `Maximum transfer limit (${restrictions.maxTransfers}) reached`
        };
    }

    return { allowed: true };
};

// Method to record transfer
voucherSchema.methods.recordTransfer = async function() {
    this.transferRestrictions.transferCount += 1;
    return this.save();
};

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;
