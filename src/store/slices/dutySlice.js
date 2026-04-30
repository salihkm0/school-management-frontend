import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import dutyService from '../../services/dutyService'
import toast from 'react-hot-toast'

export const fetchDuties = createAsyncThunk(
  'duties/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await dutyService.getDuties(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const autoAssignDuties = createAsyncThunk(
  'duties/autoAssign',
  async ({ dates, dutyType, excludedStaffIds, algorithm, className }, { rejectWithValue }) => {
    try {
      const response = await dutyService.autoAssignDuties(dates, dutyType, excludedStaffIds, algorithm, className)
      toast.success(`${response.statistics?.totalDuties || 0} duties assigned for ${dates.length} dates`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign duties')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const multiTypeAssign = createAsyncThunk(
  'duties/multiTypeAssign',
  async ({ dutyRequirements, excludedStaffIds }, { rejectWithValue }) => {
    try {
      const response = await dutyService.multiTypeAssign(dutyRequirements, excludedStaffIds)
      toast.success(`${response.statistics?.totalDuties || 0} duties assigned across ${dutyRequirements.length} types`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign duties')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const assignManualDuty = createAsyncThunk(
  'duties/manualAssign',
  async (dutyData, { rejectWithValue }) => {
    try {
      const response = await dutyService.assignManualDuty(dutyData)
      toast.success(`${response.duties?.[0]?.duties?.length || 1} duties assigned`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign duty')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateDuty = createAsyncThunk(
  'duties/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await dutyService.updateDuty(id, data)
      toast.success('Duty updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update duty')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteDuty = createAsyncThunk(
  'duties/delete',
  async (id, { rejectWithValue }) => {
    try {
      await dutyService.deleteDuty(id)
      toast.success('Duty deleted successfully')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete duty')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchDutyStats = createAsyncThunk(
  'duties/fetchStats',
  async ({ staffId, dutyType, year, month }, { rejectWithValue }) => {
    try {
      const response = await dutyService.getStaffDutyStats(staffId, dutyType, year, month)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchAvailableDates = createAsyncThunk(
  'duties/fetchAvailableDates',
  async ({ startDate, endDate, excludeWeekends, excludeHolidays }, { rejectWithValue }) => {
    try {
      const response = await dutyService.getAvailableDates(startDate, endDate, excludeWeekends, excludeHolidays)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  duties: [],
  currentDuty: null,
  stats: null,
  availableDates: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const dutySlice = createSlice({
  name: 'duties',
  initialState,
  reducers: {
    clearCurrentDuty: (state) => {
      state.currentDuty = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDuties.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchDuties.fulfilled, (state, action) => {
        state.isLoading = false
        state.duties = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchDuties.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      .addCase(fetchDutyStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      .addCase(fetchAvailableDates.fulfilled, (state, action) => {
        state.availableDates = action.payload.dates || []
      })
      .addCase(autoAssignDuties.fulfilled, (state, action) => {
        if (action.payload.assignments) {
          state.duties = [...action.payload.assignments, ...state.duties]
        }
      })
      .addCase(assignManualDuty.fulfilled, (state, action) => {
        if (action.payload.duties) {
          state.duties = [...action.payload.duties, ...state.duties]
        }
      })
      .addCase(deleteDuty.fulfilled, (state, action) => {
        state.duties = state.duties.filter(d => d._id !== action.payload)
      })
  },
})

export const { clearCurrentDuty, clearError } = dutySlice.actions
export default dutySlice.reducer