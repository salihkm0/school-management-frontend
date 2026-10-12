// src/store/slices/parentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import parentService from '../../services/parentService'
import toast from 'react-hot-toast'

export const fetchParents = createAsyncThunk(
  'parents/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await parentService.getParents(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchParentById = createAsyncThunk(
  'parents/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await parentService.getParentById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchMyChildren = createAsyncThunk(
  'parents/fetchMyChildren',
  async (_, { rejectWithValue }) => {
    try {
      const response = await parentService.getMyChildren()
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchMyParentProfile = createAsyncThunk(
  'parents/fetchMyProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await parentService.getMyParentProfile()
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const registerParent = createAsyncThunk(
  'parents/register',
  async (parentData, { rejectWithValue }) => {
    try {
      const response = await parentService.registerParent(parentData)
      toast.success('Parent registered successfully')
      return response
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to register parent'
      toast.error(errorMsg)
      return rejectWithValue(error.response?.data)
    }
  }
)

export const connectStudent = createAsyncThunk(
  'parents/connectStudent',
  async ({ parentId, studentCode, dateOfBirth, relation }, { rejectWithValue }) => {
    try {
      const response = await parentService.connectStudent(parentId, studentCode, dateOfBirth, relation)
      toast.success(response.message || 'Student connected successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect student')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const removeStudentConnection = createAsyncThunk(
  'parents/removeStudent',
  async ({ parentId, studentCode }, { rejectWithValue }) => {
    try {
      await parentService.removeStudentConnection(parentId, studentCode)
      toast.success('Student connection removed')
      return studentCode
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove connection')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateStudentRelation = createAsyncThunk(
  'parents/updateRelation',
  async ({ parentId, studentCode, relation }, { rejectWithValue }) => {
    try {
      const response = await parentService.updateStudentRelation(parentId, studentCode, relation)
      toast.success('Relationship updated successfully')
      return { parentId, studentCode, relation, data: response.data }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update relationship')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateParent = createAsyncThunk(
  'parents/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await parentService.updateParent(id, data)
      toast.success('Parent details updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update parent')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteParent = createAsyncThunk(
  'parents/delete',
  async (id, { rejectWithValue }) => {
    try {
      await parentService.deleteParent(id)
      toast.success('Parent deleted successfully')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete parent')
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  parents: [],
  currentParent: null,
  myChildren: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const parentSlice = createSlice({
  name: 'parents',
  initialState,
  reducers: {
    clearCurrentParent: (state) => {
      state.currentParent = null
    },
    clearError: (state) => {
      state.error = null
    },
    clearMyChildren: (state) => {
      state.myChildren = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Parents
      .addCase(fetchParents.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchParents.fulfilled, (state, action) => {
        state.isLoading = false
        state.parents = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchParents.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      
      // Fetch Parent By ID
      .addCase(fetchParentById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchParentById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentParent = action.payload.data
      })
      .addCase(fetchParentById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      
      // Fetch My Parent Profile (for logged-in parent)
      .addCase(fetchMyParentProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchMyParentProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentParent = action.payload.data
      })
      .addCase(fetchMyParentProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      
      // Fetch My Children
      .addCase(fetchMyChildren.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchMyChildren.fulfilled, (state, action) => {
        state.isLoading = false
        state.myChildren = action.payload.data?.children || []
      })
      .addCase(fetchMyChildren.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
        state.myChildren = []
      })
      
      // Register Parent
      .addCase(registerParent.fulfilled, (state, action) => {
        if (action.payload.data?.parent) {
          state.parents.unshift(action.payload.data.parent)
        }
      })
      
      // Connect Student
      .addCase(connectStudent.fulfilled, (state, action) => {
        if (state.currentParent) {
          state.currentParent.students = [...(state.currentParent.students || []), action.payload.data]
        }
        // Refresh children list after connection
        // This will be handled by the component calling fetchMyChildren again
      })
      .addCase(connectStudent.rejected, (state, action) => {
        state.error = action.payload?.message
      })
      
      // Remove Student Connection
      .addCase(removeStudentConnection.fulfilled, (state, action) => {
        if (state.currentParent) {
          if (state.currentParent.students) {
            state.currentParent.students = state.currentParent.students.filter(
              s => s.studentCode !== action.payload
            )
          }
          if (state.currentParent.connections) {
            state.currentParent.connections = state.currentParent.connections.filter(
              s => s.studentCode !== action.payload
            )
          }
        }
        state.myChildren = state.myChildren.filter(c => c.studentCode !== action.payload)
      })

      // Update Student Relation
      .addCase(updateStudentRelation.fulfilled, (state, action) => {
        const { studentCode, relation } = action.payload
        if (state.currentParent) {
          if (state.currentParent.students) {
            const st = state.currentParent.students.find(s => s.studentCode === studentCode)
            if (st) st.relation = relation
          }
          if (state.currentParent.connections) {
            const conn = state.currentParent.connections.find(s => s.studentCode === studentCode)
            if (conn) conn.relation = relation
          }
        }
      })
      
      // Update Parent
      .addCase(updateParent.pending, (state) => {
        state.isLoading = true
      })
      .addCase(updateParent.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentParent = action.payload.data
        const index = state.parents.findIndex(p => p._id === action.payload.data?._id)
        if (index !== -1) {
          state.parents[index] = action.payload.data
        }
      })
      .addCase(updateParent.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })

      // Delete Parent
      .addCase(deleteParent.pending, (state) => {
        state.isLoading = true
      })
      .addCase(deleteParent.fulfilled, (state, action) => {
        state.isLoading = false
        state.parents = state.parents.filter(p => p._id !== action.payload)
        if (state.currentParent && state.currentParent._id === action.payload) {
          state.currentParent = null
        }
      })
      .addCase(deleteParent.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
  },
})

export const { clearCurrentParent, clearError, clearMyChildren } = parentSlice.actions
export default parentSlice.reducer