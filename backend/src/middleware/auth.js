const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

// Generate JWT tokens
const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { userId, role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
    );

    const refreshToken = jwt.sign(
        { userId, role, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRE }
    );

    return { accessToken, refreshToken };
};

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if it's a refresh token being used as access token
        if (decoded.type === 'refresh') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        req.user = user;
        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        logger.error(`Token verification error: ${error.message}`);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                requiredRoles: roles,
                yourRole: req.userRole
            });
        }

        next();
    };
};

// Admin only middleware
const adminOnly = authorizeRoles('admin');

// Merchant only middleware
const merchantOnly = authorizeRoles('merchant');

// User only middleware
const userOnly = authorizeRoles('user');

// Admin or Merchant middleware
const adminOrMerchant = authorizeRoles('admin', 'merchant');

// All authenticated users
const authenticated = authorizeRoles('admin', 'merchant', 'user');

// Verify API key for merchants
const verifyApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }

        const merchant = await Merchant.findOne({ 
            apiKey,
            isActive: true 
        });

        if (!merchant) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        // Check if API key is expired
        if (merchant.apiKeyExpiry && merchant.apiKeyExpiry < Date.now()) {
            return res.status(401).json({ error: 'API key expired' });
        }

        req.merchant = merchant;
        req.merchantId = merchant._id;

        next();
    } catch (error) {
        logger.error(`API key verification error: ${error.message}`);
        res.status(500).json({ error: 'API key verification failed' });
    }
};

// Optional authentication - continues even if no token
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
                req.userId = decoded.userId;
                req.userRole = decoded.role;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    generateTokens,
    verifyToken,
    authorizeRoles,
    adminOnly,
    merchantOnly,
    userOnly,
    adminOrMerchant,
    authenticated,
    verifyApiKey,
    optionalAuth,
    JWT_SECRET,
};
