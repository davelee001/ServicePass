const mongoose = require('mongoose');

const notificationHistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['voucher_received', 'voucher_expiring', 'redemption_confirmation', 'merchant_notification']
    },
    channel: {
        type: String,
        required: true,
        enum: ['email', 'sms', 'push']
    },
    status: {
        type: String,
        required: true,
        enum: ['sent', 'failed', 'pending'],
        default: 'pending'
    },
    recipient: {
        type: String,
        required: true // email address, phone number, or push token
    },
    subject: String,
    content: String,
    metadata: {
        voucherId: String,
        transactionId: String,
        merchantId: String,
        attempts: { type: Number, default: 1 },
        errorMessage: String
    },
    sentAt: Date,
    deliveredAt: Date
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationHistorySchema.index({ userId: 1, createdAt: -1 });
notificationHistorySchema.index({ type: 1, createdAt: -1 });
notificationHistorySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationHistory', notificationHistorySchema);