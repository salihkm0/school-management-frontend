// src/pages/staff/StaffMarksEntry.jsx
import React, { useEffect, useState } from "react";
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
  LockClosedIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { fetchExams, fetchExamById } from "../../store/slices/examSlice";
import { fetchClasses } from "../../store/slices/classSlice";
import { fetchStaff } from "../../store/slices/staffSlice";
import { fetchAcademicYears } from "../../store/slices/academicYearSlice";
import { fetchTeacherClassTeacherClasses, clearTeacherClasses } from "../../store/slices/classSlice";
import {
  getMarksheetsByClass,
  bulkUpdateMarks,
  getTeacherPermissions,
  submitMarksForReview,
} from "../../services/markService";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import toast from "react-hot-toast";

const StaffMarksEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examIdFromUrl = searchParams.get("examId");
  const classIdFromUrl = searchParams.get("classId");

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { staff, isLoading: staffLoading } = useSelector((state) => state.staff);
  const { exams, isLoading: examsLoading } = useSelector((state) => state.exams);
  const { teacherClassTeacherClasses, isLoading: classesLoading } = useSelector((state) => state.classes);
  const { academicYears } = useSelector((state) => state.academicYears);

  const [myClasses, setMyClasses] = useState([]);
  const [mySubjectTeacherClasses, setMySubjectTeacherClasses] = useState([]);
  const [allMyClasses, setAllMyClasses] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(examIdFromUrl || "");
  const [selectedClass, setSelectedClass] = useState(classIdFromUrl || "");
  const [students, setStudents] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [examSubjects, setExamSubjects] = useState([]);
  const [tempMarks, setTempMarks] = useState({});
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [availableClassesForExam, setAvailableClassesForExam] = useState([]);

  useEffect(() => {
    loadInitialData();
    return () => {
      dispatch(clearTeacherClasses());
    };
  }, [dispatch]);

  useEffect(() => {
    if (academicYears.length > 0) {
      const currentYear = academicYears.find(y => y.isCurrent);
      setCurrentAcademicYear(currentYear);
    }
  }, [academicYears]);

  useEffect(() => {
    if (staff.length > 0 && user && currentAcademicYear && allMyClasses.length === 0) {
      getAllMyAssignedClasses();
    }
  }, [staff, user, currentAcademicYear]);

  useEffect(() => {
    if (allMyClasses.length > 0 && exams.length > 0) {
      filterAvailableExams();
    }
  }, [exams, allMyClasses]);

  useEffect(() => {
    if (selectedExam && allMyClasses.length > 0) {
      const examData = exams.find(e => e._id === selectedExam);
      if (examData && examData.classIds) {
        const examClassIds = examData.classIds.map(cid => cid._id || cid);
        const filteredClasses = allMyClasses.filter(cls => examClassIds.includes(cls._id));
        setAvailableClassesForExam(filteredClasses);
        
        if (selectedClass && !filteredClasses.find(c => c._id === selectedClass)) {
          setSelectedClass("");
          setStudents([]);
          setPermissions(null);
          setExamSubjects([]);
          setTempMarks({});
        }
      }
    }
  }, [selectedExam, allMyClasses, exams]);

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

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        dispatch(fetchExams({ limit: 100 })),
        dispatch(fetchClasses({ limit: 100 })),
        dispatch(fetchStaff({ limit: 100 })),
        dispatch(fetchAcademicYears({ limit: 10 }))
      ]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllMyAssignedClasses = async () => {
    const currentStaff = staff.find(s => {
      const staffUserId = s.userId?._id || s.userId;
      return staffUserId === user?.id;
    });
    
    if (!currentStaff) return;
    
    const staffId = currentStaff._id;
    
    try {
      const classTeacherResult = await dispatch(fetchTeacherClassTeacherClasses({ 
        teacherId: staffId, 
        academicYearId: currentAcademicYear?._id 
      })).unwrap();
      
      const classTeacherClasses = classTeacherResult?.data || [];
      setMyClasses(classTeacherClasses);
      
      const allClassesResult = await dispatch(fetchClasses({ limit: 100 })).unwrap();
      const classesList = allClassesResult.data || [];
      
      const subjectTeacherClasses = [];
      
      for (const classItem of classesList) {
        if (classItem.subjectTeachers && Array.isArray(classItem.subjectTeachers)) {
          const hasSubject = classItem.subjectTeachers.some(st => {
            const teacherIdMatch = st.teacherId?._id === staffId || st.teacherId === staffId;
            return teacherIdMatch;
          });
          if (hasSubject) {
            subjectTeacherClasses.push(classItem);
          }
        }
      }
      
      setMySubjectTeacherClasses(subjectTeacherClasses);
      
      const allAssigned = [...classTeacherClasses, ...subjectTeacherClasses];
      const uniqueClasses = Array.from(new Map(allAssigned.map(c => [c._id, c])).values());
      setAllMyClasses(uniqueClasses);
      
      if (classIdFromUrl && uniqueClasses.find(c => c._id === classIdFromUrl)) {
        setSelectedClass(classIdFromUrl);
      }
    } catch (error) {
      console.error("Failed to fetch teacher classes:", error);
    }
  };

  const filterAvailableExams = () => {
    const classIds = allMyClasses.map(c => c._id);
    const relevantExams = exams.filter(exam => {
      if (exam.classIds && Array.isArray(exam.classIds)) {
        const examClassIds = exam.classIds.map(cid => cid._id || cid);
        return examClassIds.some(cid => classIds.includes(cid));
      }
      return false;
    });
    
    relevantExams.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    setAvailableExams(relevantExams);
    
    if (examIdFromUrl && relevantExams.find(e => e._id === examIdFromUrl)) {
      setSelectedExam(examIdFromUrl);
    }
  };

  const loadData = async () => {
    if (!selectedExam || !selectedClass) return;
    setIsLoading(true);
    try {
      const permRes = await getTeacherPermissions(selectedExam, selectedClass);
      setPermissions(permRes.data);

      const examDataResponse = await dispatch(fetchExamById(selectedExam)).unwrap();
      const examData = examDataResponse.data || examDataResponse;

      const response = await getMarksheetsByClass(selectedExam, selectedClass);
      if (response.success && response.data) {
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

  const canEditSubject = (subjectId) => {
    if (permissions?.isClassTeacher) return true;
    if (permissions?.isAdmin) return true;
    if (permissions?.allowedSubjects && permissions.allowedSubjects.length > 0) {
      return permissions.allowedSubjects.some(s => s.subjectId === subjectId);
    }
    return false;
  };

  const hasEditPermission = permissions?.hasEditPermission === true || 
                            permissions?.isClassTeacher === true || 
                            permissions?.isAdmin === true ||
                            (permissions?.allowedSubjects && permissions.allowedSubjects.length > 0);

  const handleMarkChange = (studentId, subjectId, field, value) => {
    if (!canEditSubject(subjectId)) {
      toast.error("You don't have permission to edit this subject");
      return;
    }

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

  const selectedExamData = exams.find((e) => e._id === selectedExam);
  const isClassTeacher = permissions?.isClassTeacher === true;
  const isSubjectTeacher = permissions?.isSubjectTeacher === true;

  const getClassDisplayName = (classItem) => {
    if (!classItem) return "Unknown";
    if (classItem.section) return `${classItem.name} - ${classItem.section}`;
    if (classItem.displayName) return classItem.displayName;
    return classItem.name || classItem._id;
  };

  const filteredStudents = students.filter(
    (student) =>
      student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getGradeBadge = (marks, maxMarks) => {
    const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
    if (percentage >= 90) return { grade: "A+", color: "bg-emerald-100 text-emerald-700" };
    if (percentage >= 80) return { grade: "A", color: "bg-green-100 text-green-700" };
    if (percentage >= 70) return { grade: "B+", color: "bg-blue-100 text-blue-700" };
    if (percentage >= 60) return { grade: "B", color: "bg-cyan-100 text-cyan-700" };
    if (percentage >= 50) return { grade: "C+", color: "bg-amber-100 text-amber-700" };
    if (percentage >= 40) return { grade: "C", color: "bg-orange-100 text-orange-700" };
    if (percentage >= 33) return { grade: "D", color: "bg-rose-100 text-rose-700" };
    return { grade: "F", color: "bg-gray-100 text-gray-600" };
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

  const getCurrentMarkValue = (studentId, subjectId, field) => {
    const value = tempMarks[studentId]?.[subjectId]?.[field];
    return value === 0 ? "" : value || "";
  };

  if (isLoading || staffLoading || examsLoading || classesLoading) {
    return <LoadingSpinner />;
  }

  if (allMyClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No Classes Assigned</h3>
          <p className="text-sm text-gray-500">You are not assigned to any classes as a class teacher or subject teacher.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/staff-exams")} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Marks Entry</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isClassTeacher ? "Enter marks for all subjects" : isSubjectTeacher ? "Enter marks for your assigned subjects" : "View marks"}
            </p>
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Exam Selection */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-medium text-gray-900">Select Exam</h3>
              </div>
            </div>
            <div className="p-4">
              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setSelectedClass("");
                  setStudents([]);
                  setPermissions(null);
                  setExamSubjects([]);
                  setTempMarks({});
                  setAvailableClassesForExam([]);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="">Choose an exam...</option>
                {availableExams.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.displayName || e.name}
                  </option>
                ))}
              </select>
              {availableExams.length === 0 && allMyClasses.length > 0 && (
                <p className="text-xs text-amber-600 mt-2">No exams available for your classes.</p>
              )}
            </div>
          </div>

          {/* Class Selection */}
          {selectedExam && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-medium text-gray-900">Select Class</h3>
                </div>
              </div>
              <div className="p-4">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setStudents([]);
                    setPermissions(null);
                    setExamSubjects([]);
                    setTempMarks({});
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                  disabled={availableClassesForExam.length === 0}
                >
                  <option value="">Choose a class...</option>
                  {availableClassesForExam.map((cls) => {
                    const isClassTeacherClass = myClasses.some(c => c._id === cls._id);
                    const isSubjectTeacherClass = mySubjectTeacherClasses.some(c => c._id === cls._id);
                    const roleLabel = isClassTeacherClass ? "(Class Teacher)" : isSubjectTeacherClass ? "(Subject Teacher)" : "";
                    return (
                      <option key={cls._id} value={cls._id}>
                        {getClassDisplayName(cls)} {roleLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Permission Info Banner */}
        {permissions && selectedClass && (
          <div className={`rounded-lg p-3 mb-6 flex items-center gap-3 ${
            isClassTeacher ? 'bg-emerald-50 border border-emerald-200' : 
            isSubjectTeacher ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isClassTeacher ? 'bg-emerald-100' : isSubjectTeacher ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <span className={`text-xs font-bold ${
                isClassTeacher ? 'text-emerald-700' : isSubjectTeacher ? 'text-blue-700' : 'text-gray-600'
              }`}>
                {isClassTeacher ? 'CT' : isSubjectTeacher ? 'ST' : 'V'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-3 text-xs">
                <span className={isClassTeacher ? 'text-emerald-700' : isSubjectTeacher ? 'text-blue-700' : 'text-gray-700'}>
                  Role: {isClassTeacher ? 'Class Teacher' : isSubjectTeacher ? 'Subject Teacher' : 'View Only'}
                </span>
                <span className={isClassTeacher ? 'text-emerald-700' : isSubjectTeacher ? 'text-blue-700' : 'text-gray-700'}>
                  Edit: {hasEditPermission ? "Yes" : "No"}
                </span>
                {permissions?.canSubmit && <span className="text-amber-700">Submit: Yes</span>}
              </div>
              {isSubjectTeacher && permissions?.allowedSubjects && permissions.allowedSubjects.length > 0 && (
                <div className="mt-1 text-xs text-blue-600">
                  Your Subjects: {permissions.allowedSubjects.slice(0, 3).map(s => s.subjectName).join(', ')}
                  {permissions.allowedSubjects.length > 3 && ` +${permissions.allowedSubjects.length - 3}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subjects Info */}
        {examSubjects.length > 0 && selectedClass && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-6 overflow-x-auto">
            <div className="flex flex-wrap gap-2">
              {examSubjects.map((subject) => {
                const canEdit = canEditSubject(subject.subjectId);
                return (
                  <div key={subject.subjectId} className="relative group">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md ${
                      canEdit 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {!canEdit && <LockClosedIcon className="w-3 h-3" />}
                      {subject.subjectName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Actions */}
        {selectedClass && students.length > 0 && hasEditPermission && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={expandAll} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Expand All</button>
              <button onClick={collapseAll} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Collapse All</button>
            </div>
          </div>
        )}

        {/* Student Cards */}
        {selectedClass && filteredStudents.length > 0 && hasEditPermission && examSubjects.length > 0 && (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save All'}</span>
              </button>
              {permissions?.canSubmit && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Submit</span>
                </button>
              )}
            </div>

            {/* Student Cards */}
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const totalPercentage = getStudentTotalPercentage(student);
                const totalGradeInfo = getGradeBadge(totalPercentage, 100);
                const isExpanded = expandedStudents[student.studentId];
                
                return (
                  <div key={student.studentId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Student Header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleStudentExpand(student.studentId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                          {student.studentName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.studentName}</p>
                          <p className="text-xs text-gray-500">Roll: {student.rollNumber || '-'} | Adm: {student.admissionNo || student.studentCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{totalPercentage.toFixed(0)}%</div>
                          <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${totalGradeInfo.color}`}>
                            {totalGradeInfo.grade}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {examSubjects.map((subject) => {
                            const canEdit = canEditSubject(subject.subjectId);
                            const theoryMarks = tempMarks[student.studentId]?.[subject.subjectId]?.theoryScore ?? 
                              (student.subjects?.find(s => s.subjectId === subject.subjectId)?.theoryScore || 0);
                            const practicalMarks = tempMarks[student.studentId]?.[subject.subjectId]?.practicalScore ??
                              (student.subjects?.find(s => s.subjectId === subject.subjectId)?.practicalScore || 0);
                            const totalMarks = (theoryMarks === "" ? 0 : theoryMarks) + (practicalMarks === "" ? 0 : practicalMarks);
                            const percentage = subject.maxMarks > 0 ? (totalMarks / subject.maxMarks) * 100 : 0;
                            const gradeInfo = getGradeBadge(totalMarks, subject.maxMarks);
                            const theoryMax = subject.theoryMaxMarks || subject.maxMarks;
                            const practicalMax = subject.practicalMaxMarks || 0;
                            
                            return (
                              <div key={subject.subjectId} className="bg-white rounded-md border border-gray-200 p-3">
                                <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium text-gray-900">{subject.subjectName}</span>
                                    {!canEdit && <LockClosedIcon className="w-3 h-3 text-gray-400" />}
                                  </div>
                                  <span className={`px-1.5 py-0.5 text-xs rounded ${gradeInfo.color}`}>
                                    {gradeInfo.grade}
                                  </span>
                                </div>
                                
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs text-gray-500">Theory (Max: {theoryMax})</label>
                                    <input
                                      type="number"
                                      value={theoryMarks || ''}
                                      onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "theoryScore", e.target.value)}
                                      disabled={!canEdit}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                                      min="0"
                                      max={theoryMax}
                                      placeholder="0"
                                    />
                                  </div>
                                  
                                  {subject.hasPractical && practicalMax > 0 && (
                                    <div>
                                      <label className="text-xs text-gray-500">Practical (Max: {practicalMax})</label>
                                      <input
                                        type="number"
                                        value={practicalMarks || ''}
                                        onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "practicalScore", e.target.value)}
                                        disabled={!canEdit}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                                        min="0"
                                        max={practicalMax}
                                        placeholder="0"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center pt-1 text-xs">
                                    <span className="text-gray-500">Total</span>
                                    <span className="font-semibold text-gray-900">{totalMarks} / {subject.maxMarks}</span>
                                    <span className="text-gray-400">{percentage.toFixed(0)}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky Save Button */}
            <div className="sticky bottom-4 bg-white rounded-lg border border-gray-200 p-3 shadow-lg">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save All Marks'}</span>
              </button>
            </div>
          </div>
        )}

        {/* No Permission State */}
        {selectedClass && !hasEditPermission && examSubjects.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <LockClosedIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">View Only Mode</h3>
            <p className="text-sm text-gray-500">You don't have permission to edit marks for this exam.</p>
          </div>
        )}

        {/* Empty States */}
        {selectedClass && filteredStudents.length === 0 && examSubjects.length > 0 && !isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">No Students Found</h3>
            <p className="text-sm text-gray-500">No students match your search criteria.</p>
          </div>
        )}

        {selectedExam && selectedClass && examSubjects.length === 0 && !isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <BookOpenIcon className="w-12 h-12 text-amber-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">No Subjects Found</h3>
            <p className="text-sm text-gray-500">This exam has no subjects configured.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffMarksEntry;