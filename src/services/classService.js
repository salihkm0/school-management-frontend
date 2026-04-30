// src/services/classService.js
import api from './api'

const classService = {
  getClasses: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/classes?${queryParams}`)
    return response.data
  },

  getClassById: async (id) => {
    const response = await api.get(`/classes/${id}`)
    return response.data
  },

  createClass: async (classData) => {
    const response = await api.post('/classes', classData)
    return response.data
  },

  updateClass: async (id, classData) => {
    const response = await api.put(`/classes/${id}`, classData)
    return response.data
  },

  deleteClass: async (id, transferToClassId) => {
    const response = await api.delete(`/classes/${id}`, {
      data: { transferToClassId }
    })
    return response.data
  },

  assignClassTeacher: async (classId, teacherId, academicYearId) => {
    console.log('assignClassTeacher service call:', { classId, teacherId, academicYearId })
    
    if (!classId || classId === 'undefined') {
      throw new Error('Invalid class ID')
    }
    
    const response = await api.post(`/classes/${classId}/assign-teacher`, { 
      teacherId, 
      academicYearId 
    })
    return response.data
  },

  removeClassTeacher: async (classId) => {
    console.log('removeClassTeacher service call:', { classId })
    
    if (!classId || classId === 'undefined') {
      throw new Error('Invalid class ID')
    }
    
    const response = await api.post(`/classes/${classId}/assign-teacher`, { teacherId: null })
    return response.data
  },

  // Get classes where teacher is class teacher ONLY
  getTeacherClassTeacherClasses: async (teacherId, academicYearId) => {
    const params = academicYearId ? { academicYearId } : {};
    const response = await api.get(`/classes/teacher/${teacherId}/class-teacher-classes`, { params });
    return response.data;
  },

  // Get all classes where teacher is involved (both class teacher and subject teacher)
  getTeacherClasses: async (teacherId, academicYearId) => {
    const params = academicYearId ? { academicYearId } : {};
    const response = await api.get(`/classes/teacher/${teacherId}/classes`, { params });
    return response.data;
  },

  assignSubjectTeacher: async (id, subjectId, teacherId, periodsPerWeek = 1) => {
    const response = await api.post(`/classes/${id}/subject-teachers`, {
      subjectId,
      teacherId,
      periodsPerWeek
    })
    return response.data
  },

  bulkAssignSubjectTeachers: async (id, assignments) => {
    const response = await api.post(`/classes/${id}/subject-teachers/bulk`, { assignments })
    return response.data
  },

  removeSubjectTeacher: async (id, subjectId) => {
    const response = await api.delete(`/classes/${id}/subject-teachers/${subjectId}`)
    return response.data
  },

  getClassSubjectTeachers: async (id) => {
    const response = await api.get(`/classes/${id}/subject-teachers`)
    return response.data
  },

  getAllClassesSubjectTeachers: async (academicYearId) => {
    const response = await api.get(`/classes/subject-teachers/${academicYearId}`)
    return response.data
  },

  addSubjects: async (id, subjectIds) => {
    const response = await api.post(`/classes/${id}/subjects`, { subjectIds })
    return response.data
  },

  removeSubject: async (id, subjectId) => {
    const response = await api.delete(`/classes/${id}/subjects/${subjectId}`)
    return response.data
  },

  updateTimetable: async (id, timetable) => {
    const response = await api.put(`/classes/${id}/timetable`, { timetable })
    return response.data
  },

  applyTemplateToClass: async (id, templateId) => {
    const response = await api.post(`/classes/${id}/apply-template`, { templateId })
    return response.data
  },

  syncClassSubjects: async (id) => {
    const response = await api.post(`/classes/${id}/sync-subjects`)
    return response.data
  },

  syncLanguageSubjects: async (id) => {
    const response = await api.post(`/classes/${id}/sync-language-subjects`)
    return response.data
  },

  syncAllClassesLanguageSubjects: async (academicYearId) => {
    const response = await api.post(`/classes/sync-all-language-subjects/${academicYearId}`)
    return response.data
  },

  getClassLanguageSubjects: async (id) => {
    const response = await api.get(`/classes/${id}/language-subjects`)
    return response.data
  },

  // Subject Template methods
  getSubjectTemplates: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/subject-templates?${queryParams}`)
    return response.data
  },

  getSubjectTemplateById: async (id) => {
    const response = await api.get(`/subject-templates/${id}`)
    return response.data
  },

  getSubjectTemplateByClassName: async (className) => {
    const response = await api.get(`/subject-templates/class/${className}`)
    return response.data
  },

  getTemplateClassNames: async () => {
    const response = await api.get('/subject-templates/class-names')
    return response.data
  },

  createSubjectTemplate: async (data) => {
    const response = await api.post('/subject-templates', data)
    return response.data
  },

  updateSubjectTemplate: async (id, data) => {
    const response = await api.put(`/subject-templates/${id}`, data)
    return response.data
  },

  upsertSubjectTemplateByClassName: async (className, data) => {
    const response = await api.put(`/subject-templates/class/${className}`, data)
    return response.data
  },

  deleteSubjectTemplate: async (id) => {
    const response = await api.delete(`/subject-templates/${id}`)
    return response.data
  },

  applySubjectTemplateToClasses: async (id, academicYearId) => {
    const response = await api.post(`/subject-templates/${id}/apply`, { academicYearId })
    return response.data
  },
}

export default classService