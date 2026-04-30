// src/services/pdfService.js
import api from './api';

const pdfService = {
  // Abstract of Admission Register
  getAbstractPDF: async (studentId = null, params = {}) => {
    const { date, station } = params;
    let url = `/pdf/abstract/view`;
    if (studentId) url += `/${studentId}`;
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (station) queryParams.append('station', station);
    const response = await api.get(url, {
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  },

  downloadAbstractPDF: async (studentId = null, params = {}) => {
    const { date, station } = params;
    let url = `/pdf/abstract/download`;
    if (studentId) url += `/${studentId}`;
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (station) queryParams.append('station', station);
    const response = await api.get(url, {
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  },

  // Balance Rice Distribution
  getBalanceRiceDistributionPDF: async (classId, month = null, year = null) => {
    let url = `/pdf/balance-rice-distribution/view/${classId}`;
    if (month && year) url += `/${month}/${year}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadBalanceRiceDistributionPDF: async (classId, month = null, year = null) => {
    let url = `/pdf/balance-rice-distribution/download/${classId}`;
    if (month && year) url += `/${month}/${year}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getBalanceRiceDistributionList: async (classId) => {
    const response = await api.get(`/pdf/balance-rice-distribution/list/${classId}`);
    return response.data;
  },

  // Bank Account Details
  getBankAccountDetailsPDF: async (classId = null, category = 'ALL') => {
    let url = `/pdf/bank-account-details/view`;
    if (classId) url += `/${classId}`;
    const response = await api.get(url, {
      params: { category },
      responseType: 'blob'
    });
    return response.data;
  },

  downloadBankAccountDetailsPDF: async (classId = null, category = 'ALL') => {
    let url = `/pdf/bank-account-details/download`;
    if (classId) url += `/${classId}`;
    const response = await api.get(url, {
      params: { category },
      responseType: 'blob'
    });
    return response.data;
  },

  // Bhakshya Badratha (Food Security)
  getBhakshyaBadrathaPDF: async (classId, academicYearId = null) => {
    let url = `/pdf/bhakshya-badratha/view/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadBhakshyaBadrathaPDF: async (classId, academicYearId = null) => {
    let url = `/pdf/bhakshya-badratha/download/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getBhakshyaBadrathaList: async (classId) => {
    const response = await api.get(`/pdf/bhakshya-badratha/list/${classId}`);
    return response.data;
  },

  // Certificate
  getCertificatePDF: async (studentId = null, params = {}) => {
    const { date, place } = params;
    let url = `/pdf/certificate/view`;
    if (studentId) url += `/${studentId}`;
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (place) queryParams.append('place', place);
    const response = await api.get(url, {
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  },

  downloadCertificatePDF: async (studentId = null, params = {}) => {
    const { date, place } = params;
    let url = `/pdf/certificate/download`;
    if (studentId) url += `/${studentId}`;
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (place) queryParams.append('place', place);
    const response = await api.get(url, {
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  },

  // Class PTA
  getClassPTAPDF: async (classId = null, academicYearId = null) => {
    let url = `/pdf/class-pta/view`;
    if (classId) url += `/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadClassPTAPDF: async (classId = null, academicYearId = null) => {
    let url = `/pdf/class-pta/download`;
    if (classId) url += `/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  // Class Teacher List
  getClassTeacherListPDF: async (academicYearId = null) => {
    let url = `/pdf/class-teacher-list/view`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadClassTeacherListPDF: async (academicYearId = null) => {
    let url = `/pdf/class-teacher-list/download`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getClassTeacherListData: async (academicYearId = null) => {
    let url = `/pdf/class-teacher-list/data`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Fee Collection
  getFeeCollectionPDF: async (classId = null, academicYearId = null) => {
    let url = `/pdf/fee-collection/view`;
    if (classId) url += `/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadFeeCollectionPDF: async (classId = null, academicYearId = null) => {
    let url = `/pdf/fee-collection/download`;
    if (classId) url += `/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getFeeCollectionList: async (classId = null, academicYearId = null) => {
    let url = `/pdf/fee-collection/list`;
    if (classId) url += `/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url);
    return response.data;
  },

  // ID Card
  getIDCardListPDF: async (classId, academicYearId = null) => {
    let url = `/pdf/id-card/pdf/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getIDCardListByClass: async (classId, academicYearId = null) => {
    let url = `/pdf/id-card/list/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url);
    return response.data;
  },

  getIDCardClasses: async () => {
    const response = await api.get('/pdf/id-card/classes');
    return response.data;
  },

  // Marklist
  getMarklistPDF: async (studentId, examId = null) => {
    let url = `/pdf/marklist/view/${studentId}`;
    if (examId) url += `/${examId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadMarklistPDF: async (studentId, examId = null) => {
    let url = `/pdf/marklist/download/${studentId}`;
    if (examId) url += `/${examId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  // Mid Day Meal
  getMidDayMealPDF: async (classId, academicYearId = null) => {
    let url = `/pdf/mid-day-meal/pdf/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getMidDayMealList: async (classId, academicYearId = null) => {
    let url = `/pdf/mid-day-meal/list/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Noon Feeding Register
  getNoonFeedingRegisterPDF: async (classId, month = null, year = null) => {
    let url = `/pdf/noon-feeding-register/pdf/${classId}`;
    if (month && year) url += `/${month}/${year}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  // Noon Meal
  getNoonMealPDF: async (classId, month = null, year = null, workingDays = null) => {
    let url = `/pdf/noon-meal/pdf/${classId}`;
    if (month && year) url += `/${month}/${year}`;
    if (workingDays) url += `/${workingDays}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getNoonMealList: async (classId) => {
    const response = await api.get(`/pdf/noon-meal/list/${classId}`);
    return response.data;
  },

  getNoonMealClasses: async () => {
    const response = await api.get('/pdf/noon-meal/classes');
    return response.data;
  },

  // Promotion List
  getPromotionListPDF: async (classId = null, examId = null) => {
    let url = `/pdf/promotion-list/view`;
    if (classId) url += `/${classId}`;
    if (examId) url += `/${examId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadPromotionListPDF: async (classId = null, examId = null) => {
    let url = `/pdf/promotion-list/download`;
    if (classId) url += `/${classId}`;
    if (examId) url += `/${examId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  // Rice Distribution
  getRiceDistributionPDF: async (classId, academicYearId, distributionType = null) => {
    let url = `/pdf/rice-distribution/pdf/${classId}/${academicYearId}`;
    if (distributionType) url += `/${distributionType}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getRiceDistributionList: async (classId, academicYearId = null) => {
    let url = `/pdf/rice-distribution/list/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url);
    return response.data;
  },

  getRiceDistributionClasses: async () => {
    const response = await api.get('/pdf/rice-distribution/classes');
    return response.data;
  },

  // Special Rice Distribution
  getSpecialRiceDistributionPDF: async (classId, month = null, year = null) => {
    let url = `/pdf/special-rice-distribution/view/${classId}`;
    if (month && year) url += `/${month}/${year}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadSpecialRiceDistributionPDF: async (classId, month = null, year = null) => {
    let url = `/pdf/special-rice-distribution/download/${classId}`;
    if (month && year) url += `/${month}/${year}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getSpecialRiceDistributionList: async (classId) => {
    const response = await api.get(`/pdf/special-rice-distribution/list/${classId}`);
    return response.data;
  },

  // Staff List
  getStaffListPDF: async (status = null) => {
    let url = `/pdf/staff-list/view`;
    if (status) url += `/${status}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadStaffListPDF: async (status = null) => {
    let url = `/pdf/staff-list/download`;
    if (status) url += `/${status}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getStaffListData: async (status = null) => {
    let url = `/pdf/staff-list/data`;
    if (status) url += `/${status}`;
    const response = await api.get(url);
    return response.data;
  },

  // Statistical Data
  getStatisticalDataPDF: async (classId, academicYearId = null) => {
    let url = `/pdf/statistical-data/pdf/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getStatisticalData: async (classId, academicYearId = null) => {
    let url = `/pdf/statistical-data/list/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Student List
  getStudentListPDF: async (classId, academicYearId = null) => {
    let url = `/pdf/student-list/pdf/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  getStudentList: async (classId, academicYearId = null) => {
    let url = `/pdf/student-list/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Text Book Distribution
  getTextBookDistributionPDF: async (classId = null, academicYearId = null) => {
    let url = `/pdf/text-book-distribution/view`;
    if (classId) url += `/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  downloadTextBookDistributionPDF: async (classId = null, academicYearId = null) => {
    let url = `/pdf/text-book-distribution/download`;
    if (classId) url += `/${classId}`;
    if (academicYearId) url += `/${academicYearId}`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  
};

// Helper function to open PDF in new tab
export const openPDF = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>${filename || 'PDF Report'}</title>
          <style>
            body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${url}" frameborder="0"></iframe>
        </body>
      </html>
    `);
  } else {
    // Fallback: create a link and click it
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

// Helper function to download PDF
export const downloadPDF = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'report.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};



export default pdfService;