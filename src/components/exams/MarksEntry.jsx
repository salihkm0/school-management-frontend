// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import {
//   BookOpenIcon,
//   AcademicCapIcon,
//   UserGroupIcon,
//   CheckCircleIcon,
//   ExclamationTriangleIcon,
//   ChevronDownIcon,
//   ChevronUpIcon,
//   EyeIcon,
//   ChartBarIcon,
// } from "@heroicons/react/24/outline";
// import { fetchExams } from "../../store/slices/examSlice";
// import { fetchClasses } from "../../store/slices/classSlice";
// import {
//   getMarksheetsByClass,
//   bulkUpdateMarks,
//   getTeacherPermissions,
//   submitMarksForReview,
// } from "../../services/markService";
// import LoadingSpinner from "../common/LoadingSpinner";
// import toast from "react-hot-toast";

// const MarksEntry = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const examIdFromUrl = searchParams.get("examId");

//   const dispatch = useDispatch();
//   const { exams } = useSelector((state) => state.exams);
//   const { classes } = useSelector((state) => state.classes);

//   const [selectedExam, setSelectedExam] = useState(examIdFromUrl || "");
//   const [selectedClass, setSelectedClass] = useState("");
//   const [students, setStudents] = useState([]);
//   const [permissions, setPermissions] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [expandedStudents, setExpandedStudents] = useState({});
//   const [searchTerm, setSearchTerm] = useState("");
//   const [examSubjects, setExamSubjects] = useState([]);
//   const [tempMarks, setTempMarks] = useState({});

//   useEffect(() => {
//     dispatch(fetchExams({ limit: 100 }));
//     dispatch(fetchClasses({ limit: 100 }));
//   }, [dispatch]);

//   useEffect(() => {
//     if (selectedExam && selectedClass) {
//       loadData();
//     } else {
//       setStudents([]);
//       setPermissions(null);
//       setExamSubjects([]);
//       setTempMarks({});
//     }
//   }, [selectedExam, selectedClass]);

//   const loadData = async () => {
//     if (!selectedExam || !selectedClass) return;
//     setIsLoading(true);
//     try {
//       // Get permissions
//       const permRes = await getTeacherPermissions(selectedExam, selectedClass);
//       setPermissions(permRes.data);

//       // Get all marksheets for this class and exam
//       const response = await getMarksheetsByClass(selectedExam, selectedClass);
//       if (response.success && response.data) {
//         // Get exam data to extract subject details with theory/practical max marks
//         const examData = exams.find(e => e._id === selectedExam);
        
//         let subjects = response.data.subjects || [];
        
//         // Enhance subjects with theory and practical max marks from exam
//         if (examData && examData.schedule && examData.schedule.length > 0) {
//           subjects = subjects.map(subject => {
//             const scheduleItem = examData.schedule.find(
//               s => s.subjectId === subject.subjectId || s.subjectId?._id === subject.subjectId
//             );
//             if (scheduleItem) {
//               return {
//                 ...subject,
//                 theoryMaxMarks: scheduleItem.theoryMarks || scheduleItem.maxMarks || subject.maxMarks,
//                 practicalMaxMarks: scheduleItem.practicalMarks || 0,
//                 hasPractical: scheduleItem.practicalMarks > 0,
//                 maxMarks: subject.maxMarks || scheduleItem.maxMarks,
//                 passingMarks: subject.passingMarks || scheduleItem.passingMarks
//               };
//             }
//             return subject;
//           });
//         } else if (examData && examData.subjects && examData.subjects.length > 0) {
//           subjects = subjects.map(subject => {
//             const examSubject = examData.subjects.find(
//               s => s.subjectId === subject.subjectId || s.subjectId?._id === subject.subjectId
//             );
//             if (examSubject) {
//               return {
//                 ...subject,
//                 theoryMaxMarks: examSubject.theoryMaxMarks || examSubject.maxMarks,
//                 practicalMaxMarks: examSubject.practicalMaxMarks || 0,
//                 hasPractical: examSubject.practicalMaxMarks > 0,
//                 maxMarks: examSubject.maxMarks,
//                 passingMarks: examSubject.passingMarks
//               };
//             }
//             return subject;
//           });
//         }
        
//         setExamSubjects(subjects);
//         setStudents(response.data.students || []);
        
//         // Initialize temp marks with existing values
//         const initialTempMarks = {};
//         (response.data.students || []).forEach(student => {
//           initialTempMarks[student.studentId] = {};
//           (subjects || []).forEach(subject => {
//             const studentSubject = student.subjects?.find(
//               s => s.subjectId === subject.subjectId
//             );
//             initialTempMarks[student.studentId][subject.subjectId] = {
//               theoryScore: studentSubject?.theoryScore || 0,
//               practicalScore: studentSubject?.practicalScore || 0,
//               totalScore: studentSubject?.totalScore || 0,
//             };
//           });
//         });
//         setTempMarks(initialTempMarks);
//       }
//     } catch (error) {
//       console.error("Failed to load data:", error);
//       toast.error("Failed to load data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleMarkChange = (studentId, subjectId, field, value) => {
//     // Allow empty string for clearing the field
//     let marks = value === "" || value === null ? "" : parseInt(value) || 0;
    
