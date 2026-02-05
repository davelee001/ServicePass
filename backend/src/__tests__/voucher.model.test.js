const Voucher = require('../models/Voucher');
require('./setup');

describe('Voucher Model', () => {
    describe('Validation', () => {
        it('should create a valid voucher', async () => {
            const validVoucher = {
                voucherId: 'test-voucher-123',
                voucherType: 'EDU',
                amount: 1000,
                recipient: '0x123abc',
                merchantId: 'merchant-001',
                expiryTimestamp: Date.now() + 86400000,
                qrCodeData: 'data:image/png;base64,iVBORw0KG...',
                signature: 'abcd1234signature',
                transactionDigest: 'txn-digest-123',
            };

            const voucher = new Voucher(validVoucher);
            const savedVoucher = await voucher.save();

            expect(savedVoucher._id).toBeDefined();
            expect(savedVoucher.voucherId).toBe(validVoucher.voucherId);
            expect(savedVoucher.voucherType).toBe(validVoucher.voucherType);
            expect(savedVoucher.amount).toBe(validVoucher.amount);
            expect(savedVoucher.recipient).toBe(validVoucher.recipient);
            expect(savedVoucher.merchantId).toBe(validVoucher.merchantId);
            expect(savedVoucher.signature).toBe(validVoucher.signature);
        });

        it('should fail without required fields', async () => {
            const invalidVoucher = new Voucher({
                voucherType: 'EDU',
                amount: 1000,
            });

            await expect(invalidVoucher.save()).rejects.toThrow();
        });

        it('should fail with duplicate voucherId', async () => {
            const voucher1 = new Voucher({
                voucherId: 'duplicate-id',
                voucherType: 'HEALTH',
                amount: 500,
                recipient: '0x456def',
                merchantId: 'merchant-002',
                transactionDigest: 'txn-1',
            });

            await voucher1.save();

            const voucher2 = new Voucher({
                voucherId: 'duplicate-id',
                voucherType: 'TRANSPORT',
                amount: 300,
                recipient: '0x789ghi',
                merchantId: 'merchant-003',
                transactionDigest: 'txn-2',
            });

            await expect(voucher2.save()).rejects.toThrow();
        });
    });

    describe('Query Operations', () => {
        beforeEach(async () => {
            await Voucher.create([
                {
                    voucherId: 'voucher-1',
                    voucherType: 'EDU',
                    amount: 1000,
                    recipient: '0x111',
                    merchantId: 'merchant-1',
                    transactionDigest: 'txn-1',
                },
                {
                    voucherId: 'voucher-2',
                    voucherType: 'HEALTH',
                    amount: 2000,
                    recipient: '0x222',
                    merchantId: 'merchant-1',
                    transactionDigest: 'txn-2',
                },
                {
                    voucherId: 'voucher-3',
                    voucherType: 'EDU',
                    amount: 1500,
                    recipient: '0x111',
                    merchantId: 'merchant-2',
                    transactionDigest: 'txn-3',
                },
            ]);
        });

        it('should find voucher by voucherId', async () => {
            const voucher = await Voucher.findOne({ voucherId: 'voucher-1' });
            expect(voucher).toBeDefined();
            expect(voucher.voucherType).toBe('EDU');
        });

        it('should find all vouchers by recipient', async () => {
            const vouchers = await Voucher.find({ recipient: '0x111' });
            expect(vouchers).toHaveLength(2);
        });

        it('should find vouchers by merchant', async () => {
            const vouchers = await Voucher.find({ merchantId: 'merchant-1' });
            expect(vouchers).toHaveLength(2);
        });

        it('should find vouchers by type', async () => {
            const vouchers = await Voucher.find({ voucherType: 'EDU' });
            expect(vouchers).toHaveLength(2);
        });
    });
});
