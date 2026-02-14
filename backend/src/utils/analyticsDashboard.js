const Voucher = require('../models/Voucher');
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const User = require('../models/User');
const NotificationHistory = require('../models/NotificationHistory');
const BatchOperation = require('../models/BatchOperation');
const { logger } = require('./logger');

class AnalyticsDashboard {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Get comprehensive dashboard overview
    async getDashboardOverview(filters = {}) {
        try {
            const { dateRange, merchantId, voucherType } = filters;
            const cacheKey = `dashboard_overview_${JSON.stringify(filters)}`;
            
            // Check cache first
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const dateFilter = this.buildDateFilter(dateRange);
            
            const [
                voucherStats,
                redemptionStats,
                merchantStats,
                typeDistribution,
                expiryStats,
                financialSummary,
                trendData
            ] = await Promise.all([
                this.getVoucherStats(dateFilter, { merchantId, voucherType }),
                this.getRedemptionStats(dateFilter, { merchantId, voucherType }),
                this.getMerchantStats(dateFilter, { merchantId }),
                this.getVoucherTypeDistribution(dateFilter, { merchantId }),
                this.getExpiryStats(dateFilter, { merchantId, voucherType }),
                this.getFinancialSummary(dateFilter, { merchantId, voucherType }),
                this.getTrendData(dateFilter, { merchantId, voucherType })
            ]);

            const overview = {
                summary: {
                    totalVouchersMinted: voucherStats.total,
                    totalVouchersRedeemed: redemptionStats.total,
                    totalMerchants: merchantStats.totalMerchants,
                    totalValue: financialSummary.totalValue,
                    redemptionRate: voucherStats.total > 0 ? ((redemptionStats.total / voucherStats.total) * 100).toFixed(2) : 0
                },
                voucherStats,
                redemptionStats,
                merchantStats,
                typeDistribution,
                expiryStats,
                financialSummary,
                trendData,
                lastUpdated: new Date()
            };

            this.setCache(cacheKey, overview);
            return overview;

        } catch (error) {
            logger.error('Error generating dashboard overview:', error);
            throw error;
        }
    }

