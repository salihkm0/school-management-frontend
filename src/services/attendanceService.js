import api from './api'

const attendanceService = {
  // ==================== ATTENDANCE METHODS ====================
  
  getAttendance: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params)
      const response = await api.get(`/attendance?${queryParams}`)
      return response.data
    } catch (error) {
      console.error('Error fetching attendance:', error)
      throw error
    }
  },

  getAttendanceByStudent: async (studentId, year) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}`, {
        params: { year }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching student attendance:', error)
      throw error
    }
  },

  getAttendanceByClass: async (classId, year, month) => {
    try {
      const response = await api.get(`/attendance/class/${classId}`, {
        params: { year, month }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching class attendance:', error)
      throw error
    }
  },

  getAttendanceSummary: async (classId, year, month) => {
    try {
      const response = await api.get('/attendance/summary', {
        params: { classId, year, month }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching attendance summary:', error)
      throw error
    }
  },

  createAttendance: async (attendanceData) => {
    try {
      const response = await api.post('/attendance', attendanceData)
      return response.data
    } catch (error) {
      console.error('Error creating attendance:', error)
      throw error
    }
  },

  bulkCreateAttendance: async (attendanceList) => {
    try {
      const validList = attendanceList.filter(item => {
        if (!item.studentId) {
          console.warn('Missing studentId for attendance record')
          return false
        }
        if (!item.studentName) {
          console.warn('Missing studentName for attendance record', item.studentId)
          return false
        }
        if (!item.classId) {
          console.warn('Missing classId for attendance record')
          return false
        }
        return true
      })
      
      if (validList.length === 0) {
        throw new Error('No valid attendance records to save')
      }
      
      const response = await api.post('/attendance/bulk', { attendanceList: validList })
      return response.data
    } catch (error) {
      console.error('Error in bulk create attendance:', error)
      throw error
    }
  },

  updateAttendance: async (id, attendanceData) => {
    try {
      const response = await api.put(`/attendance/${id}`, attendanceData)
      return response.data
    } catch (error) {
      console.error('Error updating attendance:', error)
      throw error
    }
  },

  deleteAttendance: async (id) => {
    try {
      const response = await api.delete(`/attendance/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting attendance:', error)
      throw error
    }
  },

  // ==================== TEMPLATE METHODS ====================

  createAttendanceTemplate: async (data) => {
    try {
      const response = await api.post('/attendance/templates', data)
      return response.data
    } catch (error) {
      console.error('Error creating attendance template:', error)
      throw error
    }
  },

  getAttendanceTemplates: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params)
      const response = await api.get(`/attendance/templates?${queryParams}`)
      return response.data
    } catch (error) {
      console.error('Error fetching attendance templates:', error)
      throw error
    }
  },

  getAttendanceTemplateById: async (id) => {
    try {
      const response = await api.get(`/attendance/templates/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching attendance template:', error)
      throw error
    }
  },

  updateAttendanceTemplate: async (id, data) => {
    try {
      const response = await api.put(`/attendance/templates/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating attendance template:', error)
      throw error
    }
  },

  deleteAttendanceTemplate: async (id) => {
    try {
      const response = await api.delete(`/attendance/templates/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting attendance template:', error)
      throw error
    }
  },

  applyTemplateToMonth: async (data) => {
    try {
      const response = await api.post('/attendance/templates/apply', data)
      return response.data
    } catch (error) {
      console.error('Error applying template to month:', error)
      throw error
    }
  },

  getTemplateByClassAndMonth: async (classId, year, month) => {
    try {
      const response = await api.get(`/attendance/templates/class/${classId}/${year}/${month}`)
      return response.data
    } catch (error) {
      console.error('Error fetching template by class and month:', error)
      throw error
    }
  },

  // ==================== UTILITY METHODS ====================

  getMonthlyAttendanceStats: async (classId, year) => {
    try {
      const monthlyStats = {}
      for (let month = 1; month <= 12; month++) {
        const response = await api.get(`/attendance/class/${classId}`, {
          params: { year, month }
        })
        monthlyStats[month] = response.data
      }
      return monthlyStats
    } catch (error) {
      console.error('Error fetching monthly stats:', error)
      throw error
    }
  },

  getStudentAttendanceHistory: async (studentId, academicYearId) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}/history`, {
        params: { academicYearId }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching student attendance history:', error)
      throw error
    }
  },

  exportAttendanceReport: async (classId, year, month, format = 'excel') => {
    try {
      const response = await api.get(`/attendance/export/${classId}/${year}/${month}`, {
        params: { format },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error exporting attendance report:', error)
      throw error
    }
  },

  sendAttendanceReminders: async (classId, year, month, threshold = 75) => {
    try {
      const response = await api.post('/attendance/send-reminders', {
        classId, year, month, threshold
      })
      return response.data
    } catch (error) {
      console.error('Error sending attendance reminders:', error)
      throw error
    }
  }
}

export default attendanceService