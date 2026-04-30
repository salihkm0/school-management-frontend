import api from './api'

export const getSubjects = async (params = {}) => {
  const queryParams = new URLSearchParams(params)
  const response = await api.get(`/subjects?${queryParams}`)
  return response.data
}

export const getSubjectById = async (id) => {
  const response = await api.get(`/subjects/${id}`)
  return response.data
}

export const createSubject = async (data) => {
  const response = await api.post('/subjects', data)
  return response.data
}

export const updateSubject = async (id, data) => {
  const response = await api.put(`/subjects/${id}`, data)
  return response.data
}

export const deleteSubject = async (id) => {
  const response = await api.delete(`/subjects/${id}`)
  return response.data
}

export const bulkImportSubjects = async (subjects) => {
  const response = await api.post('/subjects/bulk-import', { subjects })
  return response.data
}

export const getSubjectsByClass = async (classId) => {
  const response = await api.get(`/subjects/class/${classId}`)
  return response.data
}

export const getSubjectsByTeacher = async (staffId) => {
  const response = await api.get(`/subjects/teacher/${staffId}`)
  return response.data
}

export const getSubjectStats = async () => {
  const response = await api.get('/subjects/stats')
  return response.data
}

export const getLanguageSubjects = async () => {
  const response = await api.get('/subjects/languages')
  return response.data
}

export const getSubjectsByTemplate = async (className) => {
  const response = await api.get(`/subjects/template/${className}`)
  return response.data
}

export const assignSubjectToClasses = async (subjectId, classIds) => {
  const response = await api.post(`/subjects/${subjectId}/assign-to-classes`, { classIds })
  return response.data
}

export const getTemplates = async (params = {}) => {
  const queryParams = new URLSearchParams(params)
  const response = await api.get(`/subject-templates?${queryParams}`)
  return response.data
}

export const getTemplateById = async (id) => {
  const response = await api.get(`/subject-templates/${id}`)
  return response.data
}

export const getTemplateByClassName = async (className) => {
  const response = await api.get(`/subject-templates/class/${className}`)
  return response.data
}

export const createTemplate = async (data) => {
  const response = await api.post('/subject-templates', data)
  return response.data
}

export const updateTemplate = async (id, data) => {
  const response = await api.put(`/subject-templates/${id}`, data)
  return response.data
}

export const upsertTemplateByClassName = async (className, data) => {
  const response = await api.put(`/subject-templates/class/${className}`, data)
  return response.data
}

export const deleteTemplate = async (id) => {
  const response = await api.delete(`/subject-templates/${id}`)
  return response.data
}

export const applyTemplateToClasses = async (id, academicYearId) => {
  const response = await api.post(`/subject-templates/${id}/apply`, { academicYearId })
  return response.data
}

export const getClassNames = async () => {
  const response = await api.get('/subject-templates/class-names')
  return response.data
}

export default {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  bulkImportSubjects,
  getSubjectsByClass,
  getSubjectsByTeacher,
  getSubjectStats,
  getLanguageSubjects,
  getSubjectsByTemplate,
  assignSubjectToClasses,
  getTemplates,
  getTemplateById,
  getTemplateByClassName,
  createTemplate,
  updateTemplate,
  upsertTemplateByClassName,
  deleteTemplate,
  applyTemplateToClasses,
  getClassNames
}