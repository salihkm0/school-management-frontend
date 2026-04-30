// src/store/slices/studentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import studentService from '../../services/studentService'
import toast from 'react-hot-toast'

export const fetchStudents = createAsyncThunk(
  'students/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await studentService.getStudents(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchStudentById = createAsyncThunk(
  'students/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await studentService.getStudentById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

// ADD THIS - Fetch students by class ID
export const fetchStudentsByClass = createAsyncThunk(
  'students/fetchByClass',
  async (classId, { rejectWithValue }) => {
    try {
      const response = await studentService.getStudentsByClass(classId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const createStudent = createAsyncThunk(
  'students/create',
  async (studentData, { rejectWithValue }) => {
    try {
      const response = await studentService.createStudent(studentData)
      toast.success('Student created successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create student')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateStudent = createAsyncThunk(
  'students/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await studentService.updateStudent(id, data)
      toast.success('Student updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteStudent = createAsyncThunk(
  'students/delete',
  async (id, { rejectWithValue }) => {
    try {
      await studentService.deleteStudent(id)
      toast.success('Student deleted successfully')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const importStudents = createAsyncThunk(
  'students/import',
  async ({ file, academicYearId, classId }, { rejectWithValue }) => {
    try {
      const response = await studentService.importStudents(file, academicYearId, classId)
      toast.success(response.message)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import students')
      return rejectWithValue(error.response?.data)
    }
  }
)

// Import from Samboorna
export const importFromSamboorna = createAsyncThunk(
  'students/importFromSamboorna',
  async ({ file, academicYearId, autoCreateClasses, updateExisting }, { rejectWithValue }) => {
    try {
      const response = await studentService.importFromSamboorna(file, academicYearId, autoCreateClasses, updateExisting)
      toast.success(response.message || 'Students imported successfully from Samboorna')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import students from Samboorna')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const promoteStudents = createAsyncThunk(
  'students/promote',
  async (promotionData, { rejectWithValue }) => {
    try {
      const response = await studentService.promoteStudents(promotionData)
      toast.success('Students promoted successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to promote students')
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  students: [],
  currentStudent: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    clearCurrentStudent: (state) => {
      state.currentStudent = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Students
      .addCase(fetchStudents.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.isLoading = false
        state.students = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      // Fetch Student By ID
      .addCase(fetchStudentById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentStudent = action.payload
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      // ADD THIS - Fetch Students By Class
      .addCase(fetchStudentsByClass.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchStudentsByClass.fulfilled, (state, action) => {
        state.isLoading = false
        state.students = action.payload.data || action.payload
      })
      .addCase(fetchStudentsByClass.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      // Create Student
      .addCase(createStudent.fulfilled, (state, action) => {
        state.students.unshift(action.payload)
      })
      // Update Student
      .addCase(updateStudent.fulfilled, (state, action) => {
        const index = state.students.findIndex(s => s._id === action.payload._id)
        if (index !== -1) {
          state.students[index] = action.payload
        }
        if (state.currentStudent?._id === action.payload._id) {
          state.currentStudent = action.payload
        }
      })
      // Delete Student
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter(s => s._id !== action.payload)
        if (state.currentStudent?._id === action.payload) {
          state.currentStudent = null
        }
      })
      // Import Students
      .addCase(importStudents.fulfilled, (state, action) => {
        // Handle import success - maybe refresh list
      })
      // Import From Samboorna
      .addCase(importFromSamboorna.fulfilled, (state, action) => {
        // Handle import success - maybe refresh list
      })
      // Promote Students
      .addCase(promoteStudents.fulfilled, (state, action) => {
        // Handle promotion success
      })
  },
})

export const { clearCurrentStudent, clearError } = studentSlice.actions
export default studentSlice.reducer