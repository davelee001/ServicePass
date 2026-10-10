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
      if (activeWallet.current && !available.includes(activeWallet.current)) {
        eventCleanup.current?.(); activeWallet.current = null; setWalletAddress('');
      }
    };
    update();
    const offRegister = registry.on('register', update);
    const offUnregister = registry.on('unregister', update);
    return () => { offRegister(); offUnregister(); eventCleanup.current?.(); generation.current++; };
  }, [setWalletAddress]);

  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }, [open]);

  const cancel = () => {
    generation.current++; destination.current = null;
    setOpen(false); setBusy(false); setAccounts([]); setError('');
  };
  const complete = (selectedWallet, account) => {
    const address = accountAddress(account);
    eventCleanup.current?.();
    activeWallet.current = selectedWallet;
    setWalletAddress(address);
    eventCleanup.current = selectedWallet.features['standard:events']?.on('change', changes => {
      if (changes.accounts) setWalletAddress(current => retainedAddress(changes.accounts, current, chain));
    });
    const onConnected = destination.current;
    destination.current = null; setOpen(false); setError(''); setAccounts([]);
    onConnected?.();
  };
  const requestConnection = onConnected => enterWithAccount(walletAddress, onConnected, callback => {
    destination.current = callback;
    setWallet(null); setAccounts([]); setError(''); setOpen(true);
  });
  const connect = async selectedWallet => {
    const request = ++generation.current;
    setBusy(true); setError(''); setWallet(selectedWallet); setAccounts([]);
    try {
      const available = await connectAccounts(selectedWallet, chain);
      if (request !== generation.current) return;
      if (available.length === 1) complete(selectedWallet, available[0]);
      else setAccounts(available);
    } catch (failure) {
      if (request === generation.current) setError(failure.message || 'Wallet connection was declined. Try again.');
    } finally { if (request === generation.current) setBusy(false); }
  };
  const detectWallet = () => {
    const available = compatibleWallets(getWallets().get(), chain);
    setWallets(available);
    setError(available.length ? '' : 'No wallet detected. Open or install a Sui wallet, then try connecting again.');
  };
  const disconnect = async () => {
    setError('');
    try {
      await activeWallet.current?.features['standard:disconnect']?.disconnect();
      eventCleanup.current?.(); eventCleanup.current = null; activeWallet.current = null;
      setWalletAddress('');
    } catch (failure) { setError(failure.message || 'Could not disconnect your wallet.'); }
  };

  return <Context.Provider value={{ requestConnection, disconnect }}>
    {children}
    {error && !open && <p role="alert" className="wallet-connection-notice">{error}</p>}
    <dialog ref={dialog} className="wallet-connection-dialog" aria-labelledby="wallet-dialog-title" onCancel={cancel}>
      <h2 id="wallet-dialog-title">Connect your Sui wallet</h2>
      <p>Connect your wallet to view your vouchers. You will be asked to approve the connection.</p>
      <div className="wallet-connection-options">
        {!wallets.length && <button onClick={detectWallet}>Connect wallet</button>}
        {accounts.length ? accounts.map(account => <button key={account.address} onClick={() => complete(wallet, account)}>{accountAddress(account)}</button>)
          : wallets.map((item, index) => <button key={index} disabled={busy} onClick={() => connect(item)}>{item.name}</button>)}
      </div>
      {busy && <p role="status">Waiting for wallet approval...</p>}
      {error && <p role="alert">{error}</p>}
      <button onClick={cancel}>Cancel</button>
    </dialog>
  </Context.Provider>;
}
