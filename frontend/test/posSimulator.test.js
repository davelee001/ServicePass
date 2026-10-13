import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_POS_VOUCHERS, validateSimulatorAmount } from '../src/utils/posSimulator.js';

test('rejects empty, non-finite, malformed and non-positive amounts', () => {
  for (const amount of ['', ' ', 'NaN', 'Infinity', '-Infinity', '0', '-1', '50abc']) {
    assert.ok(validateSimulatorAmount(amount, 'VOUCH-EDU-8902').error, amount);
