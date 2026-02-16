import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { redemptionAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import './PartialRedemptionModal.css';

function PartialRedemptionModal({ voucher, onClose, walletAddress }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [merchantInfo, setMerchantInfo] = useState('');
  const [error, setError] = useState('');

  const fields = voucher?.data?.content?.fields || {};
  const balance = fields.balance || 0;
  const originalAmount = fields.original_amount || balance;
  const voucherId = voucher?.data?.objectId;
  const allowPartialRedemption = fields.allow_partial_redemption !== false;

  const redeemMutation = useMutation({
    mutationFn: (redemptionData) => {
      if (allowPartialRedemption) {
        return redemptionAPI.recordPartialRedemption(voucherId, redemptionData);
      } else {
        return redemptionAPI.recordRedemption(redemptionData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vouchers', walletAddress]);
      queryClient.invalidateQueries(['redemptions', walletAddress]);
      onClose();
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Redemption failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const redemptionAmount = parseFloat(amount);

    if (!redemptionAmount || redemptionAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (redemptionAmount > balance) {
      setError(`Amount cannot exceed available balance of ${formatCurrency(balance)}`);
      return;
    }

    if (!merchantInfo.trim()) {
      setError('Please enter merchant information');
      return;
    }

    redeemMutation.mutate({
      voucherId,
      walletAddress,
      amount: redemptionAmount,
      merchantInfo: merchantInfo.trim(),
    });
  };

  const handleQuickAmount = (percentage) => {
    const quickAmount = (balance * percentage) / 100;
    setAmount(quickAmount.toString());
  };

  if (!voucher) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{allowPartialRedemption ? 'Partial Redemption' : 'Redeem Voucher'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="voucher-info">
            <div className="info-row">
              <span className="label">Original Amount:</span>
              <span className="value">{formatCurrency(originalAmount)}</span>
            </div>
            <div className="info-row">
              <span className="label">Available Balance:</span>
              <span className="value highlight">{formatCurrency(balance)}</span>
            </div>
            {balance < originalAmount && (
              <div className="info-row">
                <span className="label">Already Redeemed:</span>
                <span className="value">{formatCurrency(originalAmount - balance)}</span>
              </div>
            )}
          </div>

          {allowPartialRedemption && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(balance / originalAmount) * 100}%` }}
              ></div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="amount">
                {allowPartialRedemption ? 'Redemption Amount' : 'Full Amount'}
              </label>
              {allowPartialRedemption ? (
                <>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to redeem"
                    step="0.01"
                    min="0.01"
                    max={balance}
                    required
                  />
                  <div className="quick-amounts">
                    <button type="button" onClick={() => handleQuickAmount(25)}>25%</button>
                    <button type="button" onClick={() => handleQuickAmount(50)}>50%</button>
                    <button type="button" onClick={() => handleQuickAmount(75)}>75%</button>
                    <button type="button" onClick={() => setAmount(balance.toString())}>100%</button>
                  </div>
                </>
              ) : (
                <input
                  type="text"
                  id="amount"
                  value={formatCurrency(balance)}
                  disabled
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="merchantInfo">Merchant Information</label>
              <input
                type="text"
                id="merchantInfo"
                value={merchantInfo}
                onChange={(e) => setMerchantInfo(e.target.value)}
                placeholder="Enter merchant name or ID"
                required
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="redemption-summary">
                <div className="summary-row">
                  <span>Redeeming:</span>
                  <span className="amount">{formatCurrency(parseFloat(amount))}</span>
                </div>
                {allowPartialRedemption && (
                  <div className="summary-row">
                    <span>Remaining Balance:</span>
                    <span className="amount">{formatCurrency(balance - parseFloat(amount))}</span>
                  </div>
                )}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={redeemMutation.isLoading}
              >
                {redeemMutation.isLoading ? 'Processing...' : 'Confirm Redemption'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PartialRedemptionModal;
