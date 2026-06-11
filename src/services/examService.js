import api from "./api";

const examService = {
  getExams: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/exams?${queryParams}`);
    return response.data;
  },

  getExamById: async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  createExam: async (examData) => {
    const response = await api.post("/exams", examData);
    return response.data;
  },

  updateExam: async (id, examData) => {
    const response = await api.put(`/exams/${id}`, examData);
    return response.data;
  },

  deleteExam: async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },

  // Get exams for staff (class teacher)
  getStaffExams: async (academicYearId) => {
    const response = await api.get("/exams/staff/exams", {
      params: { academicYearId },
    });
    return response.data;
  },

  // Create exam as staff
  createStaffExam: async (examData) => {
    const response = await api.post("/exams/staff/exams", examData);
    return response.data;
  },

  publishExam: async (id) => {
    const response = await api.post(`/exams/${id}/publish`);
    return response.data;
  },

  cloneExam: async (id, newAcademicYearId) => {
    const response = await api.post(`/exams/${id}/clone`, {
      newAcademicYearId,
    });
    return response.data;
  },

  getExamTypes: async () => {
    const response = await api.get("/exams/types");
    return response.data;
  },

  getSessionTimes: async () => {
    const response = await api.get("/exams/session-times");
    return response.data;
  },

  getExamSchedule: async (classId, academicYearId) => {
    const response = await api.get(`/exams/schedule/${classId}`, {
      params: { academicYearId },
    });
    return response.data;
  },

  getUpcomingExams: async () => {
    const response = await api.get("/exams/upcoming");
    return response.data;
  },

  getMarksEntrySummary: async (examId) => {
    try {
      const response = await api.get(`/exams/${examId}/marks-summary`);
      return response.data;
    } catch (error) {
      console.error("Error fetching marks summary:", error);
      // Return null instead of throwing - we'll handle gracefully
      return { success: false, data: null };
    }
  },

  getExamAnalytics: async (examId) => {
    const response = await api.get(`/exams/${examId}/analytics`);
    return response.data;
  },

  // Tab-specific API calls
  getExamClasses: async (examId) => {
    const response = await api.get(`/exams/${examId}/classes`);
    return response.data;
  },

  getExamSubjects: async (examId) => {
    const response = await api.get(`/exams/${examId}/subjects`);
    return response.data;
  },

  getExamScheduleDetails: async (examId) => {
    const response = await api.get(`/exams/${examId}/schedule-details`);
    return response.data;
  },

  // Marks management - FIXED ENDPOINT
  getClassMarks: async (examId, classId) => {
    // This endpoint exists in your markRoutes
    const response = await api.get(`/marks/class/${examId}/${classId}`);
    return response.data;
  },

  submitClassMarks: async (examId, classId, marksData) => {
    const response = await api.post(
      `/exams/${examId}/classes/${classId}/submit`,
      marksData,
    );
    return response.data;
  },

  reviewClassMarks: async (examId, classId, reviewData) => {
    const response = await api.post(
      `/exams/${examId}/classes/${classId}/review`,
      reviewData,
    );
    return response.data;
  },

  saveMarks: async (examId, classId, marksData) => {
    const response = await api.post(
      `/exams/${examId}/classes/${classId}/marks`,
      marksData,
    );
    return response.data;
  },

  generateResults: async (examId, classId) => {
    const response = await api.post(
      `/exams/${examId}/classes/${classId}/generate-results`,
    );
    return response.data;
  },

  getExamResults: async (examId, classId, studentId = null) => {
    const params = studentId ? { studentId } : {};
    const response = await api.get(
      `/exams/${examId}/classes/${classId}/results`,
      { params },
    );
    return response.data;
  },
};

export default examService;
