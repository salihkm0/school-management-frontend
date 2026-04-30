// src/services/authService.js
import api from './api'

const authService = {
  login: async (email, phone, password, rememberMe) => {
    // Build the request body based on what's provided
    const requestBody = {
      password,
      rememberMe
    }
    
    if (email) {
      requestBody.email = email
    } else if (phone) {
      requestBody.phone = phone
    }
    
    console.log('Login request body:', requestBody)
    
    const response = await api.post('/auth/login', requestBody)
    // Ensure user has id field
    if (response.data.user && !response.data.user.id && response.data.user._id) {
      response.data.user.id = response.data.user._id
    }
    return response.data
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    // Ensure user has id field
    if (response.data.user && !response.data.user.id && response.data.user._id) {
      response.data.user.id = response.data.user._id
    }
    return response.data
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword })
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token, password) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password })
    return response.data
  },
}

export default authService