const { test } = require('node:test');
const assert = require('node:assert/strict');
const Voucher = require('../src/models/Voucher');

test('database model and frontend agree on millisecond boundaries and no-expiry sentinel', async t => {
    const { isVoucherExpired } = await import('../../frontend/src/utils/helpers.js');
    const now = 1700000000000;
    t.mock.method(Date, 'now', () => now);
    for (const [expiry, expired] of [[now - 1, true], [now, true], [now + 1, false], [0, false], [undefined, false]]) {
        const voucher = new Voucher({ expiryTimestamp: expiry });
        assert.equal(voucher.isExpired, expired, `model expiry ${expiry}`);
        assert.equal(isVoucherExpired(expiry), expired, `frontend expiry ${expiry}`);
        if (expiry != null) assert.equal(isVoucherExpired(String(expiry)), expired, `chain string expiry ${expiry}`);
    }
});
