const winston = require('winston');
const { getEnvConfig } = require('../config/envValidation');

const envConfig = getEnvConfig();

const logger = winston.createLogger({
    silent: envConfig.isTest,
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
    logger.add(new (require('./elasticsearchTransport').ElasticsearchTransport)({
        level: 'info',
        url: envConfig.elasticsearchUrl
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
