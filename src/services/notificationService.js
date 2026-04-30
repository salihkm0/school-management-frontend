import api from './api'

const notificationService = {
  getUserNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
    const params = new URLSearchParams({ page, limit })
    if (unreadOnly) params.append('unreadOnly', 'true')
    const response = await api.get(`/notifications?${params}`)
    return response.data
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read')
    return response.data
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`)
    return response.data
  },

  sendToUser: async (userId, title, message, type = 'info', data = {}) => {
    const response = await api.post(`/notifications/user/${userId}`, {
      title,
      message,
      type,
      data
    })
    return response.data
  },

  sendToClass: async (classId, title, message, type = 'info', data = {}) => {
    const response = await api.post(`/notifications/class/${classId}`, {
      title,
      message,
      type,
      data
    })
    return response.data
  },

  sendToRole: async (role, title, message, type = 'info', data = {}) => {
    const response = await api.post(`/notifications/role/${role}`, {
      title,
      message,
      type,
      data
    })
    return response.data
  },

  sendBulk: async (userIds, title, message, type = 'info', data = {}) => {
    const response = await api.post('/notifications/bulk', {
      userIds,
      title,
      message,
      type,
      data
    })
    return response.data
  },

  sendExamNotification: async (examId, examName, classIds, message, type = 'info') => {
    const response = await api.post('/notifications/exam', {
      examId,
      examName,
      classIds,
      message,
      type
    })
    return response.data
  },

  sendMarksNotification: async (studentId, studentName, examId, examName, subjectName, marksObtained, maxMarks) => {
    const response = await api.post('/notifications/marks', {
      studentId,
      studentName,
      examId,
      examName,
      subjectName,
      marksObtained,
      maxMarks
    })
    return response.data
  },

  sendAttendanceNotification: async (studentId, studentName, month, year, attendancePercentage, classId) => {
    const response = await api.post('/notifications/attendance', {
      studentId,
      studentName,
      month,
      year,
      attendancePercentage,
      classId
    })
    return response.data
  },

  sendDutyNotification: async (staffId, staffName, className, dutyDate, dutyType, dutyId) => {
    const response = await api.post('/notifications/duty', {
      staffId,
      staffName,
      className,
      dutyDate,
      dutyType,
      dutyId
    })
    return response.data
  },
}

export default notificationService