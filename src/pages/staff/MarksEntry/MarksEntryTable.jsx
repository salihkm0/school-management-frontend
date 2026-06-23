/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, no-unused-vars */
// src/pages/staff/StaffMarksEntry.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  BookOpenIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  DocumentArrowDownIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { fetchExams, fetchStaffExams } from "../../../store/slices/examSlice";
import { fetchClasses } from "../../../store/slices/classSlice";
import { fetchStaff } from "../../../store/slices/staffSlice";
import { fetchAcademicYears } from "../../../store/slices/academicYearSlice";
import {
  fetchTeacherClassTeacherClasses,
  clearTeacherClasses,
} from "../../../store/slices/classSlice";

import {
  getMarksheetsByClass,
  bulkUpdateMarks,
  getTeacherPermissions,
  submitMarksForReview,
} from "../../../services/markService";
import { generateClassReportCardsPDF } from "../../../services/analyticsService";
import LoadingSpinner from "../../../components/common/LoadingSpinner.jsx";
import toast from "react-hot-toast";
import useDebounce from "../../../hooks/useDebounce";

// ─────────────────────────────────────────────
// Helper: compute grade label from percentage
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// SubjectProgress mini-card
// ─────────────────────────────────────────────
const SubjectProgressCard = ({ subject }) => {
  const pct = subject.percentage ?? 0;
  const done = pct === 100;
  return (
    <div className="flex-shrink-0 w-44 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-start justify-between mb-1 gap-1">
        <p className="text-xs font-medium text-gray-800 leading-tight line-clamp-2">
          {subject.subjectName}
        </p>
        {done ? (
          <CheckBadgeIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        ) : (
          <ClockIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
        )}
      </div>
      <div className="text-xs text-gray-500 mb-1.5">
        {subject.enteredCount}/{subject.totalStudents} students
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-gray-300"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={`text-right text-xs font-semibold mt-0.5 ${
          done ? "text-emerald-600" : "text-amber-500"
        }`}
      >
        {pct}%
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const MarksEntryTable = () => {
  const navigate = useNavigate();
  const { examId, classId } = useParams();

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { staff, isLoading: staffLoading } = useSelector((s) => s.staff);
  const { exams, isLoading: examsLoading } = useSelector((s) => s.exams);
  const { teacherClassTeacherClasses, isLoading: classesLoading } = useSelector(
    (s) => s.classes
  );
  const { academicYears } = useSelector((s) => s.academicYears);
  const { classes } = useSelector((s) => s.classes);

  // ── Data state ──
  const [students, setStudents] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [examSubjects, setExamSubjects] = useState([]); // allowed subjects list
  const [subjectProgress, setSubjectProgress] = useState([]); // all subjects progress
  const [languageMapping, setLanguageMapping] = useState({});
  const [tempMarks, setTempMarks] = useState({});
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);

  // ── UI state ──
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ── Dirty tracking: only send modified students on save ──
  const dirtyStudents = useRef(new Set());

  const debouncedSearch = useDebounce(searchTerm, 300);

  // ─────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────
  useEffect(() => {
    loadInitialData();
  }, [dispatch]);

  useEffect(() => {
    if (examId && classId) {
      loadData();
    } else {
      resetClassData();
    }
  }, [examId, classId]);

  // ─────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────
  async function loadInitialData() {
    setIsLoading(true);
    try {
      const fetchTasks = [];
      if (classes.length === 0) fetchTasks.push(dispatch(fetchClasses({ limit: 1000 })));
      if (academicYears.length === 0) fetchTasks.push(dispatch(fetchAcademicYears({ limit: 10 })));
      if (fetchTasks.length > 0) await Promise.all(fetchTasks);
    } catch (e) {
      console.error("Failed to load initial data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  async function loadData() {
    if (!examId || !classId) return;
    setIsLoading(true);
    try {
      const [permRes, markRes] = await Promise.all([
        getTeacherPermissions(examId, classId),
        getMarksheetsByClass(examId, classId),
      ]);

      setPermissions(permRes.data);

      if (markRes.success && markRes.data) {
        const { subjects, students: studentsData, languageMapping: lm, subjectProgress: sp } = markRes.data;

        // Teachers only see their own subjects — already filtered by backend
        setExamSubjects(subjects || []);
        setSubjectProgress(sp || []);
        setStudents(studentsData || []);
        setLanguageMapping(lm || {});

        // Build tempMarks map
        const initial = {};
        (studentsData || []).forEach((student) => {
          initial[student.studentId] = {};
          (student.subjects || []).forEach((subject) => {
            const key = subject.examSubjectId || subject.subjectId;
            const isActuallyEntered = subject.isEntered || subject.theoryScore > 0 || subject.practicalScore > 0 || (subject.ceScore || subject.ceMarks) > 0 || subject.isAbsent;
            initial[student.studentId][key] = {
              theoryScore: isActuallyEntered ? (subject.theoryScore ?? 0) : "",
              practicalScore: isActuallyEntered ? (subject.practicalScore ?? 0) : "",
              ceMarks: isActuallyEntered ? (subject.ceScore ?? subject.ceMarks ?? 0) : "",
              isAbsent: subject.isAbsent || false,
              isEntered: isActuallyEntered,
            };
          });
        });
        setTempMarks(initial);

        // Grid layout does not require an active subject.
      }
    } catch (e) {
      console.error("Failed to load data:", e);
      toast.error("Failed to load marks data");
    } finally {
      setIsLoading(false);
    }
  };

  function resetClassData() {
    setStudents([]);
    setPermissions(null);
    setExamSubjects([]);
    setSubjectProgress([]);
    setTempMarks({});
    dirtyStudents.current.clear(); 
  };

  // ─────────────────────────────────────────
  // Permission Helpers
  // ─────────────────────────────────────────
  // Class Teacher can only edit subjects they are personally assigned to teach
  const canEditSubject = useCallback(
    (examSubjectId) => {
      if (!permissions) return false;
      if (permissions.isAdmin) return true;
      // Check if this subject is in the allowed subjects list
      if (permissions.allowedSubjects && permissions.allowedSubjects.length > 0) {
        return permissions.allowedSubjects.some(
          (s) => s.subjectId === examSubjectId || s.subjectId?.toString() === examSubjectId?.toString()
        );
      }
      return false;
    },
    [permissions]
  );

  const isClassTeacher = permissions?.isClassTeacher === true;
  const isAdmin = permissions?.isAdmin === true;
  const hasEditPermission =
    permissions?.isAdmin === true ||
    (permissions?.allowedSubjects && permissions.allowedSubjects.length > 0);

  // PDF download allowed only if class teacher or admin AND all subjects 100% done
  const allMarksEntered =
    subjectProgress.length > 0 && subjectProgress.every((sp) => sp.percentage === 100);
  const canDownloadPDF = (isClassTeacher || isAdmin) && allMarksEntered;

  // ─────────────────────────────────────────
  // Mark Change Handler
  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  // Save Handler
  // ─────────────────────────────────────────
  const handleSave = async () => {
    if (!examId || !classId) {
      toast.error("Invalid exam or class");
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
          isEntered: tm.isEntered ?? subject.isEntered ?? false,
          remarks: subject.remarks || "",
        };
      }),
      remarks: student.remarks || "",
    }));

    setIsSubmitting(true);
    try {
      await bulkUpdateMarks(examId, classId, studentsData);
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
    if (!examId || !classId) return;
    if (dirtyStudents.current.size > 0) {
      toast.error("Please save your changes first");
      return;
    }
    if (!window.confirm("Submit marks for review? They will be locked for editing.")) return;

    setIsSubmitting(true);
    try {
      await submitMarksForReview(examId, classId);
      toast.success("Marks submitted for review successfully");
      await loadData();
    } catch (e) {
      console.error("Failed to submit:", e);
      toast.error(e.response?.data?.message || "Failed to submit marks");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────
  // PDF Download
  // ─────────────────────────────────────────
  const handleDownloadClassPDF = async () => {
    if (!examId || !classId) return;
    setIsDownloadingPDF(true);
    try {
      const pdfBlob = await generateClassReportCardsPDF(examId, classId);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Class_ReportCards_${classId}_${examId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Class report cards downloaded!");
    } catch (e) {
      console.error("PDF download failed:", e);
      toast.error("Failed to download class report cards");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // ─────────────────────────────────────────
  // Filtering / Helpers
  // ─────────────────────────────────────────
  const filteredStudents = students.filter(
    (s) =>
      s.studentName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.admissionNo?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const getClassById = (classId) => {
    if (typeof classId === "object" && classId !== null) return classId;
    return classes.find((c) => c._id === classId || c.id === classId);
  };

  const getClassDisplayName = (classItem) => {
    if (!classItem) return "Unknown";
    if (classItem.section) return `${classItem.name} - ${classItem.section}`;
    return classItem.displayName || classItem.name || classItem._id;
  };

  // ─────────────────────────────────────────
  // Early returns
  // ─────────────────────────────────────────
  if (isLoading || staffLoading || examsLoading || classesLoading) {
    return <LoadingSpinner />;
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full px-2 sm:px-6 lg:px-8 py-3 sm:py-6">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("..")}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Marks Entry</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.role === 'admin'
                ? "Admin – Enter marks for any class and subject"
                : isClassTeacher
                ? "Class Teacher – Enter marks for your subject(s)"
                : hasEditPermission
                ? "Subject Teacher – Enter marks for your assigned subject(s)"
                : "View Only"}
            </p>
          </div>
        </div>

        {/* ── Content Area ── */}
        {examId && classId && (
          <>
            {/* ── Subject Progress Panel ── */}
            {subjectProgress.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <ChartBarIcon className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700">Class Progress</h2>
                  <span className="ml-auto text-xs text-gray-400">
                    {subjectProgress.filter((sp) => sp.percentage === 100).length}/
                    {subjectProgress.length} subjects complete
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                  {subjectProgress.map((sp) => (
                    <div key={sp.subjectId?.toString()} className="snap-start">
                      <SubjectProgressCard subject={sp} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Class Teacher PDF Download Banner ── */}
            {(isClassTeacher || isAdmin) && subjectProgress.length > 0 && (
              <div
                className={`mb-4 rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  allMarksEntered
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {allMarksEntered ? (
                    <CheckBadgeIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${allMarksEntered ? "text-emerald-800" : "text-amber-800"}`}>
                      {allMarksEntered
                        ? "All marks entered! Class report cards are ready."
                        : "Class report cards will be available after all marks are entered."}
                    </p>
                    {!allMarksEntered && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        {subjectProgress.filter((sp) => sp.percentage < 100).length} subject(s) still pending.
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDownloadClassPDF}
                  disabled={!allMarksEntered || isDownloadingPDF}
                  className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    allMarksEntered && !isDownloadingPDF
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  {isDownloadingPDF ? "Downloading…" : "Download Class Report PDF"}
                </button>
              </div>
            )}

            {/* ── No Subjects ── */}
            {examSubjects.length === 0 && !isLoading && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 text-center">
                <LockClosedIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  No subjects available
                </h3>
                <p className="text-xs text-gray-500">
                  You are not assigned to any subject for this class in this exam.
                </p>
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
                        let colSpan = 1; // TE
                        if (hasPrac) colSpan++;
                        if (hasCE) colSpan++;
                        colSpan += 3; // Absent, Total, Grade
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
                            {hasCE && (
                              <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 whitespace-nowrap border-l border-gray-200">
                                CE <span className="text-gray-400">/{subj.ceMaxMarks}</span>
                              </th>
                            )}
                            <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 whitespace-nowrap border-l border-gray-200">
                              TE <span className="text-gray-400">/{theoryMax}</span>
                            </th>
                            {hasPrac && (
                              <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 whitespace-nowrap border-l border-gray-200">
                                Pr <span className="text-gray-400">/{subj.practicalMaxMarks}</span>
                              </th>
                            )}
                            <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-500 whitespace-nowrap border-l border-gray-200">
                              Abs
                            </th>
                            <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 whitespace-nowrap border-l border-gray-200 bg-gray-100/50">
                              Total <span className="text-gray-400">/{subj.maxMarks || 100}</span>
                            </th>
                            <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 whitespace-nowrap border-l border-r border-gray-200 bg-gray-100/50">
                              Grade
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
                          className="text-center py-6 sm:py-10 text-gray-400 text-sm"
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

                                {/* TE (Theory) */}
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

                                {/* Total and % */}
                                <td className="px-2 py-1 text-center border-l border-gray-200 bg-gray-50/50">
                                  {absent ? (
                                    <span className="text-red-500 font-bold text-xs">AB</span>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-bold font-mono text-gray-900">
                                        {total}
                                      </span>
                                      <span className="text-[9px] text-gray-500">
                                        {maxM > 0 ? Math.round((total / maxM) * 100) : 0}%
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Grade */}
                                <td className="px-2 py-1 text-center border-l border-r border-gray-200 bg-gray-50/50">
                                  {!absent && (
                                    <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${gradeInfo.color}`}>
                                      {gradeInfo.grade}
                                    </span>
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
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 text-center mt-4">
                <LockClosedIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-700 mb-1">View Only Mode</h3>
                <p className="text-xs text-gray-500">
                  You don't have permission to edit marks for this exam.
                </p>
              </div>
            )}
          </>
        )}


      </div>
    </div>
  );
};

export default MarksEntryTable;