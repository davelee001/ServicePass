const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicepass';

        const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 20;
        const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 5;
        const serverSelectionTimeoutMS = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 10) || 30000;
        const socketTimeoutMS = parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS, 10) || 45000;

        const conn = await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize,
            minPoolSize,
            serverSelectionTimeoutMS,
            socketTimeoutMS,
        });

        logger.info(`MongoDB Connected: ${conn.connection.host} (poolSize=${maxPoolSize})`);
    } catch (error) {
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
