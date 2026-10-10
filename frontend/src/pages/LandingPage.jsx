import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaTicketAlt, 
  FaShieldAlt, 
  FaQrcode, 
  FaCoins, 
  FaStore, 
  FaGraduationCap, 
  FaHeartbeat, 
  FaBus, 
  FaSeedling, 
  FaArrowRight, 
  FaCheckCircle, 
  FaLock, 
  FaClock, 
  FaExchangeAlt, 
  FaUsers, 
  FaChartPie, 
  FaChevronDown, 
  FaChevronUp, 
  FaWallet, 
  FaLayerGroup, 
  FaBolt, 
  FaCheck, 
  FaSlidersH, 
  FaSyncAlt, 
  FaCopy 
} from 'react-icons/fa';
import './LandingPage.css';
import { useWalletConnection } from '../components/WalletConnection';

const VOUCHER_CATEGORIES = [
  {
    id: 1,
    name: 'Education Credits (EDU)',
    code: 'EDU',
    tagline: '1 EDU = $1.00 towards accredited school fees, registration & materials',
    icon: <FaGraduationCap />,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    badge: 'Education',
    examples: ['Secondary & Primary Tuition', 'National Examination Fees', 'Textbooks & Learning Kits', 'Vocational Skill Training'],
    sampleVoucher: {
      id: '0x8f3c...4a12',
      title: 'Term 1 Secondary Education Tuition Grant',
      amount: '$150.00',
      remaining: '$150.00',
      merchant: 'Greenwood Academy & 14 Certified Schools',
      expiry: '90 Days Remaining',
      status: 'Active',
      allowPartial: true,
      categoryCode: 1
    }
  },
  {
    id: 2,
    name: 'Healthcare Credits (HEALTH)',
    code: 'HEALTH',
    tagline: '1 HEALTH = $1.00 towards clinical consultations, labs & pharmaceuticals',
    icon: <FaHeartbeat />,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    badge: 'Healthcare',
    examples: ['General Outpatient Visits', 'Prescription Medications', 'Maternal & Child Health Care', 'Diagnostic & Blood Testing'],
    sampleVoucher: {
      id: '0x4b9a...91ce',
      title: 'Family Wellness & Essential Clinic Care',
      amount: '$100.00',
      remaining: '$65.00',
      merchant: 'St. Jude Community Health Network',
      expiry: '60 Days Remaining',
      status: 'Partially Used',
      allowPartial: true,
      categoryCode: 2
    }
  },
  {
    id: 3,
    name: 'Transport Credits (TRANSPORT)',
    code: 'TRANSPORT',
    tagline: '1 TRANSPORT = $1.00 towards city transit, student commute & fuel quotas',
    icon: <FaBus />,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    badge: 'Mobility',
    examples: ['Monthly Metro & Bus Passes', 'Designated Fuel Quotas', 'Student Transit Cards', 'Rural Market Connection'],
    sampleVoucher: {
      id: '0x2c1e...789f',
      title: 'Citywide Metro Commuter Allowance',
      amount: '$50.00',
      remaining: '$50.00',
      merchant: 'Metropolitan Rapid Transit Authority',
      expiry: '30 Days Remaining',
      status: 'Active',
      allowPartial: false,
      categoryCode: 3
    }
  },
  {
    id: 4,
    name: 'Agriculture Inputs (AGRI)',
    code: 'AGRI',
    tagline: '1 AGRI = $1.00 towards certified seeds, organic fertilizer & machinery rental',
    icon: <FaSeedling />,
    color: '#84CC16',
    bgColor: 'rgba(132, 204, 22, 0.12)',
    badge: 'Agriculture',
    examples: ['Certified High-Yield Seeds', 'Organic Crop Fertilizers', 'Tractor & Tiller Rentals', 'Veterinary Medications'],
    sampleVoucher: {
      id: '0x99a1...33d4',
      title: 'Smallholder Seed & Agro-Input Subsidy',
      amount: '$250.00',
      remaining: '$175.00',
      merchant: 'Regional Agro-Dealer Cooperative',
      expiry: '120 Days Remaining',
      status: 'Partially Used',
      allowPartial: true,
      categoryCode: 4
    }
  }
];

const FAQS = [
  {
    category: 'Security',
    q: 'How does ServicePass mathematically prevent voucher fraud and misallocation?',
    a: 'Every voucher exists as an on-chain, non-custodial object on Sui Move. The Move smart contract enforces category validation and verifies that the redeeming party is present in the on-chain Merchant Registry. When redeemed, the voucher object is permanently burned, making double-spending and diversion impossible.'
  },
  {
    category: 'Operations',
    q: 'How does partial redemption work without creating unbacked tokens?',
    a: 'ServicePass supports native incremental burning. When a user redeems $25 of a $100 voucher, the smart contract records an on-chain partial redemption event and safely updates the voucher object state with the remaining balance of $75. All changes are cryptographically signed and auditable in real time.'
  },
  {
    category: 'Point of Sale',
    q: 'How do merchants verify vouchers in low-connectivity or offline settings?',
    a: 'Vouchers can be formatted into HMAC-SHA256 cryptographically signed QR payloads. The Merchant POS Scanner validates the cryptographic signature and merchant ID before broadcasting the transaction to Sui. If offline, the signed receipt can be queued and processed via our resilient BullMQ queue.'
  },
  {
    category: 'Governance',
    q: 'What controls do donors and program officers have over large disbursements?',
    a: 'ServicePass features enterprise Multi-Signature Approval Workflows (e.g., 2-of-3 or 3-of-5 signers required), Scheduled Cron Issuance, and pre-audited Voucher Templates. High-value grants cannot be minted by a single rogue actor, ensuring full institutional oversight.'
  },
  {
    category: 'Blockchain',
    q: 'Why build ServicePass on Sui blockchain rather than traditional payment rails?',
    a: 'Traditional card and banking rails charge 2-4% interchange fees, take 30-60 days for merchant settlement, and suffer up to 20% fraud leakage in humanitarian aid. Sui delivers sub-second finality, gas fees under a fraction of a cent ($0.001), and programmable Move object-level ownership.'
  }
];

