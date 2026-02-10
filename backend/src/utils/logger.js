const winston = require('winston');
require('winston-elasticsearch');
const { getEnvConfig } = require('../config/envValidation');

const envConfig = getEnvConfig();

const logger = winston.createLogger({
    level: envConfig.logLevel || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// If Elasticsearch URL is provided, add it as a transport
if (envConfig.elasticsearchUrl) {
    logger.add(new winston.transports.Elasticsearch({
        level: 'info',
        clientOpts: { node: envConfig.elasticsearchUrl }
    }));
}


// If not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

module.exports = { logger };
