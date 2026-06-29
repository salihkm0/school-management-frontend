// src/store/slices/classSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import classService from '../../services/classService'
import toast from 'react-hot-toast'

// ==================== FETCH ACTIONS ====================

export const fetchClasses = createAsyncThunk(
  'classes/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await classService.getClasses(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const fetchClassById = createAsyncThunk(
  'classes/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await classService.getClassById(id)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

// ==================== TEACHER CLASSES ACTIONS ====================

// Fetch classes where teacher is class teacher ONLY
export const fetchTeacherClassTeacherClasses = createAsyncThunk(
  'classes/fetchTeacherClassTeacherClasses',
  async ({ teacherId, academicYearId }, { rejectWithValue }) => {
    try {
      const response = await classService.getTeacherClassTeacherClasses(teacherId, academicYearId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

// Fetch all classes where teacher is involved (both class teacher and subject teacher)
export const fetchTeacherClasses = createAsyncThunk(
  'classes/fetchTeacherClasses',
  async ({ teacherId, academicYearId }, { rejectWithValue }) => {
    try {
      const response = await classService.getTeacherClasses(teacherId, academicYearId)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

// ==================== CRUD ACTIONS ====================

export const createClass = createAsyncThunk(
  'classes/create',
  async (classData, { rejectWithValue }) => {
    try {
      const response = await classService.createClass(classData)
      toast.success('Class created successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create class')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const updateClass = createAsyncThunk(
  'classes/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await classService.updateClass(id, data)
      toast.success('Class updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update class')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const deleteClass = createAsyncThunk(
  'classes/delete',
  async ({ id, transferToClassId }, { rejectWithValue }) => {
    try {
      await classService.deleteClass(id, transferToClassId)
      toast.success('Class deleted successfully')
      return id
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete class')
      return rejectWithValue(error.response?.data)
    }
  }
)

// ==================== TEACHER ASSIGNMENT ACTIONS ====================

export const assignClassTeacher = createAsyncThunk(
  'classes/assignTeacher',
  async ({ classId, staffId, academicYearId, subjectId, periodsPerWeek, remove = false }, { rejectWithValue }) => {
    try {
      console.log('assignClassTeacher called with:', { classId, staffId, academicYearId, subjectId, periodsPerWeek, remove })
      
      if (!classId || classId === 'undefined') {
        throw new Error('Class ID is required and cannot be undefined')
      }
      
      let response
      
      if (remove || !staffId || staffId === 'null' || staffId === null) {
        console.log('Removing teacher from class:', classId)
        response = await classService.removeClassTeacher(classId)
        toast.success('Class teacher removed successfully')
      } else {
        if (!staffId) {
          throw new Error('Staff ID is required for assignment')
        }
        console.log('Assigning teacher to class:', { classId, staffId, academicYearId, subjectId, periodsPerWeek })
        response = await classService.assignClassTeacher(classId, staffId, academicYearId, subjectId, periodsPerWeek)
        toast.success('Class teacher assigned successfully')
      }
      
      return response
    } catch (error) {
      console.error('assignClassTeacher error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to update class teacher')
      return rejectWithValue(error.response?.data || { message: error.message })
    }
  }
)

export const assignSubjectTeacher = createAsyncThunk(
  'classes/assignSubjectTeacher',
  async ({ id, subjectId, teacherId, periodsPerWeek }, { rejectWithValue }) => {
    try {
      const response = await classService.assignSubjectTeacher(id, subjectId, teacherId, periodsPerWeek)
      toast.success(response.message || 'Subject teacher assigned successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign subject teacher')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const bulkAssignSubjectTeachers = createAsyncThunk(
  'classes/bulkAssignSubjectTeachers',
  async ({ id, assignments }, { rejectWithValue }) => {
    try {
      const response = await classService.bulkAssignSubjectTeachers(id, assignments)
      toast.success(response.message || `${response.results?.success?.length || 0} teachers assigned successfully`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign teachers')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const removeSubjectTeacher = createAsyncThunk(
  'classes/removeSubjectTeacher',
  async ({ id, subjectId }, { rejectWithValue }) => {
    try {
      const response = await classService.removeSubjectTeacher(id, subjectId)
      toast.success('Subject teacher removed successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove subject teacher')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const getClassSubjectTeachers = createAsyncThunk(
  'classes/getSubjectTeachers',
  async (id, { rejectWithValue }) => {
    try {
      const response = await classService.getClassSubjectTeachers(id)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

// ==================== SUBJECT MANAGEMENT ACTIONS ====================

export const addSubjects = createAsyncThunk(
  'classes/addSubjects',
  async ({ id, subjectIds }, { rejectWithValue }) => {
    try {
      const response = await classService.addSubjects(id, subjectIds)
      toast.success(`${subjectIds.length} subject(s) added successfully`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subjects')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const removeSubject = createAsyncThunk(
  'classes/removeSubject',
  async ({ id, subjectId }, { rejectWithValue }) => {
    try {
      const response = await classService.removeSubject(id, subjectId)
      toast.success('Subject removed successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove subject')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const syncClassSubjects = createAsyncThunk(
  'classes/syncSubjects',
  async (id, { rejectWithValue }) => {
    try {
      const response = await classService.syncClassSubjects(id)
      toast.success(response.message || 'Subjects synced successfully from template')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync subjects')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const syncAllTemplates = createAsyncThunk(
  'classes/syncAllTemplates',
  async (academicYearId, { rejectWithValue, dispatch }) => {
    try {
      const response = await classService.syncAllSubjectTemplates(academicYearId)
      toast.success(response.message || `Successfully synced templates`)
      // Refresh classes list after bulk sync
      dispatch(fetchClasses({ academicYearId }))
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync templates')
      return rejectWithValue(error.response?.data)
    }
  }
)

// ==================== LANGUAGE SUBJECT ACTIONS ====================

export const syncLanguageSubjects = createAsyncThunk(
  'classes/syncLanguageSubjects',
  async (id, { rejectWithValue }) => {
    try {
      const response = await classService.syncLanguageSubjects(id)
      toast.success(response.message || 'Language subjects synced successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync language subjects')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const syncAllClassesLanguageSubjects = createAsyncThunk(
  'classes/syncAllLanguageSubjects',
  async (academicYearId, { rejectWithValue }) => {
    try {
      const response = await classService.syncAllClassesLanguageSubjects(academicYearId)
      toast.success(response.message || `Synced language subjects for ${response.data?.length || 0} classes`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync language subjects')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const getClassLanguageSubjects = createAsyncThunk(
  'classes/getLanguageSubjects',
  async (id, { rejectWithValue }) => {
    try {
      const response = await classService.getClassLanguageSubjects(id)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

// ==================== SUBJECT TEMPLATE ACTIONS ====================

export const fetchSubjectTemplates = createAsyncThunk(
  'classes/fetchSubjectTemplates',
  async (params, { rejectWithValue }) => {
    try {
      const response = await classService.getSubjectTemplates(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const getSubjectTemplateByClassName = createAsyncThunk(
  'classes/getSubjectTemplateByClassName',
  async (className, { rejectWithValue }) => {
    try {
      const response = await classService.getSubjectTemplateByClassName(className)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data)
    }
  }
)

export const applySubjectTemplateToClasses = createAsyncThunk(
  'classes/applySubjectTemplate',
  async ({ id, academicYearId }, { rejectWithValue }) => {
    try {
      const response = await classService.applySubjectTemplateToClasses(id, academicYearId)
      toast.success(response.message || `Applied template to ${response.results?.updated?.length || 0} classes`)
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply template')
      return rejectWithValue(error.response?.data)
    }
  }
)

// ==================== TIMETABLE ACTIONS ====================

export const updateTimetable = createAsyncThunk(
  'classes/updateTimetable',
  async ({ id, timetable }, { rejectWithValue }) => {
    try {
      const response = await classService.updateTimetable(id, timetable)
      toast.success('Timetable updated successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update timetable')
      return rejectWithValue(error.response?.data)
    }
  }
)

export const applyTemplateToClass = createAsyncThunk(
  'classes/applyTemplate',
  async ({ id, templateId }, { rejectWithValue }) => {
    try {
      const response = await classService.applyTemplateToClass(id, templateId)
      toast.success(response.message || 'Template applied successfully')
      return response
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply template')
      return rejectWithValue(error.response?.data)
    }
  }
)

// ==================== INITIAL STATE ====================

const initialState = {
  classes: [],
  currentClass: null,
  teacherClassTeacherClasses: [], // Classes where teacher is class teacher ONLY
  teacherClasses: [], // All classes where teacher is involved
  subjectTeachers: null,
  languageSubjects: null,
  subjectTemplates: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
}

// ==================== SLICE ====================

const classSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    clearCurrentClass: (state) => {
      state.currentClass = null
      state.subjectTeachers = null
      state.languageSubjects = null
    },
    clearError: (state) => {
      state.error = null
    },
    clearSubjectTeachers: (state) => {
      state.subjectTeachers = null
    },
    clearTeacherClasses: (state) => {
      state.teacherClassTeacherClasses = []
      state.teacherClasses = []
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== FETCH CLASSES ====================
      .addCase(fetchClasses.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.isLoading = false
        state.classes = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      
      // ==================== FETCH CLASS BY ID ====================
      .addCase(fetchClassById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchClassById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentClass = action.payload
      })
      .addCase(fetchClassById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
      })
      
      // ==================== FETCH TEACHER CLASS TEACHER CLASSES ====================
      .addCase(fetchTeacherClassTeacherClasses.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchTeacherClassTeacherClasses.fulfilled, (state, action) => {
        state.isLoading = false
        state.teacherClassTeacherClasses = action.payload.data || []
      })
      .addCase(fetchTeacherClassTeacherClasses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
        state.teacherClassTeacherClasses = []
      })
      
      // ==================== FETCH TEACHER CLASSES (ALL) ====================
      .addCase(fetchTeacherClasses.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchTeacherClasses.fulfilled, (state, action) => {
        state.isLoading = false
        state.teacherClasses = action.payload.data || []
      })
      .addCase(fetchTeacherClasses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload?.message
        state.teacherClasses = []
      })
      
      // ==================== CREATE CLASS ====================
      .addCase(createClass.fulfilled, (state, action) => {
        state.classes.unshift(action.payload)
      })
      
      // ==================== UPDATE CLASS ====================
      .addCase(updateClass.fulfilled, (state, action) => {
        const index = state.classes.findIndex(c => c._id === action.payload._id)
        if (index !== -1) {
          state.classes[index] = action.payload
        }
        if (state.currentClass?._id === action.payload._id) {
          state.currentClass = action.payload
        }
      })
      
      // ==================== DELETE CLASS ====================
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.classes = state.classes.filter(c => c._id !== action.payload)
        if (state.currentClass?._id === action.payload) {
          state.currentClass = null
        }
      })
      
      // ==================== ASSIGN CLASS TEACHER ====================
      .addCase(assignClassTeacher.fulfilled, (state, action) => {
        if (action.payload?.data) {
          const updatedClass = action.payload.data
          if (state.currentClass && state.currentClass._id === updatedClass._id) {
            state.currentClass = {
              ...state.currentClass,
              classTeacherId: updatedClass.classTeacherId,
              classTeacherName: updatedClass.classTeacherName,
              subjectTeachers: updatedClass.subjectTeachers || state.currentClass.subjectTeachers
            }
          }
          const index = state.classes.findIndex(c => c._id === updatedClass._id)
          if (index !== -1) {
            state.classes[index] = {
              ...state.classes[index],
              classTeacherId: updatedClass.classTeacherId,
              classTeacherName: updatedClass.classTeacherName,
              subjectTeachers: updatedClass.subjectTeachers || state.classes[index].subjectTeachers
            }
          }
        }
      })
      
      // ==================== SUBJECT TEACHER ASSIGNMENT ====================
      .addCase(assignSubjectTeacher.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload.class?._id) {
          state.currentClass.subjectTeachers = action.payload.subjectTeachers
        }
      })
      
      .addCase(bulkAssignSubjectTeachers.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload.class?._id) {
          state.currentClass.subjectTeachers = action.payload.subjectTeachers
        }
      })
      
      .addCase(removeSubjectTeacher.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload.class?._id) {
          state.currentClass.subjectTeachers = action.payload.subjectTeachers
        }
      })
      
      .addCase(getClassSubjectTeachers.fulfilled, (state, action) => {
        state.subjectTeachers = action.payload
      })
      
      // ==================== SUBJECT MANAGEMENT ====================
      .addCase(addSubjects.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload._id) {
          state.currentClass = action.payload
        }
        const index = state.classes.findIndex(c => c._id === action.payload._id)
        if (index !== -1) {
          state.classes[index] = action.payload
        }
      })
      
      .addCase(removeSubject.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload._id) {
          state.currentClass = action.payload
        }
      })
      
      .addCase(syncClassSubjects.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload.class?._id) {
          state.currentClass.subjects = action.payload.class?.subjects
        }
        const index = state.classes.findIndex(c => c._id === action.payload.class?._id)
        if (index !== -1) {
          state.classes[index].subjects = action.payload.class?.subjects
        }
      })
      
      // ==================== LANGUAGE SUBJECTS ====================
      .addCase(syncLanguageSubjects.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload.data?.classId) {
          // Refresh class data
        }
        toast.success(action.payload.message || 'Language subjects synced')
      })
      
      .addCase(syncAllClassesLanguageSubjects.fulfilled, (state, action) => {
        toast.success(action.payload.message || 'All classes language subjects synced')
      })
      
      .addCase(getClassLanguageSubjects.fulfilled, (state, action) => {
        state.languageSubjects = action.payload.data
      })
      
      // ==================== SUBJECT TEMPLATES ====================
      .addCase(fetchSubjectTemplates.fulfilled, (state, action) => {
        state.subjectTemplates = action.payload.data
      })
      
      // ==================== TIMETABLE ====================
      .addCase(updateTimetable.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload._id) {
          state.currentClass.timetable = action.payload.timetable
        }
      })
      
      .addCase(applyTemplateToClass.fulfilled, (state, action) => {
        if (state.currentClass && state.currentClass._id === action.payload.class?._id) {
          state.currentClass.subjects = action.payload.class?.subjects
        }
        toast.success(action.payload.message || 'Template applied successfully')
      })
  },
})

export const { clearCurrentClass, clearError, clearSubjectTeachers, clearTeacherClasses } = classSlice.actions
export default classSlice.reducer