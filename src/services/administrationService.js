import api from './api';

const administrationService = {
  getSystemHealth: async () => {
    const response = await api.get('/administration/system/health');
    return response.data;
  },

  getSystemLogs: async (params) => {
    const response = await api.get('/administration/system/logs', { params });
    return response.data;
  },

  getUsers: async (params) => {
    const response = await api.get('/administration/users', { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/administration/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/administration/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/administration/users/${id}`);
    return response.data;
  },

  getActiveUsers: async () => {
    const response = await api.get('/administration/system/active-users');
    return response.data;
  },

  clearCache: async () => {
    const response = await api.post('/administration/system/clear-cache');
    return response.data;
  },

  getDbStats: async () => {
    const response = await api.get('/administration/system/db-stats');
    return response.data;
  },

  toggleMaintenanceMode: async (enabled) => {
    const response = await api.post('/administration/system/maintenance', { enabled });
    return response.data;
  },

  getAuditLogs: async (params) => {
    const response = await api.get('/administration/audit-logs', { params });
    return response.data;
  },

  testFcmNotification: async (data) => {
    const response = await api.post('/administration/fcm/test', data);
    return response.data;
  }
};

export default administrationService;
