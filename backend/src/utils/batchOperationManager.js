const BatchOperation = require('../models/BatchOperation');
const { logger } = require('./logger');
const crypto = require('crypto');

class BatchOperationManager {
    constructor() {
        this.activeOperations = new Map();
        this.pausedOperations = new Map();
        this.operationQueues = new Map();
        
        // Start the batch processor
        this.startBatchProcessor();
        
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
    startBatchProcessor() {
        setInterval(async () => {
            await this.processNextBatch();
        }, 1000); // Check every second
    }
    
    // Process next batch in queue
    async processNextBatch() {\n        // Get active operations count\n        const activeCount = this.activeOperations.size;\n        const maxConcurrent = process.env.MAX_CONCURRENT_BATCHES || 3;\n        \n        if (activeCount >= maxConcurrent) {\n            return; // Don't start new operations if at max capacity\n        }\n        \n        // Find next operation to process\n        let nextOperation = null;\n        \n        for (const [priority, queue] of this.operationQueues.entries()) {\n            if (queue.length > 0) {\n                nextOperation = queue.shift();\n                break;\n            }\n        }\n        \n        if (!nextOperation) {\n            return; // No operations to process\n        }\n        \n        // Start processing the operation\n        this.activeOperations.set(nextOperation.batchId, nextOperation);\n        \n        try {\n            await this.processBatchOperation(nextOperation);\n        } catch (error) {\n            logger.error(`Error processing batch ${nextOperation.batchId}:`, error);\n            await this.markOperationFailed(nextOperation, error.message);\n        } finally {\n            this.activeOperations.delete(nextOperation.batchId);\n        }\n    }\n    \n    // Process a single batch operation\n    async processBatchOperation(batchOperation) {\n        try {\n            // Update status to processing\n            batchOperation.status = 'processing';\n            batchOperation.startTime = new Date();\n            await batchOperation.save();\n            \n            logger.info(`Starting batch operation ${batchOperation.batchId}`);\n            \n            const { data, parallelProcessing, maxRetries } = batchOperation.parameters;\n            const batchSize = batchOperation.batchSize;\n            \n            // Split data into chunks\n            const chunks = this.createChunks(data, batchSize);\n            let processedCount = 0;\n            let successCount = 0;\n            let failureCount = 0;\n            \n            for (let i = 0; i < chunks.length; i++) {\n                // Check if operation is paused\n                if (this.pausedOperations.has(batchOperation.batchId)) {\n                    await this.pauseOperation(batchOperation);\n                    return;\n                }\n                \n                const chunk = chunks[i];\n                let chunkResults;\n                \n                if (parallelProcessing) {\n                    chunkResults = await this.processChunkParallel(batchOperation, chunk, i);\n                } else {\n                    chunkResults = await this.processChunkSequential(batchOperation, chunk, i);\n                }\n                \n                // Update progress\n                processedCount += chunk.length;\n                successCount += chunkResults.filter(r => r.status === 'success').length;\n                failureCount += chunkResults.filter(r => r.status === 'failed').length;\n                \n                batchOperation.processedRecords = processedCount;\n                batchOperation.successfulRecords = successCount;\n                batchOperation.failedRecords = failureCount;\n                batchOperation.progress = Math.round((processedCount / batchOperation.totalRecords) * 100);\n                batchOperation.results.push(...chunkResults);\n                \n                // Save progress\n                await batchOperation.save();\n                \n                // Emit progress update (if using WebSockets or EventEmitter)\n                this.emitProgress(batchOperation);\n                \n                logger.info(`Batch ${batchOperation.batchId} progress: ${batchOperation.progress}%`);\n            }\n            \n            // Complete the operation\n            batchOperation.status = 'completed';\n            batchOperation.endTime = new Date();\n            await batchOperation.save();\n            \n            this.metrics.successfulOperations++;\n            this.updateAverageProcessingTime(batchOperation);\n            \n            logger.info(`Batch operation ${batchOperation.batchId} completed successfully`);\n            \n            // Send completion notification\n            await this.sendCompletionNotification(batchOperation);\n            \n        } catch (error) {\n            await this.markOperationFailed(batchOperation, error.message);\n            throw error;\n        }\n    }\n    \n    // Process chunk in parallel\n    async processChunkParallel(batchOperation, chunk, chunkIndex) {\n        const promises = chunk.map((item, itemIndex) => \n            this.processItem(batchOperation, item, chunkIndex * batchOperation.batchSize + itemIndex)\n        );\n        \n        const results = await Promise.allSettled(promises);\n        \n        return results.map((result, itemIndex) => {\n            if (result.status === 'fulfilled') {\n                return {\n                    recordIndex: chunkIndex * batchOperation.batchSize + itemIndex,\n                    status: 'success',\n                    data: result.value,\n                    processedAt: new Date()\n                };\n            } else {\n                return {\n                    recordIndex: chunkIndex * batchOperation.batchSize + itemIndex,\n                    status: 'failed',\n                    error: result.reason.message,\n                    processedAt: new Date()\n                };\n            }\n        });\n    }\n    \n    // Process chunk sequentially\n    async processChunkSequential(batchOperation, chunk, chunkIndex) {\n        const results = [];\n        \n        for (let itemIndex = 0; itemIndex < chunk.length; itemIndex++) {\n            try {\n                const result = await this.processItem(\n                    batchOperation, \n                    chunk[itemIndex], \n                    chunkIndex * batchOperation.batchSize + itemIndex\n                );\n                \n                results.push({\n                    recordIndex: chunkIndex * batchOperation.batchSize + itemIndex,\n                    status: 'success',\n                    data: result,\n                    processedAt: new Date()\n                });\n            } catch (error) {\n                results.push({\n                    recordIndex: chunkIndex * batchOperation.batchSize + itemIndex,\n                    status: 'failed',\n                    error: error.message,\n                    processedAt: new Date()\n                });\n            }\n        }\n        \n        return results;\n    }\n    \n    // Process individual item based on operation type\n    async processItem(batchOperation, item, index) {\n        const { operationType } = batchOperation;\n        \n        switch (operationType) {\n            case 'bulk_mint_vouchers':\n                return await this.mintVoucher(item);\n            case 'batch_register_merchants':\n                return await this.registerMerchant(item);\n            case 'import_recipients':\n                return await this.createVoucherForRecipient(item);\n            case 'bulk_notifications':\n                return await this.sendNotification(item);\n            default:\n                throw new Error(`Unknown operation type: ${operationType}`);\n        }\n    }\n    \n    // Mint voucher implementation\n    async mintVoucher(voucherData) {\n        // Implementation for minting voucher\n        // This would call the existing voucher minting logic\n        const voucherService = require('../services/voucherService');\n        return await voucherService.mintVoucher(voucherData);\n    }\n    \n    // Register merchant implementation\n    async registerMerchant(merchantData) {\n        // Implementation for registering merchant\n        const merchantService = require('../services/merchantService');\n        return await merchantService.registerMerchant(merchantData);\n    }\n    \n    // Create voucher for recipient implementation\n    async createVoucherForRecipient(recipientData) {\n        // Implementation for creating voucher for recipient\n        const voucherService = require('../services/voucherService');\n        return await voucherService.createVoucherForRecipient(recipientData);\n    }\n    \n    // Send notification implementation\n    async sendNotification(notificationData) {\n        // Implementation for sending notification\n        const notificationManager = require('./notificationManager');\n        return await notificationManager.sendNotification(\n            notificationData.userId,\n            notificationData.type,\n            notificationData.data,\n            notificationData.options\n        );\n    }\n    \n    // Create chunks from data\n    createChunks(data, chunkSize) {\n        const chunks = [];\n        for (let i = 0; i < data.length; i += chunkSize) {\n            chunks.push(data.slice(i, i + chunkSize));\n        }\n        return chunks;\n    }\n    \n    // Pause operation\n    async pauseOperation(batchOperation) {\n        batchOperation.status = 'paused';\n        batchOperation.metadata.pausedAt = new Date();\n        await batchOperation.save();\n        \n        this.pausedOperations.set(batchOperation.batchId, batchOperation);\n        this.activeOperations.delete(batchOperation.batchId);\n        \n        logger.info(`Batch operation ${batchOperation.batchId} paused`);\n    }\n    \n    // Resume operation\n    async resumeOperation(batchId) {\n        try {\n            const batchOperation = this.pausedOperations.get(batchId);\n            \n            if (!batchOperation) {\n                throw new Error(`Paused operation ${batchId} not found`);\n            }\n            \n            batchOperation.status = 'queued';\n            batchOperation.metadata.resumedAt = new Date();\n            await batchOperation.save();\n            \n            this.pausedOperations.delete(batchId);\n            this.addToQueue(batchOperation);\n            \n            logger.info(`Batch operation ${batchId} resumed`);\n            \n            return { success: true, message: 'Operation resumed successfully' };\n            \n        } catch (error) {\n            logger.error(`Error resuming operation ${batchId}:`, error);\n            throw error;\n        }\n    }\n    \n    // Cancel operation\n    async cancelOperation(batchId) {\n        try {\n            const batchOperation = await BatchOperation.findOne({ batchId });\n            \n            if (!batchOperation) {\n                throw new Error(`Operation ${batchId} not found`);\n            }\n            \n            batchOperation.status = 'cancelled';\n            batchOperation.endTime = new Date();\n            await batchOperation.save();\n            \n            // Remove from active operations and queues\n            this.activeOperations.delete(batchId);\n            this.pausedOperations.delete(batchId);\n            \n            // Remove from queues\n            for (const queue of this.operationQueues.values()) {\n                const index = queue.findIndex(op => op.batchId === batchId);\n                if (index !== -1) {\n                    queue.splice(index, 1);\n                }\n            }\n            \n            logger.info(`Batch operation ${batchId} cancelled`);\n            \n            return { success: true, message: 'Operation cancelled successfully' };\n            \n        } catch (error) {\n            logger.error(`Error cancelling operation ${batchId}:`, error);\n            throw error;\n        }\n    }\n    \n    // Mark operation as failed\n    async markOperationFailed(batchOperation, errorMessage) {\n        batchOperation.status = 'failed';\n        batchOperation.endTime = new Date();\n        batchOperation.errors.push({\n            error: errorMessage,\n            timestamp: new Date()\n        });\n        \n        await batchOperation.save();\n        \n        this.metrics.failedOperations++;\n        \n        logger.error(`Batch operation ${batchOperation.batchId} failed: ${errorMessage}`);\n    }\n    \n    // Send completion notification\n    async sendCompletionNotification(batchOperation) {\n        try {\n            const notificationManager = require('./notificationManager');\n            \n            const duration = this.formatDuration(\n                batchOperation.endTime - batchOperation.startTime\n            );\n            \n            await notificationManager.sendNotification(\n                batchOperation.initiatedBy,\n                'bulk_operation_complete',\n                {\n                    operationType: batchOperation.operationType,\n                    batchId: batchOperation.batchId,\n                    totalRecords: batchOperation.totalRecords,\n                    successCount: batchOperation.successfulRecords,\n                    failureCount: batchOperation.failedRecords,\n                    duration\n                },\n                { priority: 'medium' }\n            );\n        } catch (error) {\n            logger.error('Error sending completion notification:', error);\n        }\n    }\n    \n    // Get operation status\n    async getOperationStatus(batchId) {\n        try {\n            const batchOperation = await BatchOperation.findOne({ batchId });\n            \n            if (!batchOperation) {\n                return { error: 'Operation not found' };\n            }\n            \n            return {\n                batchId: batchOperation.batchId,\n                operationType: batchOperation.operationType,\n                status: batchOperation.status,\n                progress: batchOperation.progress,\n                totalRecords: batchOperation.totalRecords,\n                processedRecords: batchOperation.processedRecords,\n                successfulRecords: batchOperation.successfulRecords,\n                failedRecords: batchOperation.failedRecords,\n                startTime: batchOperation.startTime,\n                endTime: batchOperation.endTime,\n                estimatedCompletion: batchOperation.estimatedCompletion,\n                errors: batchOperation.errors,\n                metadata: batchOperation.metadata\n            };\n        } catch (error) {\n            logger.error(`Error getting operation status for ${batchId}:`, error);\n            throw error;\n        }\n    }\n    \n    // Get all operations for user\n    async getUserOperations(userId, limit = 20, offset = 0) {\n        try {\n            const operations = await BatchOperation.find({ initiatedBy: userId })\n                .sort({ createdAt: -1 })\n                .limit(limit)\n                .skip(offset)\n                .select('-results') // Exclude detailed results for list view\n                .lean();\n            \n            return operations;\n        } catch (error) {\n            logger.error(`Error fetching operations for user ${userId}:`, error);\n            throw error;\n        }\n    }\n    \n    // Get system metrics\n    getMetrics() {\n        return {\n            ...this.metrics,\n            activeOperationsCount: this.activeOperations.size,\n            pausedOperationsCount: this.pausedOperations.size,\n            queuedOperationsCount: Array.from(this.operationQueues.values())\n                .reduce((total, queue) => total + queue.length, 0)\n        };\n    }\n    \n    // Estimate processing time\n    estimateProcessingTime(batchOperation) {\n        const { totalRecords, batchSize } = batchOperation;\n        const avgTimePerRecord = this.metrics.averageProcessingTime || 100; // ms\n        const totalTime = totalRecords * avgTimePerRecord;\n        \n        return Math.ceil(totalTime / 1000); // Return in seconds\n    }\n    \n    // Update average processing time\n    updateAverageProcessingTime(batchOperation) {\n        const duration = batchOperation.endTime - batchOperation.startTime;\n        const timePerRecord = duration / batchOperation.totalRecords;\n        \n        if (this.metrics.averageProcessingTime === 0) {\n            this.metrics.averageProcessingTime = timePerRecord;\n        } else {\n            this.metrics.averageProcessingTime = \n                (this.metrics.averageProcessingTime + timePerRecord) / 2;\n        }\n    }\n    \n    // Format duration\n    formatDuration(milliseconds) {\n        const seconds = Math.floor(milliseconds / 1000);\n        const minutes = Math.floor(seconds / 60);\n        const hours = Math.floor(minutes / 60);\n        \n        if (hours > 0) {\n            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;\n        } else if (minutes > 0) {\n            return `${minutes}m ${seconds % 60}s`;\n        } else {\n            return `${seconds}s`;\n        }\n    }\n    \n    // Emit progress update (placeholder for WebSocket implementation)\n    emitProgress(batchOperation) {\n        // This would emit progress to WebSocket clients\n        // Implementation depends on your WebSocket setup\n        logger.debug(`Progress update for ${batchOperation.batchId}: ${batchOperation.progress}%`);\n    }\n}\n\nmodule.exports = new BatchOperationManager();