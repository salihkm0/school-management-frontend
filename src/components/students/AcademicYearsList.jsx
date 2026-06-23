import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAcademicYears } from '../../store/slices/academicYearSlice';
import { CalendarIcon, ChevronRightIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const AcademicYearsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { academicYears, isLoading } = useSelector((state) => state.academicYears);

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }));
  }, [dispatch]);

  const sortedYears = useMemo(() => {
    return [...academicYears].sort((a, b) => {
      // Sort in descending order (newest first)
      return b.year.localeCompare(a.year);
    });
  }, [academicYears]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Academic Years</h1>
          <p className="text-gray-500 mt-2">Select an academic year to view its classes and students.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/students/import"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
          >
            <DocumentArrowUpIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Import Students</span>
            <span className="sm:hidden">Import</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedYears.length > 0 ? (
          sortedYears.map((year) => (
            <button
              key={year._id}
              onClick={() => navigate(`/students/years/${year._id}`)}
              className={`group relative flex flex-col items-start p-6 bg-white border ${year.isCurrent ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-gray-200'} rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden`}
            >
              {/* Decorative background element */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
              
              <div className="relative z-10 flex items-center justify-between w-full mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <CalendarIcon className="w-8 h-8" />
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </div>
              
              <div className="relative z-10 w-full mt-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300">
                    {year.name || year.year}
                  </h3>
                  {year.isCurrent && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Current
                    </span>
                  )}
                </div>
                {year.name && year.name !== year.year && (
                  <p className="mt-2 text-sm text-gray-500">{year.year}</p>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
            <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Academic Years Found</p>
            <p className="text-sm text-gray-500 mt-1">There are no academic years configured in the system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicYearsList;
