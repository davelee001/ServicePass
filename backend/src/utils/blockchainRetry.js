const { logger } = require('./logger');

/**
 * Retry a blockchain operation with exponential backoff
 * @param {Function} operation - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should trigger retry
 * @returns {Promise} Result of the operation
 */
async function retryBlockchainOperation(operation, options = {}) {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        shouldRetry = (error) => true,
        operationName = 'Blockchain operation'
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await operation();
            if (attempt > 0) {
                logger.info(`${operationName} succeeded after ${attempt} retries`);
            }
            return result;
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries) {
                logger.error(`${operationName} failed after ${maxRetries} retries: ${error.message}`);
                break;
            }
            
            if (!shouldRetry(error)) {
                logger.error(`${operationName} failed with non-retryable error: ${error.message}`);
                throw error;
            }
            
            const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
            logger.warn(`${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${error.message}`);
            
            await sleep(delay);
        }
    }
    
    throw new BlockchainError(
        `${operationName} failed after ${maxRetries} retries`,
        lastError
    );
}

/**
 * Custom error class for blockchain operations
 */
class BlockchainError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = 'BlockchainError';
        this.originalError = originalError;
        this.isBlockchainError = true;
    }
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Duration in milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if a blockchain error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error) {
    const retryableMessages = [
        'network',
        'timeout',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'rate limit',
        'too many requests',
        'service unavailable',
        'gateway timeout',
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
}

/**
 * Wrapper for SUI transaction execution with retry logic
 * @param {SuiClient} suiClient - The SUI client instance
 * @param {Object} txParams - Transaction parameters
 * @returns {Promise} Transaction result
 */
async function executeTransactionWithRetry(suiClient, txParams) {
    return retryBlockchainOperation(
        async () => {
            return await suiClient.signAndExecuteTransactionBlock(txParams);
        },
        {
            maxRetries: 3,
            shouldRetry: isRetryableError,
            operationName: 'Transaction execution'
        }
    );
}

/**
 * Wrapper for SUI object queries with retry logic
 * @param {SuiClient} suiClient - The SUI client instance
 * @param {Object} queryParams - Query parameters
 * @returns {Promise} Query result
 */
async function queryObjectsWithRetry(suiClient, queryParams) {
    return retryBlockchainOperation(
        async () => {
            return await suiClient.getOwnedObjects(queryParams);
        },
        {
            maxRetries: 2,
            shouldRetry: isRetryableError,
            operationName: 'Object query'
        }
    );
}

/**
 * Wrapper for SUI transaction block queries with retry logic
 * @param {SuiClient} suiClient - The SUI client instance
 * @param {Object} queryParams - Query parameters
 * @returns {Promise} Transaction block result
 */
async function getTransactionBlockWithRetry(suiClient, queryParams) {
    return retryBlockchainOperation(
        async () => {
            return await suiClient.getTransactionBlock(queryParams);
        },
        {
            maxRetries: 2,
            shouldRetry: isRetryableError,
            operationName: 'Transaction block query'
        }
    );
}

module.exports = {
    retryBlockchainOperation,
    BlockchainError,
    isRetryableError,
    executeTransactionWithRetry,
    queryObjectsWithRetry,
    getTransactionBlockWithRetry,
};
