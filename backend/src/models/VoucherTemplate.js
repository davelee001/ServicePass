const mongoose = require('mongoose');

const voucherTemplateSchema = new mongoose.Schema({
    templateId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    voucherType: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4], // 1=Education, 2=Healthcare, 3=Transport, 4=Agriculture
        index: true
    },
    defaultValue: {
        type: Number,
        required: true,
        min: 0
    },
    defaultExpiryDays: {
        type: Number,
        required: true,
        min: 1
    },
    merchantId: {
        type: String,
        index: true
    },
    allowPartialRedemption: {
        type: Boolean,
        default: false
    },
    transferRestrictions: {
        enabled: {
            type: Boolean,
            default: false
        },
        maxTransfers: {
            type: Number,
            default: -1 // -1 means unlimited
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        allowedRecipients: [{
            type: String // Wallet addresses
        }],
        restrictByRole: {
            type: Boolean,
            default: false
        },
        allowedRoles: [{
            type: String,
            enum: ['user', 'merchant', 'admin']
        }]
    },
    metadata: {
        category: String,
        tags: [String],
        customFields: mongoose.Schema.Types.Mixed
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdBy: {
        type: String,
        required: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
voucherTemplateSchema.index({ voucherType: 1, isActive: 1 });
voucherTemplateSchema.index({ createdBy: 1, isActive: 1 });
voucherTemplateSchema.index({ 'metadata.category': 1 });

// Virtual for template age
voucherTemplateSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to increment usage count
voucherTemplateSchema.methods.incrementUsage = async function() {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
    return this.save();
};

// Static method to find active templates
voucherTemplateSchema.statics.findActive = function(filter = {}) {
    return this.find({ ...filter, isActive: true });
};

// Static method to find by voucher type
voucherTemplateSchema.statics.findByType = function(voucherType) {
    return this.find({ voucherType, isActive: true });
};

module.exports = mongoose.model('VoucherTemplate', voucherTemplateSchema);
