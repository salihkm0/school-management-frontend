// src/services/parentService.js
import api from './api'

const parentService = {
  getParents: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/parents?${queryParams}`)
    return response.data
  },

  getParentById: async (id) => {
    const response = await api.get(`/parents/${id}`)
    return response.data
  },

  getMyChildren: async () => {
    const response = await api.get('/parents/my-children')
    return response.data
  },

  getMyParentProfile: async () => {
    const response = await api.get('/parents/me')
    return response.data
  },

  registerParent: async (parentData) => {
    const response = await api.post('/parents/register', parentData)
    return response.data
  },

  updateParent: async (id, parentData) => {
    const response = await api.put(`/parents/${id}`, parentData)
    return response.data
  },

  connectStudent: async (parentId, studentCode, dateOfBirth, relation) => {
    const response = await api.post(`/parents/connect-student/${parentId}`, {
      studentCode,
      dateOfBirth,
      relation
    })
    return response.data
  },

  removeStudentConnection: async (parentId, studentCode) => {
    const response = await api.delete(`/parents/student/${studentCode}`, {
      data: { parentId },
      params: { parentId }
    })
    return response.data
  },

  updateStudentRelation: async (parentId, studentCode, relation) => {
    const response = await api.put(`/parents/${parentId}/student/${studentCode}/relation`, {
      studentCode,
      relation
    })
    return response.data
  },

  getParentStudents: async (parentId, academicYearId) => {
    const response = await api.get(`/parents/${parentId}/students`, {
      params: { academicYearId }
    })
    return response.data
  },
}

export default parentService