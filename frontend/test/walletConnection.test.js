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
  const supported = wallet([]);
  assert.deepEqual(compatibleWallets([supported, { ...supported, chains: ['sui:mainnet'] }, { chains: [chain], features: {} }], chain), [supported]);
});

test('returns all compatible accounts so the user can select instead of silently choosing one', async () => {
  const first = account('0x1'), second = account('0x2');
  assert.deepEqual(await connectAccounts(wallet([first, account('0x3', ['sui:mainnet']), second]), chain), [first, second]);
});

test('rejects connection with no matching account or an invalid wallet address', async () => {
  for (const accounts of [[], [account('0x1', ['sui:mainnet'])], [account('0xnothex')], [account('0x' + 'a'.repeat(65))]]) {
    await assert.rejects(connectAccounts(wallet(accounts), chain), /No compatible account/);
  }
  assert.throws(() => accountAddress(account('0xnothex')), /Invalid Sui/);
});

test('propagates wallet rejection without inventing a replacement account', async () => {
  await assert.rejects(connectAccounts(wallet([], async () => { throw new Error('User rejected'); }), chain), /User rejected/);
