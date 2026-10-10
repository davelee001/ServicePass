import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getWallets } from '@wallet-standard/app';
import { accountAddress, compatibleWallets, connectAccounts, enterWithAccount, retainedAddress } from '../utils/walletConnection';
import './WalletConnection.css';

const Context = createContext(null);
const chain = `sui:${import.meta.env.VITE_SUI_NETWORK || 'testnet'}`;
export const useWalletConnection = () => useContext(Context);

