// src/services/userService.js
import api from './api';

const userService = {
  // Get all users (admin only)
  getAllUsers: async (search = '', page = 1, limit = 50, role = '') => {
    const params = { page, limit };
    if (search) params.search = search;
    if (role) params.role = role;
    
    const response = await api.get('/users', { params });
    return response.data;
  },
  
  // Get users by role (admin only)
  getUsersByRole: async (role, search = '', page = 1, limit = 50) => {
    const params = { page, limit };
    if (search) params.search = search;
    
    const response = await api.get(`/users/role/${role}`, { params });
    return response.data;
  },
  
  // Get parents by class (class teacher)
  getParentsByClass: async (classId, search = '') => {
    const params = {};
    if (search) params.search = search;
    
    const response = await api.get(`/users/parents/class/${classId}`, { params });
    return response.data;
  },
  
  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
};

export default userService;