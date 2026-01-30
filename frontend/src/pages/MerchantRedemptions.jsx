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
import './MerchantRedemptions.css';

function MerchantRedemptions({ merchantId }) {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const { data: redemptionsData, isLoading, refetch } = useQuery({
    queryKey: ['merchantRedemptions', merchantId, dateRange],
    queryFn: () => redemptionAPI.getRedemptionsByMerchant(merchantId, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
    enabled: !!merchantId,
  });

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  if (!merchantId) {
    return (
      <div className="merchant-redemptions">
        <div className="connect-prompt">
          <h2>Merchant Login Required</h2>
          <p>Please login to view redemptions.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="merchant-redemptions">
        <div className="loading">Loading redemptions...</div>
      </div>
    );
  }

  const redemptions = redemptionsData?.redemptions || [];

  return (
    <div className="merchant-redemptions">
      <div className="page-header">
        <h1>Accept Voucher Redemptions</h1>
        <p>View and manage all voucher redemptions</p>
      </div>

      <div className="filters-section">
        <div className="date-filters">
          <div className="filter-group">
            <label>Start Date:</label>
            <input 
              type="date" 
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date:</label>
            <input 
              type="date" 
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>
          <button className="btn-secondary" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="redemptions-summary">
        <div className="summary-item">
          <h3>Total Redemptions</h3>
          <p className="summary-value">{redemptions.length}</p>
        </div>
        <div className="summary-item">
          <h3>Total Value</h3>
          <p className="summary-value">
            {formatCurrency(redemptions.reduce((sum, r) => sum + r.amount, 0))}
          </p>
        </div>
      </div>

      <div className="redemptions-table-container">
        {redemptions.length > 0 ? (
          <table className="redemptions-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Voucher Type</th>
                <th>Amount</th>
                <th>Redeemed By</th>
                <th>Transaction ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((redemption) => (
                <tr key={redemption._id}>
                  <td>{formatDateTime(redemption.redeemedAt)}</td>
                  <td>
                    <span className="type-badge">
                      {getVoucherTypeIcon(redemption.voucherType)}{' '}
                      {getVoucherTypeName(redemption.voucherType)}
                    </span>
                  </td>
                  <td className="amount-cell">{formatCurrency(redemption.amount)}</td>
                  <td>{shortenAddress(redemption.redeemedBy)}</td>
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
                  <td>
                    <button className="btn-small btn-view">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No redemptions found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MerchantRedemptions;
