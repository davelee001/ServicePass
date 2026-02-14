const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        enabled: { type: Boolean, default: true },
        voucherReceived: { type: Boolean, default: true },
        voucherExpiring: { type: Boolean, default: true },
        redemptionConfirmation: { type: Boolean, default: true }
    },
    sms: {
        enabled: { type: Boolean, default: false },
        phoneNumber: { type: String },
        voucherReceived: { type: Boolean, default: false },
        voucherExpiring: { type: Boolean, default: true },
        redemptionConfirmation: { type: Boolean, default: true }
    },
    push: {
        enabled: { type: Boolean, default: true },
        tokens: [{ 
            token: String,
            deviceInfo: String,
            addedAt: { type: Date, default: Date.now }
        }],
        voucherReceived: { type: Boolean, default: true },
        voucherExpiring: { type: Boolean, default: true },
        redemptionConfirmation: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationPreferencesSchema.index({ userId: 1 });

module.exports = mongoose.model('NotificationPreferences', notificationPreferencesSchema);