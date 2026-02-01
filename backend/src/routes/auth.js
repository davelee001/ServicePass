const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateTokens, verifyToken, JWT_SECRET } = require('../middleware/auth');
const { authLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
    registerLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('role').optional().isIn(['user', 'merchant']).withMessage('Invalid role'),
        body('walletAddress').optional().isString(),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, name, role, walletAddress } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Create new user (only users and merchants can self-register, not admins)
            const userRole = role === 'merchant' ? 'merchant' : 'user';
            
            const user = new User({
                email,
                password,
                name,
                role: userRole,
                walletAddress,
            });

            await user.save();

            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(user._id, user.role);

            // Save refresh token
            user.refreshTokens.push({ token: refreshToken });
            await user.save();

            logger.info(`New user registered: ${email} (${userRole})`);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: user.toJSON(),
                accessToken,
                refreshToken,
            });
        } catch (error) {
            logger.error(`Registration error: ${error.message}`);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if account is locked
            if (user.isLocked()) {
                return res.status(423).json({ 
                    error: 'Account is temporarily locked due to too many failed login attempts',
                    lockUntil: user.lockUntil,
                });
            }

            // Check if account is active
            if (!user.isActive) {
                return res.status(401).json({ error: 'Account is deactivated' });
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                await user.incLoginAttempts();
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Reset login attempts on successful login
            if (user.loginAttempts > 0 || user.lockUntil) {
                await user.resetLoginAttempts();
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(user._id, user.role);

            // Save refresh token
            user.refreshTokens.push({ token: refreshToken });
            
            // Limit refresh tokens to last 5
            if (user.refreshTokens.length > 5) {
                user.refreshTokens = user.refreshTokens.slice(-5);
            }
            
            await user.save();

            logger.info(`User logged in: ${email}`);

            res.json({
                success: true,
                message: 'Login successful',
                user: user.toJSON(),
                accessToken,
                refreshToken,
            });
        } catch (error) {
            logger.error(`Login error: ${error.message}`);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { refreshToken } = req.body;

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, JWT_SECRET);

            if (decoded.type !== 'refresh') {
                return res.status(401).json({ error: 'Invalid token type' });
            }

            // Find user and check if refresh token exists
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
            if (!tokenExists) {
                return res.status(401).json({ error: 'Invalid refresh token' });
            }

            // Generate new access token
            const { accessToken } = generateTokens(user._id, user.role);

            res.json({
                success: true,
                accessToken,
            });
        } catch (error) {
            logger.error(`Token refresh error: ${error.message}`);
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Refresh token expired' });
            }
            
            res.status(500).json({ error: 'Token refresh failed' });
        }
    }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
    verifyToken,
    [
        body('refreshToken').optional().isString(),
    ],
    async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const user = await User.findById(req.userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Remove specific refresh token or all tokens
            if (refreshToken) {
                user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
            } else {
                user.refreshTokens = [];
            }

            await user.save();

            logger.info(`User logged out: ${user.email}`);

            res.json({
                success: true,
                message: 'Logout successful',
            });
        } catch (error) {
            logger.error(`Logout error: ${error.message}`);
            res.status(500).json({ error: 'Logout failed' });
        }
    }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('merchantId');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: user.toJSON(),
        });
    } catch (error) {
        logger.error(`Get user error: ${error.message}`);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password',
    verifyToken,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.userId).select('+password');

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Update password
            user.password = newPassword;
            user.refreshTokens = []; // Invalidate all refresh tokens
            await user.save();

            logger.info(`Password changed for user: ${user.email}`);

            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            logger.error(`Password change error: ${error.message}`);
            res.status(500).json({ error: 'Password change failed' });
        }
    }
);

module.exports = router;
