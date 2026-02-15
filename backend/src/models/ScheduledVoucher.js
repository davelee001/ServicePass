const mongoose = require('mongoose');

const scheduledVoucherSchema = new mongoose.Schema({
    scheduleId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    scheduledFor: {
        type: Date,
        required: true,
        index: true
    },
    voucherType: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4]
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    recipient: {
        type: String,
        required: true,
        index: true
    },
    merchantId: {
        type: String,
        required: true,
        index: true
    },
    expiryTimestamp: {
        type: Number,
        required: true
    },
    metadata: {
        type: String,
        default: ''
    },
    templateId: {
        type: String,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    createdBy: {
        type: String,
        required: true
    },
    processedAt: {
        type: Date
    },
    voucherId: {
        type: String // Set when voucher is minted
    },
    error: {
        message: String,
        code: String,
        timestamp: Date
    },
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 3
    },
    notifyRecipient: {
        type: Boolean,
        default: true
    },
    recurringSchedule: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        endDate: Date,
        nextScheduledDate: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
scheduledVoucherSchema.index({ scheduledFor: 1, status: 1 });
scheduledVoucherSchema.index({ createdBy: 1, status: 1 });
scheduledVoucherSchema.index({ status: 1, scheduledFor: 1 });

// Virtual to check if ready to process
scheduledVoucherSchema.virtual('isReady').get(function() {
    return this.status === 'pending' && new Date() >= this.scheduledFor;
});

// Method to mark as processing
scheduledVoucherSchema.methods.markProcessing = async function() {
    this.status = 'processing';
    return this.save();
};

// Method to mark as completed
scheduledVoucherSchema.methods.markCompleted = async function(voucherId) {
    this.status = 'completed';
    this.voucherId = voucherId;
    this.processedAt = new Date();
    return this.save();
};

// Method to mark as failed
scheduledVoucherSchema.methods.markFailed = async function(error) {
    this.status = 'failed';
    this.error = {
        message: error.message,
        code: error.code || 'UNKNOWN',
        timestamp: new Date()
    };
    this.retryCount += 1;
    this.processedAt = new Date();
    return this.save();
};

// Method to cancel schedule
scheduledVoucherSchema.methods.cancel = async function() {
    this.status = 'cancelled';
    return this.save();
};

// Static method to find ready schedules
scheduledVoucherSchema.statics.findReady = function() {
    return this.find({
        status: 'pending',
        scheduledFor: { $lte: new Date() }
    }).sort({ scheduledFor: 1 });
};

// Static method to find pending schedules
scheduledVoucherSchema.statics.findPending = function(filter = {}) {
    return this.find({ ...filter, status: 'pending' });
};

module.exports = mongoose.model('ScheduledVoucher', scheduledVoucherSchema);
