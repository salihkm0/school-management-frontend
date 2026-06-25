import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchClasses } from '../../store/slices/classSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const OpenStudentsList = () => {
  const { year, standard, classId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { students, isLoading, pagination } = useSelector((state) => state.students);
  const { classes } = useSelector((state) => state.classes);
  const [currentClass, setCurrentClass] = useState(null);

  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: 'active',
    classId: classId || ''
  });

  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (classId) {
      // Just fetch students for this class ID
      dispatch(fetchStudents({ ...searchParams, classId }));
    }
  }, [dispatch, classId, searchParams.page, searchParams.limit, searchParams.search]);

  useEffect(() => {
    dispatch(fetchClasses({ limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    if (classes.length > 0 && classId) {
      setCurrentClass(classes.find(c => c._id === classId));
    }
  }, [classes, classId]);

  const handlePageChange = (newPage) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
      inactive: 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20',
      discontinued: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
      transferred: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
      completed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    };
    return styles[status] || styles.active;
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      discontinued: 'Discontinued',
      transferred: 'Transferred',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  if (isLoading && students.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/open/students/${year}/${encodeURIComponent(standard)}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            title="Back to Divisions"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Students {currentClass ? `- ${currentClass.name} ${currentClass.section || ''}` : ''}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">View active student records for {year}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder="Search by name or admission number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-gray-500">
          {pagination?.total > 0 ? (
            <>Showing <span className="font-medium text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-900">{pagination.total}</span> students</>
          ) : (
            'No students found'
          )}
        </p>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Admission No
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Phone
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Status
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No students found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {student.photoUrl ? (
                          <img className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0" src={student.photoUrl} alt="" />
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs sm:text-sm font-medium text-emerald-700">
                              {student.fullName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                            {student.fullName}
                          </div>
                          <div className="text-xs text-gray-500 block sm:hidden">
                            {student.admissionNo}
                          </div>
                          <div className="text-xs text-gray-500 hidden sm:block">
                            {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 font-mono hidden sm:table-cell">
                      {student.admissionNo || '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 font-mono hidden md:table-cell">
                      {student.phoneNumber || student.contact?.primaryPhone || '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {student.className ? `${student.className} ${student.division || ''}`.trim() : 'N/A'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(student.status)}`}>
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/open/students/${year}/student/${student._id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-1.5 sm:px-2 text-xs sm:text-sm rounded-lg transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenStudentsList;
