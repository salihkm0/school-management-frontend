// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { 
//   ArrowLeftIcon, 
//   CheckCircleIcon, 
//   XCircleIcon,
//   EyeIcon,
//   AcademicCapIcon,
//   UserGroupIcon,
//   ChartBarIcon,
//   ClipboardDocumentCheckIcon,
//   ChevronDownIcon,
//   ChevronUpIcon,
//   DocumentTextIcon,
//   ExclamationTriangleIcon
// } from '@heroicons/react/24/outline';
// import { fetchExamById, clearCurrentExam } from '../../store/slices/examSlice';
// import { getMarksheetsByClass, reviewMarks } from '../../services/markService';
// import LoadingSpinner from '../common/LoadingSpinner';
// import toast from 'react-hot-toast';

// const ExamReview = () => {
//   const { examId } = useParams();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { currentExam, isLoading } = useSelector((state) => state.exams);
  
//   const [selectedClass, setSelectedClass] = useState(null);
//   const [classMarks, setClassMarks] = useState(null);
//   const [loadingMarks, setLoadingMarks] = useState(false);
//   const [reviewComments, setReviewComments] = useState('');
//   const [expandedStudents, setExpandedStudents] = useState({});
//   const [classesData, setClassesData] = useState([]);
//   const [reviewing, setReviewing] = useState(false);

//   useEffect(() => {
//     dispatch(fetchExamById(examId));
//     return () => {
//       dispatch(clearCurrentExam());
//     };
//   }, [dispatch, examId]);

//   useEffect(() => {
//     if (currentExam?.classSubmissionStatus) {
//       const submittedClasses = currentExam.classSubmissionStatus.filter(
//         cs => cs.status === 'submitted'
//       );
//       setClassesData(submittedClasses);
//       if (submittedClasses.length > 0 && !selectedClass) {
//         setSelectedClass(submittedClasses[0]);
//       }
//     }
//   }, [currentExam]);

//   useEffect(() => {
//     if (selectedClass) {
//       loadClassMarks();
//     }
//   }, [selectedClass]);

//   const loadClassMarks = async () => {
//     if (!selectedClass) return;
//     setLoadingMarks(true);
//     try {
//       const res = await getMarksheetsByClass(examId, selectedClass.classId);
//       if (res.success && res.data) {
//         setClassMarks(res.data);
//       }
//     } catch (error) {
//       console.error('Failed to load marks:', error);
//       toast.error('Failed to load marks data');
//     } finally {
//       setLoadingMarks(false);
//     }
//   };

//   const handleReviewSubmit = async () => {
//     if (!selectedClass) {
//       toast.error('Please select a class to review');
//       return;
//     }

//     const totalStudents = classMarks?.students?.length || 0;
//     const marksEntered = classMarks?.students?.filter(s => 
//       s.subjects?.some(sub => sub.totalScore > 0)
//     ).length || 0;

//     if (marksEntered < totalStudents && marksEntered > 0) {
//       if (!window.confirm(`Only ${marksEntered}/${totalStudents} students have marks entered. Do you want to proceed with review?`)) {
//         return;
//       }
//     }

//     if (marksEntered === 0) {
//       toast.error('No marks entered for this class. Cannot review empty marksheet.');
//       return;
//     }

//     setReviewing(true);
//     try {
//       const reviewData = {
//         classId: selectedClass.classId,
//         status: 'reviewed',
//         comments: reviewComments,
//         reviewedAt: new Date().toISOString()
//       };
      
//       await reviewMarks(examId, selectedClass.classId, reviewData);
//       toast.success(`Marks for ${selectedClass.className} reviewed successfully`);
      
//       await loadClassMarks();
      
//       const updatedClasses = classesData.map(cls => 
//         cls.classId === selectedClass.classId 
//           ? { ...cls, status: 'reviewed' }
//           : cls
//       );
//       setClassesData(updatedClasses);
      
//       setReviewComments('');
      
//       const currentIndex = updatedClasses.findIndex(c => c.classId === selectedClass.classId);
//       const nextClass = updatedClasses.find((c, idx) => idx > currentIndex && c.status === 'submitted');
      
