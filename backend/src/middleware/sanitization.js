const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');

/**
 * Input sanitization middleware
 * Protects against NoSQL injection, XSS, and HTTP parameter pollution
 */

/**
 * Configure mongo sanitization
 * Removes any keys that start with '$' or contain '.'
 */
const mongoSanitizeMiddleware = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Request ${req.method} ${req.path} contained potentially malicious key: ${key}`);
    },
});

/**
 * Configure XSS protection
 * Sanitizes user input to prevent XSS attacks
 */
const isSignedBodyField = (req, field) =>
    /^\/api\/redemptions\/(redeem-qr|qr-intents\/[^/]+\/submit)\/?$/.test(req.originalUrl.split('?')[0])
    && ['qrPayload', 'transactionBytes', 'signature'].includes(field);

const xssMiddleware = (req, res, next) => {
    const clean = value => {
        if (typeof value === 'string') return xss(value);
        if (Array.isArray(value)) return value.map(clean);
        if (value && typeof value === 'object') {
            for (const key of Object.keys(value)) value[key] = clean(value[key]);
        }
        return value;
    };
    for (const field of ['body', 'query', 'params']) {
        if (!req[field]) continue;
        for (const key of Object.keys(req[field])) {
            // Authentication requires the exact signed bytes; service validation checks these fields.
            if (field === 'body' && isSignedBodyField(req, key)) continue;
            req[field][key] = clean(req[field][key]);
        }
    }
    next();
};

/**
 * Configure HTTP parameter pollution protection
 * Prevents attackers from polluting HTTP parameters
 */
const hppMiddleware = hpp({
    whitelist: [
        'voucherType',
        'amount',
        'status',
        'startDate',
        'endDate',
        'merchantId',
        'page',
        'limit',
    ],
});

/**
 * Custom sanitization middleware for additional security
 */
const customSanitize = (req, res, next) => {
    // Remove null bytes from strings
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            return value.replace(/\0/g, '');
        }
        if (typeof value === 'object' && value !== null) {
            Object.keys(value).forEach(key => {
                value[key] = sanitizeValue(value[key]);
            });
        }
        return value;
    };

    if (req.body) {
        for (const key of Object.keys(req.body)) {
            if (!isSignedBodyField(req, key)) req.body[key] = sanitizeValue(req.body[key]);
        }
    }

    if (req.query) {
        req.query = sanitizeValue(req.query);
    }

    if (req.params) {
        req.params = sanitizeValue(req.params);
    }

    next();
};

/**
 * Apply all sanitization middleware
 */
const sanitizeInput = [
    mongoSanitizeMiddleware,
    xssMiddleware,
    hppMiddleware,
    customSanitize,
];

module.exports = {
    sanitizeInput,
    mongoSanitizeMiddleware,
    xssMiddleware,
    hppMiddleware,
    customSanitize,
};
