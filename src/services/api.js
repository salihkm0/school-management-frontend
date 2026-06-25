import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          })
          
          if (response.data.token) {
            localStorage.setItem('token', response.data.token)
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    
    if (error.response?.status === 503) {
      window.dispatchEvent(new Event('maintenance_mode_on'))
    }
    
    return Promise.reject(error)
  }
)

export default api