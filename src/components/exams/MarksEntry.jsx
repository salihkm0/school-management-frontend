/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, no-unused-vars, no-use-before-define */
// src/components/exams/MarksEntry.jsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpenIcon,
  UserGroupIcon,
  LockClosedIcon,
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
  const hasEditPermission = permissions?.canEdit === true || permissions?.isAdmin === true || permissions?.isClassTeacher === true;
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const dirtyStudents = useRef(new Set());
  const [examSubjects, setExamSubjects] = useState([]);
  const [tempMarks, setTempMarks] = useState({});
  const [languageMapping, setLanguageMapping] = useState({});
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const canEditSubject = () => hasEditPermission;

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
      setLanguageMapping({});
    }
  }, [selectedExam, selectedClass]);

  async function loadData() {
    if (!selectedExam || !selectedClass) return;
    setIsLoading(true);
    try {
      const permRes = await getTeacherPermissions(selectedExam, selectedClass);
      setPermissions(permRes.data);

      const response = await getMarksheetsByClass(selectedExam, selectedClass);
      if (response.success && response.data) {
        // Set subjects - these already have displayName (actual subject names)
        setExamSubjects(response.data.subjects || []);
        setStudents(response.data.students || []);
        setLanguageMapping(response.data.languageMapping || {});
        
        // Initialize temp marks
        const initialTempMarks = {};
        (response.data.students || []).forEach(student => {
          initialTempMarks[student.studentId] = {};
          (student.subjects || []).forEach(subject => {
            const subjectKey = subject.examSubjectId || subject.subjectId;
            const isActuallyEntered = subject.isEntered || subject.theoryScore > 0 || subject.practicalScore > 0 || (subject.ceScore || subject.ceMarks) > 0 || subject.isAbsent;
            initialTempMarks[student.studentId][subjectKey] = {
              isAbsent: subject.isAbsent || false,
              theoryScore: isActuallyEntered ? (subject.theoryScore ?? 0) : "",
              practicalScore: isActuallyEntered ? (subject.practicalScore ?? 0) : "",
              ceMarks: isActuallyEntered ? (subject.ceScore ?? subject.ceMarks ?? 0) : "",
              totalScore: subject.totalScore || 0,
              isEntered: isActuallyEntered,
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

  const handleMarkChange = (studentId, examSubjectId, field, value) => {
    if (!canEditSubject(examSubjectId)) {
      toast.error("You don't have permission to edit this subject");
      return;
    }

    const subject = examSubjects.find(
      (s) => s.examSubjectId?.toString() === examSubjectId?.toString()
    );
    if (!subject) return;

    let parsed = value === "" ? "" : parseInt(value, 10);
    if (typeof parsed === "number" && !isNaN(parsed)) {
      let max = 0;
      if (field === "theoryScore") max = subject.theoryMaxMarks || subject.termMaxMarks || subject.maxMarks || 100;
      else if (field === "practicalScore") max = subject.practicalMaxMarks || 0;
      else if (field === "ceMarks") max = subject.ceMaxMarks || 0;
      if (parsed > max) parsed = max;
      if (parsed < 0) parsed = 0;
    }

    // Mark this student as dirty (has unsaved changes)
    dirtyStudents.current.add(studentId);

    setTempMarks((prev) => {
      const sm = { ...(prev[studentId] || {}) };
      const curr = sm[examSubjectId] || { theoryScore: "", practicalScore: "", ceMarks: "", isAbsent: false, isEntered: false };
      sm[examSubjectId] = { ...curr, [field]: parsed, isEntered: true };
      return { ...prev, [studentId]: sm };
    });
  };

  

  const handleAbsentToggle = (studentId, examSubjectId) => {
    if (!canEditSubject(examSubjectId)) {
      toast.error("You don't have permission to edit this subject");
      return;
    }
    // Mark as dirty
    dirtyStudents.current.add(studentId);
    setTempMarks((prev) => {
      const sm = { ...(prev[studentId] || {}) };
      const curr = sm[examSubjectId] || { theoryScore: 0, practicalScore: 0, ceMarks: 0, isAbsent: false };
      const nowAbsent = !curr.isAbsent;
      sm[examSubjectId] = {
        ...curr,
        isAbsent: nowAbsent,
        theoryScore: nowAbsent ? 0 : curr.theoryScore,
        practicalScore: nowAbsent ? 0 : curr.practicalScore,
        ceMarks: nowAbsent ? 0 : curr.ceMarks,
      };
      return { ...prev, [studentId]: sm };
    });
  };

  

  const handleSave = async () => {
    if (!selectedExam || !selectedClass) {
      toast.error("Please select exam and class");
      return;
    }

    // ── Only send students that were actually changed ──
    const isDirtyMode = dirtyStudents.current.size > 0;
    const targetStudents = isDirtyMode
      ? filteredStudents.filter((s) => dirtyStudents.current.has(s.studentId))
      : filteredStudents; // fallback: send all if nothing dirty (edge case)

    if (targetStudents.length === 0) {
      toast("No changes to save.", { icon: "ℹ️" });
      return;
    }

    const studentsData = targetStudents.map((student) => ({
      studentId: student.studentId,
      subjects: student.subjects.map((subject) => {
        const key = subject.examSubjectId || subject.subjectId;
        const tm = tempMarks[student.studentId]?.[key] || {};
        return {
          examSubjectId: subject.examSubjectId || subject.subjectId,
          subjectId: subject.actualSubjectId || subject.subjectId,
          theoryScore: (tm.theoryScore === "" ? 0 : tm.theoryScore) ?? subject.theoryScore ?? 0,
          practicalScore: (tm.practicalScore === "" ? 0 : tm.practicalScore) ?? subject.practicalScore ?? 0,
          ceMarks: (tm.ceMarks === "" ? 0 : tm.ceMarks) ?? (subject.ceMarks || subject.ceScore) ?? 0,
          isAbsent: tm.isAbsent ?? subject.isAbsent ?? false,
          remarks: subject.remarks || "",
        };
      }),
      remarks: student.remarks || "",
    }));

    setIsSubmitting(true);
    try {
      await bulkUpdateMarks(selectedExam, selectedClass, studentsData);
      toast.success(`Saved marks for ${targetStudents.length} student${targetStudents.length !== 1 ? 's' : ''}!`);
      dirtyStudents.current.clear(); // clear dirty set after successful save
      await loadData();
    } catch (e) {
      console.error("Failed to save marks:", e);
      toast.error(e.response?.data?.message || "Failed to save marks");
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

  const getGradeInfo = (obtained, max) => {
    const pct = max > 0 ? (obtained / max) * 100 : 0;
    if (pct >= 90) return { grade: "A+", color: "text-emerald-600 bg-emerald-50" };
    if (pct >= 80) return { grade: "A", color: "text-green-600 bg-green-50" };
    if (pct >= 70) return { grade: "B+", color: "text-blue-600 bg-blue-50" };
    if (pct >= 60) return { grade: "B", color: "text-cyan-600 bg-cyan-50" };
    if (pct >= 50) return { grade: "C+", color: "text-yellow-600 bg-yellow-50" };
    if (pct >= 40) return { grade: "C", color: "text-orange-600 bg-orange-50" };
    if (pct >= 33) return { grade: "D", color: "text-red-500 bg-red-50" };
    return { grade: "F", color: "text-gray-500 bg-gray-100" };
  };
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
    student.subjects?.forEach((subject) => {
      const marks = subject.totalScore || 0;
      totalObtained += marks;
      totalMax += subject.maxMarks || 0;
    });
    return totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  };

  const selectedExamData = exams.find((e) => e._id === selectedExam);
  

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
                if(dirtyStudents.current) dirtyStudents.current.clear();
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

      {/* Subjects Info - Shows actual subject names */}
      {examSubjects.length > 0 && selectedClass && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-5 overflow-x-auto">
          <div className="flex flex-wrap gap-2">
            {examSubjects.map((subject) => (
              <div 
                key={subject.examSubjectId} 
                className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full whitespace-nowrap"
                title={subject.paperType || (subject.isLanguageSubject ? 'Language Subject' : 'Core Subject')}
              >
                {subject.displayName || subject.subjectName}
                {subject.ceEnabled && subject.ceMaxMarks > 0 && (
                  <span className="ml-1 text-emerald-600">(CE: {subject.ceMaxMarks})</span>
                )}
                {subject.hasPractical && subject.practicalMaxMarks > 0 && (
                  <span className="ml-1 text-blue-600">(P: {subject.practicalMaxMarks})</span>
                )}
                {subject.isLanguageSubject && (
                  <span className="ml-1 text-purple-500 text-[10px]">📖</span>
                )}
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

      {/* ── Grid Table Section ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
              {/* Search + Save bar */}
              <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4 text-emerald-600" />
                    Marks Entry Grid
                    {!hasEditPermission && (
                      <span className="ml-1 inline-flex items-center gap-1 text-xs text-gray-400">
                        <LockClosedIcon className="w-3 h-3" /> View Only
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search student…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-7 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40 sm:w-52"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <XMarkIcon className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                  {hasEditPermission && (
                    <button
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap shadow-sm"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      {isSubmitting ? "Saving…" : "Save Marks"}
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th rowSpan={2} className="sticky left-0 bg-gray-50 z-20 px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[160px] border-r border-gray-200">
                        Student
                      </th>
                      {examSubjects.map((subj) => {
                        const hasPrac = subj.hasPractical && subj.practicalMaxMarks > 0;
                        const hasCE = subj.ceEnabled && subj.ceMaxMarks > 0;
                        let colSpan = 1; // Theory
                        if (hasPrac) colSpan++;
                        if (hasCE) colSpan++;
                        colSpan += 2; // Absent, Total
                        return (
                          <th
                            key={subj.examSubjectId}
                            colSpan={colSpan}
                            className="px-3 py-2 text-center text-xs font-bold text-gray-700 whitespace-nowrap border-r border-gray-200"
                          >
                            {subj.displayName || subj.subjectName}
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {examSubjects.map((subj) => {
                        const hasPrac = subj.hasPractical && subj.practicalMaxMarks > 0;
                        const hasCE = subj.ceEnabled && subj.ceMaxMarks > 0;
                        const theoryMax = subj.theoryMaxMarks || subj.termMaxMarks || subj.maxMarks || 100;
                        return (
                          <React.Fragment key={subj.examSubjectId}>
                            <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 whitespace-nowrap border-l border-gray-200">
                              Th <span className="text-gray-400">/{theoryMax}</span>
                            </th>
                            {hasPrac && (
                              <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 whitespace-nowrap border-l border-gray-200">
                                Pr <span className="text-gray-400">/{subj.practicalMaxMarks}</span>
                              </th>
                            )}
                            {hasCE && (
                              <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 whitespace-nowrap border-l border-gray-200">
                                CE <span className="text-gray-400">/{subj.ceMaxMarks}</span>
                              </th>
                            )}
                            <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 whitespace-nowrap border-l border-gray-200">
                              Abs
                            </th>
                            <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 whitespace-nowrap border-l border-r border-gray-200 bg-gray-100/50">
                              Tot <span className="text-gray-400">/{subj.maxMarks || 100}</span>
                            </th>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={1 + examSubjects.length * 5}
                          className="text-center py-10 text-gray-400 text-sm"
                        >
                          No students found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <tr
                          key={student.studentId}
                          className={`${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          } hover:bg-emerald-50/40 transition-colors`}
                        >
                          {/* Student Name (sticky) */}
                          <td className={`sticky left-0 z-10 px-4 py-2 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-emerald-50 border-r border-gray-200`}>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px] flex-shrink-0">
                                {student.rollNumber || (idx + 1)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                                  {student.studentName}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {student.admissionNo || student.studentCode || "-"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Subjects Mapping */}
                          {examSubjects.map((subj) => {
                            const key = subj.examSubjectId?.toString();
                            const canEdit = canEditSubject(key);
                            const tm = tempMarks[student.studentId]?.[key] || {};
                            const theory = tm.theoryScore !== undefined ? tm.theoryScore : (subj.isEntered ? (subj.theoryScore ?? 0) : "");
                            const practical = tm.practicalScore !== undefined ? tm.practicalScore : (subj.isEntered ? (subj.practicalScore ?? 0) : "");
                            const ce = tm.ceMarks !== undefined ? tm.ceMarks : (subj.isEntered ? (subj.ceScore ?? subj.ceMarks ?? 0) : "");
                            const absent = tm.isAbsent ?? false;
                            const total = absent ? 0 : ((theory === "" ? 0 : theory) + (practical === "" ? 0 : practical) + (ce === "" ? 0 : ce));
                            const maxM = subj.maxMarks || 100;
                            const gradeInfo = getGradeInfo(total, maxM);
                            const theoryMax = subj.theoryMaxMarks || subj.termMaxMarks || subj.maxMarks || 100;
                            const hasPrac = subj.hasPractical && subj.practicalMaxMarks > 0;
                            const hasCE = subj.ceEnabled && subj.ceMaxMarks > 0;

                            const inputClass = `w-14 text-center px-1 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors font-mono ${
                              !canEdit || absent
                                ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                                : "bg-white border-gray-300 hover:border-emerald-300 text-gray-900 font-semibold"
                            }`;

                            return (
                              <React.Fragment key={key}>
                                {/* Theory */}
                                <td className="px-1 py-1 text-center border-l border-gray-200">
                                  <input
                                    type="number" onWheel={(e) => e.target.blur()}
                                    value={absent ? "" : theory}
                                    onChange={(e) => handleMarkChange(student.studentId, key, "theoryScore", e.target.value)}
                                   
                                    disabled={!canEdit || absent}
                                    min={0}
                                    max={theoryMax}
                                    placeholder="0"
                                    className={inputClass}
                                  />
                                </td>
                                
                                {/* Practical */}
                                {hasPrac && (
                                  <td className="px-1 py-1 text-center border-l border-gray-200">
                                    <input
                                      type="number" onWheel={(e) => e.target.blur()}
                                      value={absent ? "" : practical}
                                      onChange={(e) => handleMarkChange(student.studentId, key, "practicalScore", e.target.value)}
                                     
                                      disabled={!canEdit || absent}
                                      min={0}
                                      max={subj.practicalMaxMarks}
                                      placeholder="0"
                                      className={inputClass}
                                    />
                                  </td>
                                )}

                                {/* CE */}
                                {hasCE && (
                                  <td className="px-1 py-1 text-center border-l border-gray-200">
                                    <input
                                      type="number" onWheel={(e) => e.target.blur()}
                                      value={absent ? "" : ce}
                                      onChange={(e) => handleMarkChange(student.studentId, key, "ceMarks", e.target.value)}
                                     
                                      disabled={!canEdit || absent}
                                      min={0}
                                      max={subj.ceMaxMarks}
                                      placeholder="0"
                                      className={inputClass}
                                    />
                                  </td>
                                )}

                                {/* Absent Toggle */}
                                <td className="px-1 py-1 text-center border-l border-gray-200">
                                  <button
                                    type="button"
                                    onClick={() => canEdit && handleAbsentToggle(student.studentId, key)}
                                    disabled={!canEdit}
                                    className={`w-6 h-6 rounded border flex items-center justify-center mx-auto transition-all ${
                                      absent
                                        ? "bg-red-500 border-red-500 text-white"
                                        : "bg-white border-gray-300 text-transparent hover:border-red-300"
                                    } ${!canEdit ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                    title={absent ? "Mark as Present" : "Mark as Absent"}
                                  >
                                    <XMarkIcon className="w-3 h-3" />
                                  </button>
                                </td>

                                {/* Total */}
                                <td className="px-2 py-1 text-center border-l border-r border-gray-200 bg-gray-50/50">
                                  {absent ? (
                                    <span className="text-red-500 font-bold text-xs">AB</span>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <span className={`text-xs font-bold font-mono ${gradeInfo.color.split(' ')[0]}`}>
                                        {total}
                                      </span>
                                    </div>
                                  )}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              {filteredStudents.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <span>{filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>

            {/* ── Sticky Save Footer ── */}
            {hasEditPermission && filteredStudents.length > 0 && (
              <div className="sticky bottom-3 mt-4 flex gap-2 z-30">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-lg transition-all active:scale-95"
                >
                  <CheckIcon className="w-4 h-4" />
                  {isSubmitting ? "Saving…" : "Save All Marks"}
                </button>
                {permissions?.canSubmit && (
                  <button
                    onClick={handleSubmitForReview}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 shadow-lg transition-all active:scale-95"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Submit for Review</span>
                  </button>
                )}
              </div>
            )}

            {/* ── No Edit Permission State ── */}
            {!hasEditPermission && examSubjects.length > 0 && !isLoading && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mt-4">
                <LockClosedIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-700 mb-1">View Only Mode</h3>
                <p className="text-xs text-gray-500">
                  You don't have permission to edit marks for this exam.
                </p>
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