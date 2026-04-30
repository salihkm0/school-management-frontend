import api from './api'

const studentService = {
  getStudents: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/students?${queryParams}`)
    return response.data
  },
  
  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}`)
    return response.data
  },
  
  createStudent: async (studentData) => {
    const response = await api.post('/students', studentData)
    return response.data
  },
  
  updateStudent: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData)
    return response.data
  },
  
  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`)
    return response.data
  },
  
  importStudents: async (file, academicYearId, classId) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('academicYearId', academicYearId)
    if (classId) formData.append('classId', classId)
    
    const response = await api.post('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  
  importFromSamboorna: async (file, academicYearId, autoCreateClasses = true, updateExisting = true) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('academicYearId', academicYearId)
    formData.append('autoCreateClasses', autoCreateClasses)
    formData.append('updateExistingStudents', updateExisting)
    
    const response = await api.post('/students/import/samboorna', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  
  getImportBatchStatus: async (batchId) => {
    const response = await api.get(`/students/import/batch/${batchId}`)
    return response.data
  },
  
  getImportHistory: async (academicYearId, page = 1, limit = 20) => {
    const response = await api.get(`/students/import/history?academicYearId=${academicYearId}&page=${page}&limit=${limit}`)
    return response.data
  },
  
  promoteStudents: async (promotionData) => {
    const response = await api.post('/students/promote', promotionData)
    return response.data
  },
  
  getStudentsByClass: async (classId) => {
    const response = await api.get(`/students/class/${classId}`)
    return response.data
  },
  
  getStudentMarks: async (studentId) => {
    const response = await api.get(`/students/${studentId}/marks`)
    return response.data
  },
  
  // Academic Info API - Get language subjects
  getStudentAcademicInfo: async (studentId) => {
    const response = await api.get(`/students/${studentId}/academic-info`)
    return response.data
  },
  
// Attendance API - using academicYearId instead of year
getStudentAttendance: async (studentId, academicYearId = null) => {
  const queryParams = academicYearId ? `?academicYearId=${academicYearId}` : ''
  const response = await api.get(`/attendance/student/${studentId}${queryParams}`)
  return response.data
},
}

export default studentService