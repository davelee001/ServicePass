import { normalizeSuiAddress } from '@mysten/sui/utils';

export function accountAddress(account) {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(account.address)) throw new Error('Invalid Sui wallet address.');
