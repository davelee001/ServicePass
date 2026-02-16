import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { multiSigAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import './MultiSigOperations.css';

const MultiSigOperations = () => {
  const queryClient = useQueryClient();
  const userWallet = localStorage.getItem('walletAddress');
  
  const [formData, setFormData] = useState({
    operationType: 'transfer',
    voucherId: '',
    requiredSignatures: 2,
    expiresAt: '',
    metadata: ''
  });

  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all operations
  const { data: operations, isLoading } = useQuery({
    queryKey: ['multiSigOperations'],
    queryFn: multiSigAPI.getAll,
    refetchInterval: 5000
  });

  // Fetch pending operations (operations that need the user's signature)
  const { data: pendingOps } = useQuery({
    queryKey: ['pendingMultiSig'],
    queryFn: multiSigAPI.getPending,
    refetchInterval: 3000
  });

  // Create operation mutation
  const createMutation = useMutation({
    mutationFn: multiSigAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['multiSigOperations']);
      setFormData({
        operationType: 'transfer',
        voucherId: '',
        requiredSignatures: 2,
        expiresAt: '',
        metadata: ''
      });
    }
  });

  // Sign operation mutation
  const signMutation = useMutation({
    mutationFn: ({ operationId }) => multiSigAPI.sign(operationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['multiSigOperations']);
      queryClient.invalidateQueries(['pendingMultiSig']);
    }
  });

  // Reject operation mutation
  const rejectMutation = useMutation({
    mutationFn: ({ operationId }) => multiSigAPI.reject(operationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['multiSigOperations']);
      queryClient.invalidateQueries(['pendingMultiSig']);
    }
  });

  // Cancel operation mutation
  const cancelMutation = useMutation({
    mutationFn: ({ operationId }) => multiSigAPI.cancel(operationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['multiSigOperations']);
      queryClient.invalidateQueries(['pendingMultiSig']);
    }
  });

  // Execute operation mutation
  const executeMutation = useMutation({
    mutationFn: ({ operationId }) => multiSigAPI.execute(operationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['multiSigOperations']);
      queryClient.invalidateQueries(['pendingMultiSig']);
      queryClient.invalidateQueries(['vouchers']);
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const metadata = formData.metadata ? JSON.parse(formData.metadata) : {};
    createMutation.mutate({
      ...formData,
      metadata
    });
  };

  const handleSign = (operationId) => {
    if (confirm('Are you sure you want to sign this operation?')) {
      signMutation.mutate({ operationId });
    }
  };

  const handleReject = (operationId) => {
    if (confirm('Are you sure you want to reject this operation?')) {
      rejectMutation.mutate({ operationId });
    }
  };

  const handleCancel = (operationId) => {
    if (confirm('Are you sure you want to cancel this operation?')) {
      cancelMutation.mutate({ operationId });
    }
  };

  const handleExecute = (operationId) => {
    if (confirm('Execute this operation? This action cannot be undone.')) {
      executeMutation.mutate({ operationId });
    }
  };

  // Calculate stats
  const stats = operations ? {
    total: operations.length,
    pending: operations.filter(op => op.status === 'pending').length,
    approved: operations.filter(op => op.status === 'approved').length,
    executed: operations.filter(op => op.status === 'executed').length,
    rejected: operations.filter(op => op.status === 'rejected').length,
    needsYourSignature: pendingOps?.length || 0
  } : { total: 0, pending: 0, approved: 0, executed: 0, rejected: 0, needsYourSignature: 0 };

  // Filter operations
  const filteredOperations = operations?.filter(op => {
    if (statusFilter === 'all') return true;
    return op.status === statusFilter;
  }) || [];

  if (isLoading) {
    return <div className="loading">Loading multi-sig operations...</div>;
  }

  return (
    <div className="multisig-operations">
      <div className="page-header">
        <div>
          <h1>Multi-Signature Operations</h1>
          <p>Manage operations requiring multiple approvals for enhanced security</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Operations</p>
        </div>
        <div className="stat-card">
          <h3>{stats.needsYourSignature}</h3>
          <p>Need Your Signature</p>
        </div>
        <div className="stat-card">
          <h3>{stats.pending}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card">
          <h3>{stats.approved}</h3>
          <p>Approved</p>
        </div>
        <div className="stat-card">
          <h3>{stats.executed}</h3>
          <p>Executed</p>
        </div>
        <div className="stat-card">
          <h3>{stats.rejected}</h3>
          <p>Rejected</p>
        </div>
      </div>

      {/* Pending Signatures Section */}
      {pendingOps && pendingOps.length > 0 && (
        <div className="pending-section">
          <h2>⚠️ Operations Awaiting Your Signature ({pendingOps.length})</h2>
          <div className="pending-grid">
            {pendingOps.map(op => (
              <div key={op._id} className="pending-card">
                <div className="pending-header">
                  <div>
                    <h4>{op.operationType.toUpperCase()}</h4>
                    <span className="operation-id">ID: {op._id.slice(-8)}</span>
                  </div>
                  <span className={`status-badge status-${op.status}`}>
                    {op.status}
                  </span>
                </div>
                <div className="pending-details">
                  <p><strong>Voucher ID:</strong> {op.voucherId}</p>
                  <p><strong>Signatures:</strong> {op.signatures.length} / {op.requiredSignatures}</p>
                  <p><strong>Created:</strong> {formatDate(op.createdAt)}</p>
                  {op.expiresAt && (
                    <p><strong>Expires:</strong> {formatDate(op.expiresAt)}</p>
                  )}
                </div>
                <div className="pending-actions">
                  <button
                    className="btn-sign"
                    onClick={() => handleSign(op._id)}
                    disabled={signMutation.isLoading}
                  >
                    {signMutation.isLoading ? 'Signing...' : 'Sign'}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(op._id)}
                    disabled={rejectMutation.isLoading}
                  >
                    {rejectMutation.isLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create New Operation Form */}
      <div className="create-form-card">
        <h2>Create Multi-Sig Operation</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="operationType">Operation Type</label>
              <select
                id="operationType"
                name="operationType"
                value={formData.operationType}
                onChange={handleInputChange}
                required
              >
                <option value="transfer">Transfer</option>
                <option value="redeem">Redeem</option>
                <option value="burn">Burn</option>
                <option value="update">Update</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="voucherId">Voucher ID</label>
              <input
                type="text"
                id="voucherId"
                name="voucherId"
                value={formData.voucherId}
                onChange={handleInputChange}
                placeholder="Enter voucher ID"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="requiredSignatures">Required Signatures</label>
              <input
                type="number"
                id="requiredSignatures"
                name="requiredSignatures"
                value={formData.requiredSignatures}
                onChange={handleInputChange}
                min="2"
                max="10"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expiresAt">Expiration Date (Optional)</label>
              <input
                type="datetime-local"
                id="expiresAt"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="metadata">Additional Metadata (JSON, Optional)</label>
            <textarea
              id="metadata"
              name="metadata"
              value={formData.metadata}
              onChange={handleInputChange}
              placeholder='{"note": "Additional information", "reason": "Security requirement"}'
              rows="3"
            />
          </div>

          {createMutation.isError && (
            <div className="error-message">
              Error: {createMutation.error?.response?.data?.error || 'Failed to create operation'}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFormData({
                operationType: 'transfer',
                voucherId: '',
                requiredSignatures: 2,
                expiresAt: '',
                metadata: ''
              })}
            >
              Clear
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Operation'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="status-filters">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </button>
          <button
            className={`filter-btn ${statusFilter === 'executed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('executed')}
          >
            Executed
          </button>
          <button
            className={`filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected
          </button>
          <button
            className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Operations List */}
      {filteredOperations.length === 0 ? (
        <div className="no-operations">
          <p>No multi-sig operations found</p>
        </div>
      ) : (
        <div className="operations-list">
          {filteredOperations.map(op => (
            <div key={op._id} className="operation-card">
              <div className="operation-header">
                <div>
                  <h3>{op.operationType.toUpperCase()} Operation</h3>
                  <span className="operation-id">ID: {op._id}</span>
                </div>
                <span className={`status-badge status-${op.status}`}>
                  {op.status}
                </span>
              </div>

              <div className="operation-details">
                <div className="detail-row">
                  <span className="label">Voucher ID:</span>
                  <span className="value">{op.voucherId}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Required Signatures:</span>
                  <span className="value">{op.requiredSignatures}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Current Signatures:</span>
                  <span className="value">{op.signatures.length}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Created:</span>
                  <span className="value">{formatDate(op.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Initiator:</span>
                  <span className="value">{op.initiator.slice(0, 8)}...{op.initiator.slice(-6)}</span>
                </div>
                {op.expiresAt && (
                  <div className="detail-row">
                    <span className="label">Expires:</span>
                    <span className="value">{formatDate(op.expiresAt)}</span>
                  </div>
                )}
              </div>

              {/* Signatures List */}
              {op.signatures && op.signatures.length > 0 && (
                <div className="signatures-section">
                  <h4>Signatures ({op.signatures.length})</h4>
                  <div className="signatures-list">
                    {op.signatures.map((sig, idx) => (
                      <div key={idx} className="signature-item">
                        <span className="signer">{sig.signer.slice(0, 8)}...{sig.signer.slice(-6)}</span>
                        <span className="timestamp">{formatDate(sig.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection List */}
              {op.rejections && op.rejections.length > 0 && (
                <div className="rejections-section">
                  <h4>Rejections ({op.rejections.length})</h4>
                  <div className="rejections-list">
                    {op.rejections.map((rej, idx) => (
                      <div key={idx} className="rejection-item">
                        <span className="rejector">{rej.rejector.slice(0, 8)}...{rej.rejector.slice(-6)}</span>
                        <span className="timestamp">{formatDate(rej.timestamp)}</span>
                        {rej.reason && <span className="reason">{rej.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Operation Actions */}
              <div className="operation-actions">
                {op.status === 'pending' && (
                  <>
                    <button
                      className="btn-sign"
                      onClick={() => handleSign(op._id)}
                      disabled={signMutation.isLoading || op.signatures.some(s => s.signer === userWallet)}
                    >
                      {op.signatures.some(s => s.signer === userWallet) ? 'Already Signed' : 'Sign'}
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(op._id)}
                      disabled={rejectMutation.isLoading}
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {op.status === 'approved' && (
                  <button
                    className="btn-execute"
                    onClick={() => handleExecute(op._id)}
                    disabled={executeMutation.isLoading}
                  >
                    {executeMutation.isLoading ? 'Executing...' : 'Execute'}
                  </button>
                )}

                {(op.status === 'pending' || op.status === 'approved') && op.initiator === userWallet && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancel(op._id)}
                    disabled={cancelMutation.isLoading}
                  >
                    {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>

              {(signMutation.isError || rejectMutation.isError || executeMutation.isError || cancelMutation.isError) && (
                <div className="error-message">
                  Error: Failed to perform action
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSigOperations;
