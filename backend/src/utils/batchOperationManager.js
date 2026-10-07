const BatchOperation = require('../models/BatchOperation');
const { logger } = require('./logger');
const crypto = require('crypto');

class BatchOperationManager {
    constructor() {
        this.activeOperations = new Map();
        this.pausedOperations = new Map();
        this.operationQueues = new Map();

        // Start the batch processor
        this.processorTimer = null;

        // Performance metrics
        this.metrics = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            averageProcessingTime: 0
        };
    }

    // Create a new batch operation
    async createBatchOperation(operationType, data, options = {}) {
        try {
            const batchId = this.generateBatchId();
            const {
                batchSize = 50,
                priority = 'medium',
                userId,
                parallelProcessing = true,
                maxRetries = 3
            } = options;

            const batchOperation = new BatchOperation({
                batchId,
                operationType,
                status: 'queued',
                initiatedBy: userId,
                totalRecords: Array.isArray(data) ? data.length : 1,
                batchSize,
                parameters: {
                    data,
                    parallelProcessing,
                    maxRetries,
                    originalOptions: options
                },
                metadata: {
                    priority,
                    retryCount: 0
                }
            });

            await batchOperation.save();

            // Add to processing queue
            this.addToQueue(batchOperation);

            this.metrics.totalOperations++;

            logger.info(`Batch operation ${batchId} created for ${operationType}`);

            return {
                batchId,
                status: 'queued',
                totalRecords: batchOperation.totalRecords,
                estimatedDuration: this.estimateProcessingTime(batchOperation)
            };

        } catch (error) {
            logger.error('Error creating batch operation:', error);
            throw error;
        }
    }

    // Add operation to processing queue
    addToQueue(batchOperation) {
        const priority = batchOperation.metadata.priority;

        if (!this.operationQueues.has(priority)) {
            this.operationQueues.set(priority, []);
        }

        this.operationQueues.get(priority).push(batchOperation);

        // Sort by priority (high first, then medium, then low)
        this.sortQueuesByPriority();
    }

    // Sort queues by priority
    sortQueuesByPriority() {
        const priorities = ['high', 'medium', 'low'];
        const sortedQueues = new Map();

        priorities.forEach(priority => {
            if (this.operationQueues.has(priority)) {
                sortedQueues.set(priority, this.operationQueues.get(priority));
            }
        });

        this.operationQueues = sortedQueues;
    }

    // Generate unique batch ID
    generateBatchId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        return `batch_${timestamp}_${random}`;
    }

    // Start the batch processor
    stopProcessor() {
        if (this.processorTimer) clearInterval(this.processorTimer);
        this.processorTimer = null;
    }

    startProcessor() {
        if (this.processorTimer) return;
        this.processorTimer = setInterval(async () => {
            await this.processNextBatch();
        }, 1000); // Check every second
    }

    // Process next batch in queue
    async processNextBatch() {
        // Get active operations count
        const activeCount = this.activeOperations.size;
        const maxConcurrent = process.env.MAX_CONCURRENT_BATCHES || 3;

        if (activeCount >= maxConcurrent) {
            return; // Don't start new operations if at max capacity
        }

        // Find next operation to process
        let nextOperation = null;

        for (const [priority, queue] of this.operationQueues.entries()) {
            if (queue.length > 0) {
                nextOperation = queue.shift();
                break;
            }
        }

        if (!nextOperation) {
            return; // No operations to process
        }

        // Start processing the operation
        this.activeOperations.set(nextOperation.batchId, nextOperation);

        try {
            await this.processBatchOperation(nextOperation);
        } catch (error) {
            logger.error(`Error processing batch ${nextOperation.batchId}:`, error);
            await this.markOperationFailed(nextOperation, error.message);
        } finally {
            this.activeOperations.delete(nextOperation.batchId);
        }
    }

    // Process a single batch operation
    async processBatchOperation(batchOperation) {
        try {
            // Update status to processing
            batchOperation.status = 'processing';
            batchOperation.startTime = new Date();
            await batchOperation.save();

            logger.info(`Starting batch operation ${batchOperation.batchId}`);

            const { data, parallelProcessing, maxRetries } = batchOperation.parameters;
            const batchSize = batchOperation.batchSize;

            // Split data into chunks
            const chunks = this.createChunks(data, batchSize);
            let processedCount = 0;
            let successCount = 0;
            let failureCount = 0;

            for (let i = 0; i < chunks.length; i++) {
                // Check if operation is paused
                if (this.pausedOperations.has(batchOperation.batchId)) {
                    await this.pauseOperation(batchOperation);
                    return;
                }

                const chunk = chunks[i];
                let chunkResults;

                if (parallelProcessing) {
                    chunkResults = await this.processChunkParallel(batchOperation, chunk, i);
                } else {
                    chunkResults = await this.processChunkSequential(batchOperation, chunk, i);
                }

                // Update progress
                processedCount += chunk.length;
                successCount += chunkResults.filter(r => r.status === 'success').length;
                failureCount += chunkResults.filter(r => r.status === 'failed').length;

                batchOperation.processedRecords = processedCount;
                batchOperation.successfulRecords = successCount;
                batchOperation.failedRecords = failureCount;
                batchOperation.progress = Math.round((processedCount / batchOperation.totalRecords) * 100);
                batchOperation.results.push(...chunkResults);

                // Save progress
                await batchOperation.save();

                // Emit progress update (if using WebSockets or EventEmitter)
                this.emitProgress(batchOperation);

                logger.info(`Batch ${batchOperation.batchId} progress: ${batchOperation.progress}%`);
            }

            // Complete the operation
            batchOperation.status = 'completed';
            batchOperation.endTime = new Date();
            await batchOperation.save();

            this.metrics.successfulOperations++;
            this.updateAverageProcessingTime(batchOperation);

            logger.info(`Batch operation ${batchOperation.batchId} completed successfully`);

            // Send completion notification
            await this.sendCompletionNotification(batchOperation);

        } catch (error) {
            await this.markOperationFailed(batchOperation, error.message);
            throw error;
        }
    }

    // Process chunk in parallel
    async processChunkParallel(batchOperation, chunk, chunkIndex) {
        const promises = chunk.map((item, itemIndex) =>
            this.processItem(batchOperation, item, chunkIndex * batchOperation.batchSize + itemIndex)
        );

        const results = await Promise.allSettled(promises);

        return results.map((result, itemIndex) => {
            if (result.status === 'fulfilled') {
                return {
                    recordIndex: chunkIndex * batchOperation.batchSize + itemIndex,
                    status: 'success',
                    data: result.value,
                    processedAt: new Date()
                };
            } else {
                return {
                    recordIndex: chunkIndex * batchOperation.batchSize + itemIndex,
                    status: 'failed',
                    error: result.reason.message,
                    processedAt: new Date()
                };
            }
        });
    }

    // Process chunk sequentially
    async processChunkSequential(batchOperation, chunk, chunkIndex) {
        const results = [];

        for (let itemIndex = 0; itemIndex < chunk.length; itemIndex++) {
            try {
                const result = await this.processItem(
                    batchOperation,
                    chunk[itemIndex],
                    chunkIndex * batchOperation.batchSize + itemIndex
                );

                results.push({
                    recordIndex: chunkIndex * batchOperation.batchSize + itemIndex,
                    status: 'success',
                    data: result,
                    processedAt: new Date()
                });
            } catch (error) {
                results.push({
                    recordIndex: chunkIndex * batchOperation.batchSize + itemIndex,
                    status: 'failed',
                    error: error.message,
                    processedAt: new Date()
                });
            }
        }

        return results;
    }

    // Process individual item based on operation type
    async processItem(batchOperation, item, index) {
        const { operationType } = batchOperation;

        switch (operationType) {
            case 'bulk_mint_vouchers':
                return await this.mintVoucher(item);
            case 'batch_register_merchants':
                return await this.registerMerchant(item);
            case 'import_recipients':
                return await this.createVoucherForRecipient(item);
            case 'bulk_notifications':
                return await this.sendNotification(item);
            default:
                throw new Error(`Unknown operation type: ${operationType}`);
        }
    }

    // Mint voucher implementation
    async mintVoucher(voucherData) {
        // Implementation for minting voucher
        // This would call the existing voucher minting logic
        const voucherService = require('../services/voucherService');
        return await voucherService.mintVoucher(voucherData);
    }

    // Register merchant implementation
    async registerMerchant(merchantData) {
        // Implementation for registering merchant
        const merchantService = require('../services/merchantService');
        return await merchantService.registerMerchant(merchantData);
    }

    // Create voucher for recipient implementation
    async createVoucherForRecipient(recipientData) {
        // Implementation for creating voucher for recipient
        const voucherService = require('../services/voucherService');
        return await voucherService.createVoucherForRecipient(recipientData);
    }

    // Send notification implementation
    async sendNotification(notificationData) {
        // Implementation for sending notification
        const notificationManager = require('./notificationManager');
        return await notificationManager.sendNotification(
            notificationData.userId,
            notificationData.type,
            notificationData.data,
            notificationData.options
        );
    }

    // Create chunks from data
    createChunks(data, chunkSize) {
        const chunks = [];
        for (let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.slice(i, i + chunkSize));
        }
        return chunks;
    }

    // Pause operation
    async pauseOperation(batchOperation) {
        batchOperation.status = 'paused';
        batchOperation.metadata.pausedAt = new Date();
        await batchOperation.save();

        this.pausedOperations.set(batchOperation.batchId, batchOperation);
        this.activeOperations.delete(batchOperation.batchId);

        logger.info(`Batch operation ${batchOperation.batchId} paused`);
    }

    // Resume operation
    async resumeOperation(batchId) {
        try {
            const batchOperation = this.pausedOperations.get(batchId);

            if (!batchOperation) {
                throw new Error(`Paused operation ${batchId} not found`);
            }

            batchOperation.status = 'queued';
            batchOperation.metadata.resumedAt = new Date();
            await batchOperation.save();

            this.pausedOperations.delete(batchId);
            this.addToQueue(batchOperation);

            logger.info(`Batch operation ${batchId} resumed`);

            return { success: true, message: 'Operation resumed successfully' };

        } catch (error) {
            logger.error(`Error resuming operation ${batchId}:`, error);
            throw error;
        }
    }

    // Cancel operation
    async cancelOperation(batchId) {
        try {
            const batchOperation = await BatchOperation.findOne({ batchId });

            if (!batchOperation) {
                throw new Error(`Operation ${batchId} not found`);
            }

            batchOperation.status = 'cancelled';
            batchOperation.endTime = new Date();
            await batchOperation.save();

            // Remove from active operations and queues
            this.activeOperations.delete(batchId);
            this.pausedOperations.delete(batchId);

            // Remove from queues
            for (const queue of this.operationQueues.values()) {
                const index = queue.findIndex(op => op.batchId === batchId);
                if (index !== -1) {
                    queue.splice(index, 1);
                }
            }

            logger.info(`Batch operation ${batchId} cancelled`);

            return { success: true, message: 'Operation cancelled successfully' };

        } catch (error) {
            logger.error(`Error cancelling operation ${batchId}:`, error);
            throw error;
        }
    }

    // Mark operation as failed
    async markOperationFailed(batchOperation, errorMessage) {
        batchOperation.status = 'failed';
        batchOperation.endTime = new Date();
        batchOperation.errors.push({
            error: errorMessage,
            timestamp: new Date()
        });

        await batchOperation.save();

        this.metrics.failedOperations++;

        logger.error(`Batch operation ${batchOperation.batchId} failed: ${errorMessage}`);
    }

    // Send completion notification
    async sendCompletionNotification(batchOperation) {
        try {
            const notificationManager = require('./notificationManager');

            const duration = this.formatDuration(
                batchOperation.endTime - batchOperation.startTime
            );

            await notificationManager.sendNotification(
                batchOperation.initiatedBy,
                'bulk_operation_complete',
                {
                    operationType: batchOperation.operationType,
                    batchId: batchOperation.batchId,
                    totalRecords: batchOperation.totalRecords,
                    successCount: batchOperation.successfulRecords,
                    failureCount: batchOperation.failedRecords,
                    duration
                },
                { priority: 'medium' }
            );
        } catch (error) {
            logger.error('Error sending completion notification:', error);
        }
    }

    // Get operation status
    async getOperationStatus(batchId) {
        try {
            const batchOperation = await BatchOperation.findOne({ batchId });

            if (!batchOperation) {
                return { error: 'Operation not found' };
            }

            return {
                batchId: batchOperation.batchId,
                operationType: batchOperation.operationType,
                status: batchOperation.status,
                progress: batchOperation.progress,
                totalRecords: batchOperation.totalRecords,
                processedRecords: batchOperation.processedRecords,
                successfulRecords: batchOperation.successfulRecords,
                failedRecords: batchOperation.failedRecords,
                startTime: batchOperation.startTime,
                endTime: batchOperation.endTime,
                estimatedCompletion: batchOperation.estimatedCompletion,
                errors: batchOperation.errors,
                metadata: batchOperation.metadata
            };
        } catch (error) {
            logger.error(`Error getting operation status for ${batchId}:`, error);
            throw error;
        }
    }

    // Get all operations for user
    async getUserOperations(userId, limit = 20, offset = 0) {
        try {
            const operations = await BatchOperation.find({ initiatedBy: userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .select('-results') // Exclude detailed results for list view
                .lean();

            return operations;
        } catch (error) {
            logger.error(`Error fetching operations for user ${userId}:`, error);
            throw error;
        }
    }

    // Get system metrics
    getMetrics() {
        return {
            ...this.metrics,
            activeOperationsCount: this.activeOperations.size,
            pausedOperationsCount: this.pausedOperations.size,
            queuedOperationsCount: Array.from(this.operationQueues.values())
                .reduce((total, queue) => total + queue.length, 0)
        };
    }

    // Estimate processing time
    estimateProcessingTime(batchOperation) {
        const { totalRecords, batchSize } = batchOperation;
        const avgTimePerRecord = this.metrics.averageProcessingTime || 100; // ms
        const totalTime = totalRecords * avgTimePerRecord;

        return Math.ceil(totalTime / 1000); // Return in seconds
    }

    // Update average processing time
    updateAverageProcessingTime(batchOperation) {
        const duration = batchOperation.endTime - batchOperation.startTime;
        const timePerRecord = duration / batchOperation.totalRecords;

        if (this.metrics.averageProcessingTime === 0) {
            this.metrics.averageProcessingTime = timePerRecord;
        } else {
            this.metrics.averageProcessingTime =
                (this.metrics.averageProcessingTime + timePerRecord) / 2;
        }
    }

    // Format duration
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Emit progress update (placeholder for WebSocket implementation)
    emitProgress(batchOperation) {
        // This would emit progress to WebSocket clients
        // Implementation depends on your WebSocket setup
        logger.debug(`Progress update for ${batchOperation.batchId}: ${batchOperation.progress}%`);
    }
}

module.exports = new BatchOperationManager();
module.exports.BatchOperationManager = BatchOperationManager;
