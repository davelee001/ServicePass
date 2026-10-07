require('./config/bootstrap');

// Initialize optional telemetry before loading the framework.
if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { logger } = require('./utils/logger');
const { getEnvConfig } = require('./config/envValidation');
const { helmetConfig, getCorsConfig } = require('./config/security');
const {
    mongoSanitizeMiddleware,
    xssMiddleware,
    hppMiddleware
} = require('./middleware/sanitization');
const { generalLimiter } = require('./middleware/rateLimiter');
const { httpRequestDurationMicroseconds } = require('./utils/metrics');
const notificationScheduler = require('./utils/notificationScheduler');
const batchOperationManager = require('./utils/batchOperationManager');
const scheduledVoucherProcessor = require('./utils/scheduledVoucherProcessor');

const envConfig = getEnvConfig();
const app = express();
const PORT = envConfig.port;

// Database connection
const { connectDB } = require('./config/database');

// Middleware
app.use(helmet(helmetConfig));
app.use(cors(getCorsConfig()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Security middleware
app.use(mongoSanitizeMiddleware);
app.use(xssMiddleware);
app.use(hppMiddleware);

// Metrics middleware
app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || 'unmatched', code: String(res.statusCode) });
    });
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/redemptions', require('./routes/redemptions'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/batch', require('./routes/batchOperations'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/scheduled-vouchers', require('./routes/scheduledVouchers'));
app.use('/api/multisig', require('./routes/multiSigOperations'));
app.use('/api/transfers', require('./routes/transfers'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handlers

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    if (process.env.SENTRY_DSN) require('@sentry/node').captureException(err);
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { details: err.message })
    });
});

// Graceful shutdown
let server;

const gracefulShutdown = async () => {
    logger.info('Graceful shutdown initiated...');

    // Stop notification scheduler
    notificationScheduler.stopJobs();

    // Stop scheduled voucher processor
    scheduledVoucherProcessor.stop();

    // Stop blockchain listener
    await require('./services/blockchainListener').stopListening();
    require('./utils/notificationManager').stopProcessors();
    batchOperationManager.stopProcessor();

    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};



// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start blockchain listener
        await require('./services/blockchainListener').startListening();
        require('./utils/notificationManager').startProcessors();
        batchOperationManager.startProcessor();

        // Start notification scheduler
        notificationScheduler.startJobs();

        // Start scheduled voucher processor
        scheduledVoucherProcessor.start();

        // Start express server
        server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${envConfig.nodeEnv}`);
            logger.info('Notification scheduler started');
            logger.info('Scheduled voucher processor started');
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    startServer();
}

module.exports = app;
