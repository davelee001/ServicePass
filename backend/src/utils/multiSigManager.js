const MultiSigOperation = require('../models/MultiSigOperation');
const { logger } = require('./logger');
const crypto = require('crypto');

class MultiSigManager {
    constructor() {
        // Default configuration
        this.config = {
            defaultRequiredSignatures: 2,
            defaultExpiryHours: 24,
            operationTypeSignatures: {
                mint_large_batch: 2,
                register_merchant: 2,
                revoke_merchant: 3,
                update_system_config: 3,
                emergency_pause: 2,
                emergency_unpause: 2,
                bulk_transfer: 2,
                delete_vouchers: 3
            }
        };
    }

    /**
     * Create a new multi-signature operation
     * @param {Object} data - Operation data
     * @returns {Promise<Object>} Created operation
     */
    async createOperation(data) {
        const {
            operationType,
            operationData,
            createdBy,
            requiredSignatures,
            expiryHours,
            notes,
            priority
        } = data;

        // Validate operation type
        const validTypes = Object.keys(this.config.operationTypeSignatures);
        if (!validTypes.includes(operationType)) {
            throw new Error(`Invalid operation type: ${operationType}`);
        }

        // Determine required signatures
        const signaturesRequired = requiredSignatures || 
            this.config.operationTypeSignatures[operationType] ||
            this.config.defaultRequiredSignatures;

        // Calculate expiry date
        const hours = expiryHours || this.config.defaultExpiryHours;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + hours);

        // Generate operation ID
        const operationId = `MSIG_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        const operation = await MultiSigOperation.create({
            operationId,
            operationType,
            operationData,
            requiredSignatures: signaturesRequired,
            createdBy,
            expiresAt,
            notes,
            priority: priority || 'medium'
        });

        logger.info(`Created multi-sig operation ${operationId} (type: ${operationType}, requires ${signaturesRequired} signatures)`);

        return operation;
    }

    /**
     * Add signature to an operation
     * @param {string} operationId - Operation ID
     * @param {string} adminId - Admin ID signing the operation
     * @param {string} adminEmail - Admin email
     * @param {string} ipAddress - IP address of the admin
     * @returns {Promise<Object>} Updated operation
     */
    async addSignature(operationId, adminId, adminEmail, ipAddress) {
        const operation = await MultiSigOperation.findOne({ operationId });

        if (!operation) {
            throw new Error('Operation not found');
        }

        // Prevent creator from signing their own operation
        if (operation.createdBy === adminId) {
            throw new Error('Cannot sign your own operation');
        }

        await operation.addSignature(adminId, adminEmail, ipAddress);

        logger.info(`Admin ${adminId} signed operation ${operationId} (${operation.signatures.length}/${operation.requiredSignatures})`);

        // Check if operation is now approved
        if (operation.status === 'approved') {
            logger.info(`Operation ${operationId} is now approved and ready for execution`);
        }

        return operation;
    }

    /**
     * Reject an operation
     * @param {string} operationId - Operation ID
     * @param {string} adminId - Admin ID rejecting the operation
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Updated operation
     */
    async rejectOperation(operationId, adminId, reason) {
        const operation = await MultiSigOperation.findOne({ operationId });

        if (!operation) {
            throw new Error('Operation not found');
        }

        await operation.reject(adminId, reason);

        logger.info(`Admin ${adminId} rejected operation ${operationId}: ${reason}`);

        return operation;
    }

    /**
     * Execute an approved operation
     * @param {string} operationId - Operation ID
     * @param {string} executedBy - Admin executing the operation
     * @param {Function} executionFunction - Function to execute the operation
     * @returns {Promise<Object>} Execution result
     */
    async executeOperation(operationId, executedBy, executionFunction) {
        const operation = await MultiSigOperation.findOne({ operationId });

        if (!operation) {
            throw new Error('Operation not found');
        }

        if (operation.status !== 'approved') {
            throw new Error('Operation must be approved before execution');
        }

        let result;
        try {
            // Execute the operation
            result = await executionFunction(operation.operationData);

            await operation.execute(executedBy, {
                success: true,
                data: result
            });

            logger.info(`Successfully executed operation ${operationId} by ${executedBy}`);

            return {
                success: true,
                operation,
                result
            };
        } catch (error) {
            await operation.execute(executedBy, {
                success: false,
                error: error.message
            });

            logger.error(`Failed to execute operation ${operationId}:`, error);

            throw error;
        }
    }

    /**
     * Get pending operations
     * @param {Object} filter - Optional filter
     * @returns {Promise<Array>} Pending operations
     */
    async getPendingOperations(filter = {}) {
        return MultiSigOperation.findPending(filter);
    }

    /**
     * Get approved operations awaiting execution
     * @param {Object} filter - Optional filter
     * @returns {Promise<Array>} Approved operations
     */
    async getApprovedOperations(filter = {}) {
        return MultiSigOperation.findApproved(filter);
    }

    /**
     * Get operation details
     * @param {string} operationId - Operation ID
     * @returns {Promise<Object>} Operation details
     */
    async getOperation(operationId) {
        const operation = await MultiSigOperation.findOne({ operationId });

        if (!operation) {
            throw new Error('Operation not found');
        }

        return operation;
    }

    /**
     * Expire old pending operations
     * @returns {Promise<number>} Number of expired operations
     */
    async expireOldOperations() {
        const count = await MultiSigOperation.expireOldOperations();
        
        if (count > 0) {
            logger.info(`Expired ${count} old multi-sig operations`);
        }

        return count;
    }

    /**
     * Get operation statistics
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics() {
        const [pending, approved, executed, rejected, expired] = await Promise.all([
            MultiSigOperation.countDocuments({ status: 'pending' }),
            MultiSigOperation.countDocuments({ status: 'approved' }),
            MultiSigOperation.countDocuments({ status: 'executed' }),
            MultiSigOperation.countDocuments({ status: 'rejected' }),
            MultiSigOperation.countDocuments({ status: 'expired' })
        ]);

        return {
            pending,
            approved,
            executed,
            rejected,
            expired,
            total: pending + approved + executed + rejected + expired
        };
    }

    /**
     * Set required signatures for operation type
     * @param {string} operationType - Operation type
     * @param {number} count - Required signature count
     */
    setRequiredSignatures(operationType, count) {
        if (count < 2) {
            throw new Error('Minimum 2 signatures required');
        }

        this.config.operationTypeSignatures[operationType] = count;
        logger.info(`Set required signatures for ${operationType} to ${count}`);
    }
}

// Export singleton instance
module.exports = new MultiSigManager();
