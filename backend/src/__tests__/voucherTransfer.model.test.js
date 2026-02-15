const mongoose = require('mongoose');
const VoucherTransfer = require('../models/VoucherTransfer');

describe('VoucherTransfer Model', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servicepass-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await VoucherTransfer.deleteMany({});
    });

    describe('Transfer Creation', () => {
        test('should create a valid transfer', async () => {
            const transferData = {
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'full',
                amount: 500,
                initiatedBy: new mongoose.Types.ObjectId()
            };

            const transfer = new VoucherTransfer(transferData);
            const saved = await transfer.save();

            expect(saved._id).toBeDefined();
            expect(saved.transferId).toBeDefined();
            expect(saved.status).toBe('pending');
            expect(saved.voucherId).toBe(transferData.voucherId);
            expect(saved.transferType).toBe('full');
        });

        test('should generate unique transferId', async () => {
            const userId = new mongoose.Types.ObjectId();
            
            const transfer1 = new VoucherTransfer({
                voucherId: 'voucher_1',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'full',
                amount: 100,
                initiatedBy: userId
            });

            const transfer2 = new VoucherTransfer({
                voucherId: 'voucher_2',
                fromAddress: '0x' + '3'.repeat(64),
                toAddress: '0x' + '4'.repeat(64),
                transferType: 'partial',
                amount: 200,
                initiatedBy: userId
            });

            const saved1 = await transfer1.save();
            const saved2 = await transfer2.save();

            expect(saved1.transferId).not.toBe(saved2.transferId);
        });

        test('should validate transfer type', async () => {
            const transfer = new VoucherTransfer({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'invalid',
                initiatedBy: new mongoose.Types.ObjectId()
            });

            await expect(transfer.save()).rejects.toThrow();
        });

        test('should require essential fields', async () => {
            const transfer = new VoucherTransfer({
                voucherId: 'voucher_123'
                // Missing required fields
            });

            await expect(transfer.save()).rejects.toThrow();
        });
    });

    describe('Transfer Status Management', () => {
        let transfer;

        beforeEach(async () => {
            transfer = await VoucherTransfer.create({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'full',
                amount: 500,
                initiatedBy: new mongoose.Types.ObjectId(),
                requiresApproval: true
            });
        });

        test('should approve transfer', async () => {
            const approver = new mongoose.Types.ObjectId();
            await transfer.approve(approver, 'Transfer approved');
            
            expect(transfer.status).toBe('approved');
            expect(transfer.approvedAt).toBeDefined();
            expect(transfer.approvedBy.toString()).toBe(approver.toString());
            expect(transfer.approvalComment).toBe('Transfer approved');
        });

        test('should reject transfer', async () => {
            const rejector = new mongoose.Types.ObjectId();
            await transfer.reject(rejector, 'Invalid transfer');
            
            expect(transfer.status).toBe('rejected');
            expect(transfer.rejectedAt).toBeDefined();
            expect(transfer.rejectedBy.toString()).toBe(rejector.toString());
            expect(transfer.rejectionReason).toBe('Invalid transfer');
        });

        test('should complete transfer', async () => {
            const txHash = '0xabc123...';
            await transfer.complete(txHash);
            
            expect(transfer.status).toBe('completed');
            expect(transfer.completedAt).toBeDefined();
            expect(transfer.transactionHash).toBe(txHash);
        });

        test('should mark transfer as failed', async () => {
            const error = 'Transaction failed';
            await transfer.markFailed(error);
            
            expect(transfer.status).toBe('failed');
            expect(transfer.error).toBe(error);
        });
    });

    describe('Approval Requirements', () => {
        test('should flag transfers requiring approval', async () => {
            const transfer = await VoucherTransfer.create({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'full',
                amount: 500,
                initiatedBy: new mongoose.Types.ObjectId(),
                requiresApproval: true
            });

            expect(transfer.requiresApproval).toBe(true);
            expect(transfer.status).toBe('pending');
        });

        test('should allow transfers without approval', async () => {
            const transfer = await VoucherTransfer.create({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'full',
                amount: 500,
                initiatedBy: new mongoose.Types.ObjectId(),
                requiresApproval: false
            });

            expect(transfer.requiresApproval).toBe(false);
        });
    });

    describe('Partial Transfers', () => {
        test('should create partial transfer with amount', async () => {
            const transfer = await VoucherTransfer.create({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'partial',
                amount: 250,
                initiatedBy: new mongoose.Types.ObjectId()
            });

            expect(transfer.transferType).toBe('partial');
            expect(transfer.amount).toBe(250);
        });

        test('should require amount for partial transfers', async () => {
            const transfer = new VoucherTransfer({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'partial',
                initiatedBy: new mongoose.Types.ObjectId()
                // Missing amount
            });

            await expect(transfer.save()).rejects.toThrow();
        });
    });

    describe('Query Methods', () => {
        beforeEach(async () => {
            const userId = new mongoose.Types.ObjectId();
            const voucherId = 'voucher_123';

            await VoucherTransfer.create([
                {
                    voucherId,
                    fromAddress: '0x' + '1'.repeat(64),
                    toAddress: '0x' + '2'.repeat(64),
                    transferType: 'full',
                    initiatedBy: userId,
                    status: 'pending'
                },
                {
                    voucherId,
                    fromAddress: '0x' + '2'.repeat(64),
                    toAddress: '0x' + '3'.repeat(64),
                    transferType: 'full',
                    initiatedBy: userId,
                    status: 'completed'
                },
                {
                    voucherId: 'voucher_456',
                    fromAddress: '0x' + '3'.repeat(64),
                    toAddress: '0x' + '4'.repeat(64),
                    transferType: 'partial',
                    amount: 100,
                    initiatedBy: userId,
                    status: 'approved'
                }
            ]);
        });

        test('should get transfer history for voucher', async () => {
            const history = await VoucherTransfer.getVoucherHistory('voucher_123');
            expect(history).toHaveLength(2);
            expect(history.every(t => t.voucherId === 'voucher_123')).toBe(true);
        });

        test('should sort history by date descending', async () => {
            const history = await VoucherTransfer.getVoucherHistory('voucher_123');
            
            for (let i = 1; i < history.length; i++) {
                expect(history[i - 1].createdAt >= history[i].createdAt).toBe(true);
            }
        });
    });

    describe('Metadata', () => {
        test('should store transfer metadata', async () => {
            const transfer = await VoucherTransfer.create({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'full',
                initiatedBy: new mongoose.Types.ObjectId(),
                metadata: {
                    reason: 'Gift',
                    notes: 'Birthday present',
                    customField: 'value'
                }
            });

            expect(transfer.metadata.reason).toBe('Gift');
            expect(transfer.metadata.notes).toBe('Birthday present');
            expect(transfer.metadata.customField).toBe('value');
        });
    });

    describe('Transfer Lifecycle', () => {
        test('should track complete transfer lifecycle', async () => {
            const initiator = new mongoose.Types.ObjectId();
            const approver = new mongoose.Types.ObjectId();

            // Create transfer
            const transfer = await VoucherTransfer.create({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'full',
                amount: 500,
                initiatedBy: initiator,
                requiresApproval: true
            });

            expect(transfer.status).toBe('pending');

            // Approve
            await transfer.approve(approver, 'Approved');
            expect(transfer.status).toBe('approved');
            expect(transfer.approvedAt).toBeDefined();

            // Complete
            await transfer.complete('0xtxhash123');
            expect(transfer.status).toBe('completed');
            expect(transfer.completedAt).toBeDefined();
            expect(transfer.transactionHash).toBe('0xtxhash123');
        });

        test('should handle rejection workflow', async () => {
            const initiator = new mongoose.Types.ObjectId();
            const rejector = new mongoose.Types.ObjectId();

            const transfer = await VoucherTransfer.create({
                voucherId: 'voucher_123',
                fromAddress: '0x' + '1'.repeat(64),
                toAddress: '0x' + '2'.repeat(64),
                transferType: 'full',
                initiatedBy: initiator,
                requiresApproval: true
            });

            await transfer.reject(rejector, 'Suspicious activity');
            
            expect(transfer.status).toBe('rejected');
            expect(transfer.rejectionReason).toBe('Suspicious activity');
            expect(transfer.rejectedBy.toString()).toBe(rejector.toString());
        });
    });
});
