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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const destination = useRef(null);
  const activeWallet = useRef(null);
  const eventCleanup = useRef(null);
  const generation = useRef(0);

  useEffect(() => {
    const registry = getWallets();
    const update = () => {
      const available = compatibleWallets(registry.get(), chain);
      setWallets(available);
      if (available.length) setError('');
