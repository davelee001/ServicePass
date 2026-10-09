const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeInput } = require('../src/middleware/sanitization');

test('sanitization preserves signed QR bytes while cleaning other user input', () => {
    const qrPayload = JSON.stringify({ metadata: '<script>alert(1)</script>', signature: 'signed-value' });
    const req = { headers: {}, method: 'POST', path: '/api/redemptions/redeem-qr', originalUrl: '/api/redemptions/redeem-qr',
        body: { qrPayload, description: '<script>alert(1)</script>', '$operator': 'bad' }, query: {}, params: {} };
    for (const middleware of sanitizeInput) middleware(req, {}, () => {});
    assert.equal(req.body.qrPayload, qrPayload);
    assert.notEqual(req.body.description, '<script>alert(1)</script>');
    assert.equal(req.body.$operator, undefined);
});

test('signed-field exemption applies only to redemption endpoints', () => {
    const req = { headers: {}, originalUrl: '/api/vouchers/mint', body: { qrPayload: '<script>alert(1)</script>' }, query: {}, params: {} };
    for (const middleware of sanitizeInput) middleware(req, {}, () => {});
    assert.notEqual(req.body.qrPayload, '<script>alert(1)</script>');
});
