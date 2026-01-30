import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { voucherAPI, redemptionAPI } from '../services/api';
import { 
  calculateTotalBalance, 
  groupVouchersByType, 
  getVoucherTypeName,
  getVoucherTypeColor,
  getVoucherTypeIcon,
  formatCurrency,
  isVoucherExpired
} from '../utils/helpers';
import './UserDashboard.css';

function UserDashboard({ walletAddress }) {
  const { data: vouchersData, isLoading: vouchersLoading } = useQuery({
    queryKey: ['vouchers', walletAddress],
    queryFn: () => voucherAPI.getVouchersByOwner(walletAddress),
    enabled: !!walletAddress,
  });

  const { data: redemptionsData, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['redemptions', walletAddress],
    queryFn: () => redemptionAPI.getRedemptionsByUser(walletAddress),
    enabled: !!walletAddress,
  });

  if (!walletAddress) {
    return (
      <div className="user-dashboard">
        <div className="connect-prompt">
          <h2>Welcome to ServicePass</h2>
          <p>Please connect your wallet to view your vouchers and redemption history.</p>
        </div>
      </div>
    );
  }

  if (vouchersLoading || redemptionsLoading) {
    return (
      <div className="user-dashboard">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  const vouchers = vouchersData?.vouchers || [];
  const redemptions = redemptionsData?.redemptions || [];
  const totalBalance = calculateTotalBalance(vouchers);
  const groupedVouchers = groupVouchersByType(vouchers);
  
  const activeVouchers = vouchers.filter(v => {
    const expiry = v.data?.content?.fields?.expiry_timestamp;
    return expiry && !isVoucherExpired(expiry);
  });

  const expiredVouchers = vouchers.filter(v => {
    const expiry = v.data?.content?.fields?.expiry_timestamp;
    return expiry && isVoucherExpired(expiry);
  });

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>My Dashboard</h1>
        <p>Welcome back! Here's your voucher overview.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Balance</h3>
            <p className="stat-value">{formatCurrency(totalBalance)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3>Active Vouchers</h3>
            <p className="stat-value">{activeVouchers.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>Expired Vouchers</h3>
            <p className="stat-value">{expiredVouchers.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Total Redemptions</h3>
            <p className="stat-value">{redemptions.length}</p>
          </div>
        </div>
      </div>

      <div className="vouchers-by-type">
        <h2>Vouchers by Type</h2>
        <div className="type-grid">
          {Object.entries(groupedVouchers).map(([type, typeVouchers]) => {
            const totalAmount = typeVouchers.reduce((sum, v) => {
              return sum + (v.data?.content?.fields?.balance || 0);
            }, 0);

            return (
              <div 
                key={type} 
                className="type-card"
                style={{ borderLeftColor: getVoucherTypeColor(parseInt(type)) }}
              >
                <div className="type-header">
                  <span className="type-icon">{getVoucherTypeIcon(parseInt(type))}</span>
                  <h3>{getVoucherTypeName(parseInt(type))}</h3>
                </div>
                <div className="type-stats">
                  <div className="type-stat">
                    <span className="label">Count:</span>
                    <span className="value">{typeVouchers.length}</span>
                  </div>
                  <div className="type-stat">
                    <span className="label">Balance:</span>
                    <span className="value">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {Object.keys(groupedVouchers).length === 0 && (
          <p className="no-data">No vouchers found. Contact your administrator to receive vouchers.</p>
        )}
      </div>

      <div className="recent-activity">
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
                    <p className="redemption-merchant">Merchant: {redemption.merchantId}</p>
                  </div>
                </div>
                <div className="redemption-amount">
                  <span className="amount">{formatCurrency(redemption.amount)}</span>
                  <span className="date">{new Date(redemption.redeemedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No redemption history yet.</p>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
