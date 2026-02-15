const mongoose = require('mongoose');

const multiSigOperationSchema = new mongoose.Schema({
    operationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    operationType: {
        type: String,
        required: true,
        enum: [
            'mint_large_batch',
            'register_merchant',
            'revoke_merchant',
            'update_system_config',
            'emergency_pause',
            'emergency_unpause',
            'bulk_transfer',
            'delete_vouchers'
        ],
        index: true
    },
    operationData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    requiredSignatures: {
        type: Number,
        required: true,
        min: 2,
        default: 2
    },
    signatures: [{
        adminId: {
            type: String,
            required: true
        },
        adminEmail: String,
        signedAt: {
            type: Date,
            default: Date.now
        },
        signature: String,
        ipAddress: String
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'executed', 'rejected', 'expired'],
        default: 'pending',
        index: true
    },
    createdBy: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    executedAt: {
        type: Date
    },
    executedBy: {
        type: String
    },
    result: {
        success: Boolean,
        data: mongoose.Schema.Types.Mixed,
        error: String
    },
    notes: {
        type: String
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
multiSigOperationSchema.index({ status: 1, expiresAt: 1 });
multiSigOperationSchema.index({ createdBy: 1, status: 1 });
multiSigOperationSchema.index({ operationType: 1, status: 1 });

// Virtual to check if approved
multiSigOperationSchema.virtual('isApproved').get(function() {
    return this.signatures.length >= this.requiredSignatures;
});

// Virtual to check if expired
multiSigOperationSchema.virtual('isExpired').get(function() {
    return new Date() > this.expiresAt && this.status === 'pending';
});

// Method to add signature
multiSigOperationSchema.methods.addSignature = async function(adminId, adminEmail, ipAddress) {
    // Check if admin already signed
    const existingSignature = this.signatures.find(s => s.adminId === adminId);
    if (existingSignature) {
        throw new Error('Admin has already signed this operation');
    }

    // Check if operation is still pending
    if (this.status !== 'pending') {
        throw new Error('Operation is no longer pending');
    }

    // Check if expired
    if (new Date() > this.expiresAt) {
        this.status = 'expired';
        await this.save();
        throw new Error('Operation has expired');
    }

    // Add signature
    this.signatures.push({
        adminId,
        adminEmail,
        signedAt: new Date(),
        ipAddress
    });

    // Check if we have enough signatures
    if (this.signatures.length >= this.requiredSignatures) {
        this.status = 'approved';
    }

    return this.save();
};

// Method to reject operation
multiSigOperationSchema.methods.reject = async function(adminId, reason) {
    if (this.status !== 'pending') {
        throw new Error('Operation is no longer pending');
    }

    this.status = 'rejected';
    this.notes = `Rejected by ${adminId}: ${reason}`;
    return this.save();
};

// Method to execute operation
multiSigOperationSchema.methods.execute = async function(executedBy, result) {
    if (this.status !== 'approved') {
        throw new Error('Operation must be approved before execution');
    }

    this.status = 'executed';
    this.executedAt = new Date();
    this.executedBy = executedBy;
    this.result = result;
    return this.save();
};

// Static method to find pending operations
multiSigOperationSchema.statics.findPending = function(filter = {}) {
    return this.find({
        ...filter,
        status: 'pending',
        expiresAt: { $gt: new Date() }
    }).sort({ priority: -1, createdAt: 1 });
};

// Static method to find approved operations
multiSigOperationSchema.statics.findApproved = function(filter = {}) {
    return this.find({ ...filter, status: 'approved' });
};

// Static method to expire old operations
multiSigOperationSchema.statics.expireOldOperations = async function() {
    const result = await this.updateMany(
        {
            status: 'pending',
            expiresAt: { $lt: new Date() }
        },
        { status: 'expired' }
    );
    return result.modifiedCount;
};

module.exports = mongoose.model('MultiSigOperation', multiSigOperationSchema);
