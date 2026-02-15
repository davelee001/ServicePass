const VoucherTransfer = require('../models/VoucherTransfer');
const Voucher = require('../models/Voucher');
const User = require('../models/User');
const { logger } = require('./logger');
const crypto = require('crypto');

class TransferValidator {
    /**
     * Validate if a voucher transfer is allowed
     * @param {Object} params - Transfer parameters
     * @returns {Promise<Object>} Validation result
     */
    async validateTransfer(params) {
        const {
            voucherId,
            fromAddress,
            toAddress,
            amount,
            transferType
        } = params;

        try {
            // Get voucher
            const voucher = await Voucher.findOne({ voucherId });
            
            if (!voucher) {
                return {
                    allowed: false,
                    reason: 'Voucher not found'
                };
            }

            // Check voucher status
            if (voucher.status === 'fully_redeemed') {
                return {
                    allowed: false,
                    reason: 'Voucher has been fully redeemed'
                };
            }

            if (voucher.status === 'expired') {
                return {
                    allowed: false,
                    reason: 'Voucher has expired'
                };
            }

            if (voucher.status === 'cancelled') {
                return {
                    allowed: false,
                    reason: 'Voucher has been cancelled'
                };
            }

            // Check if voucher is expired
            if (voucher.isExpired) {
                return {
                    allowed: false,
                    reason: 'Voucher has expired'
                };
            }

            // Check ownership
            if (voucher.recipient !== fromAddress) {
                return {
                    allowed: false,
                    reason: 'Only the voucher owner can transfer'
                };
            }

            // Check transfer restrictions - max transfers
            const transferCheck = voucher.canTransfer();
            if (!transferCheck.allowed) {
                return transferCheck;
            }

            // Validate partial transfer
            if (transferType === 'partial') {
                if (!voucher.allowPartialRedemption) {
                    return {
                        allowed: false,
                        reason: 'Partial transfers not allowed for this voucher'
                    };
                }

                if (amount > voucher.remainingAmount) {
                    return {
                        allowed: false,
                        reason: `Insufficient balance. Available: ${voucher.remainingAmount}`
                    };
                }

                if (amount <= 0) {
                    return {
                        allowed: false,
                        reason: 'Transfer amount must be positive'
                    };
                }
            }

            // Check if recipient is on allowed list (if specified)
            if (voucher.transferRestrictions?.allowedRecipients?.length > 0) {
                if (!voucher.transferRestrictions.allowedRecipients.includes(toAddress)) {
                    return {
                        allowed: false,
                        reason: 'Recipient is not on the allowed list'
                    };
                }
            }

            // Check if transfer requires approval
            const requiresApproval = voucher.transferRestrictions?.requireApproval || false;

            return {
                allowed: true,
                requiresApproval,
                voucher
            };

        } catch (error) {
            logger.error('Error validating transfer:', error);
            return {
                allowed: false,
                reason: 'Error validating transfer: ' + error.message
            };
        }
    }

    /**
     * Create a transfer request
     * @param {Object} params - Transfer parameters
     * @returns {Promise<Object>} Created transfer
     */
    async createTransfer(params) {
        const {
            voucherId,
            fromAddress,
            toAddress,
            amount,
            transferType,
            metadata
        } = params;

        // Validate transfer
        const validation = await this.validateTransfer(params);

        if (!validation.allowed) {
            throw new Error(validation.reason);
        }

        // Generate transfer ID
        const transferId = `TRX_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        // Create transfer record
        const transfer = await VoucherTransfer.create({
            transferId,
            voucherId,
            fromAddress,
            toAddress,
            amount: transferType === 'partial' ? amount : validation.voucher.remainingAmount,
            transferType,
            status: validation.requiresApproval ? 'pending' : 'approved',
            requiresApproval: validation.requiresApproval,
            metadata
        });

        logger.info(`Created transfer ${transferId} for voucher ${voucherId} (status: ${transfer.status})`);

        // If no approval required, process immediately
        if (!validation.requiresApproval) {
            await this.processTransfer(transferId);
        }

        return transfer;
    }

    /**
     * Approve a transfer
     * @param {string} transferId - Transfer ID
     * @param {string} approvedBy - Admin ID approving the transfer
     * @returns {Promise<Object>} Approved transfer
     */
    async approveTransfer(transferId, approvedBy) {
        const transfer = await VoucherTransfer.findOne({ transferId });

        if (!transfer) {
            throw new Error('Transfer not found');
        }

        await transfer.approve(approvedBy);

        logger.info(`Transfer ${transferId} approved by ${approvedBy}`);

        // Process the transfer
        await this.processTransfer(transferId);

        return transfer;
    }

    /**
     * Reject a transfer
     * @param {string} transferId - Transfer ID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Rejected transfer
     */
    async rejectTransfer(transferId, reason) {
        const transfer = await VoucherTransfer.findOne({ transferId });

        if (!transfer) {
            throw new Error('Transfer not found');
        }

        await transfer.reject(reason);

        logger.info(`Transfer ${transferId} rejected: ${reason}`);

        return transfer;
    }

    /**
     * Process an approved transfer
     * @param {string} transferId - Transfer ID
     * @returns {Promise<Object>} Processed transfer
     */
    async processTransfer(transferId) {
        const transfer = await VoucherTransfer.findOne({ transferId });

        if (!transfer) {
            throw new Error('Transfer not found');
        }

        if (transfer.status !== 'approved' && transfer.status !== 'pending') {
            throw new Error('Transfer is not in approved or pending status');
        }

        try {
            const voucher = await Voucher.findOne({ voucherId: transfer.voucherId });

            if (!voucher) {
                throw new Error('Voucher not found');
            }

            // TODO: Implement actual blockchain transfer here
            // For now, just update the database

            if (transfer.transferType === 'partial') {
                // For partial transfer, reduce the amount and create new voucher for recipient
                // This is a simplified version - actual implementation may vary
                voucher.remainingAmount -= transfer.amount;
                if (voucher.remainingAmount === 0) {
                    voucher.status = 'fully_redeemed';
                } else {
                    voucher.status = 'partially_redeemed';
                }
                await voucher.save();
            } else {
                // Full transfer - update ownership
                voucher.recipient = transfer.toAddress;
                await voucher.recordTransfer();
            }

            // Mark transfer as completed
            const mockTransactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
            await transfer.complete(mockTransactionHash);

            logger.info(`Successfully processed transfer ${transferId}`);

            return transfer;

        } catch (error) {
            logger.error(`Error processing transfer ${transferId}:`, error);
            await transfer.fail(error);
            throw error;
        }
    }

    /**
     * Get transfer history for a voucher
     * @param {string} voucherId - Voucher ID
     * @returns {Promise<Array>} Transfer history
     */
    async getTransferHistory(voucherId) {
        return VoucherTransfer.getVoucherHistory(voucherId);
    }

    /**
     * Get pending transfers
     * @param {Object} filter - Optional filter
     * @returns {Promise<Array>} Pending transfers
     */
    async getPendingTransfers(filter = {}) {
        return VoucherTransfer.findPending(filter);
    }

    /**
     * Get transfer count for voucher
     * @param {string} voucherId - Voucher ID
     * @returns {Promise<number>} Transfer count
     */
    async getTransferCount(voucherId) {
        return VoucherTransfer.getTransferCount(voucherId);
    }
}

// Export singleton instance
module.exports = new TransferValidator();