function LandingPage({ 
  userType, 
  setUserType, 
  walletAddress, 
  setWalletAddress, 
  merchantId, 
  setMerchantId 
}) {
  const { requestConnection } = useWalletConnection();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(VOUCHER_CATEGORIES[0]);
  const [activeFaq, setActiveFaq] = useState(0);
  const [activeRoleTab, setActiveRoleTab] = useState('user');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('All');
  const [copiedId, setCopiedId] = useState(false);

  // ROI Calculator State
  const [grantBudget, setGrantBudget] = useState(250000);
  const [selectedCalcSector, setSelectedCalcSector] = useState('EDU');

  // Interactive POS Simulator State
  const [posSimVoucherId, setPosSimVoucherId] = useState('VOUCH-EDU-8902');
  const [posSimAmount, setPosSimAmount] = useState('50.00');
  const [posSimState, setPosSimState] = useState('idle');
  const [posSimResult, setPosSimResult] = useState(null);

  // Quick Action Handler for Roles
  const handleQuickEnterUser = () => {
    requestConnection(() => {
      setUserType('user');
      navigate('/user/dashboard');
    });
  };

  const handleQuickEnterMerchant = () => {
    setUserType('merchant');
    if (!merchantId) {
      const mockId = 'MERCHANT_' + Math.random().toString(36).substr(2, 7).toUpperCase();
      setMerchantId(mockId);
    }
    navigate('/merchant/redeem');
  };

  const handleQuickEnterAdmin = () => {
    navigate('/admin');
  };

  const handleCopySampleId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Run POS Simulation
  const handleRunPosSimulation = () => {
    setPosSimState('scanning');
    setPosSimResult(null);
    setTimeout(() => {
      const txDigest = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      setPosSimResult({
        digest: txDigest.slice(0, 18) + '...' + txDigest.slice(-6),
        amount: '$' + parseFloat(posSimAmount || 50).toFixed(2),
        merchant: 'Greenwood Certified Academy',
        status: 'BURNT_AND_SETTLED',
        epochTimestamp: Date.now(),
        gasCost: '0.00085 SUI ($0.0009)'
      });
      setPosSimState('success');
    }, 1100);
  };

  // Calculations for ROI Calculator
  const estimatedTraditionalLeakage = Math.round(grantBudget * 0.18);
  const estimatedServicePassSavings = estimatedTraditionalLeakage;
  const estimatedBeneficiaries = Math.round(grantBudget / 125);
  const estimatedSuiGasTotal = (estimatedBeneficiaries * 0.001).toFixed(2);
  const estimatedTraditionalFees = (grantBudget * 0.035).toFixed(0);

  const filteredFaqs = faqCategoryFilter === 'All' 
    ? FAQS 
    : FAQS.filter(f => f.category === faqCategoryFilter);

  return (
    <div className="enterprise-landing">
      {/* Top Protocol Announcement Strip */}
      <div className="hero-announcement-strip">
        <div className="announcement-content">
          <span className="live-status-badge">
            <span className="pulsing-beacon"></span> ON-CHAIN PROTOCOL
          </span>
          <span className="announcement-copy">
            ServicePass v1.0 • Built on Sui Move • Cryptographic Burn-on-Redemption
          </span>
          <span className="announcement-tag">AUDITED ARCHITECTURE</span>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="enterprise-hero" id="hero">
        <div className="hero-grid">
          <div className="hero-copy-col">
            <div className="hero-eyebrow">
              <FaShieldAlt className="eyebrow-icon" /> Next-Generation Purpose-Bound Aid
            </div>
            <h1 className="hero-headline">
              Programmable Vouchers That <span className="gradient-text-hero">Cannot Be Diverted</span>
            </h1>
            <p className="hero-subhead">
              The blockchain-native protocol empowering NGOs, governments, and foundations to disburse 
              ring-fenced relief for <strong>Education</strong>, <strong>Healthcare</strong>, <strong>Transport</strong>, and <strong>Agriculture</strong>. 
              Protected by Move smart contracts, POS QR verification, and sub-second instant settlement.
            </p>

            {/* Role Gateway Actions */}
            <div className="hero-gateway-grid">
              <button className="gateway-btn user-btn" onClick={handleQuickEnterUser}>
                <div className="btn-icon-wrapper"><FaWallet /></div>
                <div className="btn-text-col">
                  <span className="btn-action-label">Beneficiary Portal</span>
                  <span className="btn-action-sub">Manage & spend credits</span>
                </div>
                <FaArrowRight className="btn-action-arrow" />
              </button>

              <button className="gateway-btn merchant-btn" onClick={handleQuickEnterMerchant}>
                <div className="btn-icon-wrapper"><FaStore /></div>
                <div className="btn-text-col">
                  <span className="btn-action-label">Merchant Terminal</span>
                  <span className="btn-action-sub">Scan POS QR codes</span>
                </div>
                <FaQrcode className="btn-action-arrow" />
              </button>

              <button className="gateway-btn admin-btn" onClick={handleQuickEnterAdmin}>
                <div className="btn-icon-wrapper"><FaShieldAlt /></div>
                <div className="btn-text-col">
                  <span className="btn-action-label">Admin Control Studio</span>
                  <span className="btn-action-sub">Mint & configure grants</span>
                </div>
                <FaSlidersH className="btn-action-arrow" />
              </button>
            </div>

            {/* Protocol Guarantees Row */}
            <div className="protocol-guarantees">
              <div className="guarantee-pill">
                <FaCheckCircle className="check-icon" /> Zero Leakage
              </div>
              <div className="guarantee-pill">
                <FaCheckCircle className="check-icon" /> Sub-Second Sui Finality
              </div>
              <div className="guarantee-pill">
                <FaCheckCircle className="check-icon" /> Multi-Sig Security
              </div>
              <div className="guarantee-pill">
                <FaCheckCircle className="check-icon" /> Partial Balances
              </div>
            </div>
          </div>

          {/* HERO INTERACTIVE VOUCHER ARTIFACT */}
          <div className="hero-visual-col">
            <div className="visual-backdrop-glow"></div>
            <div className="enterprise-ticket-card">
              {/* Ticket Header */}
              <div className="ticket-header">
                <div className="ticket-sector-pill" style={{ backgroundColor: selectedCategory.bgColor, color: selectedCategory.color }}>
                  {selectedCategory.icon} <span>{selectedCategory.badge} Credit</span>
                </div>
                <div className="ticket-network-status">
                  <span className="dot-green"></span> SUI MOVE V1.0
                </div>
              </div>

              {/* Ticket Body */}
              <div className="ticket-body">
                <div className="ticket-title-row">
                  <span className="grant-ref-id">GRANT #{selectedCategory.id}042-SUI</span>
                  <h3 className="grant-name">{selectedCategory.sampleVoucher.title}</h3>
                </div>

                <div className="ticket-merchant-chip">
                  <FaStore className="chip-icon" />
                  <span>{selectedCategory.sampleVoucher.merchant}</span>
                </div>

                {/* Financial Ledger Balance Row */}
                <div className="ticket-ledger-box">
                  <div className="ledger-col">
                    <span className="ledger-label">Initial Face Value</span>
                    <span className="ledger-val">{selectedCategory.sampleVoucher.amount}</span>
                  </div>
                  <div className="ledger-separator"></div>
                  <div className="ledger-col highlight-balance">
                    <span className="ledger-label">Available Balance</span>
                    <span className="ledger-val main-balance">{selectedCategory.sampleVoucher.remaining}</span>
                  </div>
                </div>

                {/* Utilization Gauge */}
                <div className="ticket-gauge-box">
                  <div className="gauge-labels">
                    <span>Smart Contract State</span>
                    <span className="status-tag" style={{ color: selectedCategory.color }}>
                      {selectedCategory.sampleVoucher.status}
                    </span>
                  </div>
                  <div className="gauge-track">
                    <div 
                      className="gauge-fill" 
                      style={{ 
                        width: selectedCategory.sampleVoucher.status === 'Active' ? '100%' : '65%',
                        backgroundColor: selectedCategory.color 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Security Constraints Row */}
                <div className="ticket-constraints-row">
                  <div className="constraint-item">
                    <FaClock className="item-icon" /> {selectedCategory.sampleVoucher.expiry}
                  </div>
                  <div className="constraint-item">
                    <FaLock className="item-icon" /> Non-Transferable
                  </div>
                  <div className="constraint-item">
                    <FaCoins className="item-icon" /> Partial Burn OK
                  </div>
                </div>
              </div>

              {/* Barcode & Simulated Hash Strip */}
              <div className="ticket-barcode-strip">
                <div className="simulated-barcode">
                  <span className="bar b1"></span><span className="bar b2"></span><span className="bar b1"></span>
                  <span className="bar b3"></span><span className="bar b2"></span><span className="bar b1"></span>
                  <span className="bar b3"></span><span className="bar b1"></span><span className="bar b2"></span>
                  <span className="bar b1"></span><span className="bar b3"></span><span className="bar b2"></span>
                  <span className="bar b1"></span><span className="bar b2"></span><span className="bar b3"></span>
                </div>
                <div className="ticket-object-copy" onClick={() => handleCopySampleId(selectedCategory.sampleVoucher.id)}>
                  <code>ObjectID: {selectedCategory.sampleVoucher.id}</code>
                  <span className="copy-tag">{copiedId ? 'Copied!' : 'Copy'}</span>
                </div>
              </div>

              {/* Ticket Footer Quick Trigger */}
              <div className="ticket-footer">
                <button className="btn-ticket-simulate" onClick={handleQuickEnterUser}>
                  Simulate In-App Redemption <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS & BENCHMARKS STRIP */}
      <section className="protocol-stats-strip">
        <div className="stats-container">
          <div className="metric-cell">
            <span className="metric-highlight">0.00%</span>
            <span className="metric-title">Fraud & Diverted Leakage</span>
            <span className="metric-sub">Mathematically restricted on-chain</span>
          </div>
          <div className="metric-cell">
            <span className="metric-highlight">&lt; 0.9s</span>
            <span className="metric-title">Merchant Settlement Speed</span>
            <span className="metric-sub">Instant POS burn & credit validation</span>
          </div>
          <div className="metric-cell">
            <span className="metric-highlight">&lt; $0.001</span>
            <span className="metric-title">Average Sui Gas Fee</span>
            <span className="metric-sub">99.9% lower than card interchange</span>
          </div>
          <div className="metric-cell">
            <span className="metric-highlight">100%</span>
            <span className="metric-title">Audit Trail Traceability</span>
            <span className="metric-sub">Verifiable by donors and auditors</span>
          </div>
        </div>
      </section>

      {/* INTERACTIVE POS TERMINAL SIMULATOR */}
      <section className="pos-simulator-section" id="pos-simulator">
        <div className="section-head-box">
          <span className="section-kicker">Interactive Point-of-Sale Simulator</span>
          <h2 className="section-h2">Experience Sub-Second Merchant Settlement</h2>
          <p className="section-desc">
            Test how a certified merchant scans and settles a digital voucher. The Sui Move smart contract validates the accredited registry and executes instant burn-on-redemption.
          </p>
        </div>

        <div className="pos-sim-grid">
          {/* Controls Box */}
          <div className="sim-control-panel">
            <div className="panel-header">
              <FaQrcode className="panel-icon" />
              <div>
                <h4>Merchant POS Terminal</h4>
                <p>Simulating St. Jude Health Center Point-of-Sale</p>
              </div>
            </div>

            <div className="sim-form-group">
              <label>Select Sample Voucher</label>
              <select 
                value={posSimVoucherId} 
                onChange={(e) => setPosSimVoucherId(e.target.value)}
                className="sim-select"
              >
                <option value="VOUCH-EDU-8902">🎓 Term 1 Secondary Tuition ($150.00 Remaining)</option>
                <option value="VOUCH-HLTH-4410">🏥 Pediatric Clinic Diagnostics ($65.00 Remaining)</option>
                <option value="VOUCH-TRN-1209">🚌 Metro Transit Monthly ($50.00 Remaining)</option>
                <option value="VOUCH-AGRI-7731">🌾 Seed & Fertilizer Grant ($175.00 Remaining)</option>
              </select>
            </div>

            <div className="sim-form-group">
              <label>Redemption Amount ($ USD Equivalent)</label>
              <input 
                type="number" 
                value={posSimAmount} 
                onChange={(e) => setPosSimAmount(e.target.value)}
                className="sim-input"
                placeholder="50.00"
              />
            </div>

            <button 
              className={`btn-run-sim ${posSimState === 'scanning' ? 'running' : ''}`}
              onClick={handleRunPosSimulation}
              disabled={posSimState === 'scanning'}
            >
              {posSimState === 'scanning' ? (
                <>
                  <FaSyncAlt className="spin-icon" /> Verifying On-Chain...
                </>
              ) : (
                <>
                  <FaQrcode /> Scan & Execute On-Chain Burn
                </>
              )}
            </button>
          </div>

          {/* Terminal Screen Preview */}
          <div className="sim-screen-panel">
            <div className="terminal-screen">
              <div className="screen-header">
                <span className="terminal-title">SUI MOVE POS TERMINAL v1.0</span>
                <span className="terminal-clock">{new Date().toLocaleTimeString()}</span>
              </div>

              {posSimState === 'idle' && (
                <div className="screen-idle-state">
                  <div className="scanner-target-box">
                    <FaQrcode className="scanner-qr-large" />
                    <div className="laser-beam"></div>
                  </div>
                  <p className="idle-text">Ready for POS QR Scan. Click "Scan & Execute" to simulate.</p>
                </div>
              )}

              {posSimState === 'scanning' && (
                <div className="screen-processing-state">
                  <div className="processing-spinner"></div>
                  <h4>Validating HMAC Cryptographic Signature...</h4>
                  <p>Broadcasting Move Call to Sui Testnet Fullnode</p>
                  <code>Call: servicepass::voucher_system::redeem_voucher</code>
                </div>
              )}

              {posSimState === 'success' && posSimResult && (
                <div className="screen-success-state">
                  <div className="success-icon-badge">
                    <FaCheck />
                  </div>
                  <h4>REDEMPTION SETTLED</h4>
                  <div className="receipt-details">
                    <div className="receipt-row">
                      <span>Redeemed Amount:</span>
                      <strong>{posSimResult.amount}</strong>
                    </div>
                    <div className="receipt-row">
                      <span>Certified Merchant:</span>
                      <span>{posSimResult.merchant}</span>
                    </div>
                    <div className="receipt-row">
                      <span>On-Chain Status:</span>
                      <strong className="status-green">{posSimResult.status}</strong>
                    </div>
                    <div className="receipt-row">
                      <span>Transaction Digest:</span>
                      <code>{posSimResult.digest}</code>
                    </div>
                    <div className="receipt-row">
                      <span>Network Gas Cost:</span>
                      <span className="gas-tag">{posSimResult.gasCost}</span>
                    </div>
                  </div>
                  <button className="btn-sim-reset" onClick={() => setPosSimState('idle')}>
                    Simulate Next Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC IMPACT & ROI CALCULATOR */}
      <section className="impact-calculator-section" id="calculator">
        <div className="section-head-box">
          <span className="section-kicker">Program Efficiency Model</span>
          <h2 className="section-h2">Calculate Your Grant Cost Savings & Impact</h2>
          <p className="section-desc">
            Compare traditional cash or paper voucher disbursements with ServicePass smart contracts.
          </p>
        </div>

        <div className="calculator-card">
          <div className="calc-inputs-col">
            <div className="slider-header">
              <label>Total Grant / Program Disbursement Budget</label>
              <span className="budget-value">${grantBudget.toLocaleString()} USD</span>
            </div>

            <input 
              type="range" 
              min="10000" 
              max="2000000" 
              step="10000" 
              value={grantBudget} 
              onChange={(e) => setGrantBudget(Number(e.target.value))}
              className="calc-range-slider"
            />

            <div className="slider-ticks">
              <span>$10K</span>
              <span>$500K</span>
              <span>$1M</span>
              <span>$2M</span>
            </div>

            <div className="sector-select-group">
              <label>Select Target Aid Sector</label>
              <div className="sector-buttons-row">
                <button 
                  className={`sec-btn ${selectedCalcSector === 'EDU' ? 'active' : ''}`}
                  onClick={() => setSelectedCalcSector('EDU')}
                >
                  <FaGraduationCap /> Education
                </button>
                <button 
                  className={`sec-btn ${selectedCalcSector === 'HEALTH' ? 'active' : ''}`}
                  onClick={() => setSelectedCalcSector('HEALTH')}
                >
                  <FaHeartbeat /> Healthcare
                </button>
                <button 
                  className={`sec-btn ${selectedCalcSector === 'TRANSPORT' ? 'active' : ''}`}
                  onClick={() => setSelectedCalcSector('TRANSPORT')}
                >
                  <FaBus /> Transport
                </button>
                <button 
                  className={`sec-btn ${selectedCalcSector === 'AGRI' ? 'active' : ''}`}
                  onClick={() => setSelectedCalcSector('AGRI')}
                >
                  <FaSeedling /> Agriculture
                </button>
              </div>
            </div>
          </div>

          <div className="calc-results-col">
            <div className="savings-highlight-card">
              <span className="savings-label">ESTIMATED RECOVERED AID VALUE</span>
              <h3 className="savings-amount">+${estimatedServicePassSavings.toLocaleString()}</h3>
              <p className="savings-subtext">
                Saved from traditional voucher forgery, administrative overhead, and merchant leakage (~18%).
              </p>
            </div>

            <div className="calc-metrics-grid">
              <div className="calc-metric-box">
                <span className="box-label">Beneficiary Families Supported</span>
                <span className="box-val">~{estimatedBeneficiaries.toLocaleString()}</span>
              </div>
              <div className="calc-metric-box">
                <span className="box-label">Estimated Sui Gas Total</span>
                <span className="box-val">${estimatedSuiGasTotal}</span>
              </div>
              <div className="calc-metric-box">
                <span className="box-label">Traditional Card Fees Avoided</span>
                <span className="box-val">${Number(estimatedTraditionalFees).toLocaleString()}</span>
              </div>
              <div className="calc-metric-box">
                <span className="box-label">Settlement Time Saved</span>
                <span className="box-val">30-60 Days → Instant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAKEHOLDER PORTAL WORKFLOWS */}
      <section className="stakeholder-section" id="portals">
        <div className="section-head-box">
          <span className="section-kicker">Multi-Stakeholder Architecture</span>
          <h2 className="section-h2">Engineered for Every Actor in the Ecosystem</h2>
          <p className="section-desc">
            Intuitive, role-specific interfaces designed for zero friction and maximum security.
          </p>
        </div>

        <div className="stakeholder-tabs">
          <button 
            className={`stakeholder-tab ${activeRoleTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveRoleTab('user')}
          >
            <FaWallet /> Beneficiary Experience
          </button>
          <button 
            className={`stakeholder-tab ${activeRoleTab === 'merchant' ? 'active' : ''}`}
            onClick={() => setActiveRoleTab('merchant')}
          >
            <FaStore /> Merchant Experience
          </button>
          <button 
            className={`stakeholder-tab ${activeRoleTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRoleTab('admin')}
          >
            <FaShieldAlt /> Program Admin & Donors
          </button>
        </div>

        <div className="stakeholder-content-box">
          {activeRoleTab === 'user' && (
            <div className="workflow-detail-grid">
              <div className="workflow-text-col">
                <span className="role-tag user-tag">Beneficiary Portal</span>
                <h3>Dignified, Seamless Access to Essential Services</h3>
                <p>
                  Beneficiaries hold vouchers securely in their Sui Web3 wallet. Credits can be spent incrementally at accredited schools, clinics, pharmacies, and stores.
                </p>
                <div className="features-bullet-list">
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>Non-Custodial Balance Ownership:</strong> No intermediary can freeze or seize verified beneficiary grants.
                    </div>
                  </div>
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>Offline-Ready QR Pass:</strong> Generate cryptographically signed QR codes for redemption without requiring continuous internet.
                    </div>
                  </div>
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>Partial Spending Protocol:</strong> Spend exact amounts for visits, retaining remaining credits for future needs.
                    </div>
                  </div>
                </div>
                <div className="workflow-btn-row">
                  <button className="btn-primary-action" onClick={handleQuickEnterUser}>
                    Open Beneficiary Hub <FaArrowRight />
                  </button>
                  <Link to="/user/templates" className="btn-secondary-action">
                    Explore Grant Templates
                  </Link>
                </div>
              </div>

              <div className="workflow-preview-col">
                <div className="preview-card-wrap">
                  <div className="mock-user-widget">
                    <div className="widget-header">
                      <span>💳 My Active Service Passes</span>
                      <span className="widget-badge">Connected</span>
                    </div>
                    <div className="widget-item">
                      <div>
                        <strong>🎓 Secondary Tuition Pass</strong>
                        <p>Greenwood Academy • Expiry: 90d</p>
                      </div>
                      <span className="amount-badge green">$150.00</span>
                    </div>
                    <div className="widget-item">
                      <div>
                        <strong>🏥 St. Jude Clinic Health Pass</strong>
                        <p>Pharmacy & Labs • Expiry: 60d</p>
                      </div>
                      <span className="amount-badge blue">$65.00 Left</span>
                    </div>
                    <button className="btn-mock-action" onClick={handleQuickEnterUser}>
                      <FaQrcode /> Present QR Code For POS Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === 'merchant' && (
            <div className="workflow-detail-grid">
              <div className="workflow-text-col">
                <span className="role-tag merchant-tag">Merchant Portal</span>
                <h3>Guaranteed Payment Clearance & Zero Chargebacks</h3>
                <p>
                  Service providers and local businesses eliminate paperwork and slow reimbursement cycles. Scanning a beneficiary pass instantly confirms eligibility and executes on-chain settlement.
                </p>
                <div className="features-bullet-list">
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>Built-In Camera Scanner:</strong> Turn any smartphone or tablet into a high-security cryptographic POS terminal.
                    </div>
                  </div>
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>HMAC Cryptographic Validation:</strong> Tamper-evident payloads verify authenticity before triggering smart contract calls.
                    </div>
                  </div>
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>Real-Time Financial Reports:</strong> Export CSV transaction histories, redemption analytics, and daily reconciliation logs.
                    </div>
                  </div>
                </div>
                <div className="workflow-btn-row">
                  <button className="btn-primary-action merchant-bg" onClick={handleQuickEnterMerchant}>
                    Launch Merchant Scanner <FaQrcode />
                  </button>
                  <Link to="/merchant/reports" className="btn-secondary-action">
                    View Merchant Reports
                  </Link>
                </div>
              </div>

              <div className="workflow-preview-col">
                <div className="preview-card-wrap">
                  <div className="mock-merchant-widget">
                    <div className="widget-header">
                      <span>🏪 POS Point of Sale Terminal</span>
                      <span className="widget-badge merchant">Merchant Online</span>
                    </div>
                    <div className="mock-scanner-view">
                      <FaQrcode className="scanner-center-icon" />
                      <div className="scan-line-anim"></div>
                      <p>Align Beneficiary QR Code within frame</p>
                    </div>
                    <button className="btn-mock-action merchant" onClick={handleQuickEnterMerchant}>
                      Scan Customer Voucher
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === 'admin' && (
            <div className="workflow-detail-grid">
              <div className="workflow-text-col">
                <span className="role-tag admin-tag">Admin & Governance Studio</span>
                <h3>Institutional Governance, Multi-Sig & Auditability</h3>
                <p>
                  Program directors and grant administrators retain full control over minting policies, merchant accreditation, and automated disbursement schedules.
                </p>
                <div className="features-bullet-list">
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>Multi-Signature Treasury:</strong> Require dual or triple cryptographic signatures before high-value grants are released.
                    </div>
                  </div>
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>Automated Cron Drops:</strong> Configure scheduled voucher drops tied to school semesters, disaster relief milestones, or recurring allowances.
                    </div>
                  </div>
                  <div className="bullet-row">
                    <FaCheck className="bullet-check" />
                    <div>
                      <strong>Comprehensive BI Dashboard:</strong> Track redemption velocity, active circulating balances, and sector distributions in real time.
                    </div>
                  </div>
                </div>
                <div className="workflow-btn-row">
                  <button className="btn-primary-action admin-bg" onClick={handleQuickEnterAdmin}>
                    Launch Admin Studio <FaShieldAlt />
                  </button>
                  <Link to="/analytics" className="btn-secondary-action">
                    Open Analytics Suite
                  </Link>
                </div>
              </div>

              <div className="workflow-preview-col">
                <div className="preview-card-wrap">
                  <div className="mock-admin-widget">
                    <div className="widget-header">
                      <span>🛡️ Multi-Sig Treasury Queue</span>
                      <span className="widget-badge admin">2 Pending Approvals</span>
                    </div>
                    <div className="widget-item">
                      <div>
                        <strong>Tuition Grant Batch #091</strong>
                        <p>$50,000 • 350 Beneficiaries</p>
                      </div>
                      <span className="amount-badge purple">2/3 Signed</span>
                    </div>
                    <div className="widget-item">
                      <div>
                        <strong>Healthcare Emergency Fund</strong>
                        <p>$20,000 • 120 Beneficiaries</p>
                      </div>
                      <span className="amount-badge orange">1/3 Signed</span>
                    </div>
                    <button className="btn-mock-action purple" onClick={handleQuickEnterAdmin}>
                      Review & Authorize Batches
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTOR TAXONOMY SHOWCASE */}
      <section className="sectors-section" id="sectors">
        <div className="section-head-box">
          <span className="section-kicker">Certified Aid Taxonomy</span>
          <h2 className="section-h2">Targeted Smart Contract Categories</h2>
          <p className="section-desc">
            Each voucher is cryptographically tied to a verified Move category code. Funds cannot be redeemed outside approved sector registries.
          </p>
        </div>

        <div className="sector-pills-selector">
          {VOUCHER_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`sector-pill ${selectedCategory.id === cat.id ? 'active' : ''}`}
              style={{
                borderColor: selectedCategory.id === cat.id ? cat.color : 'transparent',
                backgroundColor: selectedCategory.id === cat.id ? cat.bgColor : '#ffffff'
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              <span className="pill-icon" style={{ color: cat.color }}>{cat.icon}</span>
              <span className="pill-title">{cat.code}</span>
            </button>
          ))}
        </div>

        <div className="sector-highlight-card" style={{ borderColor: selectedCategory.color }}>
          <div className="sector-card-top">
            <div className="sector-title-group">
              <div className="sector-icon-box" style={{ backgroundColor: selectedCategory.bgColor, color: selectedCategory.color }}>
                {selectedCategory.icon}
              </div>
              <div>
                <h3>{selectedCategory.name}</h3>
                <p>{selectedCategory.tagline}</p>
              </div>
            </div>
            <span className="sector-code-pill" style={{ backgroundColor: selectedCategory.color }}>
              Move Type: #{selectedCategory.id} (u8)
            </span>
          </div>

          <div className="sector-card-grid">
            <div className="sector-examples-col">
              <h4>Eligible Service Deliverables</h4>
              <div className="examples-tag-cloud">
                {selectedCategory.examples.map((ex, i) => (
                  <span key={i} className="example-tag-item">
                    <FaCheckCircle style={{ color: selectedCategory.color }} /> {ex}
                  </span>
                ))}
              </div>
            </div>

            <div className="sector-action-col">
              <h4>Program Manager Quick Actions</h4>
              <p>Configure automated grant templates or mint new purpose-bound vouchers in this sector.</p>
              <div className="sector-btns-stack">
                <Link to="/user/templates" className="btn-sector-primary" style={{ backgroundColor: selectedCategory.color }}>
                  Browse {selectedCategory.code} Templates <FaArrowRight />
                </Link>
                <Link to="/admin" className="btn-sector-outline">
                  Mint {selectedCategory.code} Voucher in Studio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE ARCHITECTURAL PILLARS */}
      <section className="architecture-pillars-section" id="features">
        <div className="section-head-box">
          <span className="section-kicker">Smart Contract Architecture</span>
          <h2 className="section-h2">Enterprise-Grade Security by Design</h2>
          <p className="section-desc">
            Combining the formal verification strengths of Sui Move with enterprise operational resiliency.
          </p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
              <FaShieldAlt />
            </div>
            <h3>On-Chain Burn-on-Redemption</h3>
            <p>
              Vouchers are consumed and deleted from the Sui global object store upon redemption, making double-spending mathematically impossible.
            </p>
            <span className="pillar-link">Move Verified Object Model →</span>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <FaCoins />
            </div>
            <h3>Partial Redemption Engine</h3>
            <p>
              Beneficiaries can spend vouchers incrementally across multiple transactions, tracking exact remaining balance with zero residual loss.
            </p>
            <span className="pillar-link">Incremental Balance Protocol →</span>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
              <FaQrcode />
            </div>
            <h3>HMAC-Signed POS QR Codes</h3>
            <p>
              Generate cryptographically signed, timestamped QR payloads that can be scanned by any merchant smartphone with offline validation.
            </p>
            <span className="pillar-link">Cryptographic POS Verification →</span>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
              <FaUsers />
            </div>
            <h3>Multi-Signature Governance</h3>
            <p>
              Require multi-party approvals (e.g., 2 of 3 program officers) before releasing high-value voucher batches or modifying registries.
            </p>
            <span className="pillar-link">Role-Based Multi-Sig Approval →</span>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#EC4899' }}>
              <FaClock />
            </div>
            <h3>Scheduled Automated Issuance</h3>
            <p>
              Automate monthly disbursements, school term allowances, and emergency relief drops with customizable cron scheduling.
            </p>
            <span className="pillar-link">Automated Grant Scheduling →</span>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'rgba(20, 184, 166, 0.12)', color: '#14B8A6' }}>
              <FaChartPie />
            </div>
            <h3>Real-Time Audit & BI Metrics</h3>
            <p>
              Gain complete visibility into redemption velocity, merchant fulfillment, category utilization, and geographic trends.
            </p>
            <span className="pillar-link">Real-Time BI Dashboard →</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS STEPPER */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-head-box">
          <span className="section-kicker">Simple 4-Step Lifecycle</span>
          <h2 className="section-h2">From Donor Grant to In-Store Redemption</h2>
        </div>

        <div className="stepper-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <div className="step-icon-box"><FaCoins /></div>
            <h4>Mint & Ringfence</h4>
            <p>Issuers mint vouchers with fixed category limits, expiry timestamps, and designated merchant registries.</p>
          </div>

          <div className="step-connector-line"></div>

          <div className="step-card">
            <div className="step-num">02</div>
            <div className="step-icon-box"><FaWallet /></div>
            <h4>Hold in Web3 Wallet</h4>
            <p>Beneficiaries receive non-custodial voucher objects in their Sui wallet or mobile app.</p>
          </div>

          <div className="step-connector-line"></div>

          <div className="step-card">
            <div className="step-num">03</div>
            <div className="step-icon-box"><FaQrcode /></div>
            <h4>Present & Scan POS</h4>
            <p>Customer presents signed QR code or wallet pass at the accredited merchant counter.</p>
          </div>

          <div className="step-connector-line"></div>

          <div className="step-card">
            <div className="step-num">04</div>
            <div className="step-icon-box"><FaCheckCircle /></div>
            <h4>On-Chain Burn & Settle</h4>
            <p>The Move contract burns the credit on-chain and updates merchant ledger in sub-second finality.</p>
          </div>
        </div>
      </section>

      {/* ENTERPRISE FAQ */}
      <section className="enterprise-faq-section" id="faq">
        <div className="section-head-box">
          <span className="section-kicker">Frequently Asked Questions</span>
          <h2 className="section-h2">Clear Answers on Security, Compliance & Settlement</h2>
        </div>

        <div className="faq-filter-row">
          {['All', 'Security', 'Operations', 'Point of Sale', 'Governance', 'Blockchain'].map((cat, i) => (
            <button
              key={i}
              className={`faq-filter-btn ${faqCategoryFilter === cat ? 'active' : ''}`}
              onClick={() => setFaqCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="faq-list-container">
          {filteredFaqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`faq-card ${activeFaq === idx ? 'expanded' : ''}`}
              onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
            >
              <div className="faq-q-row">
                <span className="faq-q-text">{faq.q}</span>
                <span className="faq-expand-icon">
                  {activeFaq === idx ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>
              {activeFaq === idx && (
                <div className="faq-a-content">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ENTERPRISE CALL TO ACTION BANNER */}
      <section className="enterprise-cta-section">
        <div className="cta-inner-card">
          <span className="cta-pill">READY TO DEPLOY?</span>
          <h2>Launch Your First Purpose-Bound Voucher Program</h2>
          <p>
            Experience next-generation targeted aid delivery on the Sui blockchain. Test live on Sui Testnet today.
          </p>
          <div className="cta-actions-group">
            <button className="btn-cta-user" onClick={handleQuickEnterUser}>
              <FaWallet /> Launch Beneficiary Hub
            </button>
            <button className="btn-cta-merchant" onClick={handleQuickEnterMerchant}>
              <FaStore /> Open Merchant Terminal
            </button>
            <button className="btn-cta-admin" onClick={handleQuickEnterAdmin}>
              <FaShieldAlt /> Enter Admin Studio
            </button>
          </div>
        </div>
      </section>

      {/* ENTERPRISE FOOTER */}
      <footer className="enterprise-footer">
        <div className="footer-top-grid">
          <div className="footer-brand-col">
            <div className="footer-brand-title">
              <FaTicketAlt className="footer-logo-icon" />
              <span>ServicePass Protocol</span>
            </div>
            <p>
              The open-source, non-custodial voucher system built on Sui Move. Ensuring purpose-bound aid reaches verified recipients with zero leakage.
            </p>
            <div className="contract-hash-chip" onClick={() => handleCopySampleId('0x7a8c90b4d21e8432f9104c2a')}>
              <code>Package: 0x7a8c...90b4</code>
              <span className="copy-badge-chip">Copy</span>
            </div>
          </div>

          <div className="footer-links-col">
            <h5>Beneficiaries</h5>
            <Link to="/user/dashboard">Dashboard</Link>
            <Link to="/user/vouchers">My Vouchers</Link>
            <Link to="/user/redeem">Approve Redemption</Link>
            <Link to="/user/transfers">Transfers</Link>
            <Link to="/user/history">Receipts & History</Link>
          </div>

          <div className="footer-links-col">
            <h5>Merchants</h5>
            <Link to="/merchant/dashboard">Merchant Dashboard</Link>
            <Link to="/merchant/redeem">POS Camera Scanner</Link>
            <Link to="/merchant/redemptions">Settlement Logs</Link>
            <Link to="/merchant/reports">Financial Reports</Link>
          </div>

          <div className="footer-links-col">
            <h5>Operations & Governance</h5>
            <Link to="/admin">Admin Control Studio</Link>
            <Link to="/user/templates">Voucher Templates</Link>
            <Link to="/user/scheduled">Scheduled Grants</Link>
            <Link to="/user/multisig">Multi-Sig Approvals</Link>
            <Link to="/analytics">Protocol Analytics</Link>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p>© {new Date().getFullYear()} ServicePass Protocol. Open Source MIT License. Powered by Sui Blockchain.</p>
          <div className="footer-network-status">
            <span className="status-indicator-dot"></span>
            <span>SUI TESTNET FULLNODE CONNECTED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;