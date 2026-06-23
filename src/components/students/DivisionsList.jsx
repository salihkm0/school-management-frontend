import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchClasses } from '../../store/slices/classSlice';
import { ArrowLeftIcon, UserIcon, ChevronRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const DivisionsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { standard, academicYearId } = useParams();
  const { classes, isLoading } = useSelector((state) => state.classes);
  const { academicYears } = useSelector((state) => state.academicYears);

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100, academicYearId }));
  }, [dispatch, academicYearId]);

  const currentYear = useMemo(() => {
    return academicYears.find(y => y._id === academicYearId);
  }, [academicYears, academicYearId]);

  // Filter classes by standard and extract their sections (divisions)
  const divisions = useMemo(() => {
    const standardClasses = classes.filter(c => c.name === standard);
    // Return the actual class objects to use their _id
    return standardClasses.sort((a, b) => {
      const sectionA = a.section || '';
      const sectionB = b.section || '';
      return sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [classes, standard]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/students/years/${academicYearId}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            title="Back to Standards"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Standard {standard}</h1>
            <p className="text-gray-500 mt-1">Select a division to view its students.</p>
          </div>
        </div>
        {currentYear && (
          <div className="mt-4 inline-flex items-center self-start px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
            Academic Year: {currentYear.name || currentYear.year}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {divisions.length > 0 ? (
          divisions.map((cls) => (
            <button
              key={cls._id}
              onClick={() => navigate(`/students/classes/${cls._id}`)}
              className="group relative flex flex-col items-start p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
              
              <div className="relative z-10 flex items-center justify-between w-full mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300">
                  <ChevronRightIcon className="w-4 h-4" />
                </div>
              </div>
              
              <div className="relative z-10 w-full mt-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                  Division {cls.section || 'General'}
                </h3>
                
                {(cls.classTeacherId?.name || cls.classTeacherName) ? (
                  <div className="flex items-center gap-1.5 mt-3 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                    <span className="truncate" title={cls.classTeacherId?.name || cls.classTeacherName}>CT: {cls.classTeacherId?.name || cls.classTeacherName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-3 text-xs sm:text-sm text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>No Class Teacher</span>
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Divisions Found</p>
            <p className="text-sm text-gray-500 mt-1">There are no divisions configured for this standard.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DivisionsList;
