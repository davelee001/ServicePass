const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const batchOperationManager = require('../utils/batchOperationManager');
const BatchOperation = require('../models/BatchOperation');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');

// Create a new batch operation
router.post('/create',
    verifyToken,
    writeLimiter,
    [
        body('operationType').isIn(['bulk_mint_vouchers', 'batch_register_merchants', 'import_recipients', 'bulk_notifications']).withMessage('Valid operation type is required'),
        body('data').isArray().notEmpty().withMessage('Data array is required'),
        body('batchSize').optional().isInt({ min: 1, max: 100 }).withMessage('Batch size must be between 1 and 100'),
        body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
        body('parallelProcessing').optional().isBoolean().withMessage('Parallel processing must be a boolean')
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

            const { operationType, data, batchSize, priority, parallelProcessing } = req.body;
            const userId = req.user.userId;
            
            // Check permissions for admin-only operations
            if (['bulk_mint_vouchers', 'batch_register_merchants'].includes(operationType) && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin privileges required for this operation' });
            }
            
            const result = await batchOperationManager.createBatchOperation(operationType, data, {
                batchSize,
                priority,
                parallelProcessing,
                userId
            });
            
            res.json({ 
                message: 'Batch operation created successfully',
                ...result
            });
        } catch (error) {
            logger.error('Error creating batch operation:', error);
            res.status(500).json({ error: 'Failed to create batch operation' });
        }
    }
);

// Get batch operation status
router.get('/status/:batchId',
    verifyToken,
    readLimiter,
    [
        param('batchId').notEmpty().withMessage('Batch ID is required')
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

            const { batchId } = req.params;
            const status = await batchOperationManager.getOperationStatus(batchId);
            
            if (status.error) {
                return res.status(404).json({ error: status.error });
            }
            
            // Check if user can access this operation
            const operation = await BatchOperation.findOne({ batchId });
            if (operation.initiatedBy !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            res.json({ batchOperation: status });
        } catch (error) {
            logger.error('Error fetching batch operation status:', error);
            res.status(500).json({ error: 'Failed to fetch batch operation status' });
        }
    }
);

// Get user's batch operations
router.get('/my-operations',
    verifyToken,
    readLimiter,
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
        query('status').optional().isIn(['queued', 'processing', 'completed', 'failed', 'cancelled', 'paused']).withMessage('Invalid status filter')
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

            const { limit = 20, offset = 0, status } = req.query;
            const userId = req.user.userId;
            
            let operations;
            
            if (status) {
                operations = await BatchOperation.find({ 
                    initiatedBy: userId, 
                    status 
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset)
                .select('-results')
                .lean();
            } else {
                operations = await batchOperationManager.getUserOperations(userId, limit, offset);
            }
            
            res.json({ operations });
        } catch (error) {
            logger.error('Error fetching user batch operations:', error);
            res.status(500).json({ error: 'Failed to fetch batch operations' });
        }
    }
);

// Pause batch operation
router.post('/pause/:batchId',
    verifyToken,
    writeLimiter,
    [
        param('batchId').notEmpty().withMessage('Batch ID is required')
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

            const { batchId } = req.params;
            
            // Check if user can pause this operation
            const operation = await BatchOperation.findOne({ batchId });
            if (!operation) {
                return res.status(404).json({ error: 'Operation not found' });
            }
            
            if (operation.initiatedBy !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            if (!['queued', 'processing'].includes(operation.status)) {
                return res.status(400).json({ error: 'Operation cannot be paused in current status' });
            }
            
            await batchOperationManager.pauseOperation(operation);
            
            res.json({ message: 'Batch operation paused successfully' });
        } catch (error) {
            logger.error('Error pausing batch operation:', error);
            res.status(500).json({ error: 'Failed to pause batch operation' });
        }
    }
);