//     const subject = examSubjects.find((s) => s.subjectId === subjectId);
//     const maxMarks = field === "theoryScore" 
//       ? (subject?.theoryMaxMarks || subject?.maxMarks || 100)
//       : (subject?.practicalMaxMarks || subject?.maxMarks || 100);
    
//     if (marks !== "" && marks !== null) {
//       if (marks > maxMarks) marks = maxMarks;
//       if (marks < 0) marks = 0;
//     }

//     setTempMarks((prev) => {
//       const studentMarks = prev[studentId] || {};
//       const subjectMarks = studentMarks[subjectId] || { theoryScore: 0, practicalScore: 0 };
      
//       const updatedSubjectMarks = {
//         ...subjectMarks,
//         [field]: marks === "" ? 0 : marks,
//       };
      
//       // Calculate total score (treat empty as 0)
//       const theoryVal = updatedSubjectMarks.theoryScore === "" ? 0 : updatedSubjectMarks.theoryScore;
//       const practicalVal = updatedSubjectMarks.practicalScore === "" ? 0 : updatedSubjectMarks.practicalScore;
//       updatedSubjectMarks.totalScore = theoryVal + practicalVal;
      
//       return {
//         ...prev,
//         [studentId]: {
//           ...studentMarks,
//           [subjectId]: updatedSubjectMarks,
//         },
//       };
//     });

//     // Update the actual student data for save operation
//     setStudents((prev) =>
//       prev.map((s) => {
//         if (s.studentId === studentId) {
//           const updatedSubjects = s.subjects?.map((sub) => {
//             if (sub.subjectId === subjectId) {
//               const theoryVal = field === "theoryScore" ? (marks === "" ? 0 : marks) : (sub.theoryScore || 0);
//               const practicalVal = field === "practicalScore" ? (marks === "" ? 0 : marks) : (sub.practicalScore || 0);
//               return {
//                 ...sub,
//                 [field]: marks === "" ? 0 : marks,
//                 totalScore: theoryVal + practicalVal,
//               };
//             }
//             return sub;
//           }) || [];

//           // If subject doesn't exist in student's subjects, create it
//           if (!updatedSubjects.find(sub => sub.subjectId === subjectId)) {
//             const theoryVal = field === "theoryScore" ? (marks === "" ? 0 : marks) : 0;
//             const practicalVal = field === "practicalScore" ? (marks === "" ? 0 : marks) : 0;
//             updatedSubjects.push({
//               subjectId: subjectId,
//               theoryScore: theoryVal,
//               practicalScore: practicalVal,
//               totalScore: theoryVal + practicalVal,
//             });
//           }

//           return {
//             ...s,
//             subjects: updatedSubjects,
//           };
//         }
//         return s;
//       }),
//     );
//   };

//   const handleSave = async () => {
//     if (!selectedExam || !selectedClass) {
//       toast.error("Please select exam and class");
//       return;
//     }

//     // Prepare students data for bulk update
//     const studentsData = students.map((student) => ({
//       studentId: student.studentId,
//       subjects: examSubjects.map((subject) => {
//         const studentSubject = student.subjects?.find(
//           (s) => s.subjectId === subject.subjectId
//         );
//         return {
//           subjectId: subject.subjectId,
//           theoryScore: studentSubject?.theoryScore || 0,
//           practicalScore: studentSubject?.practicalScore || 0,
//           remarks: studentSubject?.remarks || "",
//         };
//       }),
//       remarks: student.remarks || "",
//     }));

//     setIsSubmitting(true);
//     try {
//       await bulkUpdateMarks(selectedExam, selectedClass, studentsData);
//       toast.success("Marks saved successfully");
//       await loadData();
//     } catch (error) {
//       console.error("Failed to save marks:", error);
//       toast.error(error.response?.data?.message || "Failed to save marks");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmitForReview = async () => {
//     if (
//       !window.confirm(
//         "Submit all marks for review? You won't be able to edit after submission.",
//       )
//     ) {
//       return;
//     }
//     setIsSubmitting(true);
//     try {
//       await submitMarksForReview(selectedExam, selectedClass);
//       toast.success("Marks submitted for review successfully");
//       await loadData();
//     } catch (error) {
//       console.error("Failed to submit marks:", error);
//       toast.error(error.response?.data?.message || "Failed to submit marks");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const toggleStudentExpand = (studentId) => {
//     setExpandedStudents((prev) => ({
//       ...prev,
//       [studentId]: !prev[studentId],
//     }));
//   };

//   const expandAll = () => {
//     const allExpanded = {};
//     students.forEach((s) => {
//       allExpanded[s.studentId] = true;
//     });
//     setExpandedStudents(allExpanded);
//   };

//   const collapseAll = () => {
//     setExpandedStudents({});
//   };

//   const selectedExamData = exams.find((e) => e._id === selectedExam);
//   const hasEditPermission =
//     permissions?.canEdit === true ||
//     permissions?.isAdmin === true ||
//     permissions?.isSystemAdmin === true;

