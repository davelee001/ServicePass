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

        if (!/^0x[0-9a-f]{1,64}$/i.test(process.env[name]) || /^0x0+$/i.test(process.env[name])) invalid.push(name);
    }
    if (!['mainnet', 'testnet'].includes(process.env.SUI_NETWORK)) invalid.push('SUI_NETWORK');
    if (!/^\d+$/.test(process.env.PORT) || Number(process.env.PORT) < 1 || Number(process.env.PORT) > 65535) invalid.push('PORT');

    for (const [name, protocols] of [['MONGODB_URI', ['mongodb:', 'mongodb+srv:']], ['REDIS_URL', ['rediss:']]]) {
        try {
            const uri = new URL(process.env[name]);
            const password = decodeURIComponent(uri.password);
            const encrypted = name === 'REDIS_URL' || uri.protocol === 'mongodb+srv:' ||
                (uri.searchParams.get('tls') === 'true' || uri.searchParams.get('ssl') === 'true');
            const disablesTls = ['tls', 'ssl'].some(key => uri.searchParams.get(key) === 'false') ||
                ['tlsInsecure', 'tlsAllowInvalidCertificates', 'tlsAllowInvalidHostnames'].some(key => uri.searchParams.get(key) === 'true');
            if (!protocols.includes(uri.protocol) || !uri.hostname || !isStrongSecret(password, 16) ||
                !encrypted || disablesTls || isPlaceholder(uri.hostname)) invalid.push(name);
        } catch { invalid.push(name); }
    }
    getProductionOrigins(process.env.ALLOWED_ORIGINS);
    if (invalid.length) throw new Error(`Invalid production configuration: ${invalid.join(', ')}`);
}

/**
 * Sanitize environment variables for logging
 * @returns {Object} Sanitized environment variables
 */
function getSafeEnvForLogging() {
    const safeEnv = {};
    const sensitiveKeys = ['PRIVATE_KEY', 'SECRET', 'PASSWORD', 'KEY', 'TOKEN', 'URI', 'URL'];

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
    getProductionOrigins,
    getSafeEnvForLogging,
    getEnvConfig,
    requiredEnvVars,
    optionalEnvVars,
};
