const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const templateManager = require('../utils/templateManager');
const { logger } = require('../utils/logger');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { writeLimiter, readLimiter } = require('../middleware/rateLimiter');

// Create voucher template (Admin only)
router.post('/',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('name').notEmpty().trim().withMessage('Template name is required'),
        body('description').notEmpty().trim().withMessage('Description is required'),
        body('voucherType').isInt({ min: 1, max: 4 }).withMessage('Valid voucher type (1-4) required'),
        body('defaultValue').isFloat({ min: 0 }).withMessage('Default value must be positive'),
        body('defaultExpiryDays').isInt({ min: 1 }).withMessage('Default expiry days must be positive'),
        body('merchantId').optional().isString(),
        body('allowPartialRedemption').optional().isBoolean(),
        body('transferRestrictions').optional().isObject()
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

            const template = await templateManager.createTemplate({
                ...req.body,
                createdBy: req.user._id
            });

            res.status(201).json({
                message: 'Template created successfully',
                template
            });
        } catch (error) {
            logger.error('Error creating template:', error);
            res.status(500).json({ error: 'Failed to create template' });
        }
    }
);

// Get all templates
router.get('/',
    verifyToken,
    readLimiter,
    [
        query('voucherType').optional().isInt({ min: 1, max: 4 }),
        query('isActive').optional().isBoolean(),
        query('merchantId').optional().isString(),
        query('keyword').optional().isString()
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

            let templates;

            if (Object.keys(req.query).length > 0) {
                templates = await templateManager.searchTemplates(req.query);
            } else {
                templates = await templateManager.getActiveTemplates();
            }

            res.json({ templates });
        } catch (error) {
            logger.error('Error fetching templates:', error);
            res.status(500).json({ error: 'Failed to fetch templates' });
        }
    }
);

// Get template by ID
router.get('/:templateId',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const template = await templateManager.getTemplate(req.params.templateId);
            res.json({ template });
        } catch (error) {
            logger.error('Error fetching template:', error);
            res.status(404).json({ error: error.message });
        }
    }
);

// Update template (Admin only)
router.put('/:templateId',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('name').optional().trim(),
        body('description').optional().trim(),
        body('defaultValue').optional().isFloat({ min: 0 }),
        body('defaultExpiryDays').optional().isInt({ min: 1 }),
        body('allowPartialRedemption').optional().isBoolean(),
        body('transferRestrictions').optional().isObject()
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

            const template = await templateManager.updateTemplate(
                req.params.templateId,
                req.body
            );

            res.json({
                message: 'Template updated successfully',
                template
            });
        } catch (error) {
            logger.error('Error updating template:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Deactivate template (Admin only)
router.post('/:templateId/deactivate',
    verifyToken,
    adminOnly,
    writeLimiter,
    async (req, res) => {
        try {
            const template = await templateManager.deactivateTemplate(req.params.templateId);
            res.json({
                message: 'Template deactivated successfully',
                template
            });
        } catch (error) {
            logger.error('Error deactivating template:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Activate template (Admin only)
router.post('/:templateId/activate',
    verifyToken,
    adminOnly,
    writeLimiter,
    async (req, res) => {
        try {
            const template = await templateManager.activateTemplate(req.params.templateId);
            res.json({
                message: 'Template activated successfully',
                template
            });
        } catch (error) {
            logger.error('Error activating template:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Delete template (Admin only)
router.delete('/:templateId',
    verifyToken,
    adminOnly,
    writeLimiter,
    async (req, res) => {
        try {
            await templateManager.deleteTemplate(req.params.templateId);
            res.json({ message: 'Template deleted successfully' });
        } catch (error) {
            logger.error('Error deleting template:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Duplicate template (Admin only)
router.post('/:templateId/duplicate',
    verifyToken,
    adminOnly,
    writeLimiter,
    [
        body('name').optional().trim()
    ],
    async (req, res) => {
        try {
            const template = await templateManager.duplicateTemplate(
                req.params.templateId,
                req.user._id,
                req.body
            );

            res.status(201).json({
                message: 'Template duplicated successfully',
                template
            });
        } catch (error) {
            logger.error('Error duplicating template:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Get template usage statistics
router.get('/:templateId/stats',
    verifyToken,
    readLimiter,
    async (req, res) => {
        try {
            const stats = await templateManager.getTemplateUsageStats(req.params.templateId);
            res.json({ stats });
        } catch (error) {
            logger.error('Error fetching template stats:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Get popular templates
router.get('/analytics/popular',
    verifyToken,
    readLimiter,
    [
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const templates = await templateManager.getPopularTemplates(limit);
            res.json({ templates });
        } catch (error) {
            logger.error('Error fetching popular templates:', error);
            res.status(500).json({ error: 'Failed to fetch popular templates' });
        }
    }
);

// Get recent templates
router.get('/analytics/recent',
    verifyToken,
    readLimiter,
    [
        query('limit').optional().isInt({ min: 1, max: 50 })
    ],
    async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const templates = await templateManager.getRecentTemplates(limit);
            res.json({ templates });
        } catch (error) {
            logger.error('Error fetching recent templates:', error);
            res.status(500).json({ error: 'Failed to fetch recent templates' });
        }
    }
);

module.exports = router;
