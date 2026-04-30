import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import examService from '../../services/examService'
import toast from 'react-hot-toast'

// Async Thunks
export const fetchExams = createAsyncThunk(
  'exams/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await examService.getExams(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchExamById = createAsyncThunk(
  'exams/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await examService.getExamById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const createExam = createAsyncThunk(
  'exams/create',
  async (examData, { rejectWithValue }) => {
    try {
      const response = await examService.createExam(examData)
      toast.success('Exam created successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create exam')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateExam = createAsyncThunk(
  'exams/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await examService.updateExam(id, data)
      toast.success('Exam updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update exam')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteExam = createAsyncThunk(
  'exams/delete',
  async (id, { rejectWithValue }) => {
    try {
      await examService.deleteExam(id)
      toast.success('Exam deleted successfully')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete exam')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const publishExam = createAsyncThunk(
  'exams/publish',
  async (id, { rejectWithValue }) => {
    try {
      const response = await examService.publishExam(id)
      toast.success('Exam published successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish exam')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const cloneExam = createAsyncThunk(
  'exams/clone',
  async ({ id, newAcademicYearId }, { rejectWithValue }) => {
    try {
      const response = await examService.cloneExam(id, newAcademicYearId)
      toast.success('Exam cloned successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clone exam')
      return rejectWithValue(error.response?.data)
    }
  }
)

// Tab-specific Thunks
export const fetchExamClasses = createAsyncThunk(
  'exams/fetchExamClasses',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await examService.getExamClasses(examId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchExamSubjects = createAsyncThunk(
  'exams/fetchExamSubjects',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await examService.getExamSubjects(examId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchExamScheduleDetails = createAsyncThunk(
  'exams/fetchExamScheduleDetails',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await examService.getExamScheduleDetails(examId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

// Marks Management Thunks
export const submitClassMarks = createAsyncThunk(
  'exams/submitClassMarks',
  async ({ examId, classId, marksData }, { rejectWithValue }) => {
    try {
      const response = await examService.submitClassMarks(examId, classId, marksData)
      toast.success('Marks submitted for review')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit marks')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const reviewClassMarks = createAsyncThunk(
  'exams/reviewClassMarks',
  async ({ examId, classId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await examService.reviewClassMarks(examId, classId, reviewData)
      toast.success('Marks reviewed successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review marks')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const saveMarks = createAsyncThunk(
  'exams/saveMarks',
  async ({ examId, classId, marksData }, { rejectWithValue }) => {
    try {
      const response = await examService.saveMarks(examId, classId, marksData)
      toast.success('Marks saved successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save marks')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const getClassMarks = createAsyncThunk(
  'exams/getClassMarks',
  async ({ examId, classId }, { rejectWithValue }) => {
    try {
      const response = await examService.getClassMarks(examId, classId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const generateResults = createAsyncThunk(
  'exams/generateResults',
  async ({ examId, classId }, { rejectWithValue }) => {
    try {
      const response = await examService.generateResults(examId, classId)
      toast.success('Results generated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate results')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const getExamResults = createAsyncThunk(
  'exams/getExamResults',
  async ({ examId, classId, studentId }, { rejectWithValue }) => {
    try {
      const response = await examService.getExamResults(examId, classId, studentId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const getExamAnalytics = createAsyncThunk(
  'exams/getExamAnalytics',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await examService.getExamAnalytics(examId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const getMarksEntrySummary = createAsyncThunk(
  'exams/getMarksEntrySummary',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await examService.getMarksEntrySummary(examId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

const initialState = {
  exams: [],
  currentExam: null,
  examClasses: null,
  examSubjects: null,
  examScheduleDetails: null,
  isLoading: false,
  error: null,
  marksSummary: null,
  examAnalytics: null,
  classMarks: null,
  examResults: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

const examSlice = createSlice({
  name: 'exams',
  initialState,
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null
      state.marksSummary = null
      state.examAnalytics = null
      state.classMarks = null
      state.examResults = null
      state.examClasses = null
      state.examSubjects = null
      state.examScheduleDetails = null
    },
    clearError: (state) => {
      state.error = null
    },
    clearMarksData: (state) => {
      state.classMarks = null
      state.examResults = null
    },
    clearTabData: (state) => {
      state.examClasses = null
      state.examSubjects = null
      state.examScheduleDetails = null
    },
    setExamFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Exams
      .addCase(fetchExams.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.isLoading = false
        state.exams = action.payload.data || []
        state.pagination = action.payload.pagination || initialState.pagination
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      
      // Fetch Exam By Id
      .addCase(fetchExamById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchExamById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentExam = action.payload.data || action.payload
      })
      .addCase(fetchExamById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      
      // Fetch Exam Classes
      .addCase(fetchExamClasses.fulfilled, (state, action) => {
        state.examClasses = action.payload.data || action.payload
      })
      
      // Fetch Exam Subjects
      .addCase(fetchExamSubjects.fulfilled, (state, action) => {
        state.examSubjects = action.payload.data || action.payload
      })
      
      // Fetch Exam Schedule Details
      .addCase(fetchExamScheduleDetails.fulfilled, (state, action) => {
        state.examScheduleDetails = action.payload.data || action.payload
      })
      
      // Create Exam
      .addCase(createExam.fulfilled, (state, action) => {
        const newExam = action.payload.data || action.payload
        state.exams.unshift(newExam)
      })
      
      // Update Exam
      .addCase(updateExam.fulfilled, (state, action) => {
        const updatedExam = action.payload.data || action.payload
        const index = state.exams.findIndex(e => e._id === updatedExam._id)
        if (index !== -1) {
          state.exams[index] = updatedExam
        }
        if (state.currentExam?._id === updatedExam._id) {
          state.currentExam = updatedExam
        }
      })
      
      // Delete Exam
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.exams = state.exams.filter(e => e._id !== action.payload)
        if (state.currentExam?._id === action.payload) {
          state.currentExam = null
        }
      })
      
      // Publish Exam
      .addCase(publishExam.fulfilled, (state, action) => {
        const publishedExam = action.payload.data || action.payload
        if (state.currentExam?._id === publishedExam._id) {
          state.currentExam = publishedExam
        }
        const index = state.exams.findIndex(e => e._id === publishedExam._id)
        if (index !== -1) {
          state.exams[index] = publishedExam
        }
      })
      
      // Clone Exam
      .addCase(cloneExam.fulfilled, (state, action) => {
        const clonedExam = action.payload.data || action.payload
        state.exams.unshift(clonedExam)
      })
      
      // Get Marks Summary
      .addCase(getMarksEntrySummary.fulfilled, (state, action) => {
        state.marksSummary = action.payload.data || action.payload
      })
      
      // Get Exam Analytics
      .addCase(getExamAnalytics.fulfilled, (state, action) => {
        state.examAnalytics = action.payload.data || action.payload
      })
      
      // Get Class Marks
      .addCase(getClassMarks.fulfilled, (state, action) => {
        state.classMarks = action.payload.data || action.payload
      })
      
      // Get Exam Results
      .addCase(getExamResults.fulfilled, (state, action) => {
        state.examResults = action.payload.data || action.payload
      })
      
      // Save Marks
      .addCase(saveMarks.fulfilled, (state, action) => {
        const savedMarks = action.payload.data || action.payload
        if (state.classMarks) {
          const marksArray = Array.isArray(state.classMarks) ? state.classMarks : state.classMarks.marks
          if (marksArray) {
            const index = marksArray.findIndex(m => m.studentId === savedMarks.studentId)
            if (index !== -1) {
              marksArray[index] = savedMarks
            } else {
              marksArray.push(savedMarks)
            }
          }
        }
      })
      
      // Submit Class Marks
      .addCase(submitClassMarks.fulfilled, (state, action) => {
        const result = action.payload.data || action.payload
        if (state.currentExam) {
          const classStatus = state.currentExam.classSubmissionStatus?.find(
            cs => cs.classId === result.classId
          )
          if (classStatus) {
            classStatus.status = 'submitted'
            classStatus.submittedBy = result.submittedBy
            classStatus.submittedAt = new Date().toISOString()
          }
        }
      })
      
      // Review Class Marks
      .addCase(reviewClassMarks.fulfilled, (state, action) => {
        const result = action.payload.data || action.payload
        if (state.currentExam) {
          const classStatus = state.currentExam.classSubmissionStatus?.find(
            cs => cs.classId === result.classId
          )
          if (classStatus) {
            classStatus.status = 'reviewed'
            classStatus.reviewedBy = result.reviewedBy
            classStatus.reviewedAt = new Date().toISOString()
          }
        }
      })
      
      // Generate Results
      .addCase(generateResults.fulfilled, (state, action) => {
        const results = action.payload.data || action.payload
        state.examResults = results
      })
  },
})

export const { clearCurrentExam, clearError, clearMarksData, clearTabData, setExamFilters } = examSlice.actions
export default examSlice.reducer