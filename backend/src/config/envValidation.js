const { logger } = require('../utils/logger');

/**
 * Environment variable validation
 * Ensures all required environment variables are set
 */

const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'ADMIN_PRIVATE_KEY',
    'PACKAGE_ID',
    'ADMIN_CAP_ID',
    'REGISTRY_ID',
    'SUI_NETWORK',
];

const optionalEnvVars = [
    'NODE_ENV',
    'ALLOWED_ORIGINS',
    'REDIS_URL',
    'VOUCHER_PACKAGE_ID',
    'QR_SIGNING_SECRET',
    'ENCRYPTION_KEY',
    'LOG_LEVEL',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'MONGODB_MAX_POOL_SIZE',
    'MONGODB_MIN_POOL_SIZE',
    'MONGODB_SERVER_SELECTION_TIMEOUT_MS',
    'MONGODB_SOCKET_TIMEOUT_MS',
    'REDEMPTION_ARCHIVE_AFTER_DAYS',
    'REDEMPTION_ARCHIVE_BATCH_SIZE',
    'ELASTICSEARCH_URL',
    'SENTRY_DSN',
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required environment variable is missing
 */
function validateEnv() {
    const missing = [];
    const warnings = [];

    // Check required variables
    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Check optional but recommended variables
    if (process.env.NODE_ENV === 'production') {
        const productionRecommended = [
            'ENCRYPTION_KEY',
            'ALLOWED_ORIGINS',
            'REDIS_URL',
        ];

        productionRecommended.forEach(varName => {
            if (!process.env[varName]) {
                warnings.push(varName);
            }
        });

        if (warnings.length > 0) {
            logger.warn(`Recommended environment variables not set for production: ${warnings.join(', ')}`);
        }
    }

    logger.info('Environment variables validated successfully');
}

/**
 * Sanitize environment variables for logging
 * @returns {Object} Sanitized environment variables
 */
function getSafeEnvForLogging() {
    const safeEnv = {};
    const sensitiveKeys = ['PRIVATE_KEY', 'SECRET', 'PASSWORD', 'KEY', 'TOKEN'];

    Object.keys(process.env).forEach(key => {
        const isSensitive = sensitiveKeys.some(sensitive => 
            key.toUpperCase().includes(sensitive)
        );

        if (isSensitive) {
            safeEnv[key] = '***REDACTED***';
        } else {
            safeEnv[key] = process.env[key];
        }
    });

    return safeEnv;
}

/**
 * Get environment-specific configuration
 * @returns {Object} Environment configuration
 */
function getEnvConfig() {
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT, 10) || 3000,
        isDevelopment: process.env.NODE_ENV !== 'production',
        isProduction: process.env.NODE_ENV === 'production',
        isTest: process.env.NODE_ENV === 'test',
        logLevel: process.env.LOG_LEVEL || 'info',
        sentryDsn: process.env.SENTRY_DSN,
        elasticsearchUrl: process.env.ELASTICSEARCH_URL,
    };
}

module.exports = {
    validateEnv,
    getSafeEnvForLogging,
    getEnvConfig,
    requiredEnvVars,
    optionalEnvVars,
};
