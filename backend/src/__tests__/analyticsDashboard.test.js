const analyticsDashboard = require('../utils/analyticsDashboard');
const Voucher = require('../models/Voucher');
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const { connectDB, disconnectDB } = require('../config/database');
const mongoose = require('mongoose');

describe('Analytics Dashboard', () => {
    let testMerchant;
    let testVouchers;
    let testRedemptions;

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    beforeEach(async () => {
        // Clear collections
        await Voucher.deleteMany({});
        await Redemption.deleteMany({});
        await Merchant.deleteMany({});

        // Create test merchant
        testMerchant = await Merchant.create({
            address: '0x123456789abcdef',
            name: 'Test Merchant',
            email: 'test@merchant.com',
            category: 'Healthcare',
            isVerified: true
        });

        // Create test vouchers
        testVouchers = await Voucher.insertMany([
            {
                voucherId: 'V123456789',
                merchantId: testMerchant.address,
                merchantName: testMerchant.name,
                value: 100,
                voucherType: 1,
                description: 'Education voucher',
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'active'
            },
            {
                voucherId: 'V987654321',
                merchantId: testMerchant.address,
                merchantName: testMerchant.name,
                value: 200,
                voucherType: 2,
                description: 'Healthcare voucher',
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'redeemed'
            },
            {
                voucherId: 'V555555555',
                merchantId: testMerchant.address,
                merchantName: testMerchant.name,
                value: 50,
                voucherType: 3,
                description: 'Transport voucher',
                expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired
                status: 'expired'
            }
        ]);

        // Create test redemptions
        testRedemptions = await Redemption.insertMany([
            {
                voucherId: 'V987654321',
                userAddress: '0xuser123',
                merchantAddress: testMerchant.address,
                voucherType: 2,
                value: 200,
                timestamp: new Date(),
                status: 'completed'
            },
            {
                voucherId: 'V111111111',
                userAddress: '0xuser456',
                merchantAddress: testMerchant.address,
                voucherType: 1,
                value: 150,
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                status: 'completed'
            }
        ]);

        // Clear cache before each test
        analyticsDashboard.clearCache();
    });

    describe('getDashboardOverview', () => {
        test('should return comprehensive dashboard overview', async () => {
            const dashboard = await analyticsDashboard.getDashboardOverview();

            expect(dashboard).toHaveProperty('summary');
            expect(dashboard).toHaveProperty('recentMetrics');
            expect(dashboard).toHaveProperty('topMerchants');
            expect(dashboard).toHaveProperty('voucherTypeDistribution');
            expect(dashboard).toHaveProperty('expiryAlerts');
            expect(dashboard).toHaveProperty('financialSummary');

            expect(dashboard.summary.totalVouchers).toBeGreaterThan(0);
            expect(dashboard.summary.totalRedemptions).toBeGreaterThan(0);
            expect(dashboard.summary.activeMerchants).toBeGreaterThan(0);
        });

        test('should filter by date range', async () => {
            const filters = {
                dateRange: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString()
                }
            };

            const dashboard = await analyticsDashboard.getDashboardOverview(filters);
            expect(dashboard.summary).toBeDefined();
        });

        test('should filter by merchant', async () => {
            const filters = { merchantId: testMerchant.address };
            const dashboard = await analyticsDashboard.getDashboardOverview(filters);
            
            expect(dashboard.summary).toBeDefined();
        });
    });

    describe('getVoucherStats', () => {
        test('should return voucher statistics', async () => {
            const stats = await analyticsDashboard.getVoucherStats();

            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('active');
            expect(stats).toHaveProperty('redeemed');
            expect(stats).toHaveProperty('expired');
            expect(stats).toHaveProperty('totalValue');
            expect(stats).toHaveProperty('byType');

            expect(stats.total).toBe(3);
            expect(stats.active).toBe(1);
            expect(stats.redeemed).toBe(1);
            expect(stats.expired).toBe(1);
            expect(Array.isArray(stats.byType)).toBe(true);
        });

        test('should filter vouchers by date', async () => {
            const dateFilter = {
                createdAt: {
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            };

            const stats = await analyticsDashboard.getVoucherStats(dateFilter);
            expect(stats.total).toBeGreaterThanOrEqual(0);
        });

        test('should filter vouchers by merchant', async () => {
            const stats = await analyticsDashboard.getVoucherStats({}, { 
                merchantId: testMerchant.address 
            });

            expect(stats.total).toBe(3);
        });

        test('should filter vouchers by type', async () => {
            const stats = await analyticsDashboard.getVoucherStats({}, { 
                voucherType: '1' 
            });

            expect(stats.total).toBe(1);
        });
    });

    describe('getRedemptionStats', () => {
        test('should return redemption statistics', async () => {
            const stats = await analyticsDashboard.getRedemptionStats();

            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('totalValue');
            expect(stats).toHaveProperty('averageValue');
            expect(stats).toHaveProperty('uniqueUsers');
            expect(stats).toHaveProperty('uniqueMerchants');

            expect(stats.total).toBe(2);
            expect(stats.totalValue).toBe(350);
            expect(stats.averageValue).toBe(175);
            expect(stats.uniqueUsers).toBe(2);
            expect(stats.uniqueMerchants).toBe(1);
        });

        test('should filter redemptions by date', async () => {
            const dateFilter = {
                createdAt: {
                    $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) // Last 12 hours
                }
            };

            const stats = await analyticsDashboard.getRedemptionStats(dateFilter);
            expect(stats.total).toBe(1); // Only today's redemption
        });

        test('should filter redemptions by merchant', async () => {
            const stats = await analyticsDashboard.getRedemptionStats({}, { 
                merchantId: testMerchant.address 
            });

            expect(stats.total).toBe(2);
        });
    });

    describe('getMerchantStats', () => {
        test('should return merchant statistics', async () => {
            const stats = await analyticsDashboard.getMerchantStats();

            expect(stats).toHaveProperty('totalMerchants');
            expect(stats).toHaveProperty('activeMerchants');
            expect(stats).toHaveProperty('topPerformers');
            expect(stats).toHaveProperty('performanceByType');

            expect(stats.totalMerchants).toBeGreaterThan(0);
            expect(Array.isArray(stats.topPerformers)).toBe(true);
            expect(Array.isArray(stats.performanceByType)).toBe(true);
        });

        test('should filter merchant stats by specific merchant', async () => {
            const stats = await analyticsDashboard.getMerchantStats({}, { 
                merchantId: testMerchant.address 
            });

            expect(stats.totalMerchants).toBe(1);
        });
    });

    describe('getVoucherTypeDistribution', () => {
        test('should return voucher type distribution', async () => {
            const distribution = await analyticsDashboard.getVoucherTypeDistribution();

            expect(Array.isArray(distribution)).toBe(true);
            expect(distribution[0]).toHaveProperty('_id');
            expect(distribution[0]).toHaveProperty('count');
            expect(distribution[0]).toHaveProperty('totalValue');

            // Should have at least 3 types from our test data
            expect(distribution.length).toBeGreaterThanOrEqual(3);
        });

        test('should be empty when no vouchers exist', async () => {
            await Voucher.deleteMany({});
            
            const distribution = await analyticsDashboard.getVoucherTypeDistribution();
            expect(Array.isArray(distribution)).toBe(true);
            expect(distribution.length).toBe(0);
        });
    });

    describe('getExpiryStats', () => {
        test('should return expiry statistics', async () => {
            const stats = await analyticsDashboard.getExpiryStats();

            expect(stats).toHaveProperty('expiringIn7Days');
            expect(stats).toHaveProperty('expiringIn30Days');
            expect(stats).toHaveProperty('expired');
            expect(stats).toHaveProperty('totalActive');

            expect(stats.expired).toBe(1); // One expired voucher
            expect(stats.expiringIn7Days).toBeGreaterThanOrEqual(1); // Healthcare voucher expires in 7 days
        });

        test('should filter expiry stats by voucher type', async () => {
            const stats = await analyticsDashboard.getExpiryStats({}, { voucherType: '2' });
            
            expect(stats.expiringIn7Days).toBe(1); // Healthcare voucher
        });
    });

    describe('getFinancialSummary', () => {
        test('should return financial summary', async () => {
            const summary = await analyticsDashboard.getFinancialSummary();

            expect(summary).toHaveProperty('totalValue');
            expect(summary).toHaveProperty('totalRedeemed');
            expect(summary).toHaveProperty('remainingValue');
            expect(summary).toHaveProperty('utilizationRate');
            expect(summary).toHaveProperty('vouchersMinted');
            expect(summary).toHaveProperty('vouchersRedeemed');

            expect(summary.totalValue).toBe(350); // Total value of all vouchers
            expect(summary.totalRedeemed).toBe(350); // Total redeemed value
            expect(summary.utilizationRate).toBeGreaterThan(0);
        });

        test('should filter financial summary by voucher type', async () => {
            const summary = await analyticsDashboard.getFinancialSummary({}, { voucherType: '1' });
            
            expect(summary.vouchersMinted).toBe(1);
        });
    });

    describe('getTrendData', () => {
        test('should return daily trend data by default', async () => {
            const trends = await analyticsDashboard.getTrendData();

            expect(trends).toHaveProperty('vouchers');
            expect(trends).toHaveProperty('redemptions');
            expect(trends).toHaveProperty('period');

            expect(Array.isArray(trends.vouchers)).toBe(true);
            expect(Array.isArray(trends.redemptions)).toBe(true);
            expect(trends.period).toBe('daily');
        });

        test('should return weekly trend data when specified', async () => {
            const trends = await analyticsDashboard.getTrendData({}, {}, 'weekly');

            expect(trends.period).toBe('weekly');
            expect(Array.isArray(trends.vouchers)).toBe(true);
            expect(Array.isArray(trends.redemptions)).toBe(true);
        });

        test('should handle empty data gracefully', async () => {
            await Voucher.deleteMany({});
            await Redemption.deleteMany({});

            const trends = await analyticsDashboard.getTrendData();
            
            expect(trends.vouchers).toHaveLength(0);
            expect(trends.redemptions).toHaveLength(0);
        });
    });

    describe('Cache Management', () => {
        test('should cache dashboard results', async () => {
            // First call should fetch from database
            const start1 = Date.now();
            const dashboard1 = await analyticsDashboard.getDashboardOverview();
            const time1 = Date.now() - start1;

            // Second call should be faster (from cache)
            const start2 = Date.now();
            const dashboard2 = await analyticsDashboard.getDashboardOverview();
            const time2 = Date.now() - start2;

            expect(dashboard1).toEqual(dashboard2);
            expect(time2).toBeLessThan(time1); // Cache should be faster
        });

        test('should clear cache when requested', () => {
            expect(() => {
                analyticsDashboard.clearCache();
            }).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        test('should handle database errors gracefully', async () => {
            // Mock a database error
            const originalFind = Voucher.find;
            Voucher.find = jest.fn().mockRejectedValue(new Error('Database error'));

            await expect(analyticsDashboard.getVoucherStats()).rejects.toThrow('Database error');

            // Restore original method
            Voucher.find = originalFind;
        });

        test('should handle invalid date filters', async () => {
            const invalidDateFilter = {
                createdAt: { $gte: 'invalid-date' }
            };

            await expect(
                analyticsDashboard.getVoucherStats(invalidDateFilter)
            ).rejects.toThrow();
        });
    });

    describe('Performance', () => {
        test('should handle large datasets efficiently', async () => {
            // Create many test vouchers
            const manyVouchers = Array.from({ length: 100 }, (_, i) => ({
                voucherId: `V${i.toString().padStart(8, '0')}`,
                merchantId: testMerchant.address,
                merchantName: testMerchant.name,
                value: 100,
                voucherType: (i % 4) + 1,
                description: `Test voucher ${i}`,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: i % 3 === 0 ? 'redeemed' : 'active'
            }));

            await Voucher.insertMany(manyVouchers);

            const start = Date.now();
            const stats = await analyticsDashboard.getVoucherStats();
            const duration = Date.now() - start;

            expect(stats.total).toBe(103); // 3 original + 100 new
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });
    });
});