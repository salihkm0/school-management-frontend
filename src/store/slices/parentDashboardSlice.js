// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import { apiClient } from '../../config/api'

// export const fetchParentDashboardData = createAsyncThunk(
//   'parentDashboard/fetchData',
//   async (_, { rejectWithValue }) => {
//     try {
//       // Fetch parent-specific data from your backend
//       const [childrenResponse, notificationsResponse, feeResponse] = await Promise.all([
//         apiClient.get('/parent/my-children'),
//         apiClient.get('/parent/notifications'),
//         apiClient.get('/parent/fee-status')
//       ])
      
//       return {
//         children: childrenResponse.data,
//         avgAttendance: childrenResponse.data?.avgAttendance || 96,
//         newNotifications: notificationsResponse.data?.unread || 0,
//         recentNotifications: notificationsResponse.data?.recent || [],
//         feeStatus: feeResponse.data,
//         upcomingEvents: [] // Fetch from events API
//       }
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data')
//     }
//   }
// )

// const parentDashboardSlice = createSlice({
//   name: 'parentDashboard',
//   initialState: {
//     data: {},
//     isLoading: false,
//     error: null
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchParentDashboardData.pending, (state) => {
//         state.isLoading = true
//         state.error = null
//       })
//       .addCase(fetchParentDashboardData.fulfilled, (state, action) => {
//         state.isLoading = false
//         state.data = action.payload
//       })
//       .addCase(fetchParentDashboardData.rejected, (state, action) => {
//         state.isLoading = false
//         state.error = action.payload
//       })
//   }
// })

// export default parentDashboardSlice.reducer