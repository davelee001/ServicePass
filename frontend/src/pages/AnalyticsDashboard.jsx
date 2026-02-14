import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [selectedVoucherType, setSelectedVoucherType] = useState('');

    const voucherTypes = {
        1: 'Education',
        2: 'Healthcare',
        3: 'Transport',
        4: 'Agriculture'
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            
            if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
            if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);
            if (selectedMerchant) queryParams.append('merchantId', selectedMerchant);
            if (selectedVoucherType) queryParams.append('voucherType', selectedVoucherType);

            const response = await fetch(`/api/analytics/dashboard?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            setDashboardData(data.dashboard);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = () => {
        fetchDashboardData();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatPercentage = (value) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    const exportData = async (type, format = 'json') => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('type', type);
            queryParams.append('format', format);
            
            if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
            if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);
            if (selectedMerchant) queryParams.append('merchantId', selectedMerchant);

            const response = await fetch(`/api/analytics/export?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export data');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export_${Date.now()}.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(`Export failed: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="analytics-dashboard">
                <div className="loading-spinner">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-dashboard">
                <div className="error-message">Error: {error}</div>
                <button onClick={() => window.location.reload()} className="retry-btn">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="analytics-dashboard">
            <h1>Analytics Dashboard</h1>

            {/* Filters */}
            <div className="filters-section">
                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Start Date:</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        />
                    </div>
                    <div className="filter-group">
                        <label>End Date:</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Voucher Type:</label>
                        <select
                            value={selectedVoucherType}
                            onChange={(e) => setSelectedVoucherType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {Object.entries(voucherTypes).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <button onClick={handleFilterChange} className="apply-filters-btn">
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {dashboardData && (
                <>
                    {/* Summary Cards */}
                    <div className="summary-cards">
                        <div className="summary-card">
                            <h3>Total Vouchers</h3>
                            <div className="card-value">{dashboardData.summary.totalVouchers}</div>
                            <div className="card-change">
                                {dashboardData.recentMetrics.voucherGrowth > 0 ? '↑' : '↓'}
                                {Math.abs(dashboardData.recentMetrics.voucherGrowth)}%
                            </div>
                        </div>
                        <div className="summary-card">
                            <h3>Total Value</h3>
                            <div className="card-value">{formatCurrency(dashboardData.summary.totalValue)}</div>
                            <div className="card-change">
                                {dashboardData.recentMetrics.valueGrowth > 0 ? '↑' : '↓'}
                                {Math.abs(dashboardData.recentMetrics.valueGrowth)}%
                            </div>
                        </div>
                        <div className="summary-card">
                            <h3>Total Redemptions</h3>
                            <div className="card-value">{dashboardData.summary.totalRedemptions}</div>
                            <div className="card-change">
                                {dashboardData.recentMetrics.redemptionGrowth > 0 ? '↑' : '↓'}
                                {Math.abs(dashboardData.recentMetrics.redemptionGrowth)}%
                            </div>
                        </div>
                        <div className="summary-card">
                            <h3>Active Merchants</h3>
                            <div className="card-value">{dashboardData.summary.activeMerchants}</div>
                            <div className="card-subtitle">merchants</div>
                        </div>
                    </div>

                    {/* Voucher Type Distribution */}
                    <div className="chart-section">
                        <h2>Voucher Type Distribution</h2>
                        <div className="distribution-chart">
                            {dashboardData.voucherTypeDistribution.map((item) => (
                                <div key={item._id} className="distribution-item">
                                    <div className="distribution-label">
                                        {voucherTypes[item._id]} ({item.count})
                                    </div>
                                    <div className="distribution-bar">
                                        <div 
                                            className="distribution-fill"
                                            style={{
                                                width: `${(item.count / dashboardData.summary.totalVouchers) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="distribution-value">
                                        {formatCurrency(item.totalValue)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Merchants */}
                    <div className="merchants-section">
                        <h2>Top Performing Merchants</h2>
                        <div className="merchants-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Merchant</th>
                                        <th>Vouchers Minted</th>
                                        <th>Total Value</th>
                                        <th>Redemptions</th>
                                        <th>Success Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.topMerchants.map((merchant, index) => (
                                        <tr key={merchant._id}>
                                            <td>
                                                <div className="merchant-info">
                                                    <span className="merchant-rank">#{index + 1}</span>
                                                    <span className="merchant-name">{merchant.name}</span>
                                                </div>
                                            </td>
                                            <td>{merchant.voucherCount}</td>
                                            <td>{formatCurrency(merchant.totalValue)}</td>
                                            <td>{merchant.redemptionCount}</td>
                                            <td>
                                                <span className={`success-rate ${merchant.successRate > 0.8 ? 'high' : merchant.successRate > 0.5 ? 'medium' : 'low'}`}>
                                                    {formatPercentage(merchant.successRate)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="financial-section">
                        <h2>Financial Summary</h2>
                        <div className="financial-grid">
                            <div className="financial-item">
                                <label>Total Value Minted:</label>
                                <span>{formatCurrency(dashboardData.financialSummary.totalValue)}</span>
                            </div>
                            <div className="financial-item">
                                <label>Total Redeemed:</label>
                                <span>{formatCurrency(dashboardData.financialSummary.totalRedeemed)}</span>
                            </div>
                            <div className="financial-item">
                                <label>Remaining Value:</label>
                                <span>{formatCurrency(dashboardData.financialSummary.remainingValue)}</span>
                            </div>
                            <div className="financial-item">
                                <label>Utilization Rate:</label>
                                <span className="utilization-rate">
                                    {formatPercentage(dashboardData.financialSummary.utilizationRate)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Expiry Alerts */}
                    <div className="expiry-section">
                        <h2>Expiry Alerts</h2>
                        <div className="expiry-alerts">
                            <div className="expiry-alert warning">
                                <h4>Expiring in 7 Days</h4>
                                <div className="alert-count">{dashboardData.expiryAlerts.expiringIn7Days}</div>
                                <div className="alert-value">{formatCurrency(dashboardData.expiryAlerts.valueExpiringIn7Days)}</div>
                            </div>
                            <div className="expiry-alert info">
                                <h4>Expiring in 30 Days</h4>
                                <div className="alert-count">{dashboardData.expiryAlerts.expiringIn30Days}</div>
                                <div className="alert-value">{formatCurrency(dashboardData.expiryAlerts.valueExpiringIn30Days)}</div>
                            </div>
                            <div className="expiry-alert danger">
                                <h4>Already Expired</h4>
                                <div className="alert-count">{dashboardData.expiryAlerts.expired}</div>
                                <div className="alert-value">{formatCurrency(dashboardData.expiryAlerts.valueExpired)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="export-section">
                        <h2>Export Data</h2>
                        <div className="export-buttons">
                            <button onClick={() => exportData('dashboard', 'json')} className="export-btn">
                                Export Dashboard (JSON)
                            </button>
                            <button onClick={() => exportData('dashboard', 'csv')} className="export-btn">
                                Export Dashboard (CSV)
                            </button>
                            <button onClick={() => exportData('vouchers', 'json')} className="export-btn">
                                Export Vouchers (JSON)
                            </button>
                            <button onClick={() => exportData('vouchers', 'csv')} className="export-btn">
                                Export Vouchers (CSV)
                            </button>
                            <button onClick={() => exportData('financial', 'json')} className="export-btn">
                                Export Financial (JSON)
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsDashboard;