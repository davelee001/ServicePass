import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Voucher APIs
export const voucherAPI = {
  getVouchersByOwner: async (address) => {
    const response = await api.get(`/vouchers/owner/${address}`);
    return response.data;
  },
  
  mintVoucher: async (voucherData) => {
    const response = await api.post('/vouchers/mint', voucherData);
    return response.data;
  },
};

// Merchant APIs
export const merchantAPI = {
  getAllMerchants: async () => {
    const response = await api.get('/merchants');
    return response.data;
  },
  
  getMerchantById: async (merchantId) => {
    const response = await api.get(`/merchants/${merchantId}`);
    return response.data;
  },
  
  registerMerchant: async (merchantData) => {
    const response = await api.post('/merchants/register', merchantData);
    return response.data;
  },
};

// Redemption APIs
export const redemptionAPI = {
  recordRedemption: async (redemptionData) => {
    const response = await api.post('/redemptions', redemptionData);
    return response.data;
  },
  
  getRedemptionsByMerchant: async (merchantId, params = {}) => {
    const response = await api.get(`/redemptions/merchant/${merchantId}`, { params });
    return response.data;
  },
  
  getRedemptionsByUser: async (walletAddress) => {
    const response = await api.get(`/redemptions/user/${walletAddress}`);
    return response.data;
  },
};

export default api;
