import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchAcademicYears = createAsyncThunk(
  'academicYears/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params)
      const response = await api.get(`/academic-years?${queryParams}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchCurrentAcademicYear = createAsyncThunk(
  'academicYears/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/academic-years/current')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const createAcademicYear = createAsyncThunk(
  'academicYears/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/academic-years', data)
      toast.success('Academic year created successfully')
      return response.data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create academic year')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateAcademicYear = createAsyncThunk(
  'academicYears/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/academic-years/${id}`, data)
      toast.success('Academic year updated successfully')
      return response.data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update academic year')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const setCurrentAcademicYear = createAsyncThunk(
  'academicYears/setCurrent',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/academic-years/${id}/current`)
      toast.success('Current academic year set successfully')
      return response.data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set current academic year')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteAcademicYear = createAsyncThunk(
  'academicYears/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/academic-years/${id}`)
      toast.success('Academic year deleted successfully')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete academic year')
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  academicYears: [],
  currentAcademicYear: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const academicYearSlice = createSlice({
  name: 'academicYears',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAcademicYears.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchAcademicYears.fulfilled, (state, action) => {
        state.isLoading = false
        state.academicYears = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchAcademicYears.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      .addCase(fetchCurrentAcademicYear.fulfilled, (state, action) => {
        state.currentAcademicYear = action.payload
      })
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.academicYears.unshift(action.payload)
      })
      .addCase(updateAcademicYear.fulfilled, (state, action) => {
        const index = state.academicYears.findIndex(y => y._id === action.payload._id)
        if (index !== -1) {
          state.academicYears[index] = action.payload
        }
        if (state.currentAcademicYear?._id === action.payload._id) {
          state.currentAcademicYear = action.payload
        }
      })
      .addCase(setCurrentAcademicYear.fulfilled, (state, action) => {
        state.currentAcademicYear = action.payload.academicYear
        state.academicYears = state.academicYears.map(y => ({
          ...y,
          isCurrent: y._id === action.payload.academicYear._id,
        }))
      })
      .addCase(deleteAcademicYear.fulfilled, (state, action) => {
        state.academicYears = state.academicYears.filter(y => y._id !== action.payload)
        if (state.currentAcademicYear?._id === action.payload) {
          state.currentAcademicYear = null
        }
      })
  },
})

export const { clearError } = academicYearSlice.actions
export default academicYearSlice.reducer