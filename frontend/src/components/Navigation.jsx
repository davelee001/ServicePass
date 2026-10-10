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
import { useWalletConnection } from './WalletConnection';

function Navigation({ 
  userType, 
  setUserType, 
  walletAddress, 
  setWalletAddress, 
  merchantId, 
  setMerchantId 
}) {
  const { requestConnection, disconnect } = useWalletConnection();
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
    requestConnection(() => {
      setUserType('user');
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
    <header className="site-header" ref={navRef}>
      {/* Top Protocol Status Bar */}
      <div className="protocol-bar">
        <div className="protocol-container">
          <div className="protocol-left">
            <span className="net-pill">
              <span className="live-dot-green"></span> Sui Testnet Active
            </span>
            <span className="protocol-stat">Package: <code>0x7a8c...90b4</code></span>
            <span className="protocol-divider">|</span>
            <span className="protocol-stat">Finality: &lt; 1s</span>
          </div>
          <div className="protocol-right">
            <Link to="/admin" className="protocol-link admin-pill">
              <FaShieldAlt /> Admin Studio
            </Link>
            <Link to="/analytics" className="protocol-link">
              <FaChartPie /> Protocol Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className={`main-navbar ${isLanding ? 'navbar-landing' : 'navbar-app'}`}>
        <div className="navbar-container">
          {/* Brand Logo */}
          <Link to="/" className="brand-badge">
            <div className="brand-logo-icon">
              <FaTicketAlt />
            </div>
            <div className="brand-text-group">
              <span className="brand-title">ServicePass</span>
              <span className="brand-tag">DECENTRALIZED VOUCHER PROTOCOL</span>
            </div>
          </Link>

          {/* LANDING PAGE MARKETING NAV */}
          {isLanding ? (
            <div className="nav-menu-desktop">
              <button className="nav-menu-btn" onClick={() => scrollToSection('features')}>
                Features
              </button>
              <button className="nav-menu-btn" onClick={() => scrollToSection('sectors')}>
                Sectors
              </button>
              <button className="nav-menu-btn" onClick={() => scrollToSection('how-it-works')}>
                How It Works
              </button>
              <button className="nav-menu-btn" onClick={() => scrollToSection('calculator')}>
                ROI Calculator
              </button>
              <button className="nav-menu-btn" onClick={() => scrollToSection('security')}>
                Security & Audit
              </button>
              <button className="nav-menu-btn" onClick={() => scrollToSection('faq')}>
                FAQ
              </button>
            </div>
          ) : (
            /* APP IN-DEPTH GROUPED NAVIGATION */
            <div className="nav-menu-desktop app-nav-menu">
              {/* Role Toggle Pill */}
              <div className="portal-toggle-pill">
                <button 
                  className={`toggle-btn ${userType === 'user' ? 'active' : ''}`}
                  onClick={() => {
                    setUserType('user');
                    navigate('/user/dashboard');
                  }}
                >
                  <FaWallet /> Beneficiary
                </button>
                <button 
                  className={`toggle-btn ${userType === 'merchant' ? 'active' : ''}`}
                  onClick={() => {
                    setUserType('merchant');
                    navigate('/merchant/dashboard');
                  }}
                >
                  <FaStore /> Merchant
                </button>
              </div>

              {userType === 'user' ? (
                <>
                  <Link to="/user/dashboard" className={`app-nav-link ${isActive('/user/dashboard') ? 'active' : ''}`}>
                    <FaChartBar /> Dashboard
                  </Link>

                  {/* Vouchers Dropdown */}
                  <div className="nav-dropdown-wrapper">
                    <button 
                      className={`app-nav-link dropdown-trigger ${isActive('/user/vouchers') || isActive('/user/redeem') || isActive('/user/history') ? 'active' : ''}`}
                      onClick={() => toggleDropdown('vouchers')}
                    >
                      <FaTicketAlt /> Vouchers <FaChevronDown className="chevron" />
                    </button>
                    {dropdownOpen === 'vouchers' && (
                      <div className="nav-dropdown-menu">
                        <Link to="/user/vouchers" className="dropdown-item">
                          <FaTicketAlt className="item-icon" />
                          <div>
                            <div className="item-title">My Vouchers</div>
                            <div className="item-desc">Active balances & credits</div>
                          </div>
                        </Link>
                        <Link to="/user/redeem" className="dropdown-item">
                          <FaQrcode className="item-icon" />
                          <div>
                            <div className="item-title">Approve Redemption</div>
                            <div className="item-desc">Present signed QR code</div>
                          </div>
                        </Link>
                        <Link to="/user/history" className="dropdown-item">
                          <FaHistory className="item-icon" />
                          <div>
                            <div className="item-title">Redemption History</div>
                            <div className="item-desc">On-chain transaction receipts</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Automation & Templates */}
                  <div className="nav-dropdown-wrapper">
                    <button 
                      className={`app-nav-link dropdown-trigger ${isActive('/user/templates') || isActive('/user/scheduled') ? 'active' : ''}`}
                      onClick={() => toggleDropdown('automation')}
                    >
                      <FaLayerGroup /> Programs <FaChevronDown className="chevron" />
                    </button>
                    {dropdownOpen === 'automation' && (
                      <div className="nav-dropdown-menu">
                        <Link to="/user/templates" className="dropdown-item">
                          <FaLayerGroup className="item-icon" />
                          <div>
                            <div className="item-title">Voucher Templates</div>
                            <div className="item-desc">Reusable grant configurations</div>
                          </div>
                        </Link>
                        <Link to="/user/scheduled" className="dropdown-item">
                          <FaClock className="item-icon" />
                          <div>
                            <div className="item-title">Scheduled Disbursements</div>
                            <div className="item-desc">Automated recurring drops</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Governance & Safety */}
                  <div className="nav-dropdown-wrapper">
                    <button 
                      className={`app-nav-link dropdown-trigger ${isActive('/user/transfers') || isActive('/user/multisig') || isActive('/user/notifications') ? 'active' : ''}`}
                      onClick={() => toggleDropdown('governance')}
                    >
                      <FaUsers /> Governance <FaChevronDown className="chevron" />
                    </button>
                    {dropdownOpen === 'governance' && (
                      <div className="nav-dropdown-menu">
                        <Link to="/user/transfers" className="dropdown-item">
                          <FaExchangeAlt className="item-icon" />
                          <div>
                            <div className="item-title">Transfer Permissions</div>
                            <div className="item-desc">P2P reallocation rules</div>
                          </div>
                        </Link>
                        <Link to="/user/multisig" className="dropdown-item">
                          <FaUsers className="item-icon" />
                          <div>
                            <div className="item-title">Multi-Sig Approvals</div>
                            <div className="item-desc">Multi-party threshold signing</div>
                          </div>
                        </Link>
                        <Link to="/user/notifications" className="dropdown-item">
                          <FaBell className="item-icon" />
                          <div>
                            <div className="item-title">Notification Channels</div>
                            <div className="item-desc">SMS, Email & Webhook alerts</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* MERCHANT APP LINKS */
                <>
                  <Link to="/merchant/dashboard" className={`app-nav-link ${isActive('/merchant/dashboard') ? 'active' : ''}`}>
                    <FaChartBar /> Dashboard
                  </Link>
                  <Link to="/merchant/redeem" className={`app-nav-link ${isActive('/merchant/redeem') ? 'active' : ''}`}>
                    <FaQrcode /> POS Scanner
                  </Link>
                  <Link to="/merchant/redemptions" className={`app-nav-link ${isActive('/merchant/redemptions') ? 'active' : ''}`}>
                    <FaTicketAlt /> Settlement Log
                  </Link>
                  <Link to="/merchant/reports" className={`app-nav-link ${isActive('/merchant/reports') ? 'active' : ''}`}>
                    <FaHistory /> Financial Reports
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Right Action Controls */}
          <div className="nav-actions-right">
            {isLanding ? (
              <div className="landing-quick-actions">
                <button 
                  className="btn-launch-app"
                  onClick={() => {
                    if (userType === 'user') {
                      handleWalletConnect();
                    } else {
                      handleMerchantLogin();
                    }
                  }}
                >
                  <FaWallet /> {walletAddress ? 'Open Dashboard' : 'Launch Portal'} <FaArrowRight />
                </button>
              </div>
            ) : (
              <div className="app-account-box">
                {userType === 'user' ? (
                  walletAddress ? (
                    <div className="account-pill connected">
                      <div className="account-status-dot"></div>
                      <span className="account-id">{shortenAddress(walletAddress)}</span>
                      <button 
                        className="btn-icon-disconnect" 
                        title="Disconnect Wallet"
                        onClick={handleDisconnect}
                      >
                        <FaPowerOff />
                      </button>
                    </div>
                  ) : (
                    <button className="btn-connect-primary" onClick={handleWalletConnect}>
                      <FaWallet /> Connect Wallet
                    </button>
                  )
                ) : (
                  merchantId ? (
                    <div className="account-pill merchant-pill connected">
                      <FaStore className="store-icon" />
                      <span className="account-id">{merchantId}</span>
                      <button 
                        className="btn-icon-disconnect" 
                        title="Sign Out"
                        onClick={handleDisconnect}
                      >
                        <FaPowerOff />
                      </button>
                    </div>
                  ) : (
                    <button className="btn-connect-primary merchant-btn" onClick={handleMerchantLogin}>
                      <FaStore /> Merchant Login
                    </button>
                  )
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button 
              className="mobile-hamburger" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER MENU */}
        {mobileMenuOpen && (
          <div className="mobile-drawer">
            <div className="mobile-drawer-header">
              <span className="drawer-title">Navigation Menu</span>
              <button className="drawer-close" onClick={() => setMobileMenuOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="mobile-links-list">
              <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Home & Overview
              </Link>

              <div className="drawer-section-title">Beneficiary Experience</div>
              <Link to="/user/dashboard" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaChartBar /> User Dashboard
              </Link>
              <Link to="/user/vouchers" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaTicketAlt /> My Vouchers
              </Link>
              <Link to="/user/redeem" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaQrcode /> Approve Redemption
              </Link>
              <Link to="/user/templates" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaLayerGroup /> Voucher Templates
              </Link>
              <Link to="/user/scheduled" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaClock /> Scheduled Disbursements
              </Link>
              <Link to="/user/transfers" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaExchangeAlt /> Transfers
              </Link>
              <Link to="/user/multisig" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaUsers /> Multi-Sig Approvals
              </Link>

              <div className="drawer-section-title">Merchant Point-of-Sale</div>
              <Link to="/merchant/dashboard" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaStore /> Merchant Dashboard
              </Link>
              <Link to="/merchant/redeem" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaQrcode /> POS QR Scanner
              </Link>
              <Link to="/merchant/redemptions" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaTicketAlt /> Settlement Logs
              </Link>
              <Link to="/merchant/reports" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaHistory /> Financial Reports
              </Link>

              <div className="drawer-section-title">Platform Governance</div>
              <Link to="/admin" className="mobile-link admin-highlight" onClick={() => setMobileMenuOpen(false)}>
                <FaShieldAlt /> Admin Control Studio
              </Link>
              <Link to="/analytics" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <FaChartPie /> Protocol Analytics
              </Link>
            </div>

            <div className="mobile-drawer-footer">
              <button 
                className="btn-drawer-action"
                onClick={() => {
                  handleWalletConnect();
                  setMobileMenuOpen(false);
                }}
              >
                <FaWallet /> {walletAddress ? 'Connected: ' + shortenAddress(walletAddress) : 'Connect Sui Wallet'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navigation;
