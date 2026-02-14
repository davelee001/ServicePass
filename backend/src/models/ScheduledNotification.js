const mongoose = require('mongoose');

const scheduledNotificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['voucher_received', 'voucher_redeemed', 'voucher_expiring', 'bulk_operation_complete', 'system_alert']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    scheduleTime: {
        type: Date,
        required: true,
        index: true
    },
    options: {
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        attachments: [{
            filename: String,
            url: String,
            type: String
        }]
    },
    status: {
        type: String,
        enum: ['scheduled', 'sent', 'failed', 'cancelled'],
        default: 'scheduled',
        index: true
    },
    sentAt: {
        type: Date
    },
    error: {
        type: String
    },
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 3
    }
}, {
    timestamps: true
});

// Index for efficient querying of due notifications
scheduledNotificationSchema.index({ scheduleTime: 1, status: 1 });

// Auto-cleanup old notifications after 30 days
scheduledNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('ScheduledNotification', scheduledNotificationSchema);