// Resume batch operation
router.post('/resume/:batchId',
    verifyToken,
    writeLimiter,
    [
        param('batchId').notEmpty().withMessage('Batch ID is required')
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

            const { batchId } = req.params;
            
            // Check if user can resume this operation
            const operation = await BatchOperation.findOne({ batchId });
            if (!operation) {
                return res.status(404).json({ error: 'Operation not found' });
            }
            
            if (operation.initiatedBy !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            if (operation.status !== 'paused') {
                return res.status(400).json({ error: 'Operation is not paused' });
            }
            
            const result = await batchOperationManager.resumeOperation(batchId);
            
            res.json({ 
                message: result.message,
                success: result.success
            });
        } catch (error) {
            logger.error('Error resuming batch operation:', error);
            res.status(500).json({ error: 'Failed to resume batch operation' });
        }
    }
);

// Cancel batch operation
router.delete('/cancel/:batchId',
    verifyToken,
    writeLimiter,
    [
        param('batchId').notEmpty().withMessage('Batch ID is required')
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

            const { batchId } = req.params;
            
            // Check if user can cancel this operation
            const operation = await BatchOperation.findOne({ batchId });
            if (!operation) {
                return res.status(404).json({ error: 'Operation not found' });
            }
            
            if (operation.initiatedBy !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            if (['completed', 'failed', 'cancelled'].includes(operation.status)) {
                return res.status(400).json({ error: 'Operation cannot be cancelled in current status' });
            }
            
            const result = await batchOperationManager.cancelOperation(batchId);
            
            res.json({ 
                message: result.message,
                success: result.success
            });
        } catch (error) {
            logger.error('Error cancelling batch operation:', error);
            res.status(500).json({ error: 'Failed to cancel batch operation' });
        }
    }
);

// Get detailed results for completed operation
router.get('/results/:batchId',
    verifyToken,
    readLimiter,
    [
        param('batchId').notEmpty().withMessage('Batch ID is required'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

            const { batchId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            
            const operation = await BatchOperation.findOne({ batchId });
            
            if (!operation) {
                return res.status(404).json({ error: 'Operation not found' });
            }
            
            // Check if user can access this operation
            if (operation.initiatedBy !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const skip = (page - 1) * limit;
            const results = operation.results.slice(skip, skip + limit);
            const totalResults = operation.results.length;
            const totalPages = Math.ceil(totalResults / limit);
            
            res.json({ 
                results,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalResults,
                    limit
                }
            });
        } catch (error) {
            logger.error('Error fetching batch operation results:', error);
            res.status(500).json({ error: 'Failed to fetch batch operation results' });
        }
    }
);

// Get system batch metrics (admin only)
router.get('/metrics',
    verifyToken,
    adminOnly,
    readLimiter,
    async (req, res) => {
        try {
            const metrics = batchOperationManager.getMetrics();
            
            // Get additional database metrics
            const dbMetrics = await BatchOperation.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);
            
            const statusCounts = {};
            dbMetrics.forEach(metric => {
                statusCounts[metric._id] = metric.count;
            });
            
            const recentOperations = await BatchOperation.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .select('batchId operationType status createdAt')
                .lean();
            
            res.json({ 
                metrics: {
                    ...metrics,
                    statusCounts,
                    recentOperations
                }
            });
        } catch (error) {
            logger.error('Error fetching batch metrics:', error);
            res.status(500).json({ error: 'Failed to fetch batch metrics' });
        }
    }
);

