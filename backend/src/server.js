const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { logger } = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/redemptions', require('./routes/redemptions'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    logger.info(`ServicePass backend running on port ${PORT}`);
});

module.exports = app;
