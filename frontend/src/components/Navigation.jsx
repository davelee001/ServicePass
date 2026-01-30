import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWallet, FaStore, FaTicketAlt, FaHistory, FaChartBar } from 'react-icons/fa';
import { shortenAddress } from '../utils/helpers';
import './Navigation.css';

function Navigation({ userType, setUserType, walletAddress, setWalletAddress, merchantId, setMerchantId }) {
  const location = useLocation();
  
  const handleWalletConnect = () => {
    // Simplified wallet connection - in production, integrate with Sui wallet
    const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
    setWalletAddress(mockAddress);
  };
  
  const handleMerchantLogin = () => {
    // Simplified merchant login
    const mockMerchantId = 'MERCHANT_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setMerchantId(mockMerchantId);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <FaTicketAlt className="brand-icon" />
          <h1>ServicePass</h1>
        </div>

        <div className="nav-toggle">
          <button 
            className={userType === 'user' ? 'active' : ''}
            onClick={() => setUserType('user')}
          >
            User
          </button>
          <button 
            className={userType === 'merchant' ? 'active' : ''}
            onClick={() => setUserType('merchant')}
          >
            Merchant
          </button>
        </div>

        <div className="nav-links">
          {userType === 'user' ? (
            <>
              <Link to="/user/dashboard" className={isActive('/user/dashboard') ? 'active' : ''}>
                <FaChartBar /> Dashboard
              </Link>
              <Link to="/user/vouchers" className={isActive('/user/vouchers') ? 'active' : ''}>
                <FaTicketAlt /> My Vouchers
              </Link>
              <Link to="/user/history" className={isActive('/user/history') ? 'active' : ''}>
                <FaHistory /> Redemption History
              </Link>
            </>
          ) : (
            <>
              <Link to="/merchant/dashboard" className={isActive('/merchant/dashboard') ? 'active' : ''}>
                <FaChartBar /> Dashboard
              </Link>
              <Link to="/merchant/redemptions" className={isActive('/merchant/redemptions') ? 'active' : ''}>
                <FaTicketAlt /> Redemptions
              </Link>
              <Link to="/merchant/reports" className={isActive('/merchant/reports') ? 'active' : ''}>
                <FaHistory /> Reports
              </Link>
            </>
          )}
        </div>

        <div className="nav-wallet">
          {userType === 'user' ? (
            walletAddress ? (
              <div className="wallet-info">
                <FaWallet />
                <span>{shortenAddress(walletAddress)}</span>
              </div>
            ) : (
              <button className="connect-btn" onClick={handleWalletConnect}>
                Connect Wallet
              </button>
            )
          ) : (
            merchantId ? (
              <div className="wallet-info">
                <FaStore />
                <span>{merchantId}</span>
              </div>
            ) : (
              <button className="connect-btn" onClick={handleMerchantLogin}>
                Merchant Login
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
