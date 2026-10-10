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