//       if (nextClass) {
//         setSelectedClass(nextClass);
//         toast.info(`Moving to next class: ${nextClass.className}`);
//       } else {
//         const remainingSubmitted = updatedClasses.filter(c => c.status === 'submitted').length;
//         if (remainingSubmitted === 0) {
//           toast.success('All classes have been reviewed! You can now publish the exam results.');
//           setTimeout(() => {
//             navigate(`/exams/${examId}`);
//           }, 2000);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to review marks:', error);
//       toast.error(error.response?.data?.message || 'Failed to review marks');
//     } finally {
//       setReviewing(false);
//     }
//   };

//   const toggleStudentExpand = (studentId) => {
//     setExpandedStudents(prev => ({
//       ...prev,
//       [studentId]: !prev[studentId]
//     }));
//   };

//   const expandAll = () => {
//     const allExpanded = {};
//     classMarks?.students?.forEach(s => {
//       allExpanded[s.studentId] = true;
//     });
//     setExpandedStudents(allExpanded);
//   };

//   const collapseAll = () => {
//     setExpandedStudents({});
//   };

//   const getGradeBadge = (marks, maxMarks) => {
//     const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
//     if (percentage >= 90) return { grade: 'A+', color: 'bg-green-100 text-green-800' };
//     if (percentage >= 80) return { grade: 'A', color: 'bg-emerald-100 text-emerald-800' };
//     if (percentage >= 70) return { grade: 'B+', color: 'bg-blue-100 text-blue-800' };
//     if (percentage >= 60) return { grade: 'B', color: 'bg-cyan-100 text-cyan-800' };
//     if (percentage >= 50) return { grade: 'C+', color: 'bg-yellow-100 text-yellow-800' };
//     if (percentage >= 40) return { grade: 'C', color: 'bg-orange-100 text-orange-800' };
//     if (percentage >= 33) return { grade: 'D', color: 'bg-red-100 text-red-800' };
//     return { grade: 'F', color: 'bg-gray-100 text-gray-800' };
//   };

//   const getStatusBadge = (status) => {
//     const config = {
//       draft: { color: 'bg-gray-100 text-gray-700', icon: '📝', label: 'Draft' },
//       submitted: { color: 'bg-yellow-100 text-yellow-800', icon: '📤', label: 'Submitted' },
//       reviewed: { color: 'bg-green-100 text-green-800', icon: '✓', label: 'Reviewed' },
//       published: { color: 'bg-blue-100 text-blue-800', icon: '🎉', label: 'Published' }
//     };
//     const { color, icon, label } = config[status] || config.draft;
//     return (
//       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
//         <span className="mr-1">{icon}</span>
//         {label}
//       </span>
//     );
//   };

//   if (isLoading) return <LoadingSpinner />;

//   const totalStudents = classMarks?.students?.length || 0;
//   const marksEnteredCount = classMarks?.students?.filter(s => 
//     s.subjects?.some(sub => sub.totalScore > 0)
//   ).length || 0;
//   const averagePercentage = classMarks?.students?.length > 0
//     ? (classMarks.students.reduce((sum, s) => sum + (s.percentage || 0), 0) / classMarks.students.length).toFixed(1)
//     : 0;
//   const passCount = classMarks?.students?.filter(s => (s.percentage || 0) >= 40).length || 0;
//   const passPercentage = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

//   const remainingClasses = classesData.filter(c => c.status === 'submitted').length;
//   const reviewedClasses = classesData.filter(c => c.status === 'reviewed').length;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => navigate(`/exams/${examId}`)}
//                 className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
//               >
//                 <ArrowLeftIcon className="w-5 h-5" />
//               </button>
//               <div>
//                 <h1 className="text-2xl font-bold">Review Exam Marks</h1>
//                 <p className="text-amber-100 mt-1">
//                   {currentExam?.displayName || currentExam?.name}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="bg-white/20 rounded-lg px-4 py-2">
//                 <span className="text-sm">
//                   {reviewedClasses} / {classesData.length} Classes Reviewed
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Class Selection */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="font-medium text-gray-700">Select Class to Review</h3>
//             {remainingClasses > 0 && (
//               <span className="text-sm text-amber-600">
//                 {remainingClasses} class{remainingClasses !== 1 ? 'es' : ''} pending review
//               </span>
//             )}
//           </div>
//           <div className="flex flex-wrap gap-3">
//             {classesData.map((cls) => (
//               <button
//                 key={cls.classId}
//                 onClick={() => setSelectedClass(cls)}
//                 className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
//                   selectedClass?.classId === cls.classId
//                     ? 'bg-primary-500 text-white shadow-md'
//                     : cls.status === 'reviewed'
//                     ? 'bg-green-100 text-green-700 hover:bg-green-200'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 {cls.className}
//                 {cls.status === 'reviewed' && (
//                   <CheckCircleIcon className="w-4 h-4" />
//                 )}
//                 {cls.status === 'submitted' && selectedClass?.classId !== cls.classId && (
//                   <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
//                 )}
//               </button>
//             ))}
//             {classesData.length === 0 && (
//               <p className="text-gray-500">No classes ready for review</p>
//             )}
//           </div>
//         </div>

