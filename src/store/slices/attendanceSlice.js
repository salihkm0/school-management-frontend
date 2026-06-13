import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import attendanceService from '../../services/attendanceService'
import toast from 'react-hot-toast'

export const fetchAttendance = createAsyncThunk(
  'attendance/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getAttendance(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchAttendanceByStudent = createAsyncThunk(
  'attendance/fetchByStudent',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getAttendanceByStudent(studentId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchAttendanceByClass = createAsyncThunk(
  'attendance/fetchByClass',
  async ({ classId, year, month }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getAttendanceByClass(classId, year, month)
      return response  // This should be the entire response object
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchAttendanceSummary = createAsyncThunk(
  'attendance/fetchSummary',
  async ({ classId, year, month }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getAttendanceSummary(classId, year, month)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const createAttendance = createAsyncThunk(
  'attendance/create',
  async (attendanceData, { rejectWithValue }) => {
    try {
      const response = await attendanceService.createAttendance(attendanceData)
      toast.success('Attendance recorded successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record attendance')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const bulkCreateAttendance = createAsyncThunk(
  'attendance/bulkCreate',
  async (attendanceList, { rejectWithValue }) => {
    try {
      const response = await attendanceService.bulkCreateAttendance(attendanceList);
      const successCount = Array.isArray(response.results?.success) ? response.results.success.length : (response.results?.success || 0);
      toast.success(`Saved ${successCount} attendance records`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateAttendance = createAsyncThunk(
  'attendance/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.updateAttendance(id, data)
      toast.success('Attendance updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update attendance')
      return rejectWithValue(error.response?.data)
    }
  }
)

// Template thunks
export const createAttendanceTemplate = createAsyncThunk(
  'attendance/createTemplate',
  async (data, { rejectWithValue }) => {
    try {
      const response = await attendanceService.createAttendanceTemplate(data)
      toast.success('Template created successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create template')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchAttendanceTemplates = createAsyncThunk(
  'attendance/fetchTemplates',
  async (params, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getAttendanceTemplates(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateAttendanceTemplate = createAsyncThunk(
  'attendance/updateTemplate',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.updateAttendanceTemplate(id, data)
      toast.success('Template updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update template')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteAttendanceTemplate = createAsyncThunk(
  'attendance/deleteTemplate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await attendanceService.deleteAttendanceTemplate(id)
      toast.success('Template deleted successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete template')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const applyTemplateToMonth = createAsyncThunk(
  'attendance/applyTemplate',
  async (data, { rejectWithValue }) => {
    try {
      const response = await attendanceService.applyTemplateToMonth(data)
      toast.success('Template applied successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply template')
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  attendance: [],
  studentAttendance: [],
  classAttendance: null,
  summary: null,
  templates: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendance: (state) => {
      state.attendance = []
      state.studentAttendance = []
      state.classAttendance = null
      state.summary = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Attendance
      .addCase(fetchAttendance.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false
        state.attendance = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      // Fetch Attendance By Class
      .addCase(fetchAttendanceByClass.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAttendanceByClass.fulfilled, (state, action) => {
        state.isLoading = false
        state.classAttendance = action.payload
      })
      .addCase(fetchAttendanceByClass.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      // Fetch Attendance Summary
      .addCase(fetchAttendanceSummary.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
        state.isLoading = false
        state.summary = action.payload
      })
      .addCase(fetchAttendanceSummary.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      // Bulk Create
      .addCase(bulkCreateAttendance.fulfilled, (state, action) => {
        if (Array.isArray(action.payload.results?.success)) {
          state.attendance = [...action.payload.results.success, ...state.attendance]
        }
      })
      // Templates
      .addCase(fetchAttendanceTemplates.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAttendanceTemplates.fulfilled, (state, action) => {
        state.isLoading = false
        state.templates = action.payload.data
      })
      .addCase(fetchAttendanceTemplates.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
  },
})

export const { clearAttendance, clearError } = attendanceSlice.actions
export default attendanceSlice.reducer