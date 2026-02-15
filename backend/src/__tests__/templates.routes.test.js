const request = require('supertest');
const app = require('../server');
const VoucherTemplate = require('../models/VoucherTemplate');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Template Routes', () => {
    let adminToken, userToken, adminUser;

    beforeAll(async () => {
        // Create admin user
        adminUser = await User.create({
            email: 'admin@test.com',
            password: 'password123',
            name: 'Admin User',
            role: 'admin'
        });

        // Create regular user
        const regularUser = await User.create({
            email: 'user@test.com',
            password: 'password123',
            name: 'Regular User',
            role: 'user'
        });

        // Generate tokens
        adminToken = jwt.sign(
            { id: adminUser._id, role: 'admin' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        userToken = jwt.sign(
            { id: regularUser._id, role: 'user' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    beforeEach(async () => {
        await VoucherTemplate.deleteMany({});
    });

    describe('POST /api/templates', () => {
        test('should create template with admin auth', async () => {
            const templateData = {
                name: 'Student Stipend',
                description: 'Monthly student support',
                category: 'education',
                voucherType: 1,
                defaultValue: 500,
                defaultExpiryDays: 30,
                allowPartialRedemption: true
            };

            const response = await request(app)
                .post('/api/templates')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(templateData)
                .expect(201);

            expect(response.body.template).toBeDefined();
            expect(response.body.template.name).toBe(templateData.name);
            expect(response.body.template.templateId).toBeDefined();
        });

        test('should reject non-admin users', async () => {
            const templateData = {
                name: 'Test Template',
                category: 'education',
                voucherType: 1,
                defaultValue: 100
            };

            await request(app)
                .post('/api/templates')
                .set('Authorization', `Bearer ${userToken}`)
                .send(templateData)
                .expect(403);
        });

        test('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/templates')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    // Missing required fields
                    voucherType: 1
                })
                .expect(400);

            expect(response.body.error).toBeDefined();
        });

        test('should validate voucher type range', async () => {
            const response = await request(app)
                .post('/api/templates')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Invalid Template',
                    category: 'education',
                    voucherType: 10, // Invalid
                    defaultValue: 100
                })
                .expect(400);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /api/templates', () => {
        beforeEach(async () => {
            await VoucherTemplate.create([
                {
                    name: 'Template 1',
                    category: 'education',
                    voucherType: 1,
                    defaultValue: 100,
                    isActive: true
                },
                {
                    name: 'Template 2',
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

        test('should list all templates with auth', async () => {
            const response = await request(app)
                .get('/api/templates')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.templates).toBeDefined();
            expect(response.body.templates.length).toBeGreaterThan(0);
        });

        test('should filter by category', async () => {
            const response = await request(app)
                .get('/api/templates?category=education')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.templates.every(t => t.category === 'education')).toBe(true);
        });

        test('should filter by active status', async () => {
            const response = await request(app)
                .get('/api/templates?isActive=true')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.templates.every(t => t.isActive === true)).toBe(true);
        });

        test('should search by name', async () => {
            const response = await request(app)
                .get('/api/templates?search=Template 1')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.templates.some(t => t.name.includes('Template 1'))).toBe(true);
        });

        test('should require authentication', async () => {
            await request(app)
                .get('/api/templates')
                .expect(401);
        });
    });

    describe('GET /api/templates/:templateId', () => {
        let template;

        beforeEach(async () => {
            template = await VoucherTemplate.create({
                name: 'Test Template',
                category: 'education',
                voucherType: 1,
                defaultValue: 500
            });
        });

        test('should get template by ID', async () => {
            const response = await request(app)
                .get(`/api/templates/${template.templateId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.template.templateId).toBe(template.templateId);
            expect(response.body.template.name).toBe('Test Template');
        });

        test('should return 404 for non-existent template', async () => {
            await request(app)
                .get('/api/templates/nonexistent_template')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/templates/:templateId', () => {
        let template;

        beforeEach(async () => {
            template = await VoucherTemplate.create({
                name: 'Original Name',
                category: 'education',
                voucherType: 1,
                defaultValue: 500
            });
        });

        test('should update template with admin auth', async () => {
            const updates = {
                name: 'Updated Name',
                description: 'Updated description',
                defaultValue: 600
            };

            const response = await request(app)
                .put(`/api/templates/${template.templateId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updates)
                .expect(200);

            expect(response.body.template.name).toBe('Updated Name');
            expect(response.body.template.defaultValue).toBe(600);
        });

        test('should reject non-admin updates', async () => {
            await request(app)
                .put(`/api/templates/${template.templateId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Hacked Name' })
                .expect(403);
        });
    });

    describe('POST /api/templates/:templateId/deactivate', () => {
        let template;

        beforeEach(async () => {
            template = await VoucherTemplate.create({
                name: 'Active Template',
                category: 'education',
                voucherType: 1,
                defaultValue: 500,
                isActive: true
            });
        });

        test('should deactivate template', async () => {
            const response = await request(app)
                .post(`/api/templates/${template.templateId}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.template.isActive).toBe(false);
        });

        test('should require admin auth', async () => {
            await request(app)
                .post(`/api/templates/${template.templateId}/deactivate`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    describe('POST /api/templates/:templateId/duplicate', () => {
        let template;

        beforeEach(async () => {
            template = await VoucherTemplate.create({
                name: 'Original Template',
                category: 'education',
                voucherType: 1,
                defaultValue: 500,
                metadata: { program: 'Test Program' }
            });
        });

        test('should duplicate template', async () => {
            const response = await request(app)
                .post(`/api/templates/${template.templateId}/duplicate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(201);

            expect(response.body.template.name).toContain('Copy');
            expect(response.body.template.templateId).not.toBe(template.templateId);
            expect(response.body.template.voucherType).toBe(template.voucherType);
            expect(response.body.template.usageCount).toBe(0);
        });
    });

    describe('GET /api/templates/:templateId/stats', () => {
        let template;

        beforeEach(async () => {
            template = await VoucherTemplate.create({
                name: 'Stats Template',
                category: 'education',
                voucherType: 1,
                defaultValue: 500,
                usageCount: 10
            });
        });

        test('should get template usage stats', async () => {
            const response = await request(app)
                .get(`/api/templates/${template.templateId}/stats`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.stats).toBeDefined();
            expect(response.body.stats.usageCount).toBe(10);
        });
    });

    describe('GET /api/templates/analytics/popular', () => {
        beforeEach(async () => {
            await VoucherTemplate.create([
                {
                    name: 'Popular 1',
                    category: 'education',
                    voucherType: 1,
                    defaultValue: 100,
                    usageCount: 50
                },
                {
                    name: 'Popular 2',
                    category: 'healthcare',
                    voucherType: 2,
                    defaultValue: 200,
                    usageCount: 30
                },
                {
                    name: 'Not Popular',
                    category: 'transport',
                    voucherType: 3,
                    defaultValue: 150,
                    usageCount: 5
                }
            ]);
        });

        test('should get popular templates', async () => {
            const response = await request(app)
                .get('/api/templates/analytics/popular')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.templates).toBeDefined();
            expect(response.body.templates.length).toBeGreaterThan(0);
            
            // Should be sorted by usage count descending
            for (let i = 1; i < response.body.templates.length; i++) {
                expect(response.body.templates[i - 1].usageCount >= response.body.templates[i].usageCount).toBe(true);
            }
        });

        test('should require admin auth', async () => {
            await request(app)
                .get('/api/templates/analytics/popular')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    describe('DELETE /api/templates/:templateId', () => {
        let template;

        beforeEach(async () => {
            template = await VoucherTemplate.create({
                name: 'To Delete',
                category: 'education',
                voucherType: 1,
                defaultValue: 500
            });
        });

        test('should delete template with admin auth', async () => {
            await request(app)
                .delete(`/api/templates/${template.templateId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const deleted = await VoucherTemplate.findOne({ templateId: template.templateId });
            expect(deleted).toBeNull();
        });

        test('should reject non-admin deletion', async () => {
            await request(app)
                .delete(`/api/templates/${template.templateId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });
});
