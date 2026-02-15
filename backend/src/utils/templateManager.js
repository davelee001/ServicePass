const VoucherTemplate = require('../models/VoucherTemplate');
const { logger } = require('./logger');
const crypto = require('crypto');

class TemplateManager {
    /**
     * Create a new voucher template
     * @param {Object} data - Template data
     * @returns {Promise<Object>} Created template
     */
    async createTemplate(data) {
        const {
            name,
            description,
            voucherType,
            defaultValue,
            defaultExpiryDays,
            merchantId,
            allowPartialRedemption,
            transferRestrictions,
            metadata,
            createdBy
        } = data;

        // Generate template ID
        const templateId = `TPL_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        const template = await VoucherTemplate.create({
            templateId,
            name,
            description,
            voucherType,
            defaultValue,
            defaultExpiryDays,
            merchantId,
            allowPartialRedemption: allowPartialRedemption || false,
            transferRestrictions: transferRestrictions || {
                enabled: false,
                maxTransfers: -1,
                requireApproval: false,
                allowedRecipients: [],
                restrictByRole: false,
                allowedRoles: []
            },
            metadata: metadata || {},
            createdBy,
            isActive: true
        });

        logger.info(`Created voucher template ${templateId}: ${name}`);

        return template;
    }

    /**
     * Update a template
     * @param {string} templateId - Template ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Updated template
     */
    async updateTemplate(templateId, updates) {
        const template = await VoucherTemplate.findOne({ templateId });

        if (!template) {
            throw new Error('Template not found');
        }

        // Don't allow changing templateId or usage stats
        delete updates.templateId;
        delete updates.usageCount;
        delete updates.lastUsedAt;

        Object.assign(template, updates);
        await template.save();

        logger.info(`Updated template ${templateId}`);

        return template;
    }

    /**
     * Deactivate a template
     * @param {string} templateId - Template ID
     * @returns {Promise<Object>} Updated template
     */
    async deactivateTemplate(templateId) {
        const template = await VoucherTemplate.findOne({ templateId });

        if (!template) {
            throw new Error('Template not found');
        }

        template.isActive = false;
        await template.save();

        logger.info(`Deactivated template ${templateId}`);

        return template;
    }

    /**
     * Activate a template
     * @param {string} templateId - Template ID
     * @returns {Promise<Object>} Updated template
     */
    async activateTemplate(templateId) {
        const template = await VoucherTemplate.findOne({ templateId });

        if (!template) {
            throw new Error('Template not found');
        }

        template.isActive = true;
        await template.save();

        logger.info(`Activated template ${templateId}`);

        return template;
    }

    /**
     * Delete a template
     * @param {string} templateId - Template ID
     * @returns {Promise<void>}
     */
    async deleteTemplate(templateId) {
        const template = await VoucherTemplate.findOne({ templateId });

        if (!template) {
            throw new Error('Template not found');
        }

        // Check if template has been used
        if (template.usageCount > 0) {
            throw new Error('Cannot delete template that has been used. Please deactivate instead.');
        }

        await VoucherTemplate.deleteOne({ templateId });

        logger.info(`Deleted template ${templateId}`);
    }

    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {Promise<Object>} Template
     */
    async getTemplate(templateId) {
        const template = await VoucherTemplate.findOne({ templateId });

        if (!template) {
            throw new Error('Template not found');
        }

        return template;
    }

    /**
     * Get all active templates
     * @param {Object} filter - Optional filter
     * @returns {Promise<Array>} Active templates
     */
    async getActiveTemplates(filter = {}) {
        return VoucherTemplate.findActive(filter);
    }

    /**
     * Get templates by voucher type
     * @param {number} voucherType - Voucher type (1-4)
     * @returns {Promise<Array>} Templates
     */
    async getTemplatesByType(voucherType) {
        return VoucherTemplate.findByType(voucherType);
    }

    /**
     * Get templates created by user
     * @param {string} createdBy - User ID
     * @returns {Promise<Array>} Templates
     */
    async getTemplatesByCreator(createdBy) {
        return VoucherTemplate.find({ createdBy }).sort({ createdAt: -1 });
    }

    /**
     * Search templates
     * @param {Object} searchParams - Search parameters
     * @returns {Promise<Array>} Matching templates
     */
    async searchTemplates(searchParams) {
        const {
            keyword,
            voucherType,
            merchantId,
            isActive,
            tags,
            category
        } = searchParams;

        const query = {};

        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (voucherType) {
            query.voucherType = voucherType;
        }

        if (merchantId) {
            query.merchantId = merchantId;
        }

        if (typeof isActive !== 'undefined') {
            query.isActive = isActive;
        }

        if (tags && tags.length > 0) {
            query['metadata.tags'] = { $in: tags };
        }

        if (category) {
            query['metadata.category'] = category;
        }

        return VoucherTemplate.find(query).sort({ createdAt: -1 });
    }

    /**
     * Duplicate a template
     * @param {string} templateId - Template ID to duplicate
     * @param {string} createdBy - User creating the duplicate
     * @param {Object} overrides - Optional field overrides
     * @returns {Promise<Object>} New template
     */
    async duplicateTemplate(templateId, createdBy, overrides = {}) {
        const sourceTemplate = await this.getTemplate(templateId);

        // Create new template ID
        const newTemplateId = `TPL_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        const newTemplate = {
            ...sourceTemplate.toObject(),
            templateId: newTemplateId,
            name: overrides.name || `${sourceTemplate.name} (Copy)`,
            createdBy,
            usageCount: 0,
            lastUsedAt: null,
            ...overrides
        };

        delete newTemplate._id;
        delete newTemplate.createdAt;
        delete newTemplate.updatedAt;

        const created = await VoucherTemplate.create(newTemplate);

        logger.info(`Duplicated template ${templateId} as ${newTemplateId}`);

        return created;
    }

    /**
     * Get template usage statistics
     * @param {string} templateId - Template ID
     * @returns {Promise<Object>} Usage statistics
     */
    async getTemplateUsageStats(templateId) {
        const template = await this.getTemplate(templateId);
        const Voucher = require('../models/Voucher');

        const vouchersCreated = await Voucher.countDocuments({ templateId });
        const activeVouchers = await Voucher.countDocuments({
            templateId,
            status: 'active'
        });
        const redeemedVouchers = await Voucher.countDocuments({
            templateId,
            status: { $in: ['partially_redeemed', 'fully_redeemed'] }
        });

        return {
            templateId,
            name: template.name,
            usageCount: template.usageCount,
            lastUsedAt: template.lastUsedAt,
            vouchersCreated,
            activeVouchers,
            redeemedVouchers,
            isActive: template.isActive
        };
    }

    /**
     * Get popular templates
     * @param {number} limit - Number of templates to return
     * @returns {Promise<Array>} Popular templates
     */
    async getPopularTemplates(limit = 10) {
        return VoucherTemplate.find({ isActive: true })
            .sort({ usageCount: -1 })
            .limit(limit);
    }

    /**
     * Get recent templates
     * @param {number} limit - Number of templates to return
     * @returns {Promise<Array>} Recent templates
     */
    async getRecentTemplates(limit = 10) {
        return VoucherTemplate.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(limit);
    }
}

// Export singleton instance
module.exports = new TemplateManager();
