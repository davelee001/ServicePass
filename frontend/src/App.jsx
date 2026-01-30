import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from './components/Navigation';
import UserDashboard from './pages/UserDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import VoucherList from './pages/VoucherList';
import RedemptionHistory from './pages/RedemptionHistory';
import MerchantRedemptions from './pages/MerchantRedemptions';
import MerchantReports from './pages/MerchantReports';
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

              {/* Merchant Routes */}
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
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
