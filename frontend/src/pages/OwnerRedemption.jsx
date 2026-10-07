import React, { useEffect, useState } from 'react';
import { getWallets } from '@wallet-standard/app';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { redemptionAPI } from '../services/api';

export default function OwnerRedemption() {
  const [wallets, setWallets] = useState([]);
  const [requestId, setRequestId] = useState(new URLSearchParams(window.location.search).get('intent') || '');
  const [intent, setIntent] = useState(null);
  const [selected, setSelected] = useState('');
  const [signed, setSigned] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const registry = getWallets();
    const update = () => setWallets(registry.get().filter(wallet => wallet.features['sui:signTransaction'] && wallet.features['standard:connect']));
    update();
    const offRegister = registry.on('register', update);
    const offUnregister = registry.on('unregister', update);
    return () => { offRegister(); offUnregister(); };
  }, []);
  const load = async () => {
    setBusy(true); setMessage(''); setSigned(null); setIntent(null);
    try { setIntent(await redemptionAPI.getQrIntent(requestId.trim())); }
    catch (error) { setMessage(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  const approve = async () => {
    setBusy(true); setMessage('');
    try {
      let approval = signed;
      if (!approval) {
        const wallet = wallets.find(wallet => wallet.name === selected);
        if (!wallet) throw new Error('Select your Sui wallet.');
        const { accounts } = await wallet.features['standard:connect'].connect();
        const account = accounts.find(account => normalizeSuiAddress(account.address) === normalizeSuiAddress(intent.owner));
        if (!account) throw new Error('This wallet does not hold the voucher. Select the owner account.');
        const chain = account.chains.includes(`sui:${import.meta.env.VITE_SUI_NETWORK || 'testnet'}`)
          ? `sui:${import.meta.env.VITE_SUI_NETWORK || 'testnet'}` : null;
        if (!chain) throw new Error('Switch your wallet to the configured Sui network.');
        const result = await wallet.features['sui:signTransaction'].signTransaction({
          transaction: Transaction.from(intent.transactionBytes), account, chain,
        });
        if (result.bytes !== intent.transactionBytes) throw new Error('Wallet changed the prepared transaction. Request a fresh redemption.');
        approval = { transactionBytes: result.bytes, signature: result.signature };
        setSigned(approval);
      }
      const result = await redemptionAPI.submitQrIntent(intent.intentId, approval);
      setMessage(`Redemption confirmed: ${result.transactionDigest}`);
      setIntent(null); setSigned(null);
    } catch (error) { setMessage(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  return (
    <section className="voucher-list">
      <h1>Approve voucher redemption</h1>
      <p>Enter the request ID provided by your merchant. Your wallet signs the redemption and pays gas.</p>
      <label>Request ID <input value={requestId} onChange={event => setRequestId(event.target.value)} /></label>
      <button onClick={load} disabled={busy || !requestId.trim()}>Review request</button>
      {intent?.confirmed && <p role="status">This redemption is already confirmed: {intent.digest}</p>}
      {intent && !intent.confirmed && <div className="voucher-card">
        <p>Merchant: {intent.merchantId}</p><p>Voucher: {intent.voucherId}</p>
        <p>Value: {intent.amount} credits. This redeems the entire voucher.</p>
        <p>Owner: {intent.owner}</p><p>Gas budget: up to 0.02 SUI</p>
        <p>Request expires: {new Date(intent.expiresAt).toLocaleString()}</p>
        <label>Wallet <select value={selected} onChange={event => setSelected(event.target.value)}>
          <option value="">Select wallet</option>{wallets.map(wallet => <option key={wallet.name}>{wallet.name}</option>)}
        </select></label>
        {!wallets.length && <p>Install a Sui wallet supporting Wallet Standard transaction signing.</p>}
        <button onClick={approve} disabled={busy || (!signed && !selected)}>{signed ? 'Retry confirmation' : 'Sign and redeem'}</button>
      </div>}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
