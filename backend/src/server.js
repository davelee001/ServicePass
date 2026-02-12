const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { logger } = require('./utils/logger');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const { validateEnv, getEnvConfig } = require('./config/envValidation');
const { helmetConfig, getCorsConfig } = require('./config/security');
const { 
    mongoSanitizeMiddleware, 
    xssMiddleware, 
    hppMiddleware 
} = require('./middleware/sanitization');
const { generalLimiter } = require('./middleware/rateLimiter');
const { startListening, stopListening } = require('./services/blockchainListener');
const { httpRequestDurationMicroseconds } = require('./utils/metrics');
const notificationScheduler = require('./utils/notificationScheduler');
const batchOperationManager = require('./utils/batchOperationManager');

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

Sentry.init({
    dsn: envConfig.sentryDsn,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: envConfig.nodeEnv,
  });

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Database connection
const { connectToDatabase } = require('./config/database');

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
    const end = httpRequestDurationMicroseconds.labels(req.method, req.route?.path || req.path).startTimer();
    res.on('finish', () => {
        end();
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
app.use('/api/metrics', require('./routes/metrics'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Status monitoring
if (process.env.NODE_ENV !== 'production') {
    app.use(require('express-status-monitor')());
}

// Error handlers
app.use(Sentry.Handlers.errorHandler());
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
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
    
    // Stop blockchain listener
    await stopListening();
    
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectToDatabase();
        
        // Start blockchain listener
        await startListening();
        
        // Start notification scheduler
        notificationScheduler.startJobs();
        
        // Start express server
        server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${envConfig.nodeEnv}`);
            logger.info('Notification scheduler started');
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