//         {selectedClass && (
//           <>
//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//               <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-blue-600 font-medium">Total Students</p>
//                     <p className="text-2xl font-bold text-blue-900">{totalStudents}</p>
//                   </div>
//                   <UserGroupIcon className="w-8 h-8 text-blue-400" />
//                 </div>
//               </div>
//               <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-green-600 font-medium">Marks Entered</p>
//                     <p className="text-2xl font-bold text-green-900">{marksEnteredCount}</p>
//                   </div>
//                   <ClipboardDocumentCheckIcon className="w-8 h-8 text-green-400" />
//                 </div>
//               </div>
//               <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-purple-600 font-medium">Average Score</p>
//                     <p className="text-2xl font-bold text-purple-900">{averagePercentage}%</p>
//                   </div>
//                   <ChartBarIcon className="w-8 h-8 text-purple-400" />
//                 </div>
//               </div>
//               <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-amber-600 font-medium">Pass Percentage</p>
//                     <p className="text-2xl font-bold text-amber-900">{passPercentage}%</p>
//                   </div>
//                   <AcademicCapIcon className="w-8 h-8 text-amber-400" />
//                 </div>
//               </div>
//             </div>

//             {/* Review Comments */}
//             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Review Comments
//               </label>
//               <textarea
//                 value={reviewComments}
//                 onChange={(e) => setReviewComments(e.target.value)}
//                 rows="3"
//                 className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
//                 placeholder="Add any comments about this review (optional)..."
//               />
//             </div>

//             {/* Action Buttons */}
//             <div className="flex justify-between items-center mb-4">
//               <div className="flex gap-2">
//                 <button
//                   onClick={expandAll}
//                   className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
//                 >
//                   Expand All
//                 </button>
//                 <button
//                   onClick={collapseAll}
//                   className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
//                 >
//                   Collapse All
//                 </button>
//               </div>
//               <div className="text-sm text-gray-500">
//                 {selectedClass.status === 'reviewed' ? (
//                   <span className="text-green-600 flex items-center gap-1">
//                     <CheckCircleIcon className="w-4 h-4" />
//                     Already Reviewed
//                   </span>
//                 ) : (
//                   <span className="text-yellow-600 flex items-center gap-1">
//                     <ExclamationTriangleIcon className="w-4 h-4" />
//                     Pending Review
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Student Marks Table */}
//             {loadingMarks ? (
//               <LoadingSpinner />
//             ) : (
//               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//                 <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b">
//                   <h2 className="text-lg font-semibold">Student Marks - {selectedClass.className}</h2>
//                   <p className="text-sm text-gray-500 mt-1">Review and verify marks before approval</p>
//                 </div>

//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theory</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Practical</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-100">
//                       {classMarks?.students?.map((student) => {
//                         const isExpanded = expandedStudents[student.studentId];
//                         return (
//                           <React.Fragment key={student.studentId}>
//                             {student.subjects?.map((subject, idx) => {
//                               const gradeInfo = getGradeBadge(subject.totalScore, subject.maxMarks);
                              
