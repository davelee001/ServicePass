import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferAPI } from '../services/api';
import { 
  getVoucherTypeName, 
  getVoucherTypeColor,
  formatCurrency,
  formatDate 
} from '../utils/helpers';
import './TransferManagement.css';

function TransferManagement({ userId }) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    voucherId: '',
    fromAddress: userId || '',
    toAddress: '',
    requiresApproval: false,
  });

  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['transfers', { status: statusFilter !== 'all' ? statusFilter : undefined }],
    queryFn: () => transferAPI.getAll({ 
      status: statusFilter !== 'all' ? statusFilter : undefined 
    }),
  });

  const { data: pendingData } = useQuery({
    queryKey: ['transfers', 'pending'],
    queryFn: () => transferAPI.getPendingApprovals(),
  });

  const { data: statsData } = useQuery({
    queryKey: ['transfers', 'stats'],
    queryFn: () => transferAPI.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => transferAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transfers']);
      setShowCreateForm(false);
      setFormData({
        voucherId: '',
        fromAddress: userId || '',
        toAddress: '',
        requiresApproval: false,
      });
      alert('Transfer initiated successfully!');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (transferId) => transferAPI.approve(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries(['transfers']);
      alert('Transfer approved!');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ transferId, reason }) => transferAPI.reject(transferId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['transfers']);
      alert('Transfer rejected!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleReject = (transferId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectMutation.mutate({ transferId, reason });
    }
  };

  if (isLoading) {
    return (
      <div className="transfer-management">
        <div className="loading">Loading transfers...</div>
      </div>
    );
  }

  const transfers = transfersData?.transfers || [];
  const pendingTransfers = pendingData?.pending || [];
  const stats = statsData?.stats || {};

  const statuses = ['all', 'initiated', 'pending_approval', 'completed', 'rejected'];

  return (
    <div className="transfer-management">
      <div className="page-header">
        <div>
          <h1>🔄 Transfer Management</h1>
          <p>Manage voucher transfers and approvals</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ New Transfer'}
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalTransfers || 0}</h3>
            <p>Total Transfers</p>
          </div>
          <div className="stat-card">
            <h3>{stats.completedCount || 0}</h3>
            <p>Completed</p>
          </div>
          <div className="stat-card">
            <h3>{stats.pendingCount || 0}</h3>
            <p>Pending Approval</p>
          </div>
          <div className="stat-card">
            <h3>{stats.rejectedCount || 0}</h3>
            <p>Rejected</p>
          </div>
        </div>
      )}

      {pendingTransfers.length > 0 && (
        <div className="pending-section">
          <h2>⏱️ Pending Approvals ({pendingTransfers.length})</h2>
          <div className="pending-grid">
            {pendingTransfers.map(transfer => (
              <div key={transfer.transferId} className="pending-card">
                <div className="pending-header">
                  <span className="transfer-amount">{formatCurrency(transfer.amount)}</span>
                  <span className="status-badge status-pending">Pending</span>
                </div>
                <div className="pending-details">
                  <p><strong>From:</strong> {transfer.fromAddress.slice(0, 10)}...{transfer.fromAddress.slice(-8)}</p>
                  <p><strong>To:</strong> {transfer.toAddress.slice(0, 10)}...{transfer.toAddress.slice(-8)}</p>
                  <p><strong>Voucher:</strong> {transfer.voucherId}</p>
                </div>
                <div className="pending-actions">
                  <button 
                    className="btn-approve"
                    onClick={() => approveMutation.mutate(transfer.transferId)}
                    disabled={approveMutation.isLoading}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleReject(transfer.transferId)}
                    disabled={rejectMutation.isLoading}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="create-form-card">
          <h2>Initiate New Transfer</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Voucher ID *</label>
                <input
                  type="text"
                  name="voucherId"
                  value={formData.voucherId}
                  onChange={handleChange}
                  required
                  placeholder="Enter voucher ID"
                />
              </div>

              <div className="form-group">
                <label>From Address *</label>
                <input
                  type="text"
                  name="fromAddress"
                  value={formData.fromAddress}
                  onChange={handleChange}
                  required
                  placeholder="0x..."
                />
              </div>

              <div className="form-group">
                <label>To Address *</label>
                <input
                  type="text"
                  name="toAddress"
                  value={formData.toAddress}
                  onChange={handleChange}
                  required
                  placeholder="0x..."
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="requiresApproval"
                    checked={formData.requiresApproval}
                    onChange={handleChange}
                  />
                  Requires Approval
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Initiating...' : 'Initiate Transfer'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <div className="status-filters">
          {statuses.map(status => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="transfers-list">
        {transfers.map((transfer) => (
          <div 
            key={transfer.transferId} 
            className="transfer-card"
            style={{ borderLeftColor: getVoucherTypeColor(transfer.voucherType) }}
          >
            <div className="transfer-header">
              <div>
                <h3>Transfer #{transfer.transferId.slice(0, 8)}</h3>
                <span className={`status-badge status-${transfer.status.replace('_', '-')}`}>
                  {transfer.status.replace('_', ' ')}
                </span>
              </div>
              <div className="transfer-amount">
                {formatCurrency(transfer.amount)}
              </div>
            </div>

            <div className="transfer-details">
              <div className="detail-row">
                <span className="label">Voucher ID:</span>
                <span className="value">{transfer.voucherId}</span>
              </div>
              <div className="detail-row">
                <span className="label">From:</span>
                <span className="value">{transfer.fromAddress.slice(0, 10)}...{transfer.fromAddress.slice(-8)}</span>
              </div>
              <div className="detail-row">
                <span className="label">To:</span>
                <span className="value">{transfer.toAddress.slice(0, 10)}...{transfer.toAddress.slice(-8)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Initiated:</span>
                <span className="value">{formatDate(new Date(transfer.initiatedAt))}</span>
              </div>
              {transfer.completedAt && (
                <div className="detail-row">
                  <span className="label">Completed:</span>
                  <span className="value">{formatDate(new Date(transfer.completedAt))}</span>
                </div>
              )}
              {transfer.requiresApproval && (
                <div className="detail-row">
                  <span className="label">Approval Required:</span>
                  <span className="badge badge-warning">Yes</span>
                </div>
              )}
            </div>

            {transfer.status === 'pending_approval' && (
              <div className="transfer-actions">
                <button 
                  className="btn-approve"
                  onClick={() => approveMutation.mutate(transfer.transferId)}
                  disabled={approveMutation.isLoading}
                >
                  Approve Transfer
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => handleReject(transfer.transferId)}
                  disabled={rejectMutation.isLoading}
                >
                  Reject Transfer
                </button>
              </div>
            )}

            {transfer.status === 'rejected' && transfer.rejectionReason && (
              <div className="error-message">
                <strong>Rejection Reason:</strong> {transfer.rejectionReason}
              </div>
            )}
          </div>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="no-transfers">
          <p>No transfers found. Initiate your first transfer to get started!</p>
        </div>
      )}
    </div>
  );
}

export default TransferManagement;
