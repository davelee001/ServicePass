import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { redemptionAPI } from '../services/api';
import { 
  formatCurrency, 
  formatDate,
  getVoucherTypeName,
  getVoucherTypeColor
} from '../utils/helpers';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './MerchantReports.css';

function MerchantReports({ merchantId }) {
  const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: redemptionsData, isLoading } = useQuery({
    queryKey: ['merchantRedemptions', merchantId, dateRange],
    queryFn: () => redemptionAPI.getRedemptionsByMerchant(merchantId, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
    enabled: !!merchantId,
  });

  if (!merchantId) {
    return (
      <div className="merchant-reports">
        <div className="connect-prompt">
          <h2>Merchant Login Required</h2>
          <p>Please login to generate reports.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="merchant-reports">
        <div className="loading">Generating reports...</div>
      </div>
    );
  }

  const redemptions = redemptionsData?.redemptions || [];
  
  // Process data for charts
  const redemptionsByType = redemptions.reduce((acc, r) => {
    const typeName = getVoucherTypeName(r.voucherType);
    if (!acc[typeName]) {
      acc[typeName] = { count: 0, amount: 0 };
    }
    acc[typeName].count++;
    acc[typeName].amount += r.amount;
    return acc;
  }, {});

  const pieData = Object.entries(redemptionsByType).map(([name, data]) => ({
    name,
    value: data.amount,
    count: data.count,
  }));

  // Group by date for trend chart
  const redemptionsByDate = redemptions.reduce((acc, r) => {
    const date = new Date(r.redeemedAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, count: 0, amount: 0 };
    }
    acc[date].count++;
    acc[date].amount += r.amount;
    return acc;
  }, {});

  const trendData = Object.values(redemptionsByDate).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  const barData = Object.entries(redemptionsByType).map(([name, data]) => ({
    name,
    redemptions: data.count,
    amount: data.amount,
  }));

  const totalRevenue = redemptions.reduce((sum, r) => sum + r.amount, 0);
  const averageTransaction = redemptions.length > 0 ? totalRevenue / redemptions.length : 0;

  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#8BC34A', '#E91E63', '#9C27B0'];

  const handleExportReport = () => {
    const reportData = {
      merchantId,
      dateRange,
      totalRedemptions: redemptions.length,
      totalRevenue,
      averageTransaction,
      redemptionsByType,
      redemptions: redemptions.map(r => ({
        date: formatDate(r.redeemedAt),
        type: getVoucherTypeName(r.voucherType),
        amount: r.amount,
        transactionId: r.transactionDigest,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merchant-report-${merchantId}-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="merchant-reports">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>View detailed insights and generate reports</p>
      </div>

      <div className="report-controls">
        <div className="date-range">
          <div className="date-input">
            <label>Start Date:</label>
            <input 
              type="date" 
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="date-input">
            <label>End Date:</label>
            <input 
              type="date" 
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={handleExportReport}>
          Export Report
        </button>
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <h3>Total Redemptions</h3>
          <p className="summary-value">{redemptions.length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Revenue</h3>
          <p className="summary-value">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="summary-card">
          <h3>Average Transaction</h3>
          <p className="summary-value">{formatCurrency(averageTransaction)}</p>
        </div>
      </div>

      {redemptions.length > 0 ? (
        <>
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#2196F3" name="Revenue" />
                  <Line type="monotone" dataKey="count" stroke="#4CAF50" name="Count" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>Redemptions by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container full-width">
              <h3>Revenue by Voucher Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="redemptions" fill="#4CAF50" name="Redemptions" />
                  <Bar dataKey="amount" fill="#2196F3" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="detailed-breakdown">
            <h3>Detailed Breakdown by Voucher Type</h3>
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Voucher Type</th>
                  <th>Redemptions</th>
                  <th>Total Amount</th>
                  <th>Average Amount</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(redemptionsByType).map(([type, data]) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td>{data.count}</td>
                    <td>{formatCurrency(data.amount)}</td>
                    <td>{formatCurrency(data.amount / data.count)}</td>
                    <td>{((data.amount / totalRevenue) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="no-data">
          <p>No redemption data available for the selected period.</p>
        </div>
      )}
    </div>
  );
}

export default MerchantReports;
