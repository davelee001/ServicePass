const helmet = require('helmet');

/**
 * Helmet configuration for security headers
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: true,
    expectCt: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
});

/**
 * CORS configuration
 */
const getCorsConfig = () => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://localhost:5173'];

    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
                const msg = 'The CORS policy for this site does not allow access from the specified origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        maxAge: 86400, // 24 hours
    };
};

/**
 * Security middleware configuration
 */
const securityConfig = {
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    },
    bodyParser: {
        json: {
            limit: '10mb',
            strict: true,
        },
        urlencoded: {
            limit: '10mb',
            extended: true,
            parameterLimit: 50,
        },
    },
};

module.exports = {
    helmetConfig,
    getCorsConfig,
    securityConfig,
};
