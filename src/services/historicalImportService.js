// src/services/historicalImportService.js
import api from './api';

const BASE = '/historical-imports';

export const historicalImportService = {
  /** Upload XLS file with subject config + academic year */
  upload: (formData, onProgress) =>
    api.post(`${BASE}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),

  /** Poll processing status */
  getStatus: (id) => api.get(`${BASE}/${id}/status`),

  /** List all import batches */
  getAll: () => api.get(BASE),

  /** Get batch detail + grade/division groups */
  getById: (id) => api.get(`${BASE}/${id}`),

  /** Query students within a batch */
  getStudents: (id, params) => api.get(`${BASE}/${id}/students`, { params }),

  /** Delete a batch */
  deleteImport: (id) => api.delete(`${BASE}/${id}`),

  /**
   * Download class/division PDF marklist (filtered).
   * Uses axios blob response — base URL is already set on the `api` instance.
   */
  downloadPdf: async (id, filters = {}) => {
    const params = {};
    if (filters.grade) params.grade = filters.grade;
    if (filters.division) params.division = filters.division;
    if (filters.sheetName) params.sheetName = filters.sheetName;

    const response = await api.get(`${BASE}/${id}/pdf`, {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const divLabel = filters.division ? `_Div${filters.division}` : filters.grade ? `_Grade${filters.grade}` : '_All';
    link.download = `historical_marklist_${id}${divLabel}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  /**
   * Download individual student mark sheet PDF (school format).
   */
  downloadStudentPdf: async (studentId, studentName, admNo) => {
    const response = await api.get(`${BASE}/student/${studentId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeName = (studentName || 'student').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    link.download = `MarkSheet_${safeName}_${admNo || studentId}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};