//   const getExamClassIds = () => {
//     if (!selectedExamData) return [];
//     if (selectedExamData.classIds && Array.isArray(selectedExamData.classIds)) {
//       return selectedExamData.classIds;
//     }
//     if (selectedExamData.classes && Array.isArray(selectedExamData.classes)) {
//       return selectedExamData.classes;
//     }
//     return [];
//   };

//   const getClassDisplayName = (classItem) => {
//     if (!classItem) return "Unknown";
//     // Show name with section/division
//     if (classItem.section) {
//       return `${classItem.name} - ${classItem.section}`;
//     }
//     if (classItem.displayName) {
//       return classItem.displayName;
//     }
//     return classItem.name || classItem._id;
//   };

//   const getClassById = (classId) => {
//     if (typeof classId === "object" && classId !== null) {
//       return classId;
//     }
//     return classes.find((c) => c._id === classId || c.id === classId);
//   };

//   const examClassIds = getExamClassIds();
//   const filteredStudents = students.filter(
//     (student) =>
//       student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   const getGradeBadge = (marks, maxMarks) => {
//     const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
//     if (percentage >= 90)
//       return { grade: "A+", color: "bg-emerald-100 text-emerald-800" };
//     if (percentage >= 80)
//       return { grade: "A", color: "bg-green-100 text-green-800" };
//     if (percentage >= 70)
//       return { grade: "B+", color: "bg-blue-100 text-blue-800" };
//     if (percentage >= 60)
//       return { grade: "B", color: "bg-cyan-100 text-cyan-800" };
//     if (percentage >= 50)
//       return { grade: "C+", color: "bg-yellow-100 text-yellow-800" };
//     if (percentage >= 40)
//       return { grade: "C", color: "bg-orange-100 text-orange-800" };
//     if (percentage >= 33)
//       return { grade: "D", color: "bg-red-100 text-red-800" };
//     return { grade: "F", color: "bg-gray-100 text-gray-800" };
//   };

//   const getStudentTotalPercentage = (student) => {
//     let totalObtained = 0;
//     let totalMax = 0;
//     examSubjects.forEach((subject) => {
//       const studentSubject = student.subjects?.find(
//         (s) => s.subjectId === subject.subjectId,
//       );
//       const marks = studentSubject?.totalScore || 0;
//       totalObtained += marks;
//       totalMax += subject.maxMarks;
//     });
//     return totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
//   };

