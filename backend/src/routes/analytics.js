const express = require('express');
const router = express.Router();
const { query, param, validationResult } = require('express-validator');
const analyticsDashboard = require('../utils/analyticsDashboard');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { readLimiter } = require('../middleware/rateLimiter');

// Get comprehensive dashboard overview
router.get('/dashboard',
    verifyToken,
    readLimiter,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string'),
        query('voucherType').optional().isIn(['1', '2', '3', '4']).withMessage('Voucher type must be 1, 2, 3, or 4')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { startDate, endDate, merchantId, voucherType } = req.query;
            
            // Check if user can access merchant-specific data
            if (merchantId && req.user.role !== 'admin' && req.user.merchantId !== merchantId) {
                return res.status(403).json({ error: 'Access denied to merchant data' });
            }

            const filters = {};
            
            if (startDate || endDate) {
                filters.dateRange = {};
                if (startDate) filters.dateRange.start = startDate;
                if (endDate) filters.dateRange.end = endDate;
            }
            
            if (merchantId) filters.merchantId = merchantId;
            if (voucherType) filters.voucherType = voucherType;

            const dashboard = await analyticsDashboard.getDashboardOverview(filters);
            
            res.json({ dashboard });
        } catch (error) {
            logger.error('Error fetching dashboard overview:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard data' });
        }
    }
);

// Get voucher statistics
router.get('/vouchers',
    verifyToken,
    readLimiter,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string'),
        query('voucherType').optional().isIn(['1', '2', '3', '4']).withMessage('Voucher type must be 1, 2, 3, or 4')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { startDate, endDate, merchantId, voucherType } = req.query;
            
            if (merchantId && req.user.role !== 'admin' && req.user.merchantId !== merchantId) {
                return res.status(403).json({ error: 'Access denied to merchant data' });
            }

            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            const voucherStats = await analyticsDashboard.getVoucherStats(
                dateFilter,
                { merchantId, voucherType }
            );
            
            res.json({ voucherStats });
        } catch (error) {
            logger.error('Error fetching voucher statistics:', error);
            res.status(500).json({ error: 'Failed to fetch voucher statistics' });
        }
    }
);

// Get redemption statistics
router.get('/redemptions',
    verifyToken,
    readLimiter,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { startDate, endDate, merchantId } = req.query;
            
            if (merchantId && req.user.role !== 'admin' && req.user.merchantId !== merchantId) {
                return res.status(403).json({ error: 'Access denied to merchant data' });
            }

            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            const redemptionStats = await analyticsDashboard.getRedemptionStats(
                dateFilter,
                { merchantId }
            );
            
            res.json({ redemptionStats });
        } catch (error) {
            logger.error('Error fetching redemption statistics:', error);
            res.status(500).json({ error: 'Failed to fetch redemption statistics' });
        }
    }
);

// Get merchant performance metrics
router.get('/merchants',
    verifyToken,
    readLimiter,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { startDate, endDate, merchantId } = req.query;
            
            // Only admins can see all merchant stats, merchants can only see their own
            if (req.user.role !== 'admin') {
                if (!merchantId) {
                    return res.status(403).json({ error: 'Merchant ID required for non-admin users' });
                }
                if (req.user.merchantId !== merchantId) {
                    return res.status(403).json({ error: 'Access denied to other merchant data' });
                }
            }

            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            const merchantStats = await analyticsDashboard.getMerchantStats(
                dateFilter,
                { merchantId }
            );
            
            res.json({ merchantStats });
        } catch (error) {
            logger.error('Error fetching merchant statistics:', error);
            res.status(500).json({ error: 'Failed to fetch merchant statistics' });
        }
    }
);

// Get voucher type distribution
router.get('/distribution',
    verifyToken,
    readLimiter,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { startDate, endDate, merchantId } = req.query;
            
            if (merchantId && req.user.role !== 'admin' && req.user.merchantId !== merchantId) {
                return res.status(403).json({ error: 'Access denied to merchant data' });
            }

            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            const distribution = await analyticsDashboard.getVoucherTypeDistribution(
                dateFilter,
                { merchantId }
            );
            
            res.json({ distribution });
        } catch (error) {
            logger.error('Error fetching voucher type distribution:', error);
            res.status(500).json({ error: 'Failed to fetch distribution data' });
        }
    }
);

