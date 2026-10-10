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
    expect((await request(app).post('/api/admin-action').set('Cookie', cookie)).status).toBe(200);
    const stored = await User.findOne({ username: 'Admin' });
    expect(stored.password).not.toBe('ServicePass');
    expect(await stored.comparePassword('ServicePass')).toBe(true);
});

test('incorrect passwords cannot establish an admin session', async () => {
    const response = await request(app).post('/api/auth/admin/login').send({ username: 'Admin', password: 'incorrect' });
    expect(response.status).toBe(401);
    expect(response.headers['set-cookie']).toBeUndefined();
});

test('regular users cannot use the admin login or a forged role claim', async () => {
    const user = await User.create({ username: 'Regular', email: 'regular@test.com', password: 'ServicePass', name: 'Regular', role: 'user' });
    expect((await request(app).post('/api/auth/admin/login').send({ username: 'Regular', password: 'ServicePass' })).status).toBe(401);
    const token = jwt.sign({ userId: user._id, role: 'admin' }, JWT_SECRET);
    expect((await request(app).post('/api/admin-action').set('Authorization', `Bearer ${token}`)).status).toBe(403);
});

