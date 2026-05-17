// src/components/exams/StudentFilter.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  PlusIcon, 
  TrashIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { fetchExams } from '../../store/slices/examSlice';
import { fetchClasses } from '../../store/slices/classSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FILTER_TYPES = [
  { value: 'percentage_range', label: 'Percentage Range' },
  { value: 'rank_range', label: 'Rank Range' },
  { value: 'all_subjects_grade', label: 'All Subjects Grade' },
  { value: 'any_subject_grade', label: 'Any Subject Grade' },
];

const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

const StudentFilter = () => {
  const dispatch = useDispatch();
  const { exams } = useSelector((state) => state.exams);
  const { classes } = useSelector((state) => state.classes);
  
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [filterType, setFilterType] = useState('percentage_range');
  const [conditions, setConditions] = useState({ minPercentage: 75, maxPercentage: 100 });
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    dispatch(fetchExams({ limit: 100 }));
    dispatch(fetchClasses({ limit: 100 }));
  }, [dispatch]);

  const handleFilter = async () => {
    if (!selectedExam) {
      toast.error('Please select an exam');
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    
    try {
      const filterData = {
        examId: selectedExam,
        classId: selectedClass || undefined,
        filterType,
        conditions,
        page: 1,
        limit: 100,
        sortBy: 'percentage',
        sortOrder: 'desc'
      };

      console.log('Sending request:', filterData);
      
      const response = await api.post('/student-filters/filter', filterData);
      console.log('Response:', response.data);
      
      if (response.data.success) {
        setResults(response.data.data || []);
        setStatistics(response.data.statistics);
        setPagination(response.data.pagination);
        setShowResults(true);
        
        if (response.data.data && response.data.data.length > 0) {
          toast.success(`Found ${response.data.data.length} students`);
        } else {
          toast.info('No students match the filter criteria');
        }
      }
    } catch (error) {
      console.error('Filter error:', error);
      toast.error('Failed to filter students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedExam) return;

    try {
      const exportData = {
        examId: selectedExam,
        classId: selectedClass || undefined,
        filterType,
        conditions,
        includeCE: 'true'
      };
      
      const response = await api.post('/student-filters/export', exportData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `filtered_students_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const renderFilterConditions = () => {
    switch (filterType) {
      case 'percentage_range':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Percentage</label>
              <input
                type="number"
                value={conditions.minPercentage || ''}
                onChange={(e) => setConditions({ ...conditions, minPercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Percentage</label>
              <input
                type="number"
                value={conditions.maxPercentage || ''}
                onChange={(e) => setConditions({ ...conditions, maxPercentage: parseFloat(e.target.value) || 100 })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
                placeholder="100"
              />
            </div>
          </div>
        );

      case 'rank_range':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Rank</label>
              <input
                type="number"
                value={conditions.minRank || ''}
                onChange={(e) => setConditions({ ...conditions, minRank: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Rank</label>
              <input
                type="number"
                value={conditions.maxRank || ''}
                onChange={(e) => setConditions({ ...conditions, maxRank: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
                placeholder="10"
              />
            </div>
          </div>
        );

      case 'all_subjects_grade':
      case 'any_subject_grade':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
            <select
              value={conditions.grade || 'A+'}
              onChange={(e) => setConditions({ ...conditions, grade: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
            >
              {GRADE_OPTIONS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const getGradeBadge = (grade) => {
    if (!grade || grade === 'null' || grade === 'N/A') {
      return 'bg-gray-100 text-gray-500';
    }
    const colors = {
      'A+': 'bg-emerald-100 text-emerald-700',
      'A': 'bg-green-100 text-green-700',
      'B+': 'bg-blue-100 text-blue-700',
      'B': 'bg-cyan-100 text-cyan-700',
      'C+': 'bg-yellow-100 text-yellow-700',
      'C': 'bg-orange-100 text-orange-700',
      'D': 'bg-red-100 text-red-700',
      'F': 'bg-gray-100 text-gray-600'
    };
    return colors[grade] || 'bg-gray-100 text-gray-600';
  };

  const getStudentInfo = (result) => {
    if (result.studentId && typeof result.studentId === 'object') {
      return {
        name: result.studentName || result.studentId?.fullName || 'Unknown',
        rollNumber: result.rollNumber || result.studentId?.rollNumber || '-',
        admissionNo: result.admissionNo || result.studentId?.admissionNumber || result.studentId?.admissionNo || '-',
        studentCode: result.studentCode || result.studentId?.studentCode || '-'
      };
    }
    return {
      name: result.studentName || 'Unknown',
      rollNumber: result.rollNumber || '-',
      admissionNo: result.admissionNo || '-',
      studentCode: result.studentCode || '-'
    };
  };

  return (
    <div className="space-y-5 max-w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Student Filter</h1>
          <p className="text-sm text-gray-500 mt-0.5">Advanced filtering for exam results</p>
        </div>
        <div className="flex gap-2">
          {showResults && results.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Selection Section */}
      <div className="bg-white rounded-md border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Exam *</label>
            <select
              value={selectedExam}
              onChange={(e) => {
                setSelectedExam(e.target.value);
                setShowResults(false);
                setResults([]);
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
            >
              <option value="">Select Exam</option>
              {exams.map(exam => (
                <option key={exam._id} value={exam._id}>{exam.displayName || exam.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setShowResults(false);
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.displayName || cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter Type</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setConditions({});
                setShowResults(false);
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
            >
              {FILTER_TYPES.map(ft => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Conditions */}
      <div className="bg-white rounded-md border border-gray-200 p-4">
        {renderFilterConditions()}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleFilter}
            disabled={isLoading}
            className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? 'Filtering...' : 'Apply Filter'}
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      {showResults && statistics && statistics.totalStudents > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Students</p>
              <p className="text-lg font-bold text-gray-900">{statistics.totalStudents}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Average %</p>
              <p className="text-lg font-bold text-emerald-600">{statistics.averagePercentage}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Highest %</p>
              <p className="text-lg font-bold text-green-600">{statistics.highestPercentage}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pass %</p>
              <p className="text-lg font-bold text-blue-600">{statistics.passPercentage}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {showResults && (
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Results ({results.length} students)
            </h3>
          </div>
          
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">No students match the filter criteria</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filter settings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total Marks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Percentage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Theory Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">CE Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((result, index) => {
                    const studentInfo = getStudentInfo(result);
                    return (
                      <tr key={result._id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{result.rank}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{studentInfo.name}</p>
                          <p className="text-xs text-gray-500">{studentInfo.admissionNo}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{studentInfo.studentCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{result.totalMarks} / {result.totalMaxMarks}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{result.percentage?.toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getGradeBadge(result.grade)}`}>
                            {result.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getGradeBadge(result.theoryGrade)}`}>
                            {result.theoryGrade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getGradeBadge(result.ceGrade)}`}>
                            {result.ceGrade || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentFilter;