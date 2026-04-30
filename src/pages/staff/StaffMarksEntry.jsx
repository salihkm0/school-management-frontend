// src/pages/staff/StaffMarksEntry.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpenIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  ChartBarIcon,
  LockClosedIcon,
  PencilIcon
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
  const { classes } = useSelector((state) => state.classes);
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
      // Get classes where teacher is CLASS TEACHER
      const classTeacherResult = await dispatch(fetchTeacherClassTeacherClasses({ 
        teacherId: staffId, 
        academicYearId: currentAcademicYear?._id 
      })).unwrap();
      
      const classTeacherClasses = classTeacherResult?.data || [];
      setMyClasses(classTeacherClasses);
      
      // Get classes where teacher is SUBJECT TEACHER from the classes list
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
      
      // Combine both sets of classes (unique)
      const allAssigned = [...classTeacherClasses, ...subjectTeacherClasses];
      const uniqueClasses = Array.from(new Map(allAssigned.map(c => [c._id, c])).values());
      setAllMyClasses(uniqueClasses);
      
      console.log('Class Teacher Classes:', classTeacherClasses.map(c => c.displayName || `${c.name}-${c.section}`));
      console.log('Subject Teacher Classes:', subjectTeacherClasses.map(c => c.displayName || `${c.name}-${c.section}`));
      console.log('All Classes:', uniqueClasses.map(c => c.displayName || `${c.name}-${c.section}`));
      
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
    
    console.log('Available Exams:', relevantExams.map(e => e.displayName || e.name));
    
    if (examIdFromUrl && relevantExams.find(e => e._id === examIdFromUrl)) {
      setSelectedExam(examIdFromUrl);
    }
  };

  const loadData = async () => {
    if (!selectedExam || !selectedClass) return;
    setIsLoading(true);
    try {
      // Get permissions
      const permRes = await getTeacherPermissions(selectedExam, selectedClass);
      setPermissions(permRes.data);
      
      console.log('Permissions:', permRes.data);

      // Get exam data with subjects
      const examDataResponse = await dispatch(fetchExamById(selectedExam)).unwrap();
      const examData = examDataResponse.data || examDataResponse;

      // Get all marksheets for this class and exam
      const response = await getMarksheetsByClass(selectedExam, selectedClass);
      if (response.success && response.data) {
        let subjects = response.data.subjects || [];
        
        // Enhance subjects with exam data
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
        
        // Initialize temp marks with existing values
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
    // Class teacher can edit all subjects
    if (permissions?.isClassTeacher) return true;
    // Admin can edit all subjects
    if (permissions?.isAdmin) return true;
    // Subject teacher can edit only their assigned subjects
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

    // Update the actual student data for save operation
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
  const isClassTeacherClass = myClasses.some(c => c._id === selectedClass);
  const isSubjectTeacherClass = mySubjectTeacherClasses.some(c => c._id === selectedClass);

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

  const getCurrentMarkValue = (studentId, subjectId, field) => {
    const value = tempMarks[studentId]?.[subjectId]?.[field];
    return value === 0 ? "" : value || "";
  };

  if (isLoading || staffLoading || examsLoading || classesLoading) {
    return <LoadingSpinner />;
  }

  if (allMyClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Classes Assigned
            </h3>
            <p className="text-gray-500">
              You are not assigned to any classes as a class teacher or subject teacher.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-xl p-3">
                <BookOpenIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Marks Entry</h1>
                <p className="text-emerald-100 mt-1">
                  {isClassTeacher 
                    ? "Enter marks for all subjects (Class Teacher)" 
                    : isSubjectTeacher 
                    ? "Enter marks for your assigned subjects (Subject Teacher)"
                    : "View marks"}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/staff-exams")}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              Back to Exams
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-800">Select Exam</h3>
            </div>
          </div>
          <div className="p-5">
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="">Choose an exam...</option>
              {availableExams.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.displayName || e.name}
                </option>
              ))}
            </select>
            {availableExams.length === 0 && allMyClasses.length > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No exams available for your classes. Please check back later.
              </p>
            )}
          </div>
        </div>

        {/* Class Selection */}
        {selectedExam && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">Select Class</h3>
              </div>
            </div>
            <div className="p-5">
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setStudents([]);
                  setPermissions(null);
                  setExamSubjects([]);
                  setTempMarks({});
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
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
              {availableClassesForExam.length === 0 && selectedExam && (
                <p className="text-sm text-amber-600 mt-2">
                  This exam is not available for any of your classes.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Role Info Banner */}
        {permissions && selectedClass && (
          <div className={`rounded-xl p-4 mb-6 flex items-center space-x-3 ${
            isClassTeacher ? 'bg-emerald-50' : isSubjectTeacher ? 'bg-blue-50' : 'bg-gray-50'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isClassTeacher ? 'bg-emerald-100' : isSubjectTeacher ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <span className={`font-bold ${
                isClassTeacher ? 'text-emerald-600' : isSubjectTeacher ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {isClassTeacher ? 'CT' : isSubjectTeacher ? 'ST' : 'V'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className={isClassTeacher ? 'text-emerald-700' : isSubjectTeacher ? 'text-blue-700' : 'text-gray-700'}>
                  <strong>Role:</strong> {isClassTeacher ? 'Class Teacher' : isSubjectTeacher ? 'Subject Teacher' : 'View Only'}
                </span>
                <span className={isClassTeacher ? 'text-emerald-700' : isSubjectTeacher ? 'text-blue-700' : 'text-gray-700'}>
                  <strong>Can Edit:</strong> {hasEditPermission ? "Yes" : "No"}
                </span>
                {permissions?.canSubmit && (
                  <span className="text-amber-700">
                    <strong>Can Submit:</strong> Yes
                  </span>
                )}
              </div>
              {isSubjectTeacher && permissions?.allowedSubjects && permissions.allowedSubjects.length > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  <strong>Your Subjects:</strong> {permissions.allowedSubjects.map(s => s.subjectName).join(', ')}
                </div>
              )}
              {isSubjectTeacherClass && !isClassTeacher && (
                <div className="mt-2 text-xs text-blue-600">
                  📝 You are a subject teacher for this class. You can only edit your assigned subjects.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subjects Info */}
        {examSubjects.length > 0 && selectedClass && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Subjects for this Exam
              </h3>
              <span className="text-xs text-gray-500">
                {examSubjects.length} subjects
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {examSubjects.map((subject) => {
                const canEdit = canEditSubject(subject.subjectId);
                return (
                  <div key={subject.subjectId} className="group relative">
                    <span className={`px-3 py-1 rounded-full text-sm cursor-help flex items-center gap-1 ${
                      canEdit 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {!canEdit && <LockClosedIcon className="w-3 h-3" />}
                      {subject.subjectName}
                      {!canEdit && <span className="text-xs ml-1">(View Only)</span>}
                      {canEdit && !isClassTeacher && <span className="text-xs ml-1">(Editable)</span>}
                    </span>
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                      Theory: {subject.theoryMaxMarks || subject.maxMarks} | 
                      {subject.hasPractical && ` Practical: ${subject.practicalMaxMarks} | `}
                      Total: {subject.maxMarks} | Pass: {subject.passingMarks}
                      {!canEdit && " | You cannot edit this subject"}
                      {canEdit && !isClassTeacher && " | You can edit this subject"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Actions Bar */}
        {selectedClass && students.length > 0 && hasEditPermission && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, roll number, or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              />
              <svg
                className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
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

        {/* Marks Entry Table */}
        {selectedClass &&
          filteredStudents.length > 0 &&
          hasEditPermission &&
          examSubjects.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Enter Marks for {selectedExamData?.displayName || selectedExamData?.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Class: {getClassDisplayName(availableClassesForExam.find(c => c._id === selectedClass))} |
                    Total Students: {filteredStudents.length}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Save All Marks</span>
                      </>
                    )}
                  </button>
                  {permissions?.canSubmit && (
                    <button
                      onClick={handleSubmitForReview}
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <ChartBarIcon className="w-4 h-4" />
                      <span>Submit for Review</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredStudents.map((student, idx) => {
                  const totalPercentage = getStudentTotalPercentage(student);
                  const totalGradeInfo = getGradeBadge(totalPercentage, 100);
                  const isExpanded = expandedStudents[student.studentId];

                  return (
                    <div
                      key={student.studentId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="px-6 py-4 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleStudentExpand(student.studentId)}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                            {student.studentName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-gray-800">
                                {student.studentName}
                              </h3>
                              <span className="text-xs text-gray-400">
                                #{student.rollNumber || "N/A"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Admission: {student.admissionNo || student.studentCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-700">
                              {totalPercentage.toFixed(1)}%
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${totalGradeInfo.color}`}
                            >
                              {totalGradeInfo.grade}
                            </span>
                          </div>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                <div
                                  key={subject.subjectId}
                                  className={`bg-white rounded-xl p-4 shadow-sm border ${
                                    canEdit ? 'border-gray-100' : 'border-gray-200 bg-gray-50'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-800">
                                          {subject.subjectName}
                                        </h4>
                                        {!canEdit && (
                                          <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <LockClosedIcon className="w-3 h-3" />
                                            View Only
                                          </span>
                                        )}
                                        {canEdit && !isClassTeacher && (
                                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                                            <PencilIcon className="w-3 h-3" />
                                            Editable
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-400">
                                        Total: {subject.maxMarks} | Pass: {subject.passingMarks}
                                      </p>
                                      {subject.hasPractical && (
                                        <p className="text-xs text-gray-400">
                                          Theory: {theoryMax} | Practical: {practicalMax}
                                        </p>
                                      )}
                                    </div>
                                    <span
                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${gradeInfo.color}`}
                                    >
                                      {gradeInfo.grade}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    <div>
                                      <label className="text-xs text-gray-500">
                                        Theory Marks (Max: {theoryMax})
                                      </label>
                                      <input
                                        type="number"
                                        value={getCurrentMarkValue(student.studentId, subject.subjectId, "theoryScore")}
                                        onChange={(e) =>
                                          handleMarkChange(
                                            student.studentId,
                                            subject.subjectId,
                                            "theoryScore",
                                            e.target.value,
                                          )
                                        }
                                        disabled={!canEdit}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                                          canEdit 
                                            ? 'border-gray-200 bg-white' 
                                            : 'border-gray-200 bg-gray-100 text-gray-500'
                                        }`}
                                        min="0"
                                        max={theoryMax}
                                        placeholder="Enter marks"
                                      />
                                    </div>
                                    
                                    {subject.hasPractical && practicalMax > 0 && (
                                      <div>
                                        <label className="text-xs text-gray-500">
                                          Practical Marks (Max: {practicalMax})
                                        </label>
                                        <input
                                          type="number"
                                          value={getCurrentMarkValue(student.studentId, subject.subjectId, "practicalScore")}
                                          onChange={(e) =>
                                            handleMarkChange(
                                              student.studentId,
                                              subject.subjectId,
                                              "practicalScore",
                                              e.target.value,
                                            )
                                          }
                                          disabled={!canEdit}
                                          onClick={(e) => e.stopPropagation()}
                                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                                            canEdit 
                                              ? 'border-gray-200 bg-white' 
                                              : 'border-gray-200 bg-gray-100 text-gray-500'
                                          }`}
                                          min="0"
                                          max={practicalMax}
                                          placeholder="Enter marks"
                                        />
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center pt-2 border-t">
                                      <span className="text-sm font-medium">
                                        Total: {totalMarks} / {subject.maxMarks}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {percentage.toFixed(1)}%
                                      </span>
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

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving All Marks...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Save All Records</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        {selectedClass && !hasEditPermission && examSubjects.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LockClosedIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              View Only Mode
            </h3>
            <p className="text-gray-500">
              You don't have permission to edit marks for this exam and class.
            </p>
          </div>
        )}

        {selectedClass &&
          filteredStudents.length === 0 &&
          !isLoading &&
          examSubjects.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Students Found
              </h3>
              <p className="text-gray-500">
                No students found matching your search criteria
              </p>
            </div>
          )}

        {selectedExam &&
          selectedClass &&
          examSubjects.length === 0 &&
          !isLoading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpenIcon className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Subjects Found
              </h3>
              <p className="text-gray-500">
                This exam doesn't have any subjects configured. Please contact the administrator.
              </p>
            </div>
          )}

        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
};

export default StaffMarksEntry;