//                               return (
//                                 <tr key={`${student.studentId}-${idx}`} className="hover:bg-gray-50">
//                                   {idx === 0 && (
//                                     <>
//                                       <td 
//                                         className="px-6 py-4 align-top cursor-pointer" 
//                                         rowSpan={student.subjects.length}
//                                         onClick={() => toggleStudentExpand(student.studentId)}
//                                       >
//                                         <div className="flex items-center gap-2">
//                                           <button className="text-gray-400 hover:text-gray-600">
//                                             {isExpanded ? (
//                                               <ChevronUpIcon className="w-4 h-4" />
//                                             ) : (
//                                               <ChevronDownIcon className="w-4 h-4" />
//                                             )}
//                                           </button>
//                                           <div>
//                                             <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
//                                             <div className="text-xs text-gray-500">{student.admissionNo}</div>
//                                           </div>
//                                         </div>
//                                       </td>
//                                       <td className="px-6 py-4 text-sm text-gray-600 align-top" rowSpan={student.subjects.length}>
//                                         {student.rollNumber || '-'}
//                                       </td>
//                                     </>
//                                   )}
//                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.subjectName}</td>
//                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{subject.theoryScore || 0}</td>
//                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{subject.practicalScore || 0}</td>
//                                   <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{subject.totalScore || 0}</td>
//                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{subject.percentage?.toFixed(1) || 0}%</td>
//                                   <td className="px-6 py-4 whitespace-nowrap">
//                                     <span className={`px-2 py-1 text-xs rounded-full ${gradeInfo.color}`}>
//                                       {gradeInfo.grade}
//                                     </span>
//                                    </td>
//                                   <td className="px-6 py-4 whitespace-nowrap">
//                                     {getStatusBadge(student.status)}
//                                    </td>
//                                  </tr>
//                               );
//                             })}
//                             {isExpanded && student.subjects?.length > 0 && (
//                               <tr className="bg-gray-50">
//                                 <td colSpan="9" className="px-6 py-4">
//                                   <div className="text-sm">
//                                     <p className="font-medium text-gray-700 mb-2">Student Summary</p>
//                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                                       <div>
//                                         <span className="text-xs text-gray-500">Total Marks</span>
//                                         <p className="font-semibold">{student.totalMarks}/{student.totalMaxMarks}</p>
//                                       </div>
//                                       <div>
//                                         <span className="text-xs text-gray-500">Percentage</span>
//                                         <p className="font-semibold">{student.percentage?.toFixed(1)}%</p>
//                                       </div>
//                                       <div>
//                                         <span className="text-xs text-gray-500">Overall Grade</span>
//                                         <p className="font-semibold">{student.grade}</p>
//                                       </div>
//                                       <div>
//                                         <span className="text-xs text-gray-500">Last Updated</span>
//                                         <p className="font-semibold text-xs">{new Date(student.lastUpdated).toLocaleString()}</p>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 </td>
//                               </tr>
//                             )}
//                           </React.Fragment>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>

//                 {/* Footer Actions */}
//                 <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
//                   <button
//                     onClick={() => navigate(`/exams/${examId}`)}
//                     className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleReviewSubmit}
//                     disabled={reviewing || selectedClass.status === 'reviewed'}
//                     className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
//                       selectedClass.status === 'reviewed'
//                         ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                         : 'bg-green-500 text-white hover:bg-green-600'
//                     }`}
//                   >
//                     {reviewing ? (
//                       <>
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                         <span>Reviewing...</span>
//                       </>
//                     ) : (
//                       <>
//                         <CheckCircleIcon className="w-5 h-5" />
//                         <span>{selectedClass.status === 'reviewed' ? 'Already Reviewed' : 'Approve & Mark as Reviewed'}</span>
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             )}
//           </>
//         )}

//         {/* No classes message */}
//         {classesData.length === 0 && !isLoading && (
//           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
//             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <ClipboardDocumentCheckIcon className="w-10 h-10 text-gray-400" />
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes to Review</h3>
//             <p className="text-gray-500 mb-4">
//               There are no classes with submitted marks waiting for review.
//             </p>
//             <button
//               onClick={() => navigate(`/exams/${examId}`)}
//               className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
//             >
//               Back to Exam Details
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ExamReview;


