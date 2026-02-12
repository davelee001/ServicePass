const mongoose = require('mongoose');

const batchOperationSchema = new mongoose.Schema({
    batchId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    operationType: {
        type: String,
        required: true,
        enum: ['bulk_mint_vouchers', 'batch_register_merchants', 'import_recipients', 'bulk_notifications']
    },
    status: {
        type: String,
        required: true,
        enum: ['queued', 'processing', 'completed', 'failed', 'cancelled', 'paused'],
        default: 'queued'
    },
    initiatedBy: {
        type: String,
        required: true
    },
    totalRecords: {
        type: Number,
        required: true
    },
    processedRecords: {
        type: Number,
        default: 0
    },
    successfulRecords: {
        type: Number,
        default: 0
    },
    failedRecords: {
        type: Number,
        default: 0
    },
    batchSize: {
        type: Number,
        default: 50
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    estimatedCompletion: {
        type: Date
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    parameters: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    results: [{
        recordIndex: Number,
        status: {
            type: String,
            enum: ['success', 'failed', 'pending']
        },
        data: mongoose.Schema.Types.Mixed,
        error: String,
        processedAt: {
            type: Date,
            default: Date.now
        }
    }],
    errors: [{
        recordIndex: Number,
        error: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    metadata: {
        resumeToken: String,
        pausedAt: Date,
        resumedAt: Date,
        retryCount: {
            type: Number,
            default: 0
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for completion percentage
batchOperationSchema.virtual('completionPercentage').get(function() {
    return this.totalRecords > 0 ? Math.round((this.processedRecords / this.totalRecords) * 100) : 0;
});

// Virtual for estimated time remaining
batchOperationSchema.virtual('estimatedTimeRemaining').get(function() {
    if (!this.startTime || this.processedRecords === 0) return null;
    
    const elapsed = Date.now() - this.startTime;
    const rate = this.processedRecords / elapsed;
    const remaining = this.totalRecords - this.processedRecords;
    
    return remaining > 0 ? remaining / rate : 0;
});

// Virtual for success rate
batchOperationSchema.virtual('successRate').get(function() {
    return this.processedRecords > 0 ? Math.round((this.successfulRecords / this.processedRecords) * 100) : 0;
});

// Indexes for efficient queries
batchOperationSchema.index({ status: 1, createdAt: -1 });
batchOperationSchema.index({ initiatedBy: 1, createdAt: -1 });
batchOperationSchema.index({ operationType: 1, status: 1 });

module.exports = mongoose.model('BatchOperation', batchOperationSchema);