// Get expiry tracking statistics
router.get('/expiry',
    verifyToken,
    readLimiter,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string'),
        query('voucherType').optional().isIn(['1', '2', '3', '4']).withMessage('Voucher type must be 1, 2, 3, or 4')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { startDate, endDate, merchantId, voucherType } = req.query;
            
            if (merchantId && req.user.role !== 'admin' && req.user.merchantId !== merchantId) {
                return res.status(403).json({ error: 'Access denied to merchant data' });
            }

            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            const expiryStats = await analyticsDashboard.getExpiryStats(
                dateFilter,
                { merchantId, voucherType }
            );
            
            res.json({ expiryStats });
        } catch (error) {
            logger.error('Error fetching expiry statistics:', error);
            res.status(500).json({ error: 'Failed to fetch expiry statistics' });
        }
    }
);

// Get financial reports
router.get('/financial',
    verifyToken,
    readLimiter,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string'),
        query('voucherType').optional().isIn(['1', '2', '3', '4']).withMessage('Voucher type must be 1, 2, 3, or 4')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { startDate, endDate, merchantId, voucherType } = req.query;
            
            if (merchantId && req.user.role !== 'admin' && req.user.merchantId !== merchantId) {
                return res.status(403).json({ error: 'Access denied to merchant data' });
            }

            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            const financialSummary = await analyticsDashboard.getFinancialSummary(
                dateFilter,
                { merchantId, voucherType }
            );
            
            res.json({ financialSummary });
        } catch (error) {
            logger.error('Error fetching financial report:', error);
            res.status(500).json({ error: 'Failed to fetch financial data' });
        }
    }
);

// Get trend data for charts
router.get('/trends',
    verifyToken,
    readLimiter,
    [
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string'),
        query('voucherType').optional().isIn(['1', '2', '3', '4']).withMessage('Voucher type must be 1, 2, 3, or 4'),
        query('period').optional().isIn(['hourly', 'daily', 'weekly', 'monthly']).withMessage('Period must be hourly, daily, weekly, or monthly')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { startDate, endDate, merchantId, voucherType, period = 'daily' } = req.query;
            
            if (merchantId && req.user.role !== 'admin' && req.user.merchantId !== merchantId) {
                return res.status(403).json({ error: 'Access denied to merchant data' });
            }

            const dateFilter = {};
            if (startDate || endDate) {
                dateFilter.createdAt = {};
                if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
            }

            const trendData = await analyticsDashboard.getTrendData(
                dateFilter,
                { merchantId, voucherType },
                period
            );
            
            res.json({ trendData });
        } catch (error) {
            logger.error('Error fetching trend data:', error);
            res.status(500).json({ error: 'Failed to fetch trend data' });
        }
    }
);

// Get real-time metrics (admin only)
router.get('/realtime',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            // Get recent activity from last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const dateFilter = {
                createdAt: { $gte: yesterday }
            };

            const [recentVouchers, recentRedemptions, activeUsers] = await Promise.all([
                analyticsDashboard.getVoucherStats(dateFilter),
                analyticsDashboard.getRedemptionStats(dateFilter),
                // Get active users count (simplified)
                require('../models/User').countDocuments({
                    lastLogin: { $gte: yesterday }
                })
            ]);

            const realtime = {
                last24Hours: {
                    vouchersMinted: recentVouchers.total,
                    vouchersRedeemed: recentRedemptions.total,
                    activeUsers,
                    totalValue: recentVouchers.totalValue,
                    redeemedValue: recentRedemptions.totalValue
                },
                timestamp: new Date()
            };
            
            res.json({ realtime });
        } catch (error) {
            logger.error('Error fetching realtime metrics:', error);
            res.status(500).json({ error: 'Failed to fetch realtime metrics' });
        }
    }
);

