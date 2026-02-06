const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { logger } = require('./utils/logger');
const { validateEnv, getEnvConfig } = require('./config/envValidation');
const { helmetConfig, getCorsConfig } = require('./config/security');
const { 
    mongoSanitizeMiddleware, 
    xssMiddleware, 
    hppMiddleware 
} = require('./middleware/sanitization');
const { generalLimiter } = require('./middleware/rateLimiter');
const { startListening, stopListening } = require('./services/blockchainListener');

// Load environment variables
dotenv.config();

// Validate environment variables on startup
try {
    validateEnv();
} catch (error) {
    logger.error('Environment validation failed:', error.message);
    process.exit(1);
}

const envConfig = getEnvConfig();
const app = express();
const PORT = envConfig.port;

// Security middleware - Applied in correct order
// 1. Helmet security headers (must be first)
app.use(helmet(helmetConfig));

// 2. CORS configuration
app.use(cors(getCorsConfig()));

// 3. Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Input sanitization
app.use(mongoSanitizeMiddleware);
app.use(xssMiddleware);
app.use(hppMiddleware);

// 5. Rate limiting
app.use(generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/redemptions', require('./routes/redemptions'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: envConfig.nodeEnv,
        uptime: process.uptime()
    });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        path: req.path
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    // Log error details
    logger.error('Error occurred:', {
        message: err.message,
        stack: envConfig.isDevelopment ? err.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Prepare error response
    const errorResponse = {
        error: err.message || 'Internal Server Error',
        ...(envConfig.isDevelopment && { stack: err.stack }),
    };

    // Send response
    res.status(statusCode).json(errorResponse);
});

const server = app.listen(PORT, () => {
    logger.info(`ServicePass backend running on port ${PORT}`);
    startListening();
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    stopListening();
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;
