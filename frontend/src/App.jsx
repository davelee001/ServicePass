import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tantml:react-query';
import Navigation from './components/Navigation';
import UserDashboard from './pages/UserDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import VoucherList from './pages/VoucherList';
import RedemptionHistory from './pages/RedemptionHistory';
import MerchantRedemptions from './pages/MerchantRedemptions';
import MerchantReports from './pages/MerchantReports';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import TemplateGallery from './pages/TemplateGallery';
import NotificationPreferences from './components/NotificationPreferences';
import ScheduledVouchers from './pages/ScheduledVouchers';
import TransferManagement from './pages/TransferManagement';
import MultiSigOperations from './pages/MultiSigOperations';
import AdminPanel from './pages/AdminPanel';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [userType, setUserType] = useState('user'); // 'user' or 'merchant'
  const [walletAddress, setWalletAddress] = useState('');
  const [merchantId, setMerchantId] = useState('');

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <Navigation 
            userType={userType} 
            setUserType={setUserType}
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            merchantId={merchantId}
            setMerchantId={setMerchantId}
          />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
              
              {/* User Routes */}
              <Route 
                path="/user/dashboard" 
                element={<UserDashboard walletAddress={walletAddress} />} 
              />
              <Route 
                path="/user/vouchers" 
                element={<VoucherList walletAddress={walletAddress} />} 
              />
              <Route 
                path="/user/history" 
                element={<RedemptionHistory walletAddress={walletAddress} />} 
              />
              <Route 
                path="/user/notifications" 
                element={<NotificationPreferences userId={walletAddress} />} 
              />
              <Route 
                path="/user/templates" 
                element={<TemplateGallery userRole="user" />} 
              />
              <Route 
                path="/user/scheduled" 
                element={<ScheduledVouchers walletAddress={walletAddress} />} 
              />
              <Route 
                path="/user/transfers" 
                element={<TransferManagement walletAddress={walletAddress} />} 
              />
              <Route 
                path="/user/multisig" 
                element={<MultiSigOperations walletAddress={walletAddress} />} 
              />

              {/* Merchant Routes */
              <Route 
                path="/merchant/dashboard" 
                element={<MerchantDashboard merchantId={merchantId} />} 
              />
              <Route 
                path="/merchant/redemptions" 
                element={<MerchantRedemptions merchantId={merchantId} />} 
              />
              <Route 
                path="/merchant/reports" 
                element={<MerchantReports merchantId={merchantId} />} 
              />
              <Route 
                path="/merchant/templates" 
                element={<TemplateGallery userRole="admin" />} 
              />
              <Route 
                path="/merchant/scheduled" 
                element={<ScheduledVouchers walletAddress={merchantId} />} 
              />
              <Route 
                path="/merchant/transfers" 
                element={<TransferManagement walletAddress={merchantId} />} 
              />
              <Route 
                path="/merchant/multisig" 
                element={<MultiSigOperations walletAddress={merchantId} />} 
              />
              
              {/* Analytics Dashboard */}
              <Route 
                path="/analytics" 
                element={<AnalyticsDashboard />} 
              />
              <Route 
                path="/merchant/analytics" 
                element={<AnalyticsDashboard merchantId={merchantId} />} 
              />
              
              {/* Admin Panel */}
              <Route 
                path="/admin" 
                element={<AdminPanel />} 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
