const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
    merchantId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
    walletAddress: {
        type: String,
        required: true,
    },
    voucherTypesAccepted: [{
        type: Number,
        enum: [1, 2, 3, 4], // EDUCATION, HEALTHCARE, TRANSPORT, AGRICULTURE
    }],
    onChainObjectId: {
        type: String,
        default: null,
    },
    totalRedemptions: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    contactEmail: String,
    contactPhone: String,
    location: {
        type: new mongoose.Schema({
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: {
                type: [Number], required: true,
                validate: {
                    validator: value => value.length === 2 && value.every(Number.isFinite)
                        && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90,
                    message: 'Coordinates must contain valid longitude and latitude',
                },
            },
        }, { _id: false }),
        default: undefined,
    },
    // API Key fields
    apiKey: {
        type: String,
        sparse: true,
        index: true,
    },
    apiKeyExpiry: {
        type: Date,
    },
    apiKeyCreatedAt: {
        type: Date,
    },
    apiKeyRevokedAt: {
        type: Date,
    },
    // Owner reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

merchantSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Merchant', merchantSchema);
