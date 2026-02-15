const mongoose = require('mongoose');

const voucherTransferSchema = new mongoose.Schema({
    transferId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    voucherId: {
        type: String,
        required: true,
        index: true
    },
    fromAddress: {
        type: String,
        required: true,
        index: true
    },
    toAddress: {
        type: String,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    transferType: {
        type: String,
        enum: ['full', 'partial'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'completed', 'rejected', 'failed'],
        default: 'pending',
        index: true
    },
    requiresApproval: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: String
    },
    approvedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    transactionHash: {
        type: String
    },
    rejectionReason: {
        type: String
    },
    metadata: {
        reason: String,
        notes: String,
        customData: mongoose.Schema.Types.Mixed
    },
    transferCount: {
        type: Number,
        default: 1,
        index: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
voucherTransferSchema.index({ voucherId: 1, status: 1 });
voucherTransferSchema.index({ fromAddress: 1, status: 1 });
voucherTransferSchema.index({ toAddress: 1, status: 1 });
voucherTransferSchema.index({ status: 1, createdAt: -1 });

// Method to approve transfer
voucherTransferSchema.methods.approve = async function(approvedBy) {
    if (this.status !== 'pending') {
        throw new Error('Transfer is not in pending status');
    }

    this.status = 'approved';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    return this.save();
};

// Method to reject transfer
voucherTransferSchema.methods.reject = async function(reason) {
    if (this.status !== 'pending') {
        throw new Error('Transfer is not in pending status');
    }

    this.status = 'rejected';
    this.rejectionReason = reason;
    return this.save();
};

// Method to mark as completed
voucherTransferSchema.methods.complete = async function(transactionHash) {
    if (this.status !== 'approved' && this.status !== 'pending') {
        throw new Error('Transfer must be approved or pending to complete');
    }

    this.status = 'completed';
    this.completedAt = new Date();
    this.transactionHash = transactionHash;
    return this.save();
};

// Method to mark as failed
voucherTransferSchema.methods.fail = async function(error) {
    this.status = 'failed';
    this.rejectionReason = error.message;
    return this.save();
};

// Static method to find pending transfers
voucherTransferSchema.statics.findPending = function(filter = {}) {
    return this.find({ ...filter, status: 'pending' });
};

// Static method to get transfer history for voucher
voucherTransferSchema.statics.getVoucherHistory = function(voucherId) {
    return this.find({ voucherId }).sort({ createdAt: -1 });
};

// Static method to get transfer count for voucher
voucherTransferSchema.statics.getTransferCount = async function(voucherId) {
    const count = await this.countDocuments({
        voucherId,
        status: 'completed'
    });
    return count;
};

module.exports = mongoose.model('VoucherTransfer', voucherTransferSchema);
