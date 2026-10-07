import React, { useState } from 'react';
import { redemptionAPI } from '../services/api';
export default function MerchantQrRedemption() {
  const [payload, setPayload] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [intent, setIntent] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const prepare = async () => {
    setBusy(true); setMessage(''); setIntent(null);
    try { setIntent(await redemptionAPI.prepareQrRedemption(payload, apiKey)); }
    catch (error) { setMessage(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  const check = async () => {
    setBusy(true);
    try {
      const result = await redemptionAPI.getQrIntent(intent.intentId);
      setMessage(result.confirmed ? `Confirmed: ${result.digest}` : 'Waiting for owner approval.');
    } catch (error) { setMessage(error.response?.data?.error || error.message); }
    finally { setBusy(false); }
  };
  const ownerLink = intent ? `${window.location.origin}/user/redeem?intent=${intent.intentId}` : '';
  return <section className="voucher-list">
    <h1>Request voucher redemption</h1>
    <p>Paste the scanned voucher QR data. The owner must approve the full redemption in their wallet.</p>
    <label>Merchant API key <input type="password" autoComplete="off" value={apiKey} onChange={event => setApiKey(event.target.value)} /></label>
    <label>Voucher QR data <textarea value={payload} onChange={event => setPayload(event.target.value)} /></label>
    <button onClick={prepare} disabled={busy || !payload || !apiKey}>Prepare redemption</button>
    {intent && <div className="voucher-card"><p>Owner: {intent.owner}</p><p>Value: {intent.amount} credits</p>
      <p>Ask the owner to open this link on their wallet device:</p><a href={ownerLink}>{ownerLink}</a>
      <p>Request ID: {intent.intentId}</p><button disabled={busy} onClick={check}>Check confirmation</button>
    </div>}
    {message && <p role="status">{message}</p>}
  </section>;
}