    // Get detailed voucher statistics
    async getVoucherStats(dateFilter = {}, filters = {}) {
        try {
            const matchStage = { ...dateFilter };
            
            if (filters.merchantId) {
                matchStage.merchantId = filters.merchantId;
            }
            
            if (filters.voucherType) {
                matchStage.voucherType = filters.voucherType;
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        totalValue: { $sum: '$amount' },
                        active: { 
                            $sum: { 
                                $cond: [
                                    { 
                                        $and: [
                                            { $eq: ['$isRedeemed', false] },
                                            { 
                                                $or: [
                                                    { $eq: ['$expiryTimestamp', null] },
                                                    { $gt: ['$expiryTimestamp', Date.now()] }
                                                ]
                                            }
                                        ]
                                    }, 
                                    1, 
                                    0
                                ]
                            }
                        },
                        expired: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$expiryTimestamp', null] },
                                            { $lt: ['$expiryTimestamp', Date.now()] },
                                            { $eq: ['$isRedeemed', false] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        redeemed: { $sum: { $cond: ['$isRedeemed', 1, 0] } },
                        averageValue: { $avg: '$amount' }
                    }
                }
            ];

            // Get voucher stats by type
            const typeStatsResult = await Voucher.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$voucherType',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$amount' },
                        averageValue: { $avg: '$amount' }
                    }
                }
            ]);

            const result = await Voucher.aggregate(pipeline);
            const stats = result[0] || {
                total: 0,
                totalValue: 0,
                active: 0,
                expired: 0,
                redeemed: 0,
                averageValue: 0
            };

            return {
                ...stats,
                byType: typeStatsResult
            };

        } catch (error) {
            logger.error('Error getting voucher stats:', error);
            throw error;
        }
    }

    // Get redemption statistics
    async getRedemptionStats(dateFilter = {}, filters = {}) {
        try {
            const matchStage = { ...dateFilter };
            
            if (filters.merchantId) {
                matchStage.merchantId = filters.merchantId;
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        totalValue: { $sum: '$amount' },
                        averageValue: { $avg: '$amount' },
                        uniqueUsers: { $addToSet: '$userWalletAddress' },
                        uniqueMerchants: { $addToSet: '$merchantId' }
                    }
                },
                {
                    $project: {
                        total: 1,
                        totalValue: 1,
                        averageValue: 1,
                        uniqueUsers: { $size: '$uniqueUsers' },
                        uniqueMerchants: { $size: '$uniqueMerchants' }
                    }
                }
            ];

            // Get redemptions by time period
            const timeSeriesResult = await Redemption.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        count: { $sum: 1 },
                        value: { $sum: '$amount' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);

            const result = await Redemption.aggregate(pipeline);
            const stats = result[0] || {
                total: 0,
                totalValue: 0,
                averageValue: 0,
                uniqueUsers: 0,
                uniqueMerchants: 0
            };

            return {
                ...stats,
                timeSeries: timeSeriesResult
            };

        } catch (error) {
            logger.error('Error getting redemption stats:', error);
            throw error;
        }
    }

    // Get merchant performance metrics
    async getMerchantStats(dateFilter = {}, filters = {}) {
        try {
            const matchStage = { createdAt: dateFilter.createdAt || {} };
            
            if (filters.merchantId) {
                matchStage.merchantId = filters.merchantId;
            }

            // Get top performing merchants
            const topMerchants = await Redemption.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$merchantId',
                        totalRedemptions: { $sum: 1 },
                        totalValue: { $sum: '$amount' },
                        uniqueCustomers: { $addToSet: '$userWalletAddress' },
                        averageTransactionValue: { $avg: '$amount' }
                    }
                },
                {
                    $project: {
                        merchantId: '$_id',
                        totalRedemptions: 1,
                        totalValue: 1,
                        uniqueCustomers: { $size: '$uniqueCustomers' },
                        averageTransactionValue: 1
                    }
                },
                { $sort: { totalValue: -1 } },
                { $limit: 10 }
            ]);

            // Get merchant performance by voucher type
            const merchantsByType = await Redemption.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            merchantId: '$merchantId',
                            voucherType: '$voucherType'
                        },
                        count: { $sum: 1 },
                        value: { $sum: '$amount' }
                    }
                }
            ]);

            // Get total merchant count
            const totalMerchants = await Merchant.countDocuments();

            // Get active merchants (those with redemptions in date range)
            const activeMerchants = await Redemption.distinct('merchantId', matchStage);

            return {
                totalMerchants,
                activeMerchants: activeMerchants.length,
                topPerformers: topMerchants,
                performanceByType: merchantsByType
            };

        } catch (error) {
            logger.error('Error getting merchant stats:', error);
            throw error;
        }
    }

    // Get voucher type distribution
    async getVoucherTypeDistribution(dateFilter = {}, filters = {}) {
        try {
            const matchStage = { ...dateFilter };
            
            if (filters.merchantId) {
                matchStage.merchantId = filters.merchantId;
            }

            const typeMapping = {
                '1': 'Education',
                '2': 'Healthcare', 
                '3': 'Transport',
                '4': 'Agriculture'
            };

            const distribution = await Voucher.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$voucherType',
                        totalMinted: { $sum: 1 },
                        totalValue: { $sum: '$amount' },
                        redeemed: { $sum: { $cond: ['$isRedeemed', 1, 0] } },
                        redeemedValue: { $sum: { $cond: ['$isRedeemed', '$amount', 0] } },
                        expired: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$expiryTimestamp', null] },
                                            { $lt: ['$expiryTimestamp', Date.now()] },
                                            { $eq: ['$isRedeemed', false] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        type: '$_id',
                        typeName: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$_id', '1'] }, then: 'Education' },
                                    { case: { $eq: ['$_id', '2'] }, then: 'Healthcare' },
                                    { case: { $eq: ['$_id', '3'] }, then: 'Transport' },
                                    { case: { $eq: ['$_id', '4'] }, then: 'Agriculture' }
                                ],
                                default: 'Unknown'
                            }
                        },
                        totalMinted: 1,
                        totalValue: 1,
                        redeemed: 1,
                        redeemedValue: 1,
                        expired: 1,
                        active: { $subtract: ['$totalMinted', { $add: ['$redeemed', '$expired'] }] },
                        redemptionRate: {
                            $cond: [
                                { $gt: ['$totalMinted', 0] },
                                { $multiply: [{ $divide: ['$redeemed', '$totalMinted'] }, 100] },
                                0
                            ]
                        }
                    }
                }
            ]);

            return distribution;

        } catch (error) {
            logger.error('Error getting voucher type distribution:', error);
            throw error;
        }
    }

    // Get expiry tracking statistics
    async getExpiryStats(dateFilter = {}, filters = {}) {
        try {
            const matchStage = { ...dateFilter };
            
            if (filters.merchantId) {
                matchStage.merchantId = filters.merchantId;
            }
            
            if (filters.voucherType) {
                matchStage.voucherType = filters.voucherType;
            }

            const now = Date.now();
            const oneDayFromNow = now + (24 * 60 * 60 * 1000);
            const oneWeekFromNow = now + (7 * 24 * 60 * 60 * 1000);
            const oneMonthFromNow = now + (30 * 24 * 60 * 60 * 1000);

            const expiryStats = await Voucher.aggregate([
                { $match: { ...matchStage, isRedeemed: false } },
                {
                    $group: {
                        _id: null,
                        totalActive: { $sum: 1 },
                        alreadyExpired: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$expiryTimestamp', null] },
                                            { $lt: ['$expiryTimestamp', now] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        expiringToday: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$expiryTimestamp', null] },
                                            { $gte: ['$expiryTimestamp', now] },
                                            { $lt: ['$expiryTimestamp', oneDayFromNow] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        expiringThisWeek: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$expiryTimestamp', null] },
                                            { $gte: ['$expiryTimestamp', now] },
                                            { $lt: ['$expiryTimestamp', oneWeekFromNow] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        expiringThisMonth: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$expiryTimestamp', null] },
                                            { $gte: ['$expiryTimestamp', now] },
                                            { $lt: ['$expiryTimestamp', oneMonthFromNow] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        totalExpiredValue: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$expiryTimestamp', null] },
                                            { $lt: ['$expiryTimestamp', now] }
                                        ]
                                    },
                                    '$amount',
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            // Get expiry trend by date
            const expiryTrend = await Voucher.aggregate([
                {
                    $match: {
                        ...matchStage,
                        isRedeemed: false,
                        expiryTimestamp: { $ne: null, $gte: now, $lt: oneMonthFromNow }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: { $toDate: '$expiryTimestamp' }
                                }
                            }
                        },
                        count: { $sum: 1 },
                        value: { $sum: '$amount' }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ]);

            const stats = expiryStats[0] || {
                totalActive: 0,
                alreadyExpired: 0,
                expiringToday: 0,
                expiringThisWeek: 0,
                expiringThisMonth: 0,
                totalExpiredValue: 0
            };

            return {
                ...stats,
                expiryTrend
            };

        } catch (error) {
            logger.error('Error getting expiry stats:', error);
            throw error;
        }
    }

    // Get financial summary and reports
    async getFinancialSummary(dateFilter = {}, filters = {}) {
        try {
            const matchStage = { ...dateFilter };
            
            if (filters.merchantId) {
                matchStage.merchantId = filters.merchantId;
            }
            
            if (filters.voucherType) {
                matchStage.voucherType = filters.voucherType;
            }

            // Get overall financial metrics
            const [voucherValue, redemptionValue] = await Promise.all([
                Voucher.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            _id: null,
                            totalMinted: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
                ]),
                Redemption.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            _id: null,
                            totalRedeemed: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);

            const mintedStats = voucherValue[0] || { totalMinted: 0, count: 0 };
            const redeemedStats = redemptionValue[0] || { totalRedeemed: 0, count: 0 };

            // Get financial breakdown by voucher type
            const typeBreakdown = await Voucher.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$voucherType',
                        totalMinted: { $sum: '$amount' },
                        countMinted: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'redemptions',
                        let: { voucherType: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$voucherType', '$$voucherType'] },
                                    ...matchStage
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    totalRedeemed: { $sum: '$amount' },
                                    countRedeemed: { $sum: 1 }
                                }
                            }
                        ],
                        as: 'redemptions'
                    }
                },
                {
                    $project: {
                        voucherType: '$_id',
                        totalMinted: 1,
                        countMinted: 1,
                        totalRedeemed: { 
                            $ifNull: [{ $arrayElemAt: ['$redemptions.totalRedeemed', 0] }, 0] 
                        },
                        countRedeemed: { 
                            $ifNull: [{ $arrayElemAt: ['$redemptions.countRedeemed', 0] }, 0] 
                        }
                    }
                },
                {
                    $addFields: {
                        remainingValue: { $subtract: ['$totalMinted', '$totalRedeemed'] },
                        utilizationRate: {
                            $cond: [
                                { $gt: ['$totalMinted', 0] },
                                { $multiply: [{ $divide: ['$totalRedeemed', '$totalMinted'] }, 100] },
                                0
                            ]
                        }
                    }
                }
            ]);

            return {
                totalValue: mintedStats.totalMinted,
                totalRedeemed: redeemedStats.totalRedeemed,
                remainingValue: mintedStats.totalMinted - redeemedStats.totalRedeemed,
                utilizationRate: mintedStats.totalMinted > 0 
                    ? ((redeemedStats.totalRedeemed / mintedStats.totalMinted) * 100).toFixed(2) 
                    : 0,
                vouchersMinted: mintedStats.count,
                vouchersRedeemed: redeemedStats.count,
                typeBreakdown
            };

        } catch (error) {
            logger.error('Error getting financial summary:', error);
            throw error;
        }
    }

    // Get trend data for charts
    async getTrendData(dateFilter = {}, filters = {}, period = 'daily') {
        try {
            const matchStage = { ...dateFilter };
            
            if (filters.merchantId) {
                matchStage.merchantId = filters.merchantId;
            }
            
            if (filters.voucherType) {
                matchStage.voucherType = filters.voucherType;
            }

            const groupBy = this.getGroupByPeriod(period);

            // Get voucher minting trends
            const mintingTrend = await Voucher.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: groupBy,
                        vouchersMinted: { $sum: 1 },
                        valueMinted: { $sum: '$amount' }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            // Get redemption trends
            const redemptionTrend = await Redemption.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: groupBy,
                        vouchersRedeemed: { $sum: 1 },
                        valueRedeemed: { $sum: '$amount' }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            return {
                mintingTrend,
                redemptionTrend,
                period
            };

        } catch (error) {
            logger.error('Error getting trend data:', error);
            throw error;
        }
    }

    // Helper methods
    buildDateFilter(dateRange) {
        if (!dateRange) return {};
        
        const filter = {};
        
        if (dateRange.start && dateRange.end) {
            filter.createdAt = {
                $gte: new Date(dateRange.start),
                $lte: new Date(dateRange.end)
            };
        } else if (dateRange.start) {
            filter.createdAt = { $gte: new Date(dateRange.start) };
        } else if (dateRange.end) {
            filter.createdAt = { $lte: new Date(dateRange.end) };
        }

        return filter;
    }

    getGroupByPeriod(period) {
        switch (period) {
            case 'hourly':
                return {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                    hour: { $hour: '$createdAt' }
                };
            case 'daily':
                return {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
            case 'weekly':
                return {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
            case 'monthly':
                return {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
            default:
                return {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
        }
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Clean up old cache entries
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    // Clear cache when data changes
    clearCache() {
        this.cache.clear();
    }
}

module.exports = new AnalyticsDashboard();