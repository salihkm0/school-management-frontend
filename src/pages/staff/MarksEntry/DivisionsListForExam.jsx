import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { UserGroupIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { fetchAcademicYears } from '../../../store/slices/academicYearSlice';
import { useMyAssignedClasses } from './useMyAssignedClasses';

const DivisionsListForExam = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { examId, standard } = useParams();
  
  const { academicYears } = useSelector((state) => state.academicYears);
  const { exams } = useSelector((state) => state.exams);
  const { user } = useSelector((state) => state.auth);
  
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);

  useEffect(() => {
    if (academicYears.length === 0) {
      dispatch(fetchAcademicYears({ limit: 10 }));
    } else {
      const current = academicYears.find((y) => y.isCurrent) || academicYears[0];
      setCurrentAcademicYear(current);
    }
  }, [academicYears, dispatch]);

  const { allMyClasses, isLoading: classesLoading } = useMyAssignedClasses(currentAcademicYear);
  const exam = exams.find((e) => e._id === examId);

  // Filter divisions for this standard and exam
  const divisions = useMemo(() => {
    if (!exam || !exam.classIds) return [];
    const examClassIds = exam.classIds.map((cid) => cid._id || cid);
    return allMyClasses
      .filter((cls) => examClassIds.includes(cls._id) && cls.name === standard)
      .sort((a, b) => (a.section || "").localeCompare(b.section || ""));
  }, [exam, allMyClasses, standard]);

  if (classesLoading) return <LoadingSpinner />;
  
  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
        <p className="text-lg font-medium text-gray-900">Exam not found</p>
        <button onClick={() => navigate(user?.role === 'admin' ? '/admin/marks-entry' : '/staff/marks-entry')} className="mt-4 text-emerald-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const getClassDisplayName = (cls) => {
    if (!cls) return "";
    return `${cls.name} ${cls.section || ""}`;
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(user?.role === 'admin' ? `/admin/marks-entry/${examId}/standards` : `/staff/marks-entry/${examId}/standards`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            title="Back to Standards"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Standard {standard} Divisions
            </h1>
            <p className="text-gray-500 mt-2">Exam: <span className="font-semibold text-gray-700">{exam.displayName || exam.name}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {divisions.length > 0 ? (
          divisions.map((cls) => {
            const isCT = user?.role === 'admin' ? false : cls.classTeacher?.userId === user?.id || cls.classTeacher?._id === user?.id; // Rough check, exact check in table is better
            const badge = user?.role === 'admin' ? "" : (isCT ? "Class Teacher" : "Subject Teacher");
            
            const basePath = user?.role === 'admin' ? '/admin/marks-entry' : '/staff/marks-entry';
            
            return (
              <button
                key={cls._id}
                onClick={() => navigate(`${basePath}/${examId}/classes/${cls._id}`)}
                className="group relative flex flex-col items-start p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                
                <div className="relative z-10 flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                      {cls.section || "-"}
                    </div>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                    <ChevronRightIcon className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="relative z-10 w-full mt-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300">
                    {getClassDisplayName(cls)}
                  </h3>
                  {badge && (
                    <div className="inline-flex mt-3 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {badge}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Divisions Found</p>
            <p className="text-sm text-gray-500 mt-1">There are no divisions configured or assigned for this standard.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DivisionsListForExam;
