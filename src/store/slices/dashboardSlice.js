// store/slices/dashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// Async thunks for different dashboard types
export const fetchAdminDashboard = createAsyncThunk(
  'dashboard/fetchAdminDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/dashboard/admin')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin dashboard')
    }
  }
)

export const fetchStaffDashboard = createAsyncThunk(
  'dashboard/fetchStaffDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/dashboard/staff')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff dashboard')
    }
  }
)

export const fetchParentDashboard = createAsyncThunk(
  'dashboard/fetchParentDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/dashboard/parent')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch parent dashboard')
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    adminData: null,
    staffData: null,
    parentData: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  },
  reducers: {
    clearDashboardData: (state) => {
      state.adminData = null
      state.staffData = null
      state.parentData = null
      state.error = null
    },
    updateStats: (state, action) => {
      // For real-time socket updates
      if (state.adminData?.summary) {
        state.adminData.summary = { ...state.adminData.summary, ...action.payload }
        state.lastUpdated = new Date().toISOString()
      }
    },
    addActivity: (state, action) => {
      if (state.adminData?.recentActivities) {
        state.adminData.recentActivities.unshift(action.payload)
        state.adminData.recentActivities = state.adminData.recentActivities.slice(0, 10)
      }
      if (state.staffData?.recentActivities) {
        state.staffData.recentActivities.unshift(action.payload)
        state.staffData.recentActivities = state.staffData.recentActivities.slice(0, 10)
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Admin Dashboard
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false
        state.adminData = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Staff Dashboard
      .addCase(fetchStaffDashboard.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchStaffDashboard.fulfilled, (state, action) => {
        state.isLoading = false
        state.staffData = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchStaffDashboard.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Parent Dashboard
      .addCase(fetchParentDashboard.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchParentDashboard.fulfilled, (state, action) => {
        state.isLoading = false
        state.parentData = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchParentDashboard.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { clearDashboardData, updateStats, addActivity } = dashboardSlice.actions
export default dashboardSlice.reducer