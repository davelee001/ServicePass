import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { voucherAPI } from '../services/api';
import { 
  getVoucherTypeName, 
  getVoucherTypeColor,
  getVoucherTypeIcon,
  formatCurrency,
  formatDate,
  isVoucherExpired,
  shortenAddress
} from '../utils/helpers';
import './VoucherList.css';

function VoucherList({ walletAddress }) {
  const [filter, setFilter] = useState('all'); // all, active, expired

  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ['vouchers', walletAddress],
    queryFn: () => voucherAPI.getVouchersByOwner(walletAddress),
    enabled: !!walletAddress,
  });

  if (!walletAddress) {
    return (
      <div className="voucher-list">
        <div className="connect-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to view your vouchers.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="voucher-list">
        <div className="loading">Loading your vouchers...</div>
      </div>
    );
  }

  const vouchers = vouchersData?.vouchers || [];
  
  const filteredVouchers = vouchers.filter(voucher => {
    const expiry = voucher.data?.content?.fields?.expiry_timestamp;
    const expired = expiry && isVoucherExpired(expiry);
    
    if (filter === 'active') return !expired;
    if (filter === 'expired') return expired;
    return true;
  });

  return (
    <div className="voucher-list">
      <div className="page-header">
        <h1>My Vouchers</h1>
        <p>View and manage all your service vouchers</p>
      </div>

      <div className="filter-bar">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All ({vouchers.length})
        </button>
        <button 
          className={filter === 'active' ? 'active' : ''} 
          onClick={() => setFilter('active')}
        >
          Active ({vouchers.filter(v => !isVoucherExpired(v.data?.content?.fields?.expiry_timestamp)).length})
        </button>
        <button 
          className={filter === 'expired' ? 'active' : ''} 
          onClick={() => setFilter('expired')}
        >
          Expired ({vouchers.filter(v => isVoucherExpired(v.data?.content?.fields?.expiry_timestamp)).length})
        </button>
      </div>

      <div className="vouchers-grid">
        {filteredVouchers.map((voucher) => {
          const fields = voucher.data?.content?.fields || {};
          const voucherType = fields.voucher_type;
          const balance = fields.balance || 0;
          const expiry = fields.expiry_timestamp;
          const expired = expiry && isVoucherExpired(expiry);
          const objectId = voucher.data?.objectId;

          return (
            <div 
              key={objectId} 
              className={`voucher-card ${expired ? 'expired' : ''}`}
              style={{ borderTopColor: getVoucherTypeColor(voucherType) }}
            >
              <div className="voucher-header">
                <span className="voucher-icon">{getVoucherTypeIcon(voucherType)}</span>
                <div>
                  <h3>{getVoucherTypeName(voucherType)}</h3>
                  <p className="voucher-id">ID: {shortenAddress(objectId)}</p>
                </div>
                {expired && <span className="expired-badge">Expired</span>}
              </div>

              <div className="voucher-balance">
                <span className="label">Available Balance</span>
                <span className="amount">{formatCurrency(balance)}</span>
              </div>

              <div className="voucher-details">
                <div className="detail-row">
                  <span className="label">Expiry Date:</span>
                  <span className={expired ? 'expired-text' : ''}>
                    {expiry ? formatDate(new Date(expiry)) : 'No expiry'}
                  </span>
                </div>
                {fields.merchant_id && (
                  <div className="detail-row">
                    <span className="label">Merchant:</span>
                    <span>{String.fromCharCode(...fields.merchant_id)}</span>
                  </div>
                )}
              </div>

              {!expired && (
                <div className="voucher-actions">
                  <button className="btn-primary">Use Voucher</button>
                  <button className="btn-secondary">View Details</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredVouchers.length === 0 && (
        <div className="no-vouchers">
          <p>No {filter !== 'all' ? filter : ''} vouchers found.</p>
        </div>
      )}
    </div>
  );
}

export default VoucherList;
