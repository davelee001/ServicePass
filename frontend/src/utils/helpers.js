// Voucher type constants
export const VOUCHER_TYPES = {
  1: { name: 'EDUCATION', color: '#4CAF50', icon: '🎓' },
  2: { name: 'HEALTHCARE', color: '#2196F3', icon: '🏥' },
  3: { name: 'TRANSPORT', color: '#FF9800', icon: '🚌' },
  4: { name: 'AGRICULTURE', color: '#8BC34A', icon: '🌾' },
};

export const getVoucherTypeName = (type) => {
  return VOUCHER_TYPES[type]?.name || 'UNKNOWN';
};

export const getVoucherTypeColor = (type) => {
  return VOUCHER_TYPES[type]?.color || '#999';
};

export const getVoucherTypeIcon = (type) => {
  return VOUCHER_TYPES[type]?.icon || '📄';
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format datetime
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Check if voucher is expired
export const isVoucherExpired = (expiryTimestamp) => {
  return Date.now() > expiryTimestamp;
};

// Shorten wallet address
export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Calculate total balance from vouchers
export const calculateTotalBalance = (vouchers) => {
  return vouchers.reduce((total, voucher) => {
    const amount = voucher.data?.content?.fields?.balance || 0;
    return total + amount;
  }, 0);
};

// Group vouchers by type
export const groupVouchersByType = (vouchers) => {
  return vouchers.reduce((groups, voucher) => {
    const type = voucher.data?.content?.fields?.voucher_type || 0;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(voucher);
    return groups;
  }, {});
};