// src/components/exams/ExamReview.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { fetchExamById, clearCurrentExam } from '../../store/slices/examSlice';
import { getMarksheetsByClass, reviewMarks } from '../../services/markService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const ExamReview = () => {
  const { examId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentExam, isLoading } = useSelector((state) => state.exams);
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [classMarks, setClassMarks] = useState(null);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [expandedStudents, setExpandedStudents] = useState({});
  const [classesData, setClassesData] = useState([]);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    dispatch(fetchExamById(examId));
    return () => {
      dispatch(clearCurrentExam());
    };
  }, [dispatch, examId]);

  useEffect(() => {
    if (currentExam?.classSubmissionStatus) {
      const submittedClasses = currentExam.classSubmissionStatus.filter(
        cs => cs.status === 'submitted'
      );
      setClassesData(submittedClasses);
      if (submittedClasses.length > 0 && !selectedClass) {
        setSelectedClass(submittedClasses[0]);
      }
    }
  }, [currentExam]);

  useEffect(() => {
    if (selectedClass) {
      loadClassMarks();
    }
  }, [selectedClass]);

  const loadClassMarks = async () => {
    if (!selectedClass) return;
    setLoadingMarks(true);
    try {
      const res = await getMarksheetsByClass(examId, selectedClass.classId);
      if (res.success && res.data) {
        setClassMarks(res.data);
      }
    } catch (error) {
      console.error('Failed to load marks:', error);
      toast.error('Failed to load marks data');
    } finally {
      setLoadingMarks(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedClass) {
      toast.error('Please select a class to review');
      return;
    }

    const totalStudents = classMarks?.students?.length || 0;
    const marksEntered = classMarks?.students?.filter(s => 
      s.subjects?.some(sub => sub.totalScore > 0)
    ).length || 0;

    if (marksEntered < totalStudents && marksEntered > 0) {
      if (!window.confirm(`Only ${marksEntered}/${totalStudents} students have marks entered. Do you want to proceed with review?`)) {
        return;
      }
    }

    if (marksEntered === 0) {
      toast.error('No marks entered for this class. Cannot review empty marksheet.');
      return;
    }

    setReviewing(true);
    try {
      await reviewMarks(examId, selectedClass.classId, { comments: reviewComments });
      toast.success(`Marks for ${selectedClass.className} reviewed successfully`);
      await loadClassMarks();
      
      const updatedClasses = classesData.map(cls => 
        cls.classId === selectedClass.classId 
          ? { ...cls, status: 'reviewed' }
          : cls
      );
      setClassesData(updatedClasses);
      setReviewComments('');
      
      const currentIndex = updatedClasses.findIndex(c => c.classId === selectedClass.classId);
      const nextClass = updatedClasses.find((c, idx) => idx > currentIndex && c.status === 'submitted');
      
      if (nextClass) {
        setSelectedClass(nextClass);
        toast.info(`Moving to next class: ${nextClass.className}`);
      } else {
        const remainingSubmitted = updatedClasses.filter(c => c.status === 'submitted').length;
        if (remainingSubmitted === 0) {
          toast.success('All classes have been reviewed! You can now publish the exam results.');
          setTimeout(() => navigate(`/exams/${examId}`), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to review marks:', error);
      toast.error(error.response?.data?.message || 'Failed to review marks');
    } finally {
      setReviewing(false);
    }
  };

  const toggleStudentExpand = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const getGradeBadge = (marks, maxMarks) => {
    const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
    if (percentage >= 90) return { grade: 'A+', color: 'bg-green-100 text-green-800' };
    if (percentage >= 80) return { grade: 'A', color: 'bg-emerald-100 text-emerald-800' };
    if (percentage >= 70) return { grade: 'B+', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 60) return { grade: 'B', color: 'bg-cyan-100 text-cyan-800' };
    if (percentage >= 50) return { grade: 'C+', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 40) return { grade: 'C', color: 'bg-orange-100 text-orange-800' };
    if (percentage >= 33) return { grade: 'D', color: 'bg-red-100 text-red-800' };
    return { grade: 'F', color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: '📝', label: 'Draft' },
      submitted: { color: 'bg-yellow-100 text-yellow-800', icon: '📤', label: 'Submitted' },
      reviewed: { color: 'bg-green-100 text-green-800', icon: '✓', label: 'Reviewed' },
      published: { color: 'bg-blue-100 text-blue-800', icon: '🎉', label: 'Published' }
    };
    const { color, label } = config[status] || config.draft;
    return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{label}</span>;
  };

  if (isLoading) return <LoadingSpinner />;

  const totalStudents = classMarks?.students?.length || 0;
  const marksEnteredCount = classMarks?.students?.filter(s => 
    s.subjects?.some(sub => sub.totalScore > 0)
  ).length || 0;
  const averagePercentage = classMarks?.students?.length > 0
    ? (classMarks.students.reduce((sum, s) => sum + (s.percentage || 0), 0) / classMarks.students.length).toFixed(1)
    : 0;
  const passCount = classMarks?.students?.filter(s => (s.percentage || 0) >= 40).length || 0;
  const passPercentage = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

  const remainingClasses = classesData.filter(c => c.status === 'submitted').length;
  const reviewedClasses = classesData.filter(c => c.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/exams/${examId}`)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Exam Marks</h1>
            <p className="text-gray-500 mt-1">{currentExam?.displayName || currentExam?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded-lg px-3 py-1.5">
            <span className="text-sm text-gray-600">
              {reviewedClasses} / {classesData.length} Classes Reviewed
            </span>
          </div>
        </div>
      </div>

      {/* Class Selection */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-700">Select Class to Review</h3>
          {remainingClasses > 0 && (
            <span className="text-sm text-amber-600">
              {remainingClasses} class{remainingClasses !== 1 ? 'es' : ''} pending review
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {classesData.map((cls) => (
            <button
              key={cls.classId}
              onClick={() => setSelectedClass(cls)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedClass?.classId === cls.classId
                  ? 'bg-primary-500 text-white shadow-md'
                  : cls.status === 'reviewed'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cls.className}
              {cls.status === 'reviewed' && <CheckCircleIcon className="w-4 h-4" />}
            </button>
          ))}
          {classesData.length === 0 && (
            <p className="text-gray-500">No classes ready for review</p>
          )}
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <p className="text-sm text-gray-500">Marks Entered</p>
              <p className="text-2xl font-bold text-green-600">{marksEnteredCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-blue-600">{averagePercentage}%</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <p className="text-sm text-gray-500">Pass Percentage</p>
              <p className="text-2xl font-bold text-amber-600">{passPercentage}%</p>
            </div>
          </div>

          {/* Review Comments */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Comments
            </label>
            <textarea
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Add any comments about this review (optional)..."
            />
          </div>

          {/* Student Marks Table */}
          {loadingMarks ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold">Student Marks - {selectedClass.className}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {classMarks?.students?.map((student) => (
                      <React.Fragment key={student.studentId}>
                        {student.subjects?.map((subject, idx) => {
                          const gradeInfo = getGradeBadge(subject.totalScore, subject.maxMarks);
                          return (
                            <tr key={`${student.studentId}-${idx}`} className="hover:bg-gray-50">
                              {idx === 0 && (
                                <>
                                  <td className="px-6 py-4 align-top" rowSpan={student.subjects.length}>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => toggleStudentExpand(student.studentId)} className="text-gray-400">
                                        {expandedStudents[student.studentId] ? (
                                          <ChevronUpIcon className="w-4 h-4" />
                                        ) : (
                                          <ChevronDownIcon className="w-4 h-4" />
                                        )}
                                      </button>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                                        <div className="text-xs text-gray-500">{student.admissionNo}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 align-top" rowSpan={student.subjects.length}>
                                    {student.rollNumber || '-'}
                                  </td>
                                </>
                              )}
                              <td className="px-6 py-4 text-sm text-gray-900">{subject.subjectName}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{subject.totalScore || 0} / {subject.maxMarks}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{subject.percentage?.toFixed(1) || 0}%</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${gradeInfo.color}`}>
                                  {gradeInfo.grade}
                                </span>
                              </td>
                              <td className="px-6 py-4">{getStatusBadge(student.status)}</td>
                            </tr>
                          );
                        })}
                        {expandedStudents[student.studentId] && student.subjects?.length > 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan="7" className="px-6 py-4">
                              <div className="text-sm">
                                <p className="font-medium text-gray-700 mb-2">Student Summary</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <span className="text-xs text-gray-500">Total Marks</span>
                                    <p className="font-semibold">{student.totalMarks}/{student.totalMaxMarks}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Percentage</span>
                                    <p className="font-semibold">{student.percentage?.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Overall Grade</span>
                                    <p className="font-semibold">{student.grade}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500">Last Updated</span>
                                    <p className="font-semibold text-xs">{new Date(student.lastUpdated).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => navigate(`/exams/${examId}`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewing || selectedClass.status === 'reviewed'}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                    selectedClass.status === 'reviewed'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {reviewing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Reviewing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>{selectedClass.status === 'reviewed' ? 'Already Reviewed' : 'Approve & Mark as Reviewed'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* No classes message */}
      {classesData.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardDocumentCheckIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes to Review</h3>
          <p className="text-gray-500 mb-4">
            There are no classes with submitted marks waiting for review.
          </p>
          <button
            onClick={() => navigate(`/exams/${examId}`)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Back to Exam Details
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamReview;