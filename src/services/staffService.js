import api from './api'

const staffService = {
  getStaff: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/staff?${queryParams}`)
    return response.data
  },

  getStaffById: async (id) => {
    const response = await api.get(`/staff/${id}`)
    return response.data
  },

  createStaff: async (staffData) => {
    const response = await api.post('/staff', staffData)
    return response.data
  },

  updateStaff: async (id, staffData) => {
    const response = await api.put(`/staff/${id}`, staffData)
    return response.data
  },

  deleteStaff: async (id) => {
    const response = await api.delete(`/staff/${id}`)
    return response.data
  },

  forceDeleteStaff: async (id) => {
    const response = await api.delete(`/staff/${id}?force=true`)
    return response.data
  },

  // Add this function - fetch available roles
  fetchRoles: async () => {
    // You can either fetch from API or return static list
    // If your backend has an endpoint for roles, use that
    try {
      const response = await api.get('/staff/roles')
      return response.data
    } catch (error) {
      // Fallback to static roles if endpoint doesn't exist
      return { 
        data: ['teacher', 'principal', 'vice_principal', 'librarian', 'administrator', 'office_staff', 'support_staff'] 
      }
    }
  },

  getOrCreateStaffAssignment: async (staffId, academicYearId) => {
    const response = await api.get(`/staff/${staffId}/assignment/${academicYearId}`)
    return response.data
  },

  assignClassTeacher: async (staffId, academicYearId, classId) => {
    const response = await api.post(`/staff/${staffId}/assignment/${academicYearId}/class-teacher`, { classId })
    return response.data
  },

  assignSubjects: async (staffId, academicYearId, subjects) => {
    const response = await api.post(`/staff/${staffId}/assignment/${academicYearId}/subjects`, { subjects })
    return response.data
  },

  removeSubject: async (staffId, academicYearId, subjectId, classId) => {
    const response = await api.delete(`/staff/${staffId}/assignment/${academicYearId}/subjects/${subjectId}/class/${classId}`)
    return response.data
  },

  getStaffTimetable: async (staffId, academicYearId) => {
    const response = await api.get(`/staff/${staffId}/timetable`, {
      params: { academicYearId }
    })
    return response.data
  },

  updateStaffTimetable: async (staffId, academicYearId, timetable) => {
    const response = await api.put(`/staff/${staffId}/assignment/${academicYearId}/timetable`, { timetable })
    return response.data
  },

  getStaffAssignmentsByYear: async (academicYearId, params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/staff/assignment/year/${academicYearId}?${queryParams}`)
    return response.data
  },

  getStaffAssignmentHistory: async (staffId) => {
    const response = await api.get(`/staff/${staffId}/assignment-history`)
    return response.data
  },

  promoteStaffToNextYear: async (staffId, fromAcademicYearId, toAcademicYearId, copySubjects = true) => {
    const response = await api.post(`/staff/${staffId}/promote`, {
      fromAcademicYearId,
      toAcademicYearId,
      copySubjects
    })
    return response.data
  },

  getStaffDashboardStats: async () => {
    const response = await api.get('/staff/dashboard-stats')
    return response.data
  },
}

// Add named export for fetchRoles
export const fetchRoles = staffService.fetchRoles

export default staffService