// src/store/slices/dashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { 
  fetchDashboardStats as fetchStats,
  fetchRecentActivities,
  subscribeToDashboardUpdates
} from '../../services/analyticsService'
import toast from 'react-hot-toast'

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetchStats()
      // Also fetch recent activities separately
      const activities = await fetchRecentActivities(10)
      return { ...response, recentActivities: activities }
    } catch (error) {
      toast.error('Failed to load dashboard data')
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

export const fetchDashboardRecentActivities = createAsyncThunk(
  'dashboard/fetchRecentActivities',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await fetchRecentActivities(limit)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

export const subscribeDashboard = createAsyncThunk(
  'dashboard/subscribe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscribeToDashboardUpdates()
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

// Helper to calculate real-time stats
const calculateRealtimeStats = (currentStats, updateData) => {
  const newStats = { ...currentStats }
  
  if (updateData.totalStudents !== undefined) {
    newStats.totalStudents = updateData.totalStudents
  }
  if (updateData.totalStaff !== undefined) {
    newStats.totalStaff = updateData.totalStaff
  }
  if (updateData.totalClasses !== undefined) {
    newStats.totalClasses = updateData.totalClasses
  }
  if (updateData.currentExams !== undefined) {
    newStats.currentExams = updateData.currentExams
  }
  if (updateData.attendanceToday !== undefined) {
    newStats.attendanceToday = updateData.attendanceToday
  }
  if (updateData.fullAPlusCount !== undefined) {
    newStats.fullAPlusCount = updateData.fullAPlusCount
  }
  
  return newStats
}

const initialState = {
  stats: {
    totalStudents: 0,
    totalStaff: 0,
    totalClasses: 0,
    currentExams: 0,
    attendanceToday: 0,
    fullAPlusCount: 0,
    academicYear: null,
    demographics: {
      gender: {
        male: 0,
        female: 0,
        other: 0
      },
      category: []
    },
    enrollmentTrend: [],
    examPerformance: null,
    pendingTasks: {
      exams: 0,
      duties: 0,
      attendance: 0
    }
  },
  recentActivities: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  realtimeEnabled: true,
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateStats: (state, action) => {
      const updateData = action.payload
      state.stats = calculateRealtimeStats(state.stats, updateData)
      state.lastUpdated = new Date().toISOString()
    },
    updateStat: (state, action) => {
      const { key, value } = action.payload
      if (state.stats[key] !== undefined) {
        state.stats[key] = value
        state.lastUpdated = new Date().toISOString()
      }
    },
    updateRecentActivities: (state, action) => {
      state.recentActivities = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    addActivity: (state, action) => {
      const newActivity = action.payload
      // Check if activity already exists
      const exists = state.recentActivities.some(a => a.id === newActivity.id)
      if (!exists) {
        state.recentActivities = [newActivity, ...state.recentActivities].slice(0, 10)
        state.lastUpdated = new Date().toISOString()
      }
    },
    incrementStat: (state, action) => {
      const { key, increment = 1 } = action.payload
      if (state.stats[key] !== undefined) {
        state.stats[key] += increment
        state.lastUpdated = new Date().toISOString()
      }
    },
    decrementStat: (state, action) => {
      const { key, decrement = 1 } = action.payload
      if (state.stats[key] !== undefined) {
        state.stats[key] = Math.max(0, state.stats[key] - decrement)
        state.lastUpdated = new Date().toISOString()
      }
    },
    clearError: (state) => {
      state.error = null
    },
    resetDashboard: (state) => {
      state.stats = initialState.stats
      state.recentActivities = []
      state.error = null
      state.lastUpdated = null
    },
    toggleRealtime: (state) => {
      state.realtimeEnabled = !state.realtimeEnabled
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.stats = {
          ...state.stats,
          ...action.payload,
        }
        state.recentActivities = action.payload.recentActivities || []
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message || 'Failed to fetch dashboard stats'
        console.error('Dashboard stats error:', action.payload)
      })
      
      // Fetch Recent Activities
      .addCase(fetchDashboardRecentActivities.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchDashboardRecentActivities.fulfilled, (state, action) => {
        state.isLoading = false
        state.recentActivities = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDashboardRecentActivities.rejected, (state, action) => {
        state.isLoading = false
        console.error('Recent activities error:', action.payload)
      })
      
      // Subscribe to Dashboard
      .addCase(subscribeDashboard.fulfilled, (state, action) => {
        console.log('Subscribed to dashboard updates:', action.payload)
      })
      .addCase(subscribeDashboard.rejected, (state, action) => {
        console.error('Subscription error:', action.payload)
      })
  },
})

export const { 
  updateStats,
  updateStat,
  updateRecentActivities, 
  addActivity, 
  incrementStat,
  decrementStat,
  clearError, 
  resetDashboard,
  toggleRealtime
} = dashboardSlice.actions

export default dashboardSlice.reducer