const crypto = require('crypto');
const Merchant = require('../models/Merchant');
const { logger } = require('../utils/logger');

/**
 * Generate a secure API key
 */
const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash API key for storage
 */
const hashApiKey = (apiKey) => {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
};

/**
 * Create API key for merchant
 */
const createApiKey = async (merchantId, expiryDays = 365) => {
    try {
        const apiKey = generateApiKey();
        const hashedKey = hashApiKey(apiKey);
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        const merchant = await Merchant.findByIdAndUpdate(
            merchantId,
            {
                apiKey: hashedKey,
                apiKeyExpiry: expiryDate,
                apiKeyCreatedAt: new Date(),
            },
            { new: true }
        );

        if (!merchant) {
            throw new Error('Merchant not found');
        }

        logger.info(`API key created for merchant: ${merchant.merchantId}`);

        // Return the plain API key only once
        return {
            apiKey, // This should be shown to the merchant only once
            expiryDate,
            merchant,
        };
    } catch (error) {
        logger.error(`Error creating API key: ${error.message}`);
        throw error;
    }
};

/**
 * Regenerate API key for merchant
 */
const regenerateApiKey = async (merchantId) => {
    return await createApiKey(merchantId);
};

/**
 * Revoke API key for merchant
 */
const revokeApiKey = async (merchantId) => {
    try {
        const merchant = await Merchant.findByIdAndUpdate(
            merchantId,
            {
                $unset: { apiKey: 1, apiKeyExpiry: 1 },
                apiKeyRevokedAt: new Date(),
            },
            { new: true }
        );

        if (!merchant) {
            throw new Error('Merchant not found');
        }

        logger.info(`API key revoked for merchant: ${merchant.merchantId}`);

        return merchant;
    } catch (error) {
        logger.error(`Error revoking API key: ${error.message}`);
        throw error;
    }
};

/**
 * Verify API key
 */
const verifyApiKeyString = async (apiKey) => {
    try {
        const hashedKey = hashApiKey(apiKey);
        
        const merchant = await Merchant.findOne({
            apiKey: hashedKey,
            isActive: true,
        });

        if (!merchant) {
            return null;
        }

        // Check if expired
        if (merchant.apiKeyExpiry && merchant.apiKeyExpiry < new Date()) {
            return null;
        }

        return merchant;
    } catch (error) {
        logger.error(`Error verifying API key: ${error.message}`);
        return null;
    }
};

/**
 * Get API key info without revealing the key
 */
const getApiKeyInfo = async (merchantId) => {
    try {
        const merchant = await Merchant.findById(merchantId).select('apiKey apiKeyExpiry apiKeyCreatedAt');

        if (!merchant) {
            throw new Error('Merchant not found');
        }

        return {
            hasApiKey: !!merchant.apiKey,
            expiryDate: merchant.apiKeyExpiry,
            createdAt: merchant.apiKeyCreatedAt,
            isExpired: merchant.apiKeyExpiry ? merchant.apiKeyExpiry < new Date() : false,
        };
    } catch (error) {
        logger.error(`Error getting API key info: ${error.message}`);
        throw error;
    }
};

module.exports = {
    generateApiKey,
    hashApiKey,
    createApiKey,
    regenerateApiKey,
    revokeApiKey,
    verifyApiKeyString,
    getApiKeyInfo,
};
