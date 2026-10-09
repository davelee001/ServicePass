import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaWallet, 
  FaStore, 
  FaTicketAlt, 
  FaHistory, 
  FaChartBar, 
  FaChartPie, 
  FaClock, 
  FaExchangeAlt, 
  FaUsers, 
  FaBell, 
  FaLayerGroup, 
  FaShieldAlt,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaQrcode,
  FaArrowRight,
  FaPowerOff
} from 'react-icons/fa';
import { shortenAddress } from '../utils/helpers';
import './Navigation.css';

function Navigation({ 
  userType, 
  setUserType, 
  walletAddress, 
  setWalletAddress, 
  merchantId, 
  setMerchantId 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const navRef = useRef(null);

  const isLanding = location.pathname === '/';
  const isActive = (path) => location.pathname === path;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setDropdownOpen(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleWalletConnect = () => {
    const mockAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    setWalletAddress(mockAddress);
    setUserType('user');
    if (isLanding) {
      navigate('/user/dashboard');
    }
  };

  const handleMerchantLogin = () => {
    const mockId = 'MERCHANT_' + Math.random().toString(36).substr(2, 7).toUpperCase();
    setMerchantId(mockId);
    setUserType('merchant');
    if (isLanding) {
      navigate('/merchant/dashboard');
    }
  };

  const handleDisconnect = () => {
    if (userType === 'user') {
      setWalletAddress('');
    } else {
      setMerchantId('');
    }
  };

  const toggleDropdown = (name) => {
    setDropdownOpen(dropdownOpen === name ? null : name);
  };

  const scrollToSection = (id) => {
    if (!isLanding) {
      navigate('/#' + id);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
              <Link to="/user/redeem" className={isActive('/user/redeem') ? 'active' : ''}>
                <FaTicketAlt /> Approve Redemption
              </Link>
              <Link to="/user/templates" className={isActive('/user/templates') ? 'active' : ''}>
                <FaLayerGroup /> Templates
              </Link>
              <Link to="/user/scheduled" className={isActive('/user/scheduled') ? 'active' : ''}>
                <FaClock /> Scheduled
              </Link>
              <Link to="/user/transfers" className={isActive('/user/transfers') ? 'active' : ''}>
                <FaExchangeAlt /> Transfers
              </Link>
              <Link to="/user/multisig" className={isActive('/user/multisig') ? 'active' : ''}>
                <FaUsers /> Multi-Sig
              </Link>
              <Link to="/user/history" className={isActive('/user/history') ? 'active' : ''}>
                <FaHistory /> History
              </Link>
              <Link to="/user/notifications" className={isActive('/user/notifications') ? 'active' : ''}>
                <FaBell /> Notifications
              </Link>
              <Link to="/analytics" className={isActive('/analytics') ? 'active' : ''}>
                <FaChartPie /> Analytics
              </Link>
              <Link to="/admin" className={isActive('/admin') ? 'active admin-link' : 'admin-link'}>
                <FaShieldAlt /> Admin Panel
              </Link>
            </>
          ) : (
            <>
              <Link to="/merchant/dashboard" className={isActive('/merchant/dashboard') ? 'active' : ''}>
                <FaChartBar /> Dashboard
              </Link>
              <Link to="/merchant/redeem" className={isActive('/merchant/redeem') ? 'active' : ''}>
                <FaTicketAlt /> Request Redemption
              </Link>
              <Link to="/merchant/redemptions" className={isActive('/merchant/redemptions') ? 'active' : ''}>
                <FaTicketAlt /> Redemptions
              </Link>
              <Link to="/merchant/templates" className={isActive('/merchant/templates') ? 'active' : ''}>
                <FaLayerGroup /> Templates
              </Link>
              <Link to="/merchant/scheduled" className={isActive('/merchant/scheduled') ? 'active' : ''}>
                <FaClock /> Scheduled
              </Link>
              <Link to="/merchant/transfers" className={isActive('/merchant/transfers') ? 'active' : ''}>
                <FaExchangeAlt /> Transfers
              </Link>
              <Link to="/merchant/multisig" className={isActive('/merchant/multisig') ? 'active' : ''}>
                <FaUsers /> Multi-Sig
              </Link>
              <Link to="/merchant/reports" className={isActive('/merchant/reports') ? 'active' : ''}>
                <FaHistory /> Reports
              </Link>
              <Link to="/merchant/analytics" className={isActive('/merchant/analytics') ? 'active' : ''}>
                <FaChartPie /> Analytics
              </Link>
              <Link to="/admin" className={isActive('/admin') ? 'active admin-link' : 'admin-link'}>
                <FaShieldAlt /> Admin Panel
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
