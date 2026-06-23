import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchExams, fetchStaffExams } from '../../../store/slices/examSlice';
import { fetchAcademicYears } from '../../../store/slices/academicYearSlice';
import { ClipboardDocumentListIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useMyAssignedClasses } from './useMyAssignedClasses';

const ExamsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { academicYears } = useSelector((state) => state.academicYears);
  const { exams, isLoading: examsLoading } = useSelector((state) => state.exams);
  
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [availableExams, setAvailableExams] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Set current academic year
  useEffect(() => {
    if (academicYears.length === 0) {
      dispatch(fetchAcademicYears({ limit: 10 }));
    } else {
      const current = academicYears.find((y) => y.isCurrent) || academicYears[0];
      setCurrentAcademicYear(current);
    }
  }, [academicYears, dispatch]);

  const { allMyClasses, isLoading: classesLoading } = useMyAssignedClasses(currentAcademicYear);

  // Fetch exams
  useEffect(() => {
    if (!user || !currentAcademicYear) return;

    if (user.role === 'admin') {
      dispatch(fetchExams({ academicYearId: currentAcademicYear._id, limit: 100 })).unwrap().catch(e => console.error(e));
    } else {
      dispatch(fetchStaffExams(currentAcademicYear._id)).unwrap().catch(e => console.error(e));
    }
  }, [currentAcademicYear, dispatch, user]);

  // Filter exams based on classes
  useEffect(() => {
    if (examsLoading || classesLoading) return;

    if (user?.role === 'admin') {
      const relevant = [...exams].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setAvailableExams(relevant);
    } else {
      const classIds = allMyClasses.map((c) => c._id);
      const relevant = exams.filter((exam) => {
        const ecIds = (exam.classIds || []).map((cid) => cid._id || cid);
        return ecIds.some((cid) => classIds.includes(cid));
      });
      relevant.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setAvailableExams(relevant);
    }
    setIsInitializing(false);
  }, [exams, allMyClasses, user, examsLoading, classesLoading]);

  if (isInitializing || examsLoading || classesLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Marks Entry</h1>
        <p className="text-gray-500 mt-2">
          {user?.role === 'admin' 
            ? "Admin – Select an exam to view and enter marks for any class"
            : "Staff – Select an exam to enter marks for your assigned classes"}
        </p>
        
        {currentAcademicYear && (
          <div className="mt-4 inline-flex items-center self-start px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
            Academic Year: {currentAcademicYear.name || currentAcademicYear.year}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {availableExams.length > 0 ? (
          availableExams.map((exam) => (
            <button
              key={exam._id}
              onClick={() => {
                // Pass allMyClasses through state so we don't have to fetch again if possible
                navigate(`${exam._id}/standards`, { state: { allMyClasses } });
              }}
              className="group relative flex flex-col items-start p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
              
              <div className="relative z-10 flex items-center justify-between w-full mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <ClipboardDocumentListIcon className="w-8 h-8" />
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </div>
              
              <div className="relative z-10 w-full mt-2">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300 mb-2">
                  {exam.displayName || exam.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span>
                      {new Date(exam.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    exam.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 
                    exam.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {exam.status}
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Exams Found</p>
            <p className="text-sm text-gray-500 mt-1">There are no exams available for your assigned classes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsList;
