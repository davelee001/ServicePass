import { normalizeSuiAddress } from '@mysten/sui/utils';

export function accountAddress(account) {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(account.address)) throw new Error('Invalid Sui wallet address.');
  return normalizeSuiAddress(account.address);
}

export function compatibleAccounts(accounts, chain) {
  return accounts.filter(account => account.chains?.includes(chain)
    && /^0x[0-9a-fA-F]{1,64}$/.test(account.address));
}

export function compatibleWallets(wallets, chain) {
