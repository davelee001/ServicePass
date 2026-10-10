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
