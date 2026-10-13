import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_POS_VOUCHERS, validateSimulatorAmount } from '../src/utils/posSimulator.js';

test('rejects empty, non-finite, malformed and non-positive amounts', () => {
  for (const amount of ['', ' ', 'NaN', 'Infinity', '-Infinity', '0', '-1', '50abc']) {
    assert.ok(validateSimulatorAmount(amount, 'VOUCH-EDU-8902').error, amount);
  }
});

test('accepts cents and each exact sample value, rejects a cent above it', () => {
  for (const voucher of SAMPLE_POS_VOUCHERS) {
    assert.equal(validateSimulatorAmount('0.01', voucher.id).amount, '0.01');
    const maximum = (voucher.balanceCents / 100).toFixed(2);
    assert.equal(validateSimulatorAmount(maximum, voucher.id).amount, maximum);
    assert.ok(validateSimulatorAmount(((voucher.balanceCents + 1) / 100).toFixed(2), voucher.id).error);
  }
});
