import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountAddress, compatibleWallets, connectAccounts, enterWithAccount, retainedAddress } from '../src/utils/walletConnection.js';

const chain = 'sui:testnet';
const account = (address, chains = [chain]) => ({ address, chains });
const wallet = (accounts, connect = async () => ({ accounts })) => ({
  name: 'Test wallet', chains: [chain], features: { 'standard:connect': { connect } },
});
