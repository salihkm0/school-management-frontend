import api from './api';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const jobService = {
  getJobStatus: (jobId) => api.get(`/jobs/${jobId}`),
  
  downloadJobResult: async (jobId, filename) => {
    const response = await api.get(`/jobs/${jobId}/download`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `download_${jobId}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  pollJob: async (jobId, onProgress) => {
    let maxRetries = 150; // 5 minutes max at 2s interval
    while (maxRetries > 0) {
      const { data: job } = await jobService.getJobStatus(jobId);
      
      if (onProgress && job.progress !== undefined) {
        onProgress(job.progress, job.state);
      }

      if (job.state === 'completed') {
        return job;
      }
      
      if (job.state === 'failed') {
        throw new Error(job.error || 'Job processing failed');
      }

      await sleep(2000);
      maxRetries--;
    }
    
    throw new Error('Job timed out');
  }
};
