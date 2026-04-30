// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import { apiClient } from '../../config/api'

// export const fetchStaffDashboardData = createAsyncThunk(
//   'staffDashboard/fetchData',
//   async (_, { rejectWithValue }) => {
//     try {
//       // Fetch staff-specific data from your backend
//       const [classesResponse, studentsResponse, tasksResponse] = await Promise.all([
//         apiClient.get('/staff/my-classes'),
//         apiClient.get('/staff/my-students'),
//         apiClient.get('/staff/pending-tasks')
//       ])
      
//       return {
//         myClasses: classesResponse.data,
//         myClassesCount: classesResponse.data?.length || 0,
//         totalStudents: studentsResponse.data?.total || 0,
//         pendingTasks: tasksResponse.data,
//         pendingTasksCount: tasksResponse.data?.length || 0,
//         attendanceToday: 92 // You can fetch from attendance API
//       }
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data')
//     }
//   }
// )

// const staffDashboardSlice = createSlice({
//   name: 'staffDashboard',
//   initialState: {
//     data: {},
//     isLoading: false,
//     error: null
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchStaffDashboardData.pending, (state) => {
//         state.isLoading = true
//         state.error = null
//       })
//       .addCase(fetchStaffDashboardData.fulfilled, (state, action) => {
//         state.isLoading = false
//         state.data = action.payload
//       })
//       .addCase(fetchStaffDashboardData.rejected, (state, action) => {
//         state.isLoading = false
//         state.error = action.payload
//       })
//   }
// })

// export default staffDashboardSlice.reducer