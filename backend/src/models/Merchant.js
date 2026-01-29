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
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
        },
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
