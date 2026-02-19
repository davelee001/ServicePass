import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCoins, FaStore, FaChartBar, FaCog, FaUsers, FaFileAlt, FaCalendar, FaShieldAlt } from 'react-icons/fa';
import './AdminPanel.css';

// Import API functions
import { voucherAPI, merchantAPI, analyticsAPI } from '../services/api';

function AdminPanel() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mint');
  
  // State for minting vouchers
  const [mintForm, setMintForm] = useState({
    voucherType: '1',
    amount: '',
    recipient: '',
    merchantId: '',
    expiryDays: '30',
    metadata: '',
  });

  // State for registering merchants
  const [merchantForm, setMerchantForm] = useState({
    merchantId: '',
    name: '',
    walletAddress: '',
    voucherTypesAccepted: [],
    contactEmail: '',
    contactPhone: '',
  });

  // State for system configuration
  const [systemConfig, setSystemConfig] = useState({
    rateLimitEnabled: true,
    maintenanceMode: false,
    autoArchivalEnabled: true,
    archivalDays: 90,
  });

  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsAPI.getDashboard(),
  });

  // Mint voucher mutation
  const mintMutation = useMutation({
    mutationFn: (data) => voucherAPI.mint(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vouchers']);
      queryClient.invalidateQueries(['analytics']);
      alert('Voucher minted successfully!');
      // Reset form
      setMintForm({
        voucherType: '1',
        amount: '',
        recipient: '',
        merchantId: '',
        expiryDays: '30',
        metadata: '',
      });
    },
    onError: (error) => {
      alert(`Error minting voucher: ${error.message}`);
    },
  });

  // Register merchant mutation
  const registerMerchantMutation = useMutation({
    mutationFn: (data) => merchantAPI.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['merchants']);
      alert('Merchant registered successfully!');
      // Reset form
      setMerchantForm({
        merchantId: '',
        name: '',
        walletAddress: '',
        voucherTypesAccepted: [],
        contactEmail: '',
        contactPhone: '',
      });
    },
    onError: (error) => {
      alert(`Error registering merchant: ${error.message}`);
    },
  });

  // Handle mint form submit
  const handleMintSubmit = (e) => {
    e.preventDefault();
    
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (parseInt(mintForm.expiryDays) * 24 * 60 * 60);
    
    mintMutation.mutate({
      voucherType: parseInt(mintForm.voucherType),
      amount: parseFloat(mintForm.amount),
      recipient: mintForm.recipient,
      merchantId: mintForm.merchantId,
      expiryTimestamp,
      metadata: mintForm.metadata,
    });
  };

  // Handle merchant form submit
  const handleMerchantSubmit = (e) => {
    e.preventDefault();
    
    registerMerchantMutation.mutate({
      ...merchantForm,
      voucherTypesAccepted: merchantForm.voucherTypesAccepted.map(Number),
    });
  };

  // Handle voucher type checkbox for merchant
  const handleVoucherTypeToggle = (type) => {
    setMerchantForm(prev => ({
      ...prev,
      voucherTypesAccepted: prev.voucherTypesAccepted.includes(type)
        ? prev.voucherTypesAccepted.filter(t => t !== type)
        : [...prev.voucherTypesAccepted, type]
    }));
  };

  const voucherTypes = [
    { value: '1', label: 'Education', icon: '🎓', color: '#4CAF50' },
    { value: '2', label: 'Healthcare', icon: '🏥', color: '#2196F3' },
    { value: '3', label: 'Transport', icon: '🚌', color: '#FF9800' },
    { value: '4', label: 'Agriculture', icon: '🌾', color: '#8BC34A' },
  ];

  const tabs = [
    { id: 'mint', label: 'Mint Vouchers', icon: <FaCoins /> },
    { id: 'merchants', label: 'Manage Merchants', icon: <FaStore /> },
    { id: 'analytics', label: 'Analytics', icon: <FaChartBar /> },
    { id: 'config', label: 'Configuration', icon: <FaCog /> },
  ];

  const stats = analyticsData?.summary || {};

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h1>🛡️ Admin Control Panel</h1>
          <p>System management and configuration</p>
        </div>
        <div className="admin-badge">
          <FaShieldAlt /> Administrator
        </div>
      </div>

      {/* Quick Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: '#4CAF50' }}>
            <FaCoins />
          </div>
          <div className="stat-content">
            <h3>{stats.totalVouchersMinted || 0}</h3>
            <p>Total Vouchers Minted</p>
            <span className="stat-change positive">+{stats.newThisMonth || 0} this month</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: '#2196F3' }}>
            <FaStore />
          </div>
          <div className="stat-content">
            <h3>{stats.totalMerchants || 0}</h3>
            <p>Active Merchants</p>
            <span className="stat-change positive">+{stats.newMerchants || 0} new</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: '#FF9800' }}>
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers || 0}</h3>
            <p>Registered Users</p>
            <span className="stat-change">Active today: {stats.activeToday || 0}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: '#9C27B0' }}>
            <FaFileAlt />
          </div>
          <div className="stat-content">
            <h3>{stats.totalRedemptions || 0}</h3>
            <p>Total Redemptions</p>
            <span className="stat-change positive">+{stats.redemptionsToday || 0} today</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {/* Mint Vouchers Tab */}
        {activeTab === 'mint' && (
          <div className="admin-section">
            <div className="section-header">
              <h2><FaCoins /> Mint New Voucher</h2>
              <p>Create and distribute vouchers to recipients</p>
            </div>

            <form onSubmit={handleMintSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Voucher Type *</label>
                  <select
                    value={mintForm.voucherType}
                    onChange={(e) => setMintForm({ ...mintForm, voucherType: e.target.value })}
                    required
                  >
                    {voucherTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mintForm.amount}
                    onChange={(e) => setMintForm({ ...mintForm, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Recipient Wallet Address *</label>
                  <input
                    type="text"
                    value={mintForm.recipient}
                    onChange={(e) => setMintForm({ ...mintForm, recipient: e.target.value })}
                    placeholder="0x..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Merchant ID *</label>
                  <input
                    type="text"
                    value={mintForm.merchantId}
                    onChange={(e) => setMintForm({ ...mintForm, merchantId: e.target.value })}
                    placeholder="e.g., SCHOOL_001"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    value={mintForm.expiryDays}
                    onChange={(e) => setMintForm({ ...mintForm, expiryDays: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Metadata (Optional)</label>
                  <input
                    type="text"
                    value={mintForm.metadata}
                    onChange={(e) => setMintForm({ ...mintForm, metadata: e.target.value })}
                    placeholder="e.g., Grade 10 School Fees"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={mintMutation.isLoading}
                >
                  {mintMutation.isLoading ? 'Minting...' : 'Mint Voucher'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {/* Navigate to bulk mint */}}
                >
                  Bulk Mint
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage Merchants Tab */}
        {activeTab === 'merchants' && (
          <div className="admin-section">
            <div className="section-header">
              <h2><FaStore /> Register New Merchant</h2>
              <p>Add service providers to accept vouchers</p>
            </div>

            <form onSubmit={handleMerchantSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Merchant ID *</label>
                  <input
                    type="text"
                    value={merchantForm.merchantId}
                    onChange={(e) => setMerchantForm({ ...merchantForm, merchantId: e.target.value })}
                    placeholder="e.g., CLINIC_001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Business Name *</label>
                  <input
                    type="text"
                    value={merchantForm.name}
                    onChange={(e) => setMerchantForm({ ...merchantForm, name: e.target.value })}
                    placeholder="e.g., Community Health Clinic"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Wallet Address *</label>
                <input
                  type="text"
                  value={merchantForm.walletAddress}
                  onChange={(e) => setMerchantForm({ ...merchantForm, walletAddress: e.target.value })}
                  placeholder="0x..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Accepted Voucher Types *</label>
                <div className="checkbox-grid">
                  {voucherTypes.map(type => (
                    <label key={type.value} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={merchantForm.voucherTypesAccepted.includes(type.value)}
                        onChange={() => handleVoucherTypeToggle(type.value)}
                      />
                      <span style={{ color: type.color }}>
                        {type.icon} {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    value={merchantForm.contactEmail}
                    onChange={(e) => setMerchantForm({ ...merchantForm, contactEmail: e.target.value })}
                    placeholder="merchant@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    value={merchantForm.contactPhone}
                    onChange={(e) => setMerchantForm({ ...merchantForm, contactPhone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={registerMerchantMutation.isLoading}
                >
                  {registerMerchantMutation.isLoading ? 'Registering...' : 'Register Merchant'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {/* Navigate to merchant list */}}
                >
                  View All Merchants
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="admin-section">
            <div className="section-header">
              <h2><FaChartBar /> System Analytics</h2>
              <p>Comprehensive system metrics and insights</p>
            </div>

            <div className="analytics-summary">
              <div className="metric-card">
                <h3>Total Value Distributed</h3>
                <p className="metric-value">${stats.totalValueDistributed?.toLocaleString() || 0}</p>
                <span className="metric-trend">Across all voucher types</span>
              </div>

              <div className="metric-card">
                <h3>Redemption Rate</h3>
                <p className="metric-value">{stats.redemptionRate || 0}%</p>
                <span className="metric-trend">Of issued vouchers redeemed</span>
              </div>

              <div className="metric-card">
                <h3>Active Vouchers</h3>
                <p className="metric-value">{stats.activeVouchers || 0}</p>
                <span className="metric-trend">Currently in circulation</span>
              </div>

              <div className="metric-card">
                <h3>System Uptime</h3>
                <p className="metric-value">99.9%</p>
                <span className="metric-trend">Last 30 days</span>
              </div>
            </div>

            <div className="quick-links">
              <button className="link-btn" onClick={() => {/* Navigate to full analytics */}}>
                <FaChartBar /> View Full Analytics Dashboard
              </button>
              <button className="link-btn" onClick={() => {/* Export data */}}>
                <FaFileAlt /> Export System Report
              </button>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="admin-section">
            <div className="section-header">
              <h2><FaCog /> System Configuration</h2>
              <p>Manage system settings and preferences</p>
            </div>

            <div className="config-section">
              <h3>Security Settings</h3>
              <div className="config-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={systemConfig.rateLimitEnabled}
                    onChange={(e) => setSystemConfig({ ...systemConfig, rateLimitEnabled: e.target.checked })}
                  />
                  <span className="switch"></span>
                  <span>Enable Rate Limiting</span>
                </label>
                <p className="config-description">Protect API endpoints from abuse</p>
              </div>
            </div>

            <div className="config-section">
              <h3>Maintenance</h3>
              <div className="config-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={systemConfig.maintenanceMode}
                    onChange={(e) => setSystemConfig({ ...systemConfig, maintenanceMode: e.target.checked })}
                  />
                  <span className="switch"></span>
                  <span>Maintenance Mode</span>
                </label>
                <p className="config-description">Temporarily disable user access for system updates</p>
              </div>
            </div>

            <div className="config-section">
              <h3>Data Management</h3>
              <div className="config-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={systemConfig.autoArchivalEnabled}
                    onChange={(e) => setSystemConfig({ ...systemConfig, autoArchivalEnabled: e.target.checked })}
                  />
                  <span className="switch"></span>
                  <span>Auto-Archive Old Records</span>
                </label>
                <p className="config-description">Automatically archive redemption records</p>
              </div>

              <div className="form-group">
                <label>Archive After (Days)</label>
                <input
                  type="number"
                  min="30"
                  value={systemConfig.archivalDays}
                  onChange={(e) => setSystemConfig({ ...systemConfig, archivalDays: e.target.value })}
                  disabled={!systemConfig.autoArchivalEnabled}
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-primary">
                Save Configuration
              </button>
              <button className="btn-secondary">
                Reset to Defaults
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