// Retry failed items in a batch operation
router.post('/retry/:batchId',
    verifyToken,
    writeLimiter,
    [
        param('batchId').notEmpty().withMessage('Batch ID is required'),
        body('failedItemsOnly').optional().isBoolean().withMessage('Failed items only must be a boolean')
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

            const { batchId } = req.params;
            const { failedItemsOnly = true } = req.body;
            
            const operation = await BatchOperation.findOne({ batchId });
            
            if (!operation) {
                return res.status(404).json({ error: 'Operation not found' });
            }
            
            // Check if user can retry this operation
            if (operation.initiatedBy !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            if (operation.status !== 'completed' && operation.status !== 'failed') {
                return res.status(400).json({ error: 'Operation must be completed or failed to retry' });
            }
            
            // Get failed items
            const failedResults = operation.results.filter(result => result.status === 'failed');
            
            if (failedResults.length === 0) {
                return res.status(400).json({ error: 'No failed items to retry' });
            }
            
            // Create new batch operation with failed items
            const retryData = failedResults.map(result => {
                const originalIndex = result.recordIndex;
                return operation.parameters.data[originalIndex];
            });
            
            const retryResult = await batchOperationManager.createBatchOperation(\n                operation.operationType,\n                retryData,\n                {\n                    batchSize: operation.batchSize,\n                    priority: 'high',\n                    userId: req.user.userId,\n                    originalBatchId: batchId\n                }\n            );\n            \n            res.json({ \n                message: 'Retry batch operation created successfully',\n                retryBatchId: retryResult.batchId,\n                itemsToRetry: failedResults.length\n            });\n        } catch (error) {\n            logger.error('Error retrying batch operation:', error);\n            res.status(500).json({ error: 'Failed to retry batch operation' });\n        }\n    }\n);\n\n// Export batch operation results\nrouter.get('/export/:batchId',\n    verifyToken,\n    readLimiter,\n    [\n        param('batchId').notEmpty().withMessage('Batch ID is required'),\n        query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')\n    ],\n    async (req, res) => {\n        try {\n            const errors = validationResult(req);\n            if (!errors.isEmpty()) {\n                return res.status(400).json({ \n                    error: 'Validation failed', \n                    details: errors.array() \n                });\n            }\n\n            const { batchId } = req.params;\n            const { format = 'json' } = req.query;\n            \n            const operation = await BatchOperation.findOne({ batchId });\n            \n            if (!operation) {\n                return res.status(404).json({ error: 'Operation not found' });\n            }\n            \n            // Check if user can access this operation\n            if (operation.initiatedBy !== req.user.userId && req.user.role !== 'admin') {\n                return res.status(403).json({ error: 'Access denied' });\n            }\n            \n            const exportData = {\n                batchId: operation.batchId,\n                operationType: operation.operationType,\n                status: operation.status,\n                totalRecords: operation.totalRecords,\n                successfulRecords: operation.successfulRecords,\n                failedRecords: operation.failedRecords,\n                startTime: operation.startTime,\n                endTime: operation.endTime,\n                results: operation.results\n            };\n            \n            if (format === 'csv') {\n                const csvData = convertToCSV(exportData);\n                res.setHeader('Content-Type', 'text/csv');\n                res.setHeader('Content-Disposition', `attachment; filename=${batchId}_results.csv`);\n                res.send(csvData);\n            } else {\n                res.setHeader('Content-Type', 'application/json');\n                res.setHeader('Content-Disposition', `attachment; filename=${batchId}_results.json`);\n                res.json(exportData);\n            }\n        } catch (error) {\n            logger.error('Error exporting batch operation results:', error);\n            res.status(500).json({ error: 'Failed to export batch operation results' });\n        }\n    }\n);\n\n// Helper function to convert data to CSV\nfunction convertToCSV(data) {\n    const results = data.results;\n    if (!results || results.length === 0) {\n        return 'No results to export';\n    }\n    \n    const headers = ['recordIndex', 'status', 'processedAt', 'error'];\n    const csvRows = [headers.join(',')];\n    \n    results.forEach(result => {\n        const row = [\n            result.recordIndex,\n            result.status,\n            result.processedAt,\n            result.error || ''\n        ].map(field => `\"${field || ''}\"`); // Escape commas and quotes\n        csvRows.push(row.join(','));\n    });\n    \n    return csvRows.join('\\n');\n}\n\nmodule.exports = router;