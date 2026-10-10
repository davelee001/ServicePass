const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, adminOnly, JWT_SECRET } = require('../middleware/auth');
const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth'));
app.post('/api/admin-action', verifyToken, adminOnly, (req, res) => res.json({ success: true }));

beforeEach(async () => {
    await User.create({ username: 'Admin', email: 'admin@test.com', password: 'ServicePass', name: 'Admin', role: 'admin' });
});
const login = () => request(app).post('/api/auth/admin/login').send({ username: 'Admin', password: 'ServicePass' });

test('unauthenticated sessions and administrative actions are denied', async () => {
    expect((await request(app).get('/api/auth/admin/session')).status).toBe(401);
    expect((await request(app).post('/api/admin-action')).status).toBe(401);
});

test('correct credentials establish an HttpOnly session accepted by protected API routes', async () => {
    const response = await login();
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('admin');
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(response.body.accessToken).toBeUndefined();
    expect((await request(app).get('/api/auth/admin/session').set('Cookie', cookie)).status).toBe(200);
