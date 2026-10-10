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
  return wallets.filter(wallet => wallet.features['standard:connect'] && wallet.chains?.includes(chain));
}

export async function connectAccounts(wallet, chain) {
  const result = await wallet.features['standard:connect'].connect();
  const accounts = compatibleAccounts(result.accounts || [], chain);
  if (!accounts.length) throw new Error(`No compatible account. Switch your wallet to Sui ${chain.split(':')[1]} and try again.`);
  return accounts;
}

// An entry action must reuse the selected account rather than reconnecting it.
export function enterWithAccount(address, onConnected, openSelector) {
  if (address) onConnected();
  else openSelector(onConnected);
}

export function retainedAddress(accounts, address, chain) {
  return compatibleAccounts(accounts, chain).some(account => accountAddress(account) === address) ? address : '';
}