//   // Get current mark value (show empty string if 0)
//   const getCurrentMarkValue = (studentId, subjectId, field) => {
//     const value = tempMarks[studentId]?.[subjectId]?.[field];
//     return value === 0 ? "" : value || "";
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="bg-white/20 rounded-xl p-3">
//                 <BookOpenIcon className="w-8 h-8" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold">Marks Entry</h1>
//                 <p className="text-emerald-100 mt-1">
//                   Enter and manage student marks for exams
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => navigate("/exams")}
//               className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
//             >
//               Back to Exams
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Selection Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//           {/* Exam Selection Card */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//             <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
//               <div className="flex items-center space-x-2">
//                 <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
//                 <h3 className="font-semibold text-gray-800">Select Exam</h3>
//               </div>
//             </div>
//             <div className="p-5">
//               <select
//                 value={selectedExam}
//                 onChange={(e) => {
//                   setSelectedExam(e.target.value);
//                   setSelectedClass("");
//                   setStudents([]);
//                   setPermissions(null);
//                   setExamSubjects([]);
//                   setTempMarks({});
//                 }}
//                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
//               >
//                 <option value="">Choose an exam...</option>
//                 {exams.map((e) => (
//                   <option key={e._id} value={e._id}>
//                     {e.displayName || e.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Class Selection Card */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//             <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
//               <div className="flex items-center space-x-2">
//                 <UserGroupIcon className="w-5 h-5 text-emerald-600" />
//                 <h3 className="font-semibold text-gray-800">Select Class</h3>
//               </div>
//             </div>
//             <div className="p-5">
//               <select
//                 value={selectedClass}
//                 onChange={(e) => {
//                   setSelectedClass(e.target.value);
//                   setStudents([]);
//                   setPermissions(null);
//                   setExamSubjects([]);
//                   setTempMarks({});
//                 }}
//                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
//                 disabled={!selectedExam}
//               >
//                 <option value="">Choose a class...</option>
//                 {examClassIds.map((classId) => {
//                   const classItem = getClassById(classId);
//                   if (!classItem) return null;
//                   const classIdValue = classItem._id || classItem.id || classId;
//                   return (
//                     <option key={classIdValue} value={classIdValue}>
//                       {getClassDisplayName(classItem)}
//                     </option>
//                   );
//                 })}
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Subjects Info */}
//         {examSubjects.length > 0 && selectedClass && (
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
//             <div className="flex justify-between items-center mb-2">
//               <h3 className="text-sm font-medium text-gray-700">
//                 Subjects for this Exam
//               </h3>
//               <span className="text-xs text-gray-500">
//                 {examSubjects.length} subjects
//               </span>
//             </div>
//             <div className="flex flex-wrap gap-2">
//               {examSubjects.map((subject) => (
//                 <div key={subject.subjectId} className="group relative">
//                   <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm cursor-help">
//                     {subject.subjectName}
//                   </span>
//                   <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
//                     Theory: {subject.theoryMaxMarks || subject.maxMarks} | 
//                     {subject.hasPractical && ` Practical: ${subject.practicalMaxMarks} | `}
//                     Total: {subject.maxMarks} | Pass: {subject.passingMarks}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Permission Info */}
//         {permissions && (
//           <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center space-x-3">
//             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//               <span className="text-blue-600 font-bold">
//                 {permissions.role?.charAt(0).toUpperCase()}
//               </span>
//             </div>
//             <div className="flex-1">
//               <div className="flex flex-wrap gap-3 text-sm">
//                 <span className="text-blue-700">
//                   <strong>Role:</strong> {permissions.role}
//                 </span>
//                 <span className="text-blue-700">
//                   <strong>Class Teacher:</strong>{" "}
//                   {permissions.isClassTeacher ? "Yes" : "No"}
//                 </span>
//                 <span className="text-blue-700">
//                   <strong>Can Edit:</strong> {hasEditPermission ? "Yes" : "No"}
//                 </span>
//                 <span className="text-blue-700">
//                   <strong>Can Submit:</strong>{" "}
//                   {permissions.canSubmit ? "Yes" : "No"}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Search and Actions Bar */}
//         {selectedClass && students.length > 0 && hasEditPermission && (
//           <div className="flex flex-col sm:flex-row gap-4 mb-6">
//             <div className="flex-1 relative">
//               <input
//                 type="text"
//                 placeholder="Search by name, roll number, or admission number..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
//               />
//               <svg
//                 className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                 />
//               </svg>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={expandAll}
//                 className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
//               >
//                 Expand All
//               </button>
//               <button
//                 onClick={collapseAll}
//                 className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
//               >
//                 Collapse All
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Marks Entry Table */}
//         {selectedClass &&
//           filteredStudents.length > 0 &&
//           hasEditPermission &&
//           examSubjects.length > 0 && (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//               {/* Header */}
//               <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
//                 <div>
//                   <h2 className="text-lg font-semibold text-gray-800">
//                     Enter Marks for{" "}
//                     {selectedExamData?.displayName || selectedExamData?.name}
//                   </h2>
//                   <p className="text-sm text-gray-500 mt-0.5">
//                     Class: {getClassDisplayName(getClassById(selectedClass))} |
//                     Total Students: {filteredStudents.length}
//                   </p>
//                 </div>
//                 <div className="flex space-x-3">
//                   <button
//                     onClick={handleSave}
//                     disabled={isSubmitting}
//                     className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
//                   >
//                     {isSubmitting ? (
//                       <>
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                         <span>Saving...</span>
//                       </>
//                     ) : (
//                       <>
//                         <CheckCircleIcon className="w-4 h-4" />
//                         <span>Save All Marks</span>
//                       </>
//                     )}
//                   </button>
//                   {permissions?.canSubmit && (
//                     <button
//                       onClick={handleSubmitForReview}
//                       disabled={isSubmitting}
//                       className="px-5 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
//                     >
//                       <ChartBarIcon className="w-4 h-4" />
//                       <span>Submit for Review</span>
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {/* Students List with Subjects */}
//               <div className="divide-y divide-gray-100">
//                 {filteredStudents.map((student, idx) => {
//                   const totalPercentage = getStudentTotalPercentage(student);
//                   const totalGradeInfo = getGradeBadge(totalPercentage, 100);
//                   const isExpanded = expandedStudents[student.studentId];

//                   return (
//                     <div
//                       key={student.studentId}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       {/* Student Header Row */}
//                       <div
//                         className="px-6 py-4 flex items-center justify-between cursor-pointer"
//                         onClick={() => toggleStudentExpand(student.studentId)}
//                       >
//                         <div className="flex items-center space-x-4 flex-1">
//                           <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
//                             {student.studentName?.charAt(0).toUpperCase()}
//                           </div>
//                           <div className="flex-1">
//                             <div className="flex items-center space-x-3">
//                               <h3 className="font-semibold text-gray-800">
//                                 {student.studentName}
//                               </h3>
//                               <span className="text-xs text-gray-400">
//                                 #{student.rollNumber || "N/A"}
//                               </span>
//                             </div>
//                             <p className="text-xs text-gray-400 mt-0.5">
//                               Admission:{" "}
//                               {student.admissionNo || student.studentCode}
//                             </p>
//                           </div>
//                         </div>

//                         <div className="flex items-center space-x-6">
//                           {/* Total Percentage */}
//                           <div className="text-right">
//                             <div className="text-sm font-semibold text-gray-700">
//                               {totalPercentage.toFixed(1)}%
//                             </div>
//                             <span
//                               className={`px-2 py-0.5 text-xs font-semibold rounded-full ${totalGradeInfo.color}`}
//                             >
//                               {totalGradeInfo.grade}
//                             </span>
//                           </div>

