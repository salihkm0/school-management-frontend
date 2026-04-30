import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import subjectService from '../../services/subjectService'
import toast from 'react-hot-toast'

export const fetchSubjects = createAsyncThunk(
  'subjects/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await subjectService.getSubjects(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchSubjectById = createAsyncThunk(
  'subjects/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await subjectService.getSubjectById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const createSubject = createAsyncThunk(
  'subjects/create',
  async (subjectData, { rejectWithValue }) => {
    try {
      const response = await subjectService.createSubject(subjectData)
      toast.success('Subject created successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create subject')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateSubject = createAsyncThunk(
  'subjects/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await subjectService.updateSubject(id, data)
      toast.success('Subject updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update subject')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteSubject = createAsyncThunk(
  'subjects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await subjectService.deleteSubject(id)
      toast.success('Subject deactivated successfully')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete subject')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const bulkImportSubjects = createAsyncThunk(
  'subjects/bulkImport',
  async (subjects, { rejectWithValue }) => {
    try {
      const response = await subjectService.bulkImportSubjects(subjects)
      toast.success(`Imported ${response.results?.success?.length || 0} subjects`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import subjects')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchSubjectStats = createAsyncThunk(
  'subjects/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subjectService.getSubjectStats()
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  subjects: [],
  currentSubject: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const subjectSlice = createSlice({
  name: 'subjects',
  initialState,
  reducers: {
    clearCurrentSubject: (state) => {
      state.currentSubject = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubjects.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.isLoading = false
        state.subjects = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      .addCase(fetchSubjectById.fulfilled, (state, action) => {
        state.currentSubject = action.payload
      })
      .addCase(fetchSubjectStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      .addCase(createSubject.fulfilled, (state, action) => {
        state.subjects.unshift(action.payload)
      })
      .addCase(updateSubject.fulfilled, (state, action) => {
        const index = state.subjects.findIndex(s => s._id === action.payload._id)
        if (index !== -1) {
          state.subjects[index] = action.payload
        }
        if (state.currentSubject?._id === action.payload._id) {
          state.currentSubject = action.payload
        }
      })
      .addCase(deleteSubject.fulfilled, (state, action) => {
        state.subjects = state.subjects.filter(s => s._id !== action.payload)
        if (state.currentSubject?._id === action.payload) {
          state.currentSubject = null
        }
      })
      .addCase(bulkImportSubjects.fulfilled, (state, action) => {
        if (action.payload.results?.success) {
          state.subjects = [...action.payload.results.success, ...state.subjects]
        }
      })
  },
})

export const { clearCurrentSubject, clearError } = subjectSlice.actions
export default subjectSlice.reducer