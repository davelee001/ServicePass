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
  
  // Partial Redemption
  recordPartialRedemption: async (voucherId, redemptionData) => {
    const response = await api.post(`/redemptions/${voucherId}/partial`, redemptionData);
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
  
  getRedemptionHistory: async (voucherId) => {
    const response = await api.get(`/redemptions/voucher/${voucherId}/history`);
    return response.data;
  },
};

// Notification APIs
export const notificationAPI = {
  getPreferences: async () => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },
  
  updatePreferences: async (preferences) => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },
  
  registerPushToken: async (tokenData) => {
    const response = await api.post('/notifications/push-token', tokenData);
    return response.data;
  },
  
  getNotificationHistory: async (params = {}) => {
    const response = await api.get('/notifications/history', { params });
    return response.data;
  },
  
  sendTestNotification: async (testData) => {
    const response = await api.post('/notifications/test', testData);
    return response.data;
  }
};

// Voucher Template APIs
export const templateAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/templates', { params });
    return response.data;
  },
  
  getById: async (templateId) => {
    const response = await api.get(`/templates/${templateId}`);
    return response.data;
  },
  
  create: async (templateData) => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },
  
  update: async (templateId, templateData) => {
    const response = await api.put(`/templates/${templateId}`, templateData);
    return response.data;
  },
  
  deactivate: async (templateId) => {
    const response = await api.post(`/templates/${templateId}/deactivate`);
    return response.data;
  },
  
  activate: async (templateId) => {
    const response = await api.post(`/templates/${templateId}/activate`);
    return response.data;
  },
  
  duplicate: async (templateId) => {
    const response = await api.post(`/templates/${templateId}/duplicate`);
    return response.data;
  },
  
  delete: async (templateId) => {
    const response = await api.delete(`/templates/${templateId}`);
    return response.data;
  },
  
  getStats: async (templateId) => {
    const response = await api.get(`/templates/${templateId}/stats`);
    return response.data;
  },
  
  getPopular: async () => {
    const response = await api.get('/templates/analytics/popular');
    return response.data;
  },
  
  getRecent: async () => {
    const response = await api.get('/templates/analytics/recent');
    return response.data;
  },
};

// Scheduled Voucher APIs
export const scheduledVoucherAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/scheduled-vouchers', { params });
    return response.data;
  },
  
  getById: async (scheduleId) => {
    const response = await api.get(`/scheduled-vouchers/${scheduleId}`);
    return response.data;
  },
  
  create: async (scheduleData) => {
    const response = await api.post('/scheduled-vouchers', scheduleData);
    return response.data;
  },
  
  cancel: async (scheduleId) => {
    const response = await api.post(`/scheduled-vouchers/${scheduleId}/cancel`);
    return response.data;
  },
  
  triggerProcessing: async () => {
    const response = await api.post('/scheduled-vouchers/process/trigger');
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/scheduled-vouchers/analytics/stats');
    return response.data;
  },
};

// Multi-Signature Operation APIs
export const multiSigAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/multisig', { params });
    return response.data;
  },
  
  getPending: async () => {
    const response = await api.get('/multisig/pending');
    return response.data;
  },
  
  getById: async (operationId) => {
    const response = await api.get(`/multisig/${operationId}`);
    return response.data;
  },
  
  create: async (operationData) => {
    const response = await api.post('/multisig', operationData);
    return response.data;
  },
  
  sign: async (operationId) => {
    const response = await api.post(`/multisig/${operationId}/sign`);
    return response.data;
  },
  
  reject: async (operationId, reason) => {
    const response = await api.post(`/multisig/${operationId}/reject`, { reason });
    return response.data;
  },
  
  execute: async (operationId) => {
    const response = await api.post(`/multisig/${operationId}/execute`);
    return response.data;
  },
  
  expireOld: async () => {
    const response = await api.post('/multisig/maintenance/expire');
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/multisig/analytics/stats');
    return response.data;
  },
  
  getUserHistory: async (userId) => {
    const response = await api.get(`/multisig/user/${userId}/history`);
    return response.data;
  },
};

// Voucher Transfer APIs
export const transferAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/transfers', { params });
    return response.data;
  },
  
  getById: async (transferId) => {
    const response = await api.get(`/transfers/${transferId}`);
    return response.data;
  },
  
  create: async (transferData) => {
    const response = await api.post('/transfers', transferData);
    return response.data;
  },
  
  approve: async (transferId) => {
    const response = await api.post(`/transfers/${transferId}/approve`);
    return response.data;
  },
  
  reject: async (transferId, reason) => {
    const response = await api.post(`/transfers/${transferId}/reject`, { reason });
    return response.data;
  },
  
  getVoucherHistory: async (voucherId) => {
    const response = await api.get(`/transfers/voucher/${voucherId}/history`);
    return response.data;
  },
  
  getPendingApprovals: async () => {
    const response = await api.get('/transfers/pending/approvals');
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/transfers/analytics/stats');
    return response.data;
  },
};

export default api;