//                           {/* Expand Icon */}
//                           <button className="p-1 text-gray-400 hover:text-gray-600">
//                             {isExpanded ? (
//                               <ChevronUpIcon className="w-5 h-5" />
//                             ) : (
//                               <ChevronDownIcon className="w-5 h-5" />
//                             )}
//                           </button>
//                         </div>
//                       </div>

//                       {/* Subjects Row (expanded) */}
//                       {isExpanded && (
//                         <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
//                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                             {examSubjects.map((subject) => {
//                               const theoryMarks = tempMarks[student.studentId]?.[subject.subjectId]?.theoryScore ?? 
//                                 (student.subjects?.find(s => s.subjectId === subject.subjectId)?.theoryScore || 0);
//                               const practicalMarks = tempMarks[student.studentId]?.[subject.subjectId]?.practicalScore ??
//                                 (student.subjects?.find(s => s.subjectId === subject.subjectId)?.practicalScore || 0);
//                               const totalMarks = (theoryMarks === "" ? 0 : theoryMarks) + (practicalMarks === "" ? 0 : practicalMarks);
//                               const percentage = subject.maxMarks > 0 ? (totalMarks / subject.maxMarks) * 100 : 0;
//                               const gradeInfo = getGradeBadge(totalMarks, subject.maxMarks);
//                               const theoryMax = subject.theoryMaxMarks || subject.maxMarks;
//                               const practicalMax = subject.practicalMaxMarks || 0;

//                               return (
//                                 <div
//                                   key={subject.subjectId}
//                                   className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
//                                 >
//                                   <div className="flex justify-between items-start mb-3">
//                                     <div>
//                                       <h4 className="font-semibold text-gray-800">
//                                         {subject.subjectName}
//                                       </h4>
//                                       <p className="text-xs text-gray-400">
//                                         Total: {subject.maxMarks} | Pass: {subject.passingMarks}
//                                       </p>
//                                       {subject.hasPractical && (
//                                         <p className="text-xs text-gray-400">
//                                           Theory: {theoryMax} | Practical: {practicalMax}
//                                         </p>
//                                       )}
//                                     </div>
//                                     <span
//                                       className={`px-2 py-1 text-xs font-semibold rounded-full ${gradeInfo.color}`}
//                                     >
//                                       {gradeInfo.grade}
//                                     </span>
//                                   </div>

//                                   <div className="space-y-2">
//                                     <div>
//                                       <label className="text-xs text-gray-500">
//                                         Theory Marks (Max: {theoryMax})
//                                       </label>
//                                       <input
//                                         type="number"
//                                         value={getCurrentMarkValue(student.studentId, subject.subjectId, "theoryScore")}
//                                         onChange={(e) =>
//                                           handleMarkChange(
//                                             student.studentId,
//                                             subject.subjectId,
//                                             "theoryScore",
//                                             e.target.value,
//                                           )
//                                         }
//                                         onClick={(e) => e.stopPropagation()}
//                                         className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
//                                         min="0"
//                                         max={theoryMax}
//                                         placeholder="Enter marks"
//                                       />
//                                     </div>
                                    
//                                     {subject.hasPractical && practicalMax > 0 && (
//                                       <div>
//                                         <label className="text-xs text-gray-500">
//                                           Practical Marks (Max: {practicalMax})
//                                         </label>
//                                         <input
//                                           type="number"
//                                           value={getCurrentMarkValue(student.studentId, subject.subjectId, "practicalScore")}
//                                           onChange={(e) =>
//                                             handleMarkChange(
//                                               student.studentId,
//                                               subject.subjectId,
//                                               "practicalScore",
//                                               e.target.value,
//                                             )
//                                           }
//                                           onClick={(e) => e.stopPropagation()}
//                                           className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
//                                           min="0"
//                                           max={practicalMax}
//                                           placeholder="Enter marks"
//                                         />
//                                       </div>
//                                     )}
                                    
//                                     <div className="flex justify-between items-center pt-2 border-t">
//                                       <span className="text-sm font-medium">
//                                         Total: {totalMarks} / {subject.maxMarks}
//                                       </span>
//                                       <span className="text-xs text-gray-500">
//                                         {percentage.toFixed(1)}%
//                                       </span>
//                                     </div>
//                                   </div>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Save Footer */}
//               <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
//                 <button
//                   onClick={handleSave}
//                   disabled={isSubmitting}
//                   className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
//                 >
//                   {isSubmitting ? (
//                     <>
//                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                       <span>Saving All Marks...</span>
//                     </>
//                   ) : (
//                     <>
//                       <CheckCircleIcon className="w-4 h-4" />
//                       <span>Save All Records</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           )}

//         {/* Empty States */}
//         {selectedClass &&
//           filteredStudents.length === 0 &&
//           !isLoading &&
//           examSubjects.length > 0 && (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
//               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <UserGroupIcon className="w-10 h-10 text-gray-400" />
//               </div>
//               <h3 className="text-lg font-semibold text-gray-700 mb-2">
//                 No Students Found
//               </h3>
//               <p className="text-gray-500">
//                 No students found matching your search criteria
//               </p>
//             </div>
//           )}

