import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountAddress, compatibleWallets, connectAccounts, enterWithAccount, retainedAddress } from '../src/utils/walletConnection.js';

const chain = 'sui:testnet';
const account = (address, chains = [chain]) => ({ address, chains });
const wallet = (accounts, connect = async () => ({ accounts })) => ({
  name: 'Test wallet', chains: [chain], features: { 'standard:connect': { connect } },
});

test('uses the wallet-provided address in the 64-digit format required by the API', async () => {
  const address = '0x' + 'a'.repeat(40);
  const [selected] = await connectAccounts(wallet([account(address)]), chain);
  assert.equal(accountAddress(selected), '0x' + '0'.repeat(24) + 'a'.repeat(40));
  assert.match(accountAddress(selected), /^0x[a-fA-F0-9]{64}$/);
});

test('filters wallet discovery by configured network and connection support', () => {