// Export analytics data
router.get('/export',
    verifyToken,
    readLimiter,
    [
        query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
        query('type').isIn(['dashboard', 'vouchers', 'redemptions', 'merchants', 'financial']).withMessage('Export type is required'),
        query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
        query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
        query('merchantId').optional().isString().withMessage('Merchant ID must be a string')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: errors.array() 
                });
            }

            const { format = 'json', type, startDate, endDate, merchantId } = req.query;
            
            if (merchantId && req.user.role !== 'admin' && req.user.merchantId !== merchantId) {
                return res.status(403).json({ error: 'Access denied to merchant data' });
            }

            const filters = {};
            if (startDate || endDate) {
                filters.dateRange = {};
                if (startDate) filters.dateRange.start = startDate;
                if (endDate) filters.dateRange.end = endDate;
            }
            if (merchantId) filters.merchantId = merchantId;

            let data;
            let filename;

            switch (type) {
                case 'dashboard':
                    data = await analyticsDashboard.getDashboardOverview(filters);
                    filename = `dashboard_${Date.now()}`;
                    break;
                case 'vouchers':
                    const dateFilter = {};
                    if (startDate || endDate) {
                        dateFilter.createdAt = {};
                        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
                        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
                    }
                    data = await analyticsDashboard.getVoucherStats(dateFilter, { merchantId });
                    filename = `vouchers_${Date.now()}`;
                    break;
                case 'redemptions':
                    const redemptionDateFilter = {};
                    if (startDate || endDate) {
                        redemptionDateFilter.createdAt = {};
                        if (startDate) redemptionDateFilter.createdAt.$gte = new Date(startDate);
                        if (endDate) redemptionDateFilter.createdAt.$lte = new Date(endDate);
                    }
                    data = await analyticsDashboard.getRedemptionStats(redemptionDateFilter, { merchantId });
                    filename = `redemptions_${Date.now()}`;
                    break;
                case 'merchants':
                    const merchantDateFilter = {};
                    if (startDate || endDate) {
                        merchantDateFilter.createdAt = {};
                        if (startDate) merchantDateFilter.createdAt.$gte = new Date(startDate);
                        if (endDate) merchantDateFilter.createdAt.$lte = new Date(endDate);
                    }
                    data = await analyticsDashboard.getMerchantStats(merchantDateFilter, { merchantId });
                    filename = `merchants_${Date.now()}`;
                    break;
                case 'financial':
                    const financialDateFilter = {};
                    if (startDate || endDate) {
                        financialDateFilter.createdAt = {};
                        if (startDate) financialDateFilter.createdAt.$gte = new Date(startDate);
                        if (endDate) financialDateFilter.createdAt.$lte = new Date(endDate);
                    }
                    data = await analyticsDashboard.getFinancialSummary(financialDateFilter, { merchantId });
                    filename = `financial_${Date.now()}`;
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid export type' });
            }

            if (format === 'csv') {
                const csvData = convertToCSV(data, type);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
                res.send(csvData);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
                res.json(data);
            }
            
        } catch (error) {
            logger.error('Error exporting analytics data:', error);
            res.status(500).json({ error: 'Failed to export data' });
        }
    }
);

// Clear analytics cache (admin only)
router.post('/cache/clear',
    verifyToken,
    adminOnly,
    async (req, res) => {
        try {
            analyticsDashboard.clearCache();
            res.json({ message: 'Analytics cache cleared successfully' });
        } catch (error) {
            logger.error('Error clearing analytics cache:', error);
            res.status(500).json({ error: 'Failed to clear cache' });
        }
    }
);

// Helper function to convert data to CSV format
function convertToCSV(data, type) {
    try {
        let csvContent = '';
        
        switch (type) {
            case 'vouchers':
                csvContent = 'Total,Total Value,Active,Expired,Redeemed,Average Value\n';
                csvContent += `${data.total},${data.totalValue},${data.active},${data.expired},${data.redeemed},${data.averageValue}\n`;
                
                if (data.byType && data.byType.length > 0) {
                    csvContent += '\nBy Type:\nType,Count,Total Value,Average Value\n';
                    data.byType.forEach(item => {
                        csvContent += `${item._id},${item.count},${item.totalValue},${item.averageValue}\n`;
                    });
                }
                break;
                
            case 'redemptions':
                csvContent = 'Total,Total Value,Average Value,Unique Users,Unique Merchants\n';
                csvContent += `${data.total},${data.totalValue},${data.averageValue},${data.uniqueUsers},${data.uniqueMerchants}\n`;
                break;
                
            case 'financial':
                csvContent = 'Total Value,Total Redeemed,Remaining Value,Utilization Rate,Vouchers Minted,Vouchers Redeemed\n';
                csvContent += `${data.totalValue},${data.totalRedeemed},${data.remainingValue},${data.utilizationRate},${data.vouchersMinted},${data.vouchersRedeemed}\n`;
                break;
                
            default:
                csvContent = JSON.stringify(data, null, 2);
        }
        
        return csvContent;
    } catch (error) {
        logger.error('Error converting to CSV:', error);
        return 'Error generating CSV data';
    }
}

module.exports = router;