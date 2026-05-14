// src/components/exams/MarksEntry.jsx
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
  MagnifyingGlassIcon,
  XMarkIcon,
  PaperAirplaneIcon,
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
                ceEnabled: scheduleItem.ceEnabled || false,
                ceMaxMarks: scheduleItem.ceMaxMarks || 0,
                maxMarks: (subject.maxMarks || scheduleItem.maxMarks) + (scheduleItem.ceMaxMarks || 0),
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
              ceMarks: studentSubject?.ceMarks || 0,
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
    let maxMarks = 0;
    if (field === "theoryScore") {
      maxMarks = subject?.theoryMaxMarks || subject?.maxMarks || 100;
    } else if (field === "practicalScore") {
      maxMarks = subject?.practicalMaxMarks || 0;
    } else if (field === "ceMarks") {
      maxMarks = subject?.ceMaxMarks || 0;
    }
    
    if (marks !== "" && marks !== null) {
      if (marks > maxMarks) marks = maxMarks;
      if (marks < 0) marks = 0;
    }

    setTempMarks((prev) => {
      const studentMarks = prev[studentId] || {};
      const subjectMarks = studentMarks[subjectId] || { theoryScore: 0, practicalScore: 0, ceMarks: 0 };
      
      const updatedSubjectMarks = {
        ...subjectMarks,
        [field]: marks === "" ? 0 : marks,
      };
      
      const theoryVal = updatedSubjectMarks.theoryScore === "" ? 0 : updatedSubjectMarks.theoryScore;
      const practicalVal = updatedSubjectMarks.practicalScore === "" ? 0 : updatedSubjectMarks.practicalScore;
      const ceVal = updatedSubjectMarks.ceMarks === "" ? 0 : updatedSubjectMarks.ceMarks;
      updatedSubjectMarks.totalScore = theoryVal + practicalVal + ceVal;
      
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
              const ceVal = field === "ceMarks" ? (marks === "" ? 0 : marks) : (sub.ceMarks || 0);
              return {
                ...sub,
                [field]: marks === "" ? 0 : marks,
                totalScore: theoryVal + practicalVal + ceVal,
              };
            }
            return sub;
          }) || [];

          if (!updatedSubjects.find(sub => sub.subjectId === subjectId)) {
            const theoryVal = field === "theoryScore" ? (marks === "" ? 0 : marks) : 0;
            const practicalVal = field === "practicalScore" ? (marks === "" ? 0 : marks) : 0;
            const ceVal = field === "ceMarks" ? (marks === "" ? 0 : marks) : 0;
            updatedSubjects.push({
              subjectId: subjectId,
              theoryScore: theoryVal,
              practicalScore: practicalVal,
              ceMarks: ceVal,
              totalScore: theoryVal + practicalVal + ceVal,
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
          ceMarks: studentSubject?.ceMarks || 0,
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
    if (percentage >= 90) return { grade: "A+", color: "bg-emerald-100 text-emerald-700" };
    if (percentage >= 80) return { grade: "A", color: "bg-green-100 text-green-700" };
    if (percentage >= 70) return { grade: "B+", color: "bg-blue-100 text-blue-700" };
    if (percentage >= 60) return { grade: "B", color: "bg-cyan-100 text-cyan-700" };
    if (percentage >= 50) return { grade: "C+", color: "bg-yellow-100 text-yellow-700" };
    if (percentage >= 40) return { grade: "C", color: "bg-orange-100 text-orange-700" };
    if (percentage >= 33) return { grade: "D", color: "bg-red-100 text-red-700" };
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
    <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Marks Entry</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enter student marks for exams</p>
        </div>
        <button
          onClick={() => navigate("/exams")}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Exams
        </button>
      </div>

      {/* Selection Cards - Stack on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Select Exam</h3>
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
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">Choose an exam...</option>
              {exams.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.displayName || e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Select Class</h3>
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white disabled:bg-gray-50"
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
      </div>

      {/* Subjects Info - Horizontal scroll on mobile */}
      {examSubjects.length > 0 && selectedClass && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-5 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {examSubjects.map((subject) => (
              <div key={subject.subjectId} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full whitespace-nowrap">
                {subject.subjectName}
                {subject.ceEnabled && <span className="ml-1 text-gray-500">(CE)</span>}
                {subject.hasPractical && <span className="ml-1 text-gray-500">(P)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permission Info - Compact */}
      {permissions && (
        <div className="bg-blue-50 rounded-lg p-3 mb-5">
          <div className="flex flex-wrap gap-3 text-xs text-blue-700">
            <span>Role: {permissions.role}</span>
            <span>Class Teacher: {permissions.isClassTeacher ? "Yes" : "No"}</span>
            <span>Edit: {hasEditPermission ? "Yes" : "No"}</span>
            <span>Submit: {permissions.canSubmit ? "Yes" : "No"}</span>
          </div>
        </div>
      )}

      {/* Search and Expand/Collapse */}
      {selectedClass && students.length > 0 && hasEditPermission && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student..."
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
            <button onClick={expandAll} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Expand All
            </button>
            <button onClick={collapseAll} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Collapse All
            </button>
          </div>
        </div>
      )}

      {/* Student Marks Table */}
      {selectedClass && filteredStudents.length > 0 && hasEditPermission && examSubjects.length > 0 && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save All'}</span>
            </button>
            {permissions?.canSubmit && (
              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                <span>Submit</span>
              </button>
            )}
          </div>

          {/* Student Cards - Mobile friendly */}
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const totalPercentage = getStudentTotalPercentage(student);
              const totalGradeInfo = getGradeBadge(totalPercentage, 100);
              const isExpanded = expandedStudents[student.studentId];
              
              return (
                <div key={student.studentId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Student Header - Clickable */}
                  <div
                    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleStudentExpand(student.studentId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                          {student.studentName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{student.studentName}</p>
                          <p className="text-xs text-gray-500">Roll: {student.rollNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{totalPercentage.toFixed(0)}%</div>
                        <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${totalGradeInfo.color}`}>
                          {totalGradeInfo.grade}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Subject Cards - Mobile responsive */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 bg-gray-50">
                      <div className="space-y-2">
                        {examSubjects.map((subject) => {
                          const theoryMarks = tempMarks[student.studentId]?.[subject.subjectId]?.theoryScore ?? 
                            (student.subjects?.find(s => s.subjectId === subject.subjectId)?.theoryScore || 0);
                          const practicalMarks = tempMarks[student.studentId]?.[subject.subjectId]?.practicalScore ??
                            (student.subjects?.find(s => s.subjectId === subject.subjectId)?.practicalScore || 0);
                          const ceMarks = subject.ceEnabled ? (tempMarks[student.studentId]?.[subject.subjectId]?.ceMarks ??
                            (student.subjects?.find(s => s.subjectId === subject.subjectId)?.ceMarks || 0)) : 0;
                          const totalMarks = theoryMarks + practicalMarks + ceMarks;
                          const percentage = subject.maxMarks > 0 ? (totalMarks / subject.maxMarks) * 100 : 0;
                          const gradeInfo = getGradeBadge(totalMarks, subject.maxMarks);
                          const theoryMax = subject.theoryMaxMarks || subject.maxMarks;
                          const practicalMax = subject.practicalMaxMarks || 0;
                          const ceMax = subject.ceMaxMarks || 0;
                          const hasCE = subject.ceEnabled && ceMax > 0;
                          const hasPractical = subject.hasPractical && practicalMax > 0;
                          
                          return (
                            <div key={subject.subjectId} className="bg-white rounded-lg border border-gray-200 p-3">
                              {/* Subject Title */}
                              <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-900">{subject.subjectName}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${gradeInfo.color}`}>
                                  {gradeInfo.grade}
                                </span>
                              </div>
                              
                              {/* Marks Inputs - Inline layout for mobile */}
                              <div className="space-y-2">
                                {/* Theory Row */}
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500 w-14 flex-shrink-0">Theory</label>
                                  <input
                                    type="number"
                                    value={theoryMarks || ''}
                                    onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "theoryScore", e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    min="0"
                                    max={theoryMax}
                                    placeholder="0"
                                  />
                                  <span className="text-xs text-gray-400 w-12 text-right">/ {theoryMax}</span>
                                </div>
                                
                                {/* Practical Row */}
                                {hasPractical && (
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 w-14 flex-shrink-0">Practical</label>
                                    <input
                                      type="number"
                                      value={practicalMarks || ''}
                                      onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "practicalScore", e.target.value)}
                                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      min="0"
                                      max={practicalMax}
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-gray-400 w-12 text-right">/ {practicalMax}</span>
                                  </div>
                                )}
                                
                                {/* CE Row - Inline like theory/practical */}
                                {hasCE && (
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 w-14 flex-shrink-0">CE</label>
                                    <input
                                      type="number"
                                      value={ceMarks || ''}
                                      onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "ceMarks", e.target.value)}
                                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      min="0"
                                      max={ceMax}
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-gray-400 w-12 text-right">/ {ceMax}</span>
                                  </div>
                                )}
                                
                                {/* Total Summary */}
                                <div className="flex justify-between items-center pt-1 text-xs border-t border-gray-100">
                                  <span className="text-gray-500">Total</span>
                                  <div className="text-right">
                                    <span className="font-semibold text-gray-900">{totalMarks} / {subject.maxMarks}</span>
                                    <span className="text-gray-400 ml-2">({percentage.toFixed(1)}%)</span>
                                  </div>
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

          {/* Save Footer - Mobile sticky */}
          <div className="sticky bottom-4 bg-white rounded-lg border border-gray-200 p-3 shadow-lg">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save All Marks'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty States */}
      {selectedClass && filteredStudents.length === 0 && examSubjects.length > 0 && !isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-800 mb-1">No Students Found</h3>
          <p className="text-sm text-gray-500">No students match your search</p>
        </div>
      )}

      {selectedExam && selectedClass && examSubjects.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <BookOpenIcon className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-800 mb-1">No Subjects Found</h3>
          <p className="text-sm text-gray-500">Add subjects to the exam first</p>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;