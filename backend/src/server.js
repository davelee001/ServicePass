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
