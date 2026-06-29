import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import staffService from '../../services/staffService'
import toast from 'react-hot-toast'

export const fetchStaff = createAsyncThunk(
  'staff/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await staffService.getStaff(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchStaffById = createAsyncThunk(
  'staff/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await staffService.getStaffById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const createStaff = createAsyncThunk(
  'staff/create',
  async (staffData, { rejectWithValue }) => {
    try {
      const response = await staffService.createStaff(staffData)
      toast.success('Staff created successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create staff')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateStaff = createAsyncThunk(
  'staff/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await staffService.updateStaff(id, data)
      toast.success('Staff updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update staff')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteStaff = createAsyncThunk(
  'staff/delete',
  async (id, { rejectWithValue }) => {
    try {
      await staffService.deleteStaff(id)
      toast.success('Staff deactivated successfully')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete staff')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const forceDeleteStaff = createAsyncThunk(
  'staff/forceDelete',
  async (id, { rejectWithValue }) => {
    try {
      await staffService.forceDeleteStaff(id)
      toast.success('Staff permanently deleted')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to force delete staff')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const assignStaffSubjects = createAsyncThunk(
  'staff/assignSubjects',
  async ({ staffId, academicYearId, subjects }, { rejectWithValue }) => {
    try {
      const response = await staffService.assignSubjects(staffId, academicYearId, subjects)
      toast.success('Subjects assigned successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign subjects')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const assignClassTeacher = createAsyncThunk(
  'staff/assignClassTeacher',
  async ({ staffId, academicYearId, classId }, { rejectWithValue }) => {
    try {
      const response = await staffService.assignClassTeacher(staffId, academicYearId, classId)
      toast.success('Class teacher assigned successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign class teacher')
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  staff: [],
  currentStaff: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearCurrentStaff: (state) => {
      state.currentStaff = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.isLoading = false
        state.staff = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      .addCase(fetchStaffById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentStaff = action.payload
      })
      .addCase(fetchStaffById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.staff.unshift(action.payload.data)
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        const index = state.staff.findIndex(s => s._id === action.payload._id)
        if (index !== -1) {
          state.staff[index] = action.payload
        }
        if (state.currentStaff?._id === action.payload._id) {
          state.currentStaff = action.payload
        }
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        // Find and mark as inactive
        const index = state.staff.findIndex(s => s._id === action.payload)
        if (index !== -1) {
          state.staff[index].isActive = false
        }
      })
      .addCase(forceDeleteStaff.fulfilled, (state, action) => {
        state.staff = state.staff.filter((s) => s._id !== action.payload)
        state.pagination.total -= 1
        if (state.currentStaff?._id === action.payload) {
          state.currentStaff = null
        }
      })
  },
})

export const { clearCurrentStaff, clearError } = staffSlice.actions
export default staffSlice.reducer