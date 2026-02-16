import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledVoucherAPI } from '../services/api';
import { 
  getVoucherTypeName, 
  getVoucherTypeColor,
  formatCurrency,
  formatDate 
} from '../utils/helpers';
import './ScheduledVouchers.css';

function ScheduledVouchers({ merchantId }) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    voucherType: 'discount',
    amount: '',
    recipient: '',
    scheduleTime: '',
    recurrence: 'once',
    merchantId: merchantId || '',
  });

  const { data: scheduledVouchersData, isLoading } = useQuery({
    queryKey: ['scheduled-vouchers', { status: statusFilter !== 'all' ? statusFilter : undefined }],
    queryFn: () => scheduledVoucherAPI.getAll({ 
      status: statusFilter !== 'all' ? statusFilter : undefined 
    }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['scheduled-vouchers', 'stats'],
    queryFn: () => scheduledVoucherAPI.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => scheduledVoucherAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-vouchers']);
      setShowCreateForm(false);
      setFormData({
        voucherType: 'discount',
        amount: '',
        recipient: '',
        scheduleTime: '',
        recurrence: 'once',
        merchantId: merchantId || '',
      });
      alert('Voucher scheduled successfully!');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (scheduleId) => scheduledVoucherAPI.cancel(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-vouchers']);
      alert('Scheduled voucher cancelled!');
    },
  });

  const triggerProcessingMutation = useMutation({
    mutationFn: () => scheduledVoucherAPI.triggerProcessing(),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-vouchers']);
      alert('Processing triggered successfully!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="scheduled-vouchers">
        <div className="loading">Loading scheduled vouchers...</div>
      </div>
    );
  }

  const scheduledVouchers = scheduledVouchersData?.scheduledVouchers || [];
  const stats = statsData?.stats || {};

  const statuses = ['all', 'scheduled', 'issued', 'cancelled', 'failed'];

  return (
    <div className="scheduled-vouchers">
      <div className="page-header">
        <div>
          <h1>🗓️ Scheduled Vouchers</h1>
          <p>Manage and automate voucher issuance</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Schedule New Voucher'}
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalScheduled || 0}</h3>
            <p>Total Scheduled</p>
          </div>
          <div className="stat-card">
            <h3>{stats.pendingCount || 0}</h3>
            <p>Pending</p>
          </div>
          <div className="stat-card">
            <h3>{stats.issuedCount || 0}</h3>
            <p>Issued</p>
          </div>
          <div className="stat-card">
            <h3>{stats.failedCount || 0}</h3>
            <p>Failed</p>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="create-form-card">
          <h2>Schedule New Voucher</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Recipient Address *</label>
                <input
                  type="text"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleChange}
                  required
                  placeholder="0x..."
                />
              </div>

              <div className="form-group">
                <label>Voucher Type *</label>
                <select
                  name="voucherType"
                  value={formData.voucherType}
                  onChange={handleChange}
                  required
                >
                  <option value="discount">Discount</option>
                  <option value="cashback">Cashback</option>
                  <option value="giftcard">Gift Card</option>
                  <option value="loyalty">Loyalty</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Schedule Time *</label>
                <input
                  type="datetime-local"
                  name="scheduleTime"
                  value={formData.scheduleTime}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label>Recurrence</label>
                <select
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleChange}
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Merchant ID</label>
                <input
                  type="text"
                  name="merchantId"
                  value={formData.merchantId}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Scheduling...' : 'Schedule Voucher'}
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
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <button 
          className="btn-secondary"
          onClick={() => triggerProcessingMutation.mutate()}
          disabled={triggerProcessingMutation.isLoading}
        >
          Trigger Processing
        </button>
      </div>

      <div className="schedules-list">
        {scheduledVouchers.map((schedule) => (
          <div 
            key={schedule.scheduleId} 
            className="schedule-card"
            style={{ borderLeftColor: getVoucherTypeColor(schedule.voucherType) }}
          >
            <div className="schedule-header">
              <div>
                <h3>{getVoucherTypeName(schedule.voucherType)}</h3>
                <span className={`status-badge status-${schedule.status}`}>
                  {schedule.status}
                </span>
              </div>
              <div className="schedule-amount">
                {formatCurrency(schedule.amount)}
              </div>
            </div>

            <div className="schedule-details">
              <div className="detail-row">
                <span className="label">Recipient:</span>
                <span className="value">{schedule.recipient.slice(0, 10)}...{schedule.recipient.slice(-8)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Scheduled For:</span>
                <span className="value">{formatDate(new Date(schedule.scheduleTime))}</span>
              </div>
              {schedule.recurrence && schedule.recurrence !== 'once' && (
                <div className="detail-row">
                  <span className="label">Recurrence:</span>
                  <span className="value">{schedule.recurrence}</span>
                </div>
              )}
              {schedule.merchantId && (
                <div className="detail-row">
                  <span className="label">Merchant ID:</span>
                  <span className="value">{schedule.merchantId}</span>
                </div>
              )}
              {schedule.issuedVoucherId && (
                <div className="detail-row">
                  <span className="label">Issued Voucher:</span>
                  <span className="value">{schedule.issuedVoucherId}</span>
                </div>
              )}
            </div>

            {schedule.status === 'scheduled' && (
              <div className="schedule-actions">
                <button 
                  className="btn-danger"
                  onClick={() => cancelMutation.mutate(schedule.scheduleId)}
                  disabled={cancelMutation.isLoading}
                >
                  Cancel Schedule
                </button>
              </div>
            )}

            {schedule.status === 'failed' && schedule.failureReason && (
              <div className="error-message">
                <strong>Failure Reason:</strong> {schedule.failureReason}
              </div>
            )}
          </div>
        ))}
      </div>

      {scheduledVouchers.length === 0 && (
        <div className="no-schedules">
          <p>No scheduled vouchers found. Create your first scheduled voucher to get started!</p>
        </div>
      )}
    </div>
  );
}

export default ScheduledVouchers;
