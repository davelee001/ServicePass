const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

/**
 * General API rate limiter - applies to all routes
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
        });
    },
});

/**
 * Strict rate limiter for authentication routes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    message: 'Too many authentication attempts, please try again later.',
    handler: (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many authentication attempts',
            message: 'Please wait 15 minutes before trying again.',
        });
    },
});

/**
 * Strict rate limiter for registration
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registration attempts per hour
    message: 'Too many accounts created from this IP, please try again later.',
    handler: (req, res) => {
        logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many registration attempts',
            message: 'Please wait before creating another account.',
        });
    },
});

/**
 * Rate limiter for redemption endpoints
 */
const redemptionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 redemption requests per minute
    message: 'Too many redemption requests, please slow down.',
    handler: (req, res) => {
        logger.warn(`Redemption rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many redemption requests',
            message: 'Please wait before making another redemption request.',
        });
    },
});

/**
 * Rate limiter for merchant API key usage
 */
const apiKeyLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit each API key to 30 requests per minute
    keyGenerator: (req) => {
        // Use API key as the rate limit key instead of IP
        return req.headers['x-api-key'] || req.ip;
    },
    message: 'API key rate limit exceeded.',
    handler: (req, res) => {
        logger.warn(`API key rate limit exceeded: ${req.headers['x-api-key']?.substring(0, 8)}...`);
        res.status(429).json({
            error: 'API rate limit exceeded',
            message: 'Your API key has exceeded the rate limit. Please slow down.',
        });
    },
});

/**
 * Lenient rate limiter for read-only operations
 */
const readLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 read requests per minute
    message: 'Too many requests, please slow down.',
});

/**
 * Strict rate limiter for write operations
 */
const writeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 write requests per minute
    message: 'Too many write requests, please slow down.',
});

/**
 * Rate limiter for password reset
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: 'Too many password reset attempts.',
    handler: (req, res) => {
        logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many password reset attempts',
            message: 'Please wait before requesting another password reset.',
        });
    },
});

module.exports = {
    generalLimiter,
    authLimiter,
    registerLimiter,
    redemptionLimiter,
    apiKeyLimiter,
    readLimiter,
    writeLimiter,
    passwordResetLimiter,
};
