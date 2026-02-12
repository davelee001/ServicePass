import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { merchantAPI, redemptionAPI } from '../services/api';
import { 
  formatCurrency, 
  formatDate,
  getVoucherTypeName,
  getVoucherTypeIcon,
  getVoucherTypeColor
} from '../utils/helpers';
import './MerchantDashboard.css';

function MerchantDashboard({ merchantId }) {
  const { data: merchantData, isLoading: merchantLoading } = useQuery({
    queryKey: ['merchant', merchantId],
    queryFn: () => merchantAPI.getMerchantById(merchantId),
    enabled: !!merchantId,
  });

  const { data: redemptionsData, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['merchantRedemptions', merchantId],
    queryFn: () => redemptionAPI.getRedemptionsByMerchant(merchantId),
    enabled: !!merchantId,
  });

  if (!merchantId) {
    return (
      <div className="merchant-dashboard">
        <div className="connect-prompt">
          <h2>Welcome to Merchant Portal</h2>
          <p>Please login to access your merchant dashboard.</p>
        </div>
      </div>
    );
  }

  if (merchantLoading || redemptionsLoading) {
    return (
      <div className="merchant-dashboard">
        <div className="loading">Loading merchant dashboard...</div>
      </div>
    );
  }

  const merchant = merchantData?.merchant;
  const redemptions = redemptionsData?.redemptions || [];
  
  const today = new Date();
  const todayRedemptions = redemptions.filter(r => {
    const redemptionDate = new Date(r.redeemedAt);
    return redemptionDate.toDateString() === today.toDateString();
  });

  const totalRevenue = redemptions.reduce((sum, r) => sum + r.amount, 0);
  const todayRevenue = todayRedemptions.reduce((sum, r) => sum + r.amount, 0);

  // Group redemptions by voucher type
  const redemptionsByType = redemptions.reduce((acc, r) => {
    if (!acc[r.voucherType]) {
      acc[r.voucherType] = { count: 0, amount: 0 };
    }
    acc[r.voucherType].count++;
    acc[r.voucherType].amount += r.amount;
    return acc;
  }, {});

  return (
    <div className="merchant-dashboard">
      <div className="dashboard-header">
        <h1>Merchant Dashboard</h1>
        <p>Welcome back, {merchant?.name || merchantId}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Redemptions</h3>
            <p className="stat-value">{redemptions.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Today's Revenue</h3>
            <p className="stat-value">{formatCurrency(todayRevenue)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Today's Redemptions</h3>
            <p className="stat-value">{todayRedemptions.length}</p>
          </div>
        </div>
      </div>

      {merchant && (
        <div className="merchant-info">
          <h2>Merchant Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Merchant ID:</span>
              <span className="value">{merchant.merchantId}</span>
            </div>
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{merchant.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Wallet Address:</span>
              <span className="value">{merchant.walletAddress}</span>
            </div>
            <div className="info-item">
              <span className="label">Registration Date:</span>
              <span className="value">{formatDate(merchant.registeredAt)}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value">
                <span className={`status-badge ${merchant.isActive ? 'active' : 'inactive'}`}>
                  {merchant.isActive ? 'Active' : 'Inactive'}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="redemptions-by-type">
        <h2>Redemptions by Voucher Type</h2>
        <div className="type-stats-grid">
          {Object.entries(redemptionsByType).map(([type, stats]) => (
            <div 
              key={type} 
              className="type-stat-card"
              style={{ borderLeftColor: getVoucherTypeColor(parseInt(type)) }}
            >
              <div className="type-stat-header">
                <span className="type-icon">{getVoucherTypeIcon(parseInt(type))}</span>
                <h3>{getVoucherTypeName(parseInt(type))}</h3>
              </div>
              <div className="type-stat-body">
                <div className="stat-row">
                  <span className="label">Redemptions:</span>
                  <span className="value">{stats.count}</span>
                </div>
                <div className="stat-row">
                  <span className="label">Total Amount:</span>
                  <span className="value">{formatCurrency(stats.amount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {Object.keys(redemptionsByType).length === 0 && (
          <p className="no-data">No redemptions yet.</p>
        )}
      </div>

      <div className="recent-redemptions">
        <h2>Recent Redemptions</h2>
        {redemptions.length > 0 ? (
          <div className="redemptions-list">
            {redemptions.slice(0, 5).map((redemption) => (
              <div key={redemption._id} className="redemption-item">
                <div className="redemption-info">
                  <span className="redemption-icon">
                    {getVoucherTypeIcon(redemption.voucherType)}
                  </span>
                  <div>
                    <h4>{getVoucherTypeName(redemption.voucherType)}</h4>
                    <p className="redemption-time">{formatDate(redemption.redeemedAt)}</p>
                  </div>
                </div>
                <div className="redemption-amount">
                  <span className="amount">{formatCurrency(redemption.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No redemptions yet.</p>
        )}
      </div>

      <div className="batch-operations">
        <h2>Batch Operations</h2>
        <div className="batch-buttons">
          <button className="batch-button" onClick={() => alert('Bulk Voucher Minting')}>Bulk Voucher Minting</button>
          <button className="batch-button" onClick={() => alert('CSV Import for Recipients')}>CSV Import for Recipients</button>
          <button className="batch-button" onClick={() => alert('Batch Merchant Registration')}>Batch Merchant Registration</button>
        </div>
      </div>
    </div>
  );
}

export default MerchantDashboard;
