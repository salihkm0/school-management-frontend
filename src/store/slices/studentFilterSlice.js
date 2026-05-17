// src/store/slices/studentFilterSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import studentFilterService from '../../services/studentFilterService';
import toast from 'react-hot-toast';

// Async Thunks
export const fetchFilterOptions = createAsyncThunk(
  'studentFilter/fetchOptions',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await studentFilterService.getFilterOptions(examId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const filterStudents = createAsyncThunk(
  'studentFilter/filter',
  async (filterData, { rejectWithValue }) => {
    try {
      const response = await studentFilterService.filterStudents(filterData);
      console.log('API Response:', response); // Debug log
      return response;
    } catch (error) {
      console.error('Filter error:', error);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const bulkFilterStudents = createAsyncThunk(
  'studentFilter/bulkFilter',
  async (filterData, { rejectWithValue }) => {
    try {
      const response = await studentFilterService.bulkFilterStudents(filterData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const exportFilteredStudents = createAsyncThunk(
  'studentFilter/export',
  async (filterData, { rejectWithValue }) => {
    try {
      const blob = await studentFilterService.exportFilteredStudents(filterData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `filtered_students_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed successfully');
      return { success: true };
    } catch (error) {
      toast.error('Failed to export data');
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getTopPerformers = createAsyncThunk(
  'studentFilter/topPerformers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await studentFilterService.getTopPerformers(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getGradeDifferenceAnalysis = createAsyncThunk(
  'studentFilter/gradeDifference',
  async (params, { rejectWithValue }) => {
    try {
      const response = await studentFilterService.getGradeDifferenceAnalysis(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getCEComponentAnalysis = createAsyncThunk(
  'studentFilter/ceComponent',
  async (params, { rejectWithValue }) => {
    try {
      const response = await studentFilterService.getCEComponentAnalysis(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  filterOptions: null,
  filteredResults: [],
  bulkFilterResults: null,
  topPerformers: null,
  gradeDifferenceAnalysis: null,
  ceComponentAnalysis: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  },
  statistics: null
};

const studentFilterSlice = createSlice({
  name: 'studentFilter',
  initialState,
  reducers: {
    clearFilterResults: (state) => {
      state.filteredResults = [];
      state.bulkFilterResults = null;
      state.statistics = null;
      state.pagination = initialState.pagination;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Filter Options
      .addCase(fetchFilterOptions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filterOptions = action.payload.data;
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
      })

      // Filter Students
      .addCase(filterStudents.pending, (state) => {
        state.isLoading = true;
        state.filteredResults = []; // Clear previous results while loading
      })
      .addCase(filterStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        // IMPORTANT: The response structure is { success, data, pagination, statistics }
        state.filteredResults = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        state.statistics = action.payload.statistics;
        console.log('State updated - filteredResults:', state.filteredResults.length); // Debug log
      })
      .addCase(filterStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.filteredResults = [];
        state.error = action.payload?.message;
        toast.error(action.payload?.message || 'Failed to filter students');
      })

      // Bulk Filter Students
      .addCase(bulkFilterStudents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(bulkFilterStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bulkFilterResults = action.payload.data;
        state.pagination = action.payload.pagination || initialState.pagination;
        state.statistics = action.payload.statistics;
      })
      .addCase(bulkFilterStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message;
        toast.error(action.payload?.message || 'Failed to apply bulk filters');
      })

      // Get Top Performers
      .addCase(getTopPerformers.fulfilled, (state, action) => {
        state.topPerformers = action.payload.data;
      })

      // Grade Difference Analysis
      .addCase(getGradeDifferenceAnalysis.fulfilled, (state, action) => {
        state.gradeDifferenceAnalysis = action.payload.data;
      })

      // CE Component Analysis
      .addCase(getCEComponentAnalysis.fulfilled, (state, action) => {
        state.ceComponentAnalysis = action.payload.data;
      });
  }
});

export const { clearFilterResults, clearError, setPagination } = studentFilterSlice.actions;
export default studentFilterSlice.reducer;