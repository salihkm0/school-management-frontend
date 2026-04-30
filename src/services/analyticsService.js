// src/services/analyticsService.js
import api from './api'

export const fetchDashboardStats = async () => {
  try {
    const response = await api.get('/analytics/dashboard')
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    throw error
  }
}

export const fetchRecentActivities = async (limit = 10) => {
  try {
    const response = await api.get(`/analytics/recent-activities?limit=${limit}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch recent activities:', error)
    // Return empty array as fallback
    return []
  }
}

export const fetchPerformanceAnalytics = async (examId = null, classId = null, academicYearId = null) => {
  try {
    const params = new URLSearchParams()
    if (examId) params.append('examId', examId)
    if (classId) params.append('classId', classId)
    if (academicYearId) params.append('academicYearId', academicYearId)
    const response = await api.get(`/analytics/performance?${params}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch performance analytics:', error)
    throw error
  }
}

export const fetchAttendanceAnalytics = async (classId = null, startDate = null, endDate = null, academicYearId = null) => {
  try {
    const params = new URLSearchParams()
    if (classId) params.append('classId', classId)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (academicYearId) params.append('academicYearId', academicYearId)
    const response = await api.get(`/analytics/attendance?${params}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch attendance analytics:', error)
    throw error
  }
}

export const fetchGradeAnalysis = async (examId = null, classId = null, academicYearId = null) => {
  try {
    const params = new URLSearchParams()
    if (examId) params.append('examId', examId)
    if (classId) params.append('classId', classId)
    if (academicYearId) params.append('academicYearId', academicYearId)
    const response = await api.get(`/analytics/grade-analysis?${params}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch grade analysis:', error)
    throw error
  }
}

export const fetchFullAPlusStudents = async (examId = null, classId = null, academicYearId = null) => {
  try {
    const params = new URLSearchParams()
    if (examId) params.append('examId', examId)
    if (classId) params.append('classId', classId)
    if (academicYearId) params.append('academicYearId', academicYearId)
    const response = await api.get(`/analytics/full-aplus?${params}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch full A+ students:', error)
    throw error
  }
}

export const fetchNearFullAPlusStudents = async (examId = null, classId = null, missingSubject = null, academicYearId = null) => {
  try {
    const params = new URLSearchParams()
    if (examId) params.append('examId', examId)
    if (classId) params.append('classId', classId)
    if (missingSubject) params.append('missingSubject', missingSubject)
    if (academicYearId) params.append('academicYearId', academicYearId)
    const response = await api.get(`/analytics/near-full-aplus?${params}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch near full A+ students:', error)
    throw error
  }
}

export const fetchTopPerformingClasses = async (examId = null, limit = 10, academicYearId = null) => {
  try {
    const params = new URLSearchParams()
    if (examId) params.append('examId', examId)
    if (academicYearId) params.append('academicYearId', academicYearId)
    params.append('limit', limit)
    const response = await api.get(`/analytics/top-classes?${params}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch top performing classes:', error)
    throw error
  }
}

export const fetchStudentProgressTrend = async (studentId, academicYearId = null) => {
  try {
    const params = new URLSearchParams()
    if (academicYearId) params.append('academicYearId', academicYearId)
    const response = await api.get(`/analytics/student-progress/${studentId}?${params}`)
    return response.data.data
  } catch (error) {
    console.error('Failed to fetch student progress trend:', error)
    throw error
  }
}

export const generateReportCardPDF = async (studentId, academicYearId = null) => {
  try {
    let url = `/analytics/report-card/${studentId}`
    if (academicYearId) url += `/${academicYearId}`
    const response = await api.get(url, {
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    console.error('Failed to generate report card PDF:', error)
    throw error
  }
}

export const generateClassReportCardsPDF = async (classId, academicYearId) => {
  try {
    const response = await api.get(`/analytics/class-report-cards/${classId}/${academicYearId}`, {
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    console.error('Failed to generate class report cards PDF:', error)
    throw error
  }
}

export const subscribeToDashboardUpdates = async () => {
  try {
    const response = await api.post('/analytics/dashboard/subscribe')
    return response.data
  } catch (error) {
    console.error('Failed to subscribe to dashboard updates:', error)
    throw error
  }
}

export default {
  fetchDashboardStats,
  fetchRecentActivities,
  fetchPerformanceAnalytics,
  fetchAttendanceAnalytics,
  fetchGradeAnalysis,
  fetchFullAPlusStudents,
  fetchNearFullAPlusStudents,
  fetchTopPerformingClasses,
  fetchStudentProgressTrend,
  generateReportCardPDF,
  generateClassReportCardsPDF,
  subscribeToDashboardUpdates,
}