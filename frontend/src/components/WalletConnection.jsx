import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getWallets } from '@wallet-standard/app';
import { accountAddress, compatibleWallets, connectAccounts, enterWithAccount, retainedAddress } from '../utils/walletConnection';
import './WalletConnection.css';

const Context = createContext(null);
const chain = `sui:${import.meta.env.VITE_SUI_NETWORK || 'testnet'}`;
export const useWalletConnection = () => useContext(Context);

export default function WalletConnection({ walletAddress, setWalletAddress, children }) {
  const [wallets, setWallets] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