//         {selectedExam &&
//           selectedClass &&
//           examSubjects.length === 0 &&
//           !isLoading && (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
//               <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <BookOpenIcon className="w-10 h-10 text-amber-600" />
//               </div>
//               <h3 className="text-lg font-semibold text-gray-700 mb-2">
//                 No Subjects Found
//               </h3>
//               <p className="text-gray-500">
//                 This exam doesn't have any subjects configured. Please add
//                 subjects to the exam first.
//               </p>
//             </div>
//           )}

//         {isLoading && <LoadingSpinner />}
//       </div>
//     </div>
//   );
// };

// export default MarksEntry;


// src/components/exams/MarksEntry.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpenIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { fetchExams } from "../../store/slices/examSlice";
import { fetchClasses } from "../../store/slices/classSlice";
import {
  getMarksheetsByClass,
  bulkUpdateMarks,
  getTeacherPermissions,
  submitMarksForReview,
} from "../../services/markService";
import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import useDebounce from "../../hooks/useDebounce";

const MarksEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examIdFromUrl = searchParams.get("examId");

  const dispatch = useDispatch();
  const { exams } = useSelector((state) => state.exams);
  const { classes } = useSelector((state) => state.classes);

  const [selectedExam, setSelectedExam] = useState(examIdFromUrl || "");
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [examSubjects, setExamSubjects] = useState([]);
  const [tempMarks, setTempMarks] = useState({});
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    dispatch(fetchExams({ limit: 100 }));
    dispatch(fetchClasses({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (selectedExam && selectedClass) {
      loadData();
    } else {
      setStudents([]);
      setPermissions(null);
      setExamSubjects([]);
      setTempMarks({});
    }
  }, [selectedExam, selectedClass]);

  const loadData = async () => {
    if (!selectedExam || !selectedClass) return;
    setIsLoading(true);
    try {
      const permRes = await getTeacherPermissions(selectedExam, selectedClass);
      setPermissions(permRes.data);

      const response = await getMarksheetsByClass(selectedExam, selectedClass);
      if (response.success && response.data) {
        const examData = exams.find(e => e._id === selectedExam);
        let subjects = response.data.subjects || [];
        
        if (examData && examData.schedule && examData.schedule.length > 0) {
          subjects = subjects.map(subject => {
            const scheduleItem = examData.schedule.find(
              s => s.subjectId === subject.subjectId || s.subjectId?._id === subject.subjectId
            );
            if (scheduleItem) {
              return {
                ...subject,
                theoryMaxMarks: scheduleItem.theoryMarks || scheduleItem.maxMarks || subject.maxMarks,
                practicalMaxMarks: scheduleItem.practicalMarks || 0,
                hasPractical: scheduleItem.practicalMarks > 0,
                maxMarks: subject.maxMarks || scheduleItem.maxMarks,
                passingMarks: subject.passingMarks || scheduleItem.passingMarks
              };
            }
            return subject;
          });
        }
        
        setExamSubjects(subjects);
        setStudents(response.data.students || []);
        
        const initialTempMarks = {};
        (response.data.students || []).forEach(student => {
          initialTempMarks[student.studentId] = {};
          (subjects || []).forEach(subject => {
            const studentSubject = student.subjects?.find(
              s => s.subjectId === subject.subjectId
            );
            initialTempMarks[student.studentId][subject.subjectId] = {
              theoryScore: studentSubject?.theoryScore || 0,
              practicalScore: studentSubject?.practicalScore || 0,
              totalScore: studentSubject?.totalScore || 0,
            };
          });
        });
        setTempMarks(initialTempMarks);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChange = (studentId, subjectId, field, value) => {
    let marks = value === "" || value === null ? "" : parseInt(value) || 0;
    
    const subject = examSubjects.find((s) => s.subjectId === subjectId);
    const maxMarks = field === "theoryScore" 
      ? (subject?.theoryMaxMarks || subject?.maxMarks || 100)
      : (subject?.practicalMaxMarks || subject?.maxMarks || 100);
    
    if (marks !== "" && marks !== null) {
      if (marks > maxMarks) marks = maxMarks;
      if (marks < 0) marks = 0;
    }

    setTempMarks((prev) => {
      const studentMarks = prev[studentId] || {};
      const subjectMarks = studentMarks[subjectId] || { theoryScore: 0, practicalScore: 0 };
      
      const updatedSubjectMarks = {
        ...subjectMarks,
        [field]: marks === "" ? 0 : marks,
      };
      
      const theoryVal = updatedSubjectMarks.theoryScore === "" ? 0 : updatedSubjectMarks.theoryScore;
      const practicalVal = updatedSubjectMarks.practicalScore === "" ? 0 : updatedSubjectMarks.practicalScore;
      updatedSubjectMarks.totalScore = theoryVal + practicalVal;
      
      return {
        ...prev,
        [studentId]: {
          ...studentMarks,
          [subjectId]: updatedSubjectMarks,
        },
      };
    });

    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId) {
          const updatedSubjects = s.subjects?.map((sub) => {
            if (sub.subjectId === subjectId) {
              const theoryVal = field === "theoryScore" ? (marks === "" ? 0 : marks) : (sub.theoryScore || 0);
              const practicalVal = field === "practicalScore" ? (marks === "" ? 0 : marks) : (sub.practicalScore || 0);
              return {
                ...sub,
                [field]: marks === "" ? 0 : marks,
                totalScore: theoryVal + practicalVal,
              };
            }
            return sub;
          }) || [];

          if (!updatedSubjects.find(sub => sub.subjectId === subjectId)) {
            const theoryVal = field === "theoryScore" ? (marks === "" ? 0 : marks) : 0;
            const practicalVal = field === "practicalScore" ? (marks === "" ? 0 : marks) : 0;
            updatedSubjects.push({
              subjectId: subjectId,
              theoryScore: theoryVal,
              practicalScore: practicalVal,
              totalScore: theoryVal + practicalVal,
            });
          }

          return {
            ...s,
            subjects: updatedSubjects,
          };
        }
        return s;
      }),
    );
  };

  const handleSave = async () => {
    if (!selectedExam || !selectedClass) {
      toast.error("Please select exam and class");
      return;
    }

    const studentsData = students.map((student) => ({
      studentId: student.studentId,
      subjects: examSubjects.map((subject) => {
        const studentSubject = student.subjects?.find(
          (s) => s.subjectId === subject.subjectId
        );
        return {
          subjectId: subject.subjectId,
          theoryScore: studentSubject?.theoryScore || 0,
          practicalScore: studentSubject?.practicalScore || 0,
          remarks: studentSubject?.remarks || "",
        };
      }),
      remarks: student.remarks || "",
    }));

    setIsSubmitting(true);
    try {
      await bulkUpdateMarks(selectedExam, selectedClass, studentsData);
      toast.success("Marks saved successfully");
      await loadData();
    } catch (error) {
      console.error("Failed to save marks:", error);
      toast.error(error.response?.data?.message || "Failed to save marks");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!permissions?.canSubmit) {
      toast.error("You don't have permission to submit for review");
      return;
    }
    
    if (!window.confirm("Submit all marks for review? You won't be able to edit after submission.")) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await submitMarksForReview(selectedExam, selectedClass);
      toast.success("Marks submitted for review successfully");
      await loadData();
    } catch (error) {
      console.error("Failed to submit marks:", error);
      toast.error(error.response?.data?.message || "Failed to submit marks");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStudentExpand = (studentId) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    students.forEach((s) => {
      allExpanded[s.studentId] = true;
    });
    setExpandedStudents(allExpanded);
  };

  const collapseAll = () => {
    setExpandedStudents({});
  };

  const filteredStudents = students.filter(
    (student) =>
      student.studentName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      student.rollNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      student.admissionNo?.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  const getGradeBadge = (marks, maxMarks) => {
    const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
    if (percentage >= 90) return { grade: "A+", color: "bg-emerald-100 text-emerald-800" };
    if (percentage >= 80) return { grade: "A", color: "bg-green-100 text-green-800" };
    if (percentage >= 70) return { grade: "B+", color: "bg-blue-100 text-blue-800" };
    if (percentage >= 60) return { grade: "B", color: "bg-cyan-100 text-cyan-800" };
    if (percentage >= 50) return { grade: "C+", color: "bg-yellow-100 text-yellow-800" };
    if (percentage >= 40) return { grade: "C", color: "bg-orange-100 text-orange-800" };
    if (percentage >= 33) return { grade: "D", color: "bg-red-100 text-red-800" };
    return { grade: "F", color: "bg-gray-100 text-gray-800" };
  };

  const getStudentTotalPercentage = (student) => {
    let totalObtained = 0;
    let totalMax = 0;
    examSubjects.forEach((subject) => {
      const studentSubject = student.subjects?.find(
        (s) => s.subjectId === subject.subjectId,
      );
      const marks = studentSubject?.totalScore || 0;
      totalObtained += marks;
      totalMax += subject.maxMarks;
    });
    return totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  };

  const selectedExamData = exams.find((e) => e._id === selectedExam);
  const hasEditPermission = permissions?.canEdit === true || permissions?.isAdmin === true || permissions?.isClassTeacher === true;

  const getExamClassIds = () => {
    if (!selectedExamData) return [];
    if (selectedExamData.classIds && Array.isArray(selectedExamData.classIds)) {
      return selectedExamData.classIds;
    }
    if (selectedExamData.classes && Array.isArray(selectedExamData.classes)) {
      return selectedExamData.classes;
    }
    return [];
  };

  const getClassDisplayName = (classItem) => {
    if (!classItem) return "Unknown";
    if (classItem.section) return `${classItem.name} - ${classItem.section}`;
    if (classItem.displayName) return classItem.displayName;
    return classItem.name || classItem._id;
  };

  const getClassById = (classId) => {
    if (typeof classId === "object" && classId !== null) return classId;
    return classes.find((c) => c._id === classId || c.id === classId);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
          <p className="text-gray-500 mt-1">Enter and manage student marks for exams</p>
        </div>
        <button
          onClick={() => navigate("/exams")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to Exams
        </button>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
          <select
            value={selectedExam}
            onChange={(e) => {
              setSelectedExam(e.target.value);
              setSelectedClass("");
              setStudents([]);
              setPermissions(null);
              setExamSubjects([]);
              setTempMarks({});
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">Choose an exam...</option>
            {exams.map((e) => (
              <option key={e._id} value={e._id}>
                {e.displayName || e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setStudents([]);
              setPermissions(null);
              setExamSubjects([]);
              setTempMarks({});
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-50"
            disabled={!selectedExam}
          >
            <option value="">Choose a class...</option>
            {getExamClassIds().map((classId) => {
              const classItem = getClassById(classId);
              if (!classItem) return null;
              return (
                <option key={classItem._id} value={classItem._id}>
                  {getClassDisplayName(classItem)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Subjects Info */}
      {examSubjects.length > 0 && selectedClass && (
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {examSubjects.map((subject) => (
              <div key={subject.subjectId} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {subject.subjectName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permission Info */}
      {permissions && (
        <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">
              {permissions.role?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-blue-700">Role: {permissions.role}</span>
              <span className="text-blue-700">Class Teacher: {permissions.isClassTeacher ? "Yes" : "No"}</span>
              <span className="text-blue-700">Can Edit: {hasEditPermission ? "Yes" : "No"}</span>
              <span className="text-blue-700">Can Submit: {permissions.canSubmit ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Expand/Collapse */}
      {selectedClass && students.length > 0 && hasEditPermission && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, roll number, or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}

      {/* Student Marks Table */}
      {selectedClass && filteredStudents.length > 0 && hasEditPermission && examSubjects.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Enter Marks for {selectedExamData?.displayName || selectedExamData?.name}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Class: {getClassDisplayName(getClassById(selectedClass))} | Total Students: {filteredStudents.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save All Marks'}</span>
              </button>
              {permissions?.canSubmit && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  <span>Submit for Review</span>
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredStudents.map((student) => {
              const totalPercentage = getStudentTotalPercentage(student);
              const totalGradeInfo = getGradeBadge(totalPercentage, 100);
              const isExpanded = expandedStudents[student.studentId];
              
              return (
                <div key={student.studentId} className="hover:bg-gray-50 transition-colors">
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleStudentExpand(student.studentId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-bold">
                        {student.studentName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{student.studentName}</p>
                        <p className="text-xs text-gray-500">Roll No: {student.rollNumber || '-'}</p>
                        <p className="text-xs text-gray-400">Admission: {student.admissionNo || student.studentCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700">
                          {totalPercentage.toFixed(1)}%
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${totalGradeInfo.color}`}>
                          {totalGradeInfo.grade}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {examSubjects.map((subject) => {
                            const theoryMarks = tempMarks[student.studentId]?.[subject.subjectId]?.theoryScore ?? 
                              (student.subjects?.find(s => s.subjectId === subject.subjectId)?.theoryScore || 0);
                            const practicalMarks = tempMarks[student.studentId]?.[subject.subjectId]?.practicalScore ??
                              (student.subjects?.find(s => s.subjectId === subject.subjectId)?.practicalScore || 0);
                            const totalMarks = theoryMarks + practicalMarks;
                            const percentage = subject.maxMarks > 0 ? (totalMarks / subject.maxMarks) * 100 : 0;
                            const gradeInfo = getGradeBadge(totalMarks, subject.maxMarks);
                            const theoryMax = subject.theoryMaxMarks || subject.maxMarks;
                            const practicalMax = subject.practicalMaxMarks || 0;
                            
                            return (
                              <div key={subject.subjectId} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-medium text-gray-800">{subject.subjectName}</span>
                                    {subject.hasPractical && practicalMax > 0 && (
                                      <p className="text-xs text-gray-400">
                                        Theory: {theoryMax} | Practical: {practicalMax}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${gradeInfo.color}`}>
                                    {gradeInfo.grade}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs text-gray-500">Theory Marks</label>
                                    <input
                                      type="number"
                                      value={theoryMarks}
                                      onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "theoryScore", e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-primary-500"
                                      min="0"
                                      max={theoryMax}
                                      placeholder="Enter marks"
                                    />
                                  </div>
                                  {subject.hasPractical && practicalMax > 0 && (
                                    <div>
                                      <label className="text-xs text-gray-500">Practical Marks</label>
                                      <input
                                        type="number"
                                        value={practicalMarks}
                                        onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "practicalScore", e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-primary-500"
                                        min="0"
                                        max={practicalMax}
                                        placeholder="Enter marks"
                                      />
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-1 border-t border-gray-100">
                                    <span className="text-sm font-medium">Total</span>
                                    <span className="text-sm font-semibold">{totalMarks} / {subject.maxMarks}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-gray-400">{percentage.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty States */}
      {selectedClass && filteredStudents.length === 0 && examSubjects.length > 0 && !isLoading && (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Students Found</h3>
          <p className="text-gray-500">No students found matching your search criteria</p>
        </div>
      )}

      {selectedExam && selectedClass && examSubjects.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="w-10 h-10 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Subjects Found</h3>
          <p className="text-gray-500">This exam doesn't have any subjects configured. Please add subjects to the exam first.</p>
        </div>
      )}

      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default MarksEntry;