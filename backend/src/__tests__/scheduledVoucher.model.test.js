const mongoose = require('mongoose');
const ScheduledVoucher = require('../models/ScheduledVoucher');

describe('ScheduledVoucher Model', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servicepass-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await ScheduledVoucher.deleteMany({});
    });

    describe('Scheduled Voucher Creation', () => {
        test('should create a valid scheduled voucher', async () => {
            const scheduleData = {
                scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
                voucherType: 1,
                amount: 500,
                recipient: '0x' + '1'.repeat(64),
                merchantId: 'merchant_123',
                expiryTimestamp: Date.now() + 2592000000, // 30 days
                createdBy: new mongoose.Types.ObjectId()
            };

            const schedule = new ScheduledVoucher(scheduleData);
            const saved = await schedule.save();

            expect(saved._id).toBeDefined();
            expect(saved.scheduleId).toBeDefined();
            expect(saved.status).toBe('pending');
            expect(saved.voucherType).toBe(scheduleData.voucherType);
            expect(saved.amount).toBe(scheduleData.amount);
        });

        test('should generate unique scheduleId', async () => {
            const tomorrow = new Date(Date.now() + 86400000);
            
            const schedule1 = new ScheduledVoucher({
                scheduledFor: tomorrow,
                voucherType: 1,
                amount: 100,
                recipient: '0x' + '1'.repeat(64),
                merchantId: 'merchant_1',
                expiryTimestamp: Date.now() + 2592000000,
                createdBy: new mongoose.Types.ObjectId()
            });

            const schedule2 = new ScheduledVoucher({
                scheduledFor: tomorrow,
                voucherType: 2,
                amount: 200,
                recipient: '0x' + '2'.repeat(64),
                merchantId: 'merchant_2',
                expiryTimestamp: Date.now() + 2592000000,
                createdBy: new mongoose.Types.ObjectId()
            });

            const saved1 = await schedule1.save();
            const saved2 = await schedule2.save();

            expect(saved1.scheduleId).not.toBe(saved2.scheduleId);
        });

        test('should require essential fields', async () => {
            const schedule = new ScheduledVoucher({
                scheduledFor: new Date()
                // Missing required fields
            });

            await expect(schedule.save()).rejects.toThrow();
        });
    });

    describe('Status Management', () => {
        let schedule;

        beforeEach(async () => {
            schedule = await ScheduledVoucher.create({
                scheduledFor: new Date(Date.now() + 86400000),
                voucherType: 1,
                amount: 500,
                recipient: '0x' + '1'.repeat(64),
                merchantId: 'merchant_123',
                expiryTimestamp: Date.now() + 2592000000,
                createdBy: new mongoose.Types.ObjectId()
            });
        });

        test('should mark as processing', async () => {
            await schedule.markProcessing();
            expect(schedule.status).toBe('processing');
            expect(schedule.processedAt).toBeDefined();
        });

        test('should mark as completed', async () => {
            const voucherId = 'voucher_123';
            await schedule.markCompleted(voucherId);
            
            expect(schedule.status).toBe('completed');
            expect(schedule.voucherId).toBe(voucherId);
            expect(schedule.completedAt).toBeDefined();
        });

        test('should mark as failed with error', async () => {
            const error = 'Test error message';
            await schedule.markFailed(error);
            
            expect(schedule.status).toBe('failed');
            expect(schedule.error).toBe(error);
            expect(schedule.retryCount).toBe(1);
        });

        test('should increment retry count on multiple failures', async () => {
            await schedule.markFailed('Error 1');
            expect(schedule.retryCount).toBe(1);
            
            await schedule.markFailed('Error 2');
            expect(schedule.retryCount).toBe(2);
            
            await schedule.markFailed('Error 3');
            expect(schedule.retryCount).toBe(3);
        });

        test('should mark as cancelled', async () => {
            await schedule.markCancelled();
            expect(schedule.status).toBe('cancelled');
        });
    });

    describe('Recurring Schedules', () => {
        test('should create recurring schedule', async () => {
            const schedule = await ScheduledVoucher.create({
                scheduledFor: new Date(Date.now() + 86400000),
                voucherType: 1,
                amount: 500,
                recipient: '0x' + '1'.repeat(64),
                merchantId: 'merchant_123',
                expiryTimestamp: Date.now() + 2592000000,
                createdBy: new mongoose.Types.ObjectId(),
                recurringSchedule: {
                    enabled: true,
                    frequency: 'monthly',
                    endDate: new Date(Date.now() + 31536000000) // 1 year
                }
            });

            expect(schedule.recurringSchedule.enabled).toBe(true);
            expect(schedule.recurringSchedule.frequency).toBe('monthly');
            expect(schedule.recurringSchedule.endDate).toBeDefined();
        });

        test('should validate frequency options', async () => {
            const schedule = new ScheduledVoucher({
                scheduledFor: new Date(Date.now() + 86400000),
                voucherType: 1,
                amount: 500,
                recipient: '0x' + '1'.repeat(64),
                merchantId: 'merchant_123',
                expiryTimestamp: Date.now() + 2592000000,
                createdBy: new mongoose.Types.ObjectId(),
                recurringSchedule: {
                    enabled: true,
                    frequency: 'invalid' // Invalid frequency
                }
            });

            await expect(schedule.save()).rejects.toThrow();
        });
    });

    describe('Query Methods', () => {
        beforeEach(async () => {
            const now = Date.now();
            await ScheduledVoucher.create([
                {
                    scheduleId: 'sched_1',
                    scheduledFor: new Date(now - 86400000), // Yesterday
                    voucherType: 1,
                    amount: 100,
                    recipient: '0x' + '1'.repeat(64),
                    merchantId: 'merchant_1',
                    expiryTimestamp: now + 2592000000,
                    createdBy: new mongoose.Types.ObjectId(),
                    status: 'pending'
                },
                {
                    scheduleId: 'sched_2',
                    scheduledFor: new Date(now + 86400000), // Tomorrow
                    voucherType: 1,
                    amount: 200,
                    recipient: '0x' + '2'.repeat(64),
                    merchantId: 'merchant_2',
                    expiryTimestamp: now + 2592000000,
                    createdBy: new mongoose.Types.ObjectId(),
                    status: 'pending'
                },
                {
                    scheduleId: 'sched_3',
                    scheduledFor: new Date(now - 3600000), // 1 hour ago
                    voucherType: 1,
                    amount: 300,
                    recipient: '0x' + '3'.repeat(64),
                    merchantId: 'merchant_3',
                    expiryTimestamp: now + 2592000000,
                    createdBy: new mongoose.Types.ObjectId(),
                    status: 'completed'
                }
            ]);
        });

        test('should find ready schedules', async () => {
            const ready = await ScheduledVoucher.findReady();
            expect(ready.length).toBeGreaterThan(0);
            expect(ready.every(s => s.status === 'pending')).toBe(true);
            expect(ready.every(s => s.scheduledFor <= new Date())).toBe(true);
        });

        test('should find pending schedules', async () => {
            const pending = await ScheduledVoucher.findPending();
            expect(pending.length).toBe(2);
            expect(pending.every(s => s.status === 'pending')).toBe(true);
        });
    });

    describe('Template Integration', () => {
        test('should store template reference', async () => {
            const schedule = await ScheduledVoucher.create({
                scheduledFor: new Date(Date.now() + 86400000),
                voucherType: 1,
                amount: 500,
                recipient: '0x' + '1'.repeat(64),
                merchantId: 'merchant_123',
                expiryTimestamp: Date.now() + 2592000000,
                createdBy: new mongoose.Types.ObjectId(),
                templateId: 'template_123'
            });

            expect(schedule.templateId).toBe('template_123');
        });
    });
});
