// src/services/historicalImportService.js
import api from './api';
import { jobService } from './jobService';

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
  downloadPdf: async (id, filters = {}, onProgress) => {
    const params = {};
    if (filters.grade) params.grade = filters.grade;
    if (filters.division) params.division = filters.division;
    if (filters.sheetName) params.sheetName = filters.sheetName;

    // Get jobId from backend instead of blob
    const { data } = await api.get(`${BASE}/${id}/pdf`, { params });
    
    if (data.jobId) {
      await jobService.pollJob(data.jobId, onProgress);
      const divLabel = filters.division ? `_Div${filters.division}` : filters.grade ? `_Grade${filters.grade}` : '_All';
      await jobService.downloadJobResult(data.jobId, `historical_marklist_${id}${divLabel}.pdf`);
    }
  },

  /**
   * Download individual student mark sheet PDF (school format).
   */
  downloadStudentPdf: async (studentId, studentName, admNo, onProgress) => {
    const { data } = await api.get(`${BASE}/student/${studentId}/pdf`);
    
    if (data.jobId) {
      await jobService.pollJob(data.jobId, onProgress);
      const safeName = (studentName || 'student').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      await jobService.downloadJobResult(data.jobId, `MarkSheet_${safeName}_${admNo || studentId}.pdf`);
    }
  },
};
