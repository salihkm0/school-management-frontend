import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchClasses } from '../../store/slices/classSlice';
import { fetchAcademicYears } from '../../store/slices/academicYearSlice';
import { ArrowLeftIcon, UserGroupIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const OpenDivisionsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { year, standard } = useParams();
  const { classes, isLoading } = useSelector((state) => state.classes);
  const { academicYears } = useSelector((state) => state.academicYears);
  const [academicYearId, setAcademicYearId] = useState(null);

  useEffect(() => {
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  useEffect(() => {
    if (academicYears.length > 0 && year) {
      const foundYear = academicYears.find(y => y.year === year);
      if (foundYear) {
        setAcademicYearId(foundYear._id);
      }
    }
  }, [academicYears, year]);

  useEffect(() => {
    if (academicYearId) {
      dispatch(fetchClasses({ limit: 100, academicYearId }));
    }
  }, [dispatch, academicYearId]);

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

  if (isLoading && divisions.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-3">
          <Link
            to={`/open/students/${year}`}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            title="Back to Standards"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Standard {standard} Divisions</h1>
            <p className="text-gray-500 mt-2">Select a division to view its students.</p>
          </div>
        </div>
        {year && (
          <div className="mt-4 inline-flex items-center self-start px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
            Academic Year: {year}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {divisions.length > 0 ? (
          divisions.map((cls) => (
            <button
              key={cls._id}
              onClick={() => navigate(`/open/students/${year}/${encodeURIComponent(standard)}/${cls._id}`)}
              className="group relative flex flex-col items-start p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
              
              <div className="relative z-10 flex items-center justify-between w-full mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </div>
              
              <div className="relative z-10 w-full mt-2">
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300">
                  Division {cls.section || 'General'}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span>Standard {cls.name}</span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Divisions Found</p>
            <p className="text-sm text-gray-500 mt-1">There are no divisions configured for Standard {standard} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenDivisionsList;
