const mongoose = require('mongoose');
const VoucherTemplate = require('../models/VoucherTemplate');

describe('VoucherTemplate Model', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servicepass-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await VoucherTemplate.deleteMany({});
    });

    describe('Template Creation', () => {
        test('should create a valid template', async () => {
            const templateData = {
                name: 'Student Stipend',
                description: 'Monthly student support voucher',
                category: 'education',
                voucherType: 1,
                defaultValue: 500,
                defaultExpiryDays: 30,
                allowPartialRedemption: true,
                transferRestrictions: {
                    maxTransfers: 2,
                    requireApproval: false
                }
            };

            const template = new VoucherTemplate(templateData);
            const savedTemplate = await template.save();

            expect(savedTemplate._id).toBeDefined();
            expect(savedTemplate.templateId).toBeDefined();
            expect(savedTemplate.name).toBe(templateData.name);
            expect(savedTemplate.category).toBe(templateData.category);
            expect(savedTemplate.isActive).toBe(true);
            expect(savedTemplate.usageCount).toBe(0);
        });

        test('should generate unique templateId', async () => {
            const template1 = new VoucherTemplate({
                name: 'Template 1',
                category: 'education',
                voucherType: 1,
                defaultValue: 100
            });

            const template2 = new VoucherTemplate({
                name: 'Template 2',
                category: 'healthcare',
                voucherType: 2,
                defaultValue: 200
            });

            const saved1 = await template1.save();
            const saved2 = await template2.save();

            expect(saved1.templateId).toBeDefined();
            expect(saved2.templateId).toBeDefined();
            expect(saved1.templateId).not.toBe(saved2.templateId);
        });

        test('should require name and category', async () => {
            const template = new VoucherTemplate({
                voucherType: 1,
                defaultValue: 100
            });

            await expect(template.save()).rejects.toThrow();
        });

        test('should validate voucher type range', async () => {
            const template = new VoucherTemplate({
                name: 'Invalid Type',
                category: 'education',
                voucherType: 5, // Invalid
                defaultValue: 100
            });

            await expect(template.save()).rejects.toThrow();
        });

        test('should validate default value is positive', async () => {
            const template = new VoucherTemplate({
                name: 'Negative Value',
                category: 'education',
                voucherType: 1,
                defaultValue: -100
            });

            await expect(template.save()).rejects.toThrow();
        });
    });

    describe('Usage Tracking', () => {
        test('should increment usage count', async () => {
            const template = new VoucherTemplate({
                name: 'Test Template',
                category: 'education',
                voucherType: 1,
                defaultValue: 100
            });

            await template.save();
            expect(template.usageCount).toBe(0);

            await template.incrementUsage();
            expect(template.usageCount).toBe(1);

            await template.incrementUsage();
            expect(template.usageCount).toBe(2);
        });
    });

    describe('Template Queries', () => {
        beforeEach(async () => {
            await VoucherTemplate.create([
                {
                    name: 'Active Template 1',
                    category: 'education',
                    voucherType: 1,
                    defaultValue: 100,
                    isActive: true
                },
                {
                    name: 'Active Template 2',
                    category: 'healthcare',
                    voucherType: 2,
                    defaultValue: 200,
                    isActive: true
                },
                {
                    name: 'Inactive Template',
                    category: 'education',
                    voucherType: 1,
                    defaultValue: 150,
                    isActive: false
                }
            ]);
        });

        test('should find only active templates', async () => {
            const activeTemplates = await VoucherTemplate.findActive();
            expect(activeTemplates).toHaveLength(2);
            expect(activeTemplates.every(t => t.isActive)).toBe(true);
        });

        test('should find templates by category', async () => {
            const eduTemplates = await VoucherTemplate.findByCategory('education');
            expect(eduTemplates).toHaveLength(2);
            expect(eduTemplates.every(t => t.category === 'education')).toBe(true);
        });
    });

    describe('Transfer Restrictions', () => {
        test('should store transfer restrictions', async () => {
            const template = new VoucherTemplate({
                name: 'Restricted Template',
                category: 'education',
                voucherType: 1,
                defaultValue: 100,
                transferRestrictions: {
                    maxTransfers: 3,
                    requireApproval: true,
                    allowedRecipients: ['0x123', '0x456']
                }
            });

            const saved = await template.save();
            expect(saved.transferRestrictions.maxTransfers).toBe(3);
            expect(saved.transferRestrictions.requireApproval).toBe(true);
            expect(saved.transferRestrictions.allowedRecipients).toHaveLength(2);
        });
    });

    describe('Metadata', () => {
        test('should store custom metadata', async () => {
            const template = new VoucherTemplate({
                name: 'Template with Metadata',
                category: 'education',
                voucherType: 1,
                defaultValue: 100,
                metadata: {
                    program: 'Student Support',
                    semester: 'Spring 2026',
                    customField: 'value'
                }
            });

            const saved = await template.save();
            expect(saved.metadata.program).toBe('Student Support');
            expect(saved.metadata.semester).toBe('Spring 2026');
            expect(saved.metadata.customField).toBe('value');
        });
    });
});
