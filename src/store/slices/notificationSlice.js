// src/store/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ page = 1, limit = 20, unreadOnly = false }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit })
      if (unreadOnly) params.append('unreadOnly', 'true')
      const response = await api.get(`/notifications?${params}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const markAsRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`)
      return { notificationId, data: response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.put('/notifications/mark-all-read')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      return notificationId
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification = action.payload
      // Check if notification already exists
      const exists = state.notifications.some(n => n.id === notification.id || n._id === notification._id)
      if (!exists) {
        state.notifications.unshift(notification)
        if (!notification.isRead && !notification.read) {
          state.unreadCount++
        }
        // Keep only last 100 notifications
        if (state.notifications.length > 100) {
          state.notifications.pop()
        }
      }
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter(n => !n.isRead && !n.read).length
    },
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload || n._id === action.payload)
      if (notification && !notification.isRead && !notification.read) {
        notification.isRead = true
        notification.read = true
        notification.readAt = new Date().toISOString()
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => {
        n.isRead = true
        n.read = true
      })
      state.unreadCount = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false
        state.notifications = action.payload.data
        state.unreadCount = action.payload.unreadCount
        state.pagination = action.payload.pagination
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload.notificationId || n._id === action.payload.notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          notification.read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.isRead = true
          n.read = true
        })
        state.unreadCount = 0
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(n => n.id !== action.payload && n._id !== action.payload)
        state.unreadCount = state.notifications.filter(n => !n.isRead && !n.read).length
      })
  },
})

export const { 
  addNotification, 
  updateUnreadCount, 
  clearNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} = notificationSlice.actions

export default notificationSlice.reducer