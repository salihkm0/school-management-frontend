import api from './api'

export const getTeacherPermissions = async (examId, classId) => {
  const response = await api.get(`/marks/permissions/${examId}/${classId}`)
  return response.data
}

// Get all marksheets for a class (NEW STRUCTURE)
export const getMarksheetsByClass = async (examId, classId) => {
  const response = await api.get(`/marks/class/${examId}/${classId}`)
  return response.data
}

// Get or create individual marksheet
export const getOrCreateMarksheet = async (examId, classId, studentId) => {
  const response = await api.get(`/marks/student/${examId}/${classId}/${studentId}`)
  return response.data
}

// Update single student marks
export const updateStudentMarks = async (examId, classId, studentId, data) => {
  const response = await api.put(`/marks/student/${examId}/${classId}/${studentId}`, data)
  return response.data
}

// Bulk update marks for all students - FIXED ENDPOINT
export const bulkUpdateMarks = async (examId, classId, studentsData) => {
  // The correct endpoint from your routes: POST /marks/bulk/:examId/:classId
  const response = await api.post(`/marks/bulk/${examId}/${classId}`, { studentsData })
  return response.data
}

// Submit for review
export const submitMarksForReview = async (examId, classId) => {
  const response = await api.post('/marks/submit', { examId, classId })
  return response.data
}

// Review marks - FIXED to accept comments
export const reviewMarks = async (examId, classId, reviewData = {}) => {
  const response = await api.post('/marks/review', { examId, classId, ...reviewData })
  return response.data
}

// Get student marksheet (for viewing)
export const getStudentMarksheet = async (examId, studentId) => {
  const response = await api.get(`/marks/result/${examId}/${studentId}`)
  return response.data
}

// Get class rankings
export const getClassRankings = async (examId, classId) => {
  const response = await api.get(`/marks/rankings/${examId}/${classId}`)
  return response.data
}

// Publish results
export const publishResults = async (examId, classId) => {
  const response = await api.post('/marks/publish', { examId, classId })
  return response.data
}

// Keep these for backward compatibility if needed
export const getMarks = async (examId, classId, subjectId) => {
  const response = await api.get(`/marks?examId=${examId}&classId=${classId}&subjectId=${subjectId}`)
  return response.data
}

export const enterMarks = async (examId, classId, subjectId, marks) => {
  const response = await api.post('/marks/enter', { examId, classId, subjectId, marks })
  return response.data
}

export const enterMarksBulk = async (examId, classId, marksData) => {
  // This endpoint doesn't exist - use bulkUpdateMarks instead
  console.warn('enterMarksBulk is deprecated, use bulkUpdateMarks instead')
  return bulkUpdateMarks(examId, classId, marksData)
}

export default {
  getTeacherPermissions,
  getMarksheetsByClass,
  getOrCreateMarksheet,
  updateStudentMarks,
  bulkUpdateMarks,
  submitMarksForReview,
  reviewMarks,
  getStudentMarksheet,
  getClassRankings,
  publishResults,
  getMarks,
  enterMarks,
  enterMarksBulk
}