import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { redemptionAPI } from '../services/api';
import { 
  getVoucherTypeName,
  getVoucherTypeIcon,
  formatCurrency,
  formatDateTime,
  shortenAddress
} from '../utils/helpers';
import './RedemptionHistory.css';

function RedemptionHistory({ walletAddress }) {
  const [sortBy, setSortBy] = useState('date'); // date, amount, type

  const { data: redemptionsData, isLoading } = useQuery({
    queryKey: ['redemptions', walletAddress],
    queryFn: () => redemptionAPI.getRedemptionsByUser(walletAddress),
    enabled: !!walletAddress,
  });

  if (!walletAddress) {
    return (
      <div className="redemption-history">
        <div className="connect-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to view your redemption history.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="redemption-history">
        <div className="loading">Loading redemption history...</div>
      </div>
    );
  }

  let redemptions = redemptionsData?.redemptions || [];

  // Sort redemptions
  const sortedRedemptions = [...redemptions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.redeemedAt) - new Date(a.redeemedAt);
    } else if (sortBy === 'amount') {
      return b.amount - a.amount;
    } else if (sortBy === 'type') {
      return a.voucherType - b.voucherType;
    }
    return 0;
  });

  const totalRedeemed = redemptions.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="redemption-history">
      <div className="page-header">
        <h1>Redemption History</h1>
        <p>Track all your voucher redemptions</p>
      </div>

      <div className="history-summary">
        <div className="summary-card">
          <h3>Total Redemptions</h3>
          <p className="summary-value">{redemptions.length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Amount Redeemed</h3>
          <p className="summary-value">{formatCurrency(totalRedeemed)}</p>
        </div>
      </div>

      <div className="controls-bar">
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date (Latest First)</option>
            <option value="amount">Amount (Highest First)</option>
            <option value="type">Voucher Type</option>
          </select>
        </div>
      </div>

      <div className="redemptions-table">
        {sortedRedemptions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {sortedRedemptions.map((redemption) => (
                <tr key={redemption._id}>
                  <td>{formatDateTime(redemption.redeemedAt)}</td>
                  <td>
                    <span className="type-badge">
                      {getVoucherTypeIcon(redemption.voucherType)} {getVoucherTypeName(redemption.voucherType)}
                    </span>
                  </td>
                  <td>{redemption.merchantId}</td>
                  <td className="amount-cell">{formatCurrency(redemption.amount)}</td>
                  <td>
                    <a 
                      href={`https://explorer.sui.io/txblock/${redemption.transactionDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transaction-link"
                    >
                      {shortenAddress(redemption.transactionDigest)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No redemption history found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RedemptionHistory;
