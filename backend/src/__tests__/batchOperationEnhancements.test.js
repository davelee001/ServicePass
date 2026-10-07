const batchOperationManager = require('../utils/batchOperationManager');
const BatchOperation = require('../models/BatchOperation');
const { clearDB } = require('./setup');

describe('Enhanced Batch Operation Manager', () => {

    beforeEach(async () => {
        await clearDB();

        // Clear manager state
        batchOperationManager.activeOperations.clear();
        batchOperationManager.pausedOperations.clear();
        batchOperationManager.operationQueues.clear();
    });

    describe('Batch Operation Creation', () => {
        test('should create batch operation with default options', async () => {
            const data = [
                { voucherType: '1', amount: 100, recipient: '0x' + '1'.repeat(64), merchantId: 'MERCHANT_001' },
                { voucherType: '2', amount: 200, recipient: '0x' + '2'.repeat(64), merchantId: 'MERCHANT_002' }
            ];

            const result = await batchOperationManager.createBatchOperation(
                'bulk_mint_vouchers',
                data,
                { userId: 'test-user' }
            );

            expect(result.batchId).toBeDefined();
            expect(result.status).toBe('queued');
            expect(result.totalRecords).toBe(2);
            expect(result.estimatedDuration).toBeDefined();

            // Check database record
            const dbOperation = await BatchOperation.findOne({ batchId: result.batchId });
            expect(dbOperation).toBeTruthy();
            expect(dbOperation.operationType).toBe('bulk_mint_vouchers');
            expect(dbOperation.totalRecords).toBe(2);
        });

        test('should respect custom batch options', async () => {
            const data = new Array(10).fill().map((_, i) => ({
                voucherType: '1',
                amount: 100 + i,
                recipient: '0x' + i.toString().repeat(64).slice(0, 64),
                merchantId: `MERCHANT_${String(i).padStart(3, '0')}`
            }));

            const result = await batchOperationManager.createBatchOperation(
                'bulk_mint_vouchers',
                data,
                {
                    userId: 'test-user',
                    batchSize: 3,
                    priority: 'high',
                    parallelProcessing: false
                }
            );

            const dbOperation = await BatchOperation.findOne({ batchId: result.batchId });
            expect(dbOperation.batchSize).toBe(3);
            expect(dbOperation.metadata.priority).toBe('high');
            expect(dbOperation.parameters.parallelProcessing).toBe(false);
        });

        test('should generate unique batch IDs', async () => {
            const data = [{ test: 'data' }];

            const result1 = await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user' }
            );

            const result2 = await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user' }
            );

            expect(result1.batchId).not.toBe(result2.batchId);
        });
    });

    describe('Queue Management', () => {
        test('should add operations to priority queues', async () => {
            const data = [{ test: 'data' }];

            await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user', priority: 'high' }
            );

            await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user', priority: 'low' }
            );

            expect(batchOperationManager.operationQueues.has('high')).toBe(true);
            expect(batchOperationManager.operationQueues.has('low')).toBe(true);
            expect(batchOperationManager.operationQueues.get('high').length).toBe(1);
            expect(batchOperationManager.operationQueues.get('low').length).toBe(1);
        });

        test('should sort queues by priority', async () => {
            const data = [{ test: 'data' }];

            // Create operations in different priority order
            await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user', priority: 'low' }
            );

            await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user', priority: 'high' }
            );

            const queueKeys = Array.from(batchOperationManager.operationQueues.keys());
            expect(queueKeys[0]).toBe('high');
            expect(queueKeys[1]).toBe('low');
        });
    });

    describe('Chunk Processing', () => {
        test('should create correct chunks from data', async () => {
            const data = new Array(10).fill().map((_, i) => ({ item: i }));
            const chunks = batchOperationManager.createChunks(data, 3);

            expect(chunks.length).toBe(4); // 10 items with chunk size 3 = 4 chunks
            expect(chunks[0].length).toBe(3);
            expect(chunks[1].length).toBe(3);
            expect(chunks[2].length).toBe(3);
            expect(chunks[3].length).toBe(1); // Last chunk has remaining items
        });

        test('should handle data smaller than chunk size', async () => {
            const data = [{ item: 1 }, { item: 2 }];
            const chunks = batchOperationManager.createChunks(data, 5);

            expect(chunks.length).toBe(1);
            expect(chunks[0].length).toBe(2);
        });
    });

    describe('Operation Status Management', () => {
        test('should get operation status', async () => {
            const data = [{ test: 'data' }];

            const result = await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user' }
            );

            const status = await batchOperationManager.getOperationStatus(result.batchId);

            expect(status.batchId).toBe(result.batchId);
            expect(status.operationType).toBe('bulk_notifications');
            expect(status.status).toBe('queued');
            expect(status.totalRecords).toBe(1);
            expect(status.processedRecords).toBe(0);
        });

        test('should return error for non-existent operation', async () => {
            const status = await batchOperationManager.getOperationStatus('non-existent-id');

            expect(status.error).toBe('Operation not found');
        });
    });

    describe('User Operations', () => {
        test('should get user operations with pagination', async () => {
            const userId = 'test-user';
            const data = [{ test: 'data' }];

            // Create multiple operations
            for (let i = 0; i < 5; i++) {
                await batchOperationManager.createBatchOperation(
                    'bulk_notifications',
                    data,
                    { userId }
                );
            }

            const operations = await batchOperationManager.getUserOperations(userId, 3, 0);

            expect(operations.length).toBe(3);
            expect(operations[0].initiatedBy).toBe(userId);
        });

        test('should respect pagination offset', async () => {
            const userId = 'test-user';
            const data = [{ test: 'data' }];

            // Create multiple operations
            for (let i = 0; i < 5; i++) {
                await batchOperationManager.createBatchOperation(
                    'bulk_notifications',
                    data,
                    { userId }
                );
            }

            const page1 = await batchOperationManager.getUserOperations(userId, 2, 0);
            const page2 = await batchOperationManager.getUserOperations(userId, 2, 2);

            expect(page1.length).toBe(2);
            expect(page2.length).toBe(2);
            expect(page1[0]._id).not.toEqual(page2[0]._id);
        });
    });

    describe('Operation Control', () => {
        test('should cancel operation', async () => {
            const data = [{ test: 'data' }];

            const result = await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user' }
            );

            const cancelResult = await batchOperationManager.cancelOperation(result.batchId);

            expect(cancelResult.success).toBe(true);
            expect(cancelResult.message).toContain('cancelled successfully');

            // Check database status
            const dbOperation = await BatchOperation.findOne({ batchId: result.batchId });
            expect(dbOperation.status).toBe('cancelled');
        });

        test('should fail to cancel non-existent operation', async () => {
            await expect(
                batchOperationManager.cancelOperation('non-existent-id')
            ).rejects.toThrow('Operation non-existent-id not found');
        });
    });

    describe('Metrics and Analytics', () => {
        test('should provide system metrics', async () => {
            const metrics = batchOperationManager.getMetrics();

            expect(metrics).toHaveProperty('totalOperations');
            expect(metrics).toHaveProperty('successfulOperations');
            expect(metrics).toHaveProperty('failedOperations');
            expect(metrics).toHaveProperty('averageProcessingTime');
            expect(metrics).toHaveProperty('activeOperationsCount');
            expect(metrics).toHaveProperty('pausedOperationsCount');
            expect(metrics).toHaveProperty('queuedOperationsCount');
        });

        test('should update metrics when operations are created', async () => {
            const initialMetrics = batchOperationManager.getMetrics();

            const data = [{ test: 'data' }];
            await batchOperationManager.createBatchOperation(
                'bulk_notifications',
                data,
                { userId: 'test-user' }
            );

            const updatedMetrics = batchOperationManager.getMetrics();

            expect(updatedMetrics.totalOperations).toBe(initialMetrics.totalOperations + 1);
        });
    });

    describe('Time Estimation', () => {
        test('should estimate processing time', async () => {
            const mockOperation = {
                totalRecords: 100,
                batchSize: 10
            };

            const estimatedTime = batchOperationManager.estimateProcessingTime(mockOperation);

            expect(estimatedTime).toBeGreaterThan(0);
            expect(typeof estimatedTime).toBe('number');
        });

        test('should provide reasonable estimates', async () => {
            const smallOperation = {
                totalRecords: 10,
                batchSize: 5
            };

            const largeOperation = {
                totalRecords: 1000,
                batchSize: 50
            };

            const smallTime = batchOperationManager.estimateProcessingTime(smallOperation);
            const largeTime = batchOperationManager.estimateProcessingTime(largeOperation);

            expect(largeTime).toBeGreaterThan(smallTime);
        });
    });

    describe('Duration Formatting', () => {
        test('should format duration in seconds', async () => {
            const duration = batchOperationManager.formatDuration(5000); // 5 seconds
            expect(duration).toBe('5s');
        });

        test('should format duration in minutes and seconds', async () => {
            const duration = batchOperationManager.formatDuration(125000); // 2 minutes 5 seconds
            expect(duration).toBe('2m 5s');
        });

        test('should format duration in hours, minutes, and seconds', async () => {
            const duration = batchOperationManager.formatDuration(3725000); // 1 hour 2 minutes 5 seconds
            expect(duration).toBe('1h 2m 5s');
        });
    });

    describe('Virtual Properties', () => {
        test('should calculate completion percentage', async () => {
            const operation = new BatchOperation({
                batchId: 'test-123',
                operationType: 'bulk_notifications',
                initiatedBy: 'test-user',
                totalRecords: 100,
                processedRecords: 25,
                parameters: { data: [] }
            });

            expect(operation.completionPercentage).toBe(25);
        });

        test('should calculate success rate', async () => {
            const operation = new BatchOperation({
                batchId: 'test-123',
                operationType: 'bulk_notifications',
                initiatedBy: 'test-user',
                totalRecords: 100,
                processedRecords: 50,
                successfulRecords: 40,
                parameters: { data: [] }
            });

            expect(operation.successRate).toBe(80); // 40/50 * 100
        });

        test('should handle zero division in virtual properties', async () => {
            const operation = new BatchOperation({
                batchId: 'test-123',
                operationType: 'bulk_notifications',
                initiatedBy: 'test-user',
                totalRecords: 0,
                processedRecords: 0,
                parameters: { data: [] }
            });

            expect(operation.completionPercentage).toBe(0);
            expect(operation.successRate).toBe(0);
        });
    });
});
