const mongoose = require('mongoose');
const MultiSigOperation = require('../models/MultiSigOperation');

describe('MultiSigOperation Model', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servicepass-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await MultiSigOperation.deleteMany({});
    });

    describe('Operation Creation', () => {
        test('should create a valid multi-sig operation', async () => {
            const operationData = {
                operationType: 'CREATE_VOUCHER_BATCH',
                operationData: { voucherCount: 100, type: 1 },
                initiatedBy: new mongoose.Types.ObjectId(),
                requiredSignatures: 2
            };

            const operation = new MultiSigOperation(operationData);
            const saved = await operation.save();

            expect(saved._id).toBeDefined();
            expect(saved.operationId).toBeDefined();
            expect(saved.status).toBe('pending');
            expect(saved.signatures).toHaveLength(0);
            expect(saved.requiredSignatures).toBe(2);
        });

        test('should generate unique operationId', async () => {
            const op1 = new MultiSigOperation({
                operationType: 'CREATE_VOUCHER_BATCH',
                operationData: { count: 100 },
                initiatedBy: new mongoose.Types.ObjectId(),
                requiredSignatures: 2
            });

            const op2 = new MultiSigOperation({
                operationType: 'BULK_TRANSFER',
                operationData: { count: 50 },
                initiatedBy: new mongoose.Types.ObjectId(),
                requiredSignatures: 3
            });

            const saved1 = await op1.save();
            const saved2 = await op2.save();

            expect(saved1.operationId).not.toBe(saved2.operationId);
        });

        test('should validate operation type', async () => {
            const operation = new MultiSigOperation({
                operationType: 'INVALID_TYPE',
                operationData: {},
                initiatedBy: new mongoose.Types.ObjectId(),
                requiredSignatures: 2
            });

            await expect(operation.save()).rejects.toThrow();
        });

        test('should validate required signatures range', async () => {
            const operation = new MultiSigOperation({
                operationType: 'CREATE_VOUCHER_BATCH',
                operationData: {},
                initiatedBy: new mongoose.Types.ObjectId(),
                requiredSignatures: 15 // Too many
            });

            await expect(operation.save()).rejects.toThrow();
        });

        test('should set default expiry to 24 hours', async () => {
            const operation = new MultiSigOperation({
                operationType: 'CREATE_VOUCHER_BATCH',
                operationData: {},
                initiatedBy: new mongoose.Types.ObjectId(),
                requiredSignatures: 2
            });

            const saved = await operation.save();
            const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            expect(saved.expiresAt).toBeDefined();
            expect(Math.abs(saved.expiresAt - expectedExpiry)).toBeLessThan(1000);
        });
    });

    describe('Signature Management', () => {
        let operation;
        let adminId1, adminId2, adminId3;

        beforeEach(async () => {
            adminId1 = new mongoose.Types.ObjectId();
            adminId2 = new mongoose.Types.ObjectId();
            adminId3 = new mongoose.Types.ObjectId();

            operation = await MultiSigOperation.create({
                operationType: 'CREATE_VOUCHER_BATCH',
                operationData: { count: 100 },
                initiatedBy: adminId1,
                requiredSignatures: 2
            });
        });

        test('should add signature', async () => {
            await operation.addSignature(adminId2, 'Approved - looks good');
            
            expect(operation.signatures).toHaveLength(1);
            expect(operation.signatures[0].signedBy.toString()).toBe(adminId2.toString());
            expect(operation.signatures[0].comment).toBe('Approved - looks good');
            expect(operation.signatures[0].signedAt).toBeDefined();
        });

        test('should prevent duplicate signature from same admin', async () => {
            await operation.addSignature(adminId2);
            
            await expect(operation.addSignature(adminId2)).rejects.toThrow('already signed');
        });

        test('should auto-approve when required signatures reached', async () => {
            await operation.addSignature(adminId2);
            expect(operation.status).toBe('pending');
            
            await operation.addSignature(adminId3);
            expect(operation.status).toBe('approved');
            expect(operation.approvedAt).toBeDefined();
        });

        test('should track who signed', async () => {
            await operation.addSignature(adminId2);
            await operation.addSignature(adminId3);

            const signers = operation.signatures.map(s => s.signedBy.toString());
            expect(signers).toContain(adminId2.toString());
            expect(signers).toContain(adminId3.toString());
        });
    });

    describe('Operation Status', () => {
        let operation;

        beforeEach(async () => {
            operation = await MultiSigOperation.create({
                operationType: 'BULK_TRANSFER',
                operationData: { count: 50 },
                initiatedBy: new mongoose.Types.ObjectId(),
                requiredSignatures: 2
            });
        });

        test('should mark as executed', async () => {
            const result = { success: true, count: 50 };
            await operation.markExecuted(result);
            
            expect(operation.status).toBe('executed');
            expect(operation.executedAt).toBeDefined();
            expect(operation.executionResult).toEqual(result);
        });

        test('should mark as rejected', async () => {
            const reason = 'Security concerns';
            await operation.markRejected(reason);
            
            expect(operation.status).toBe('rejected');
            expect(operation.rejectionReason).toBe(reason);
        });

        test('should mark as expired', async () => {
            await operation.markExpired();
            expect(operation.status).toBe('expired');
        });

        test('should not allow state changes after execution', async () => {
            await operation.markExecuted({ success: true });
            
            await expect(operation.addSignature(new mongoose.Types.ObjectId()))
                .rejects.toThrow();
        });
    });

    describe('Query Methods', () => {
        beforeEach(async () => {
            const now = new Date();
            const adminId = new mongoose.Types.ObjectId();

            await MultiSigOperation.create([
                {
                    operationType: 'CREATE_VOUCHER_BATCH',
                    operationData: {},
                    initiatedBy: adminId,
                    requiredSignatures: 2,
                    status: 'pending',
                    expiresAt: new Date(now.getTime() + 86400000)
                },
                {
                    operationType: 'BULK_TRANSFER',
                    operationData: {},
                    initiatedBy: adminId,
                    requiredSignatures: 2,
                    status: 'approved',
                    expiresAt: new Date(now.getTime() + 86400000)
                },
                {
                    operationType: 'EMERGENCY_FREEZE',
                    operationData: {},
                    initiatedBy: adminId,
                    requiredSignatures: 3,
                    status: 'pending',
                    expiresAt: new Date(now.getTime() - 3600000) // Expired
                }
            ]);
        });

        test('should find pending operations', async () => {
            const pending = await MultiSigOperation.findPending();
            expect(pending.length).toBeGreaterThan(0);
            expect(pending.every(op => op.status === 'pending')).toBe(true);
        });

        test('should find expired operations', async () => {
            const expired = await MultiSigOperation.findExpired();
            expect(expired.length).toBeGreaterThan(0);
            expect(expired.every(op => op.expiresAt < new Date())).toBe(true);
        });
    });

    describe('Operation Types', () => {
        const operationTypes = [
            'CREATE_VOUCHER_BATCH',
            'MODIFY_CRITICAL_SETTINGS',
            'DELETE_MULTIPLE_VOUCHERS',
            'CHANGE_MERCHANT_STATUS',
            'BULK_TRANSFER',
            'EMERGENCY_FREEZE',
            'SYSTEM_MAINTENANCE',
            'SECURITY_UPDATE'
        ];

        test.each(operationTypes)('should accept operation type: %s', async (type) => {
            const operation = new MultiSigOperation({
                operationType: type,
                operationData: {},
                initiatedBy: new mongoose.Types.ObjectId(),
                requiredSignatures: 2
            });

            const saved = await operation.save();
            expect(saved.operationType).toBe(type);
        });
    });

    describe('Execution Flow', () => {
        test('should track complete execution lifecycle', async () => {
            const admin1 = new mongoose.Types.ObjectId();
            const admin2 = new mongoose.Types.ObjectId();
            const admin3 = new mongoose.Types.ObjectId();

            const operation = await MultiSigOperation.create({
                operationType: 'BULK_TRANSFER',
                operationData: { amount: 1000, recipients: 10 },
                initiatedBy: admin1,
                requiredSignatures: 2
            });

            // Initial state
            expect(operation.status).toBe('pending');
            expect(operation.signatures).toHaveLength(0);

            // First signature
            await operation.addSignature(admin2, 'Approved');
            expect(operation.status).toBe('pending');
            expect(operation.signatures).toHaveLength(1);

            // Second signature (auto-approve)
            await operation.addSignature(admin3, 'Also approved');
            expect(operation.status).toBe('approved');
            expect(operation.approvedAt).toBeDefined();

            // Execution
            const result = { success: true, transferred: 10 };
            await operation.markExecuted(result);
            expect(operation.status).toBe('executed');
            expect(operation.executedAt).toBeDefined();
            expect(operation.executionResult).toEqual(result);
        });
    });
});
