// src/services/studentFilterService.js
import api from './api';

const studentFilterService = {
  // Get filter options for an exam
  getFilterOptions: async (examId) => {
    const response = await api.get(`/student-filters/options/${examId}`);
    return response.data;
  },

  // Main filter endpoint
  filterStudents: async (filterData) => {
    const response = await api.post('/student-filters/filter', filterData);
    return response.data;
  },

  // Bulk filter with multiple criteria
  bulkFilterStudents: async (filterData) => {
    const response = await api.post('/student-filters/bulk', filterData);
    return response.data;
  },

  // Export filtered students to CSV
  exportFilteredStudents: async (filterData) => {
    const response = await api.post('/student-filters/export', filterData, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get top performers
  getTopPerformers: async (params) => {
    const response = await api.get('/student-filters/top-performers', { params });
    return response.data;
  },

  // Get students by subject grade
  getStudentsBySubjectGrade: async (params) => {
    const response = await api.get('/student-filters/by-subject-grade', { params });
    return response.data;
  },

  // Get students by mixed grades
  getStudentsByMixedGrades: async (data) => {
    const response = await api.post('/student-filters/by-mixed-grades', data);
    return response.data;
  },

  // Get students by rank range
  getStudentsByRank: async (params) => {
    const response = await api.get('/student-filters/by-rank', { params });
    return response.data;
  },

  // Get students by percentage range
  getStudentsByPercentage: async (params) => {
    const response = await api.get('/student-filters/by-percentage', { params });
    return response.data;
  },

  // Grade difference analysis
  getGradeDifferenceAnalysis: async (params) => {
    const response = await api.get('/student-filters/grade-difference-analysis', { params });
    return response.data;
  },

  // CE component analysis
  getCEComponentAnalysis: async (params) => {
    const response = await api.get('/student-filters/ce-component-analysis', { params });
    return response.data;
  }
};

export default studentFilterService;