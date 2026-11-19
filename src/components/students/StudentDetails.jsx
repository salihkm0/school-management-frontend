// src/components/students/StudentDetails.jsx - Fixed Imports
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  PencilIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  CakeIcon,
  HeartIcon,
  BriefcaseIcon,
  TrophyIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import pdfService, { downloadPDF } from "../../services/pdfService";
import {
  fetchStudentById,
  clearCurrentStudent,
} from "../../store/slices/studentSlice";
import { fetchAcademicYears } from "../../store/slices/academicYearSlice";
import studentService from "../../services/studentService";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  formatDate,
  calculateAge,
  getInitials,
  getRandomColor,
} from "../../utils/helpers";

const getGradeColor = (grade) => {
  const colors = {
    "A+": "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20",
    "A": "bg-green-100 text-green-700 ring-1 ring-green-600/20",
    "B+": "bg-blue-100 text-blue-700 ring-1 ring-blue-600/20",
    "B": "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-600/20",
    "C+": "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20",
    "C": "bg-orange-100 text-orange-700 ring-1 ring-orange-600/20",
    "D+": "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20",
    "D": "bg-rose-100 text-rose-700 ring-1 ring-rose-600/20",
    "E": "bg-gray-100 text-gray-600 ring-1 ring-gray-500/20",
  };
  return colors[grade] || "bg-gray-100 text-gray-600";
};

const getGradeIcon = (grade) => {
  if (grade === "A+" || grade === "A") return <TrophyIcon className="w-4 h-4" />;
  return <DocumentTextIcon className="w-4 h-4" />;
};

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isReadOnly = location.pathname.startsWith('/open');
  const { currentStudent, isLoading } = useSelector((state) => state.students);
  const { academicYears } = useSelector((state) => state.academicYears);

  const [marksData, setMarksData] = useState(null);
  const [academicInfo, setAcademicInfo] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [loadingAcademic, setLoadingAcademic] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("all");
  const [downloadingExamId, setDownloadingExamId] = useState(null);
  const [viewingExamId, setViewingExamId] = useState(null);
  const [downloadingReportCardId, setDownloadingReportCardId] = useState(null);

  useEffect(() => {
    dispatch(fetchStudentById(id));
    dispatch(fetchAcademicYears({ limit: 100 }));
    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (currentStudent?.academicYearId?._id) {
      setSelectedAcademicYearId(currentStudent.academicYearId._id);
    } else if (currentStudent?.academicYearId) {
      setSelectedAcademicYearId(currentStudent.academicYearId);
    } else if (academicYears.length > 0) {
      const currentYear = academicYears.find(y => y.isCurrent);
      if (currentYear) {
        setSelectedAcademicYearId(currentYear._id);
      }
    }
  }, [currentStudent, academicYears]);

  useEffect(() => {
    if (activeTab === "marks" && !marksData) {
      loadMarks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "academic" && !academicInfo) {
      loadAcademicInfo();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "attendance" && selectedAcademicYearId) {
      loadAttendance();
    }
  }, [activeTab, selectedAcademicYearId]);

  const loadMarks = async () => {
    setLoadingMarks(true);
    try {
      const data = await studentService.getStudentMarks(id);
      setMarksData(data);
      if (data?.analytics?.examWise && Object.keys(data.analytics.examWise).length > 0) {
        setSelectedExamId("all");
      }
    } catch (error) {
      console.error("Failed to load marks:", error);
    } finally {
      setLoadingMarks(false);
    }
  };

  const handleDownloadExamMarklist = async (examId, examName) => {
    try {
      setDownloadingExamId(examId);
      const blob = await pdfService.downloadMarklistPDF(id, examId);
      downloadPDF(
        blob,
        `Marklist_${(currentStudent?.fullName || 'Student').replace(/\s+/g, '_')}_${(examName || 'Exam').replace(/\s+/g, '_')}.pdf`
      );
      toast.success(`${examName || 'Exam'} marklist downloaded`);
    } catch (error) {
      console.error('Failed to download marklist:', error);
      toast.error('Failed to download marklist PDF');
    } finally {
      setDownloadingExamId(null);
    }
  };

  const handleViewExamMarklist = async (examId) => {
    try {
      setViewingExamId(examId);
      const blob = await pdfService.getMarklistPDF(id, examId);
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');
    } catch (error) {
      console.error('Failed to view marklist:', error);
      toast.error('Failed to open marklist PDF');
    } finally {
      setViewingExamId(null);
    }
  };

  const handleDownloadReportCard = async (examId, examName) => {
    try {
      setDownloadingReportCardId(examId);
      const academicYearId = currentStudent?.academicYearId?._id || currentStudent?.academicYearId || selectedAcademicYearId;
      const blob = await pdfService.downloadStudentReportCardPDF(id, examId, academicYearId);
      downloadPDF(
        blob,
        `ReportCard_${(currentStudent?.fullName || 'Student').replace(/\s+/g, '_')}_${(examName || 'Exam').replace(/\s+/g, '_')}.pdf`
      );
      toast.success('Report card downloaded');
    } catch (error) {
      console.error('Failed to download report card:', error);
      toast.error('Failed to download report card PDF');
    } finally {
      setDownloadingReportCardId(null);
    }
  };

  const handlePrintAll = () => {
    const examIds = marksData?.analytics?.examWise ? Object.keys(marksData.analytics.examWise) : [];
    const examIdToPrint = (selectedExamId && selectedExamId !== 'all') ? selectedExamId : examIds[0];
    if (examIdToPrint) {
      handleViewExamMarklist(examIdToPrint);
    } else {
      window.print();
    }
  };

  const handleExportAll = () => {
    const examIds = marksData?.analytics?.examWise ? Object.keys(marksData.analytics.examWise) : [];
    const examIdToExport = (selectedExamId && selectedExamId !== 'all') ? selectedExamId : examIds[0];
    const examNameToExport = examIdToExport ? marksData.analytics.examWise[examIdToExport]?.examName : 'Marklist';
    if (examIdToExport) {
      handleDownloadExamMarklist(examIdToExport, examNameToExport);
    } else {
      toast.error('No exam marks available to export');
    }
  };

  const loadAcademicInfo = async () => {
    setLoadingAcademic(true);
    try {
      const data = await studentService.getStudentAcademicInfo(id);
      setAcademicInfo(data?.data || data);
    } catch (error) {
      console.error("Failed to load academic info:", error);
    } finally {
      setLoadingAcademic(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedAcademicYearId) return;
    setLoadingAttendance(true);
    try {
      const data = await studentService.getStudentAttendance(id, selectedAcademicYearId);
      setAttendanceData(data);
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const getOverallGradeInfo = (percentage) => {
    if (percentage >= 90) return { grade: "A+", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (percentage >= 80) return { grade: "A", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    if (percentage >= 70) return { grade: "B+", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    if (percentage >= 60) return { grade: "B", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" };
    if (percentage >= 50) return { grade: "C+", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    if (percentage >= 40) return { grade: "C", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
    if (percentage >= 30) return { grade: "D+", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    if (percentage >= 20) return { grade: "D", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
    return { grade: "E", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
  };

  if (isLoading || !currentStudent) {
    return <LoadingSpinner />;
  }

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-100 last:border-0 gap-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{value || "-"}</span>
    </div>
  );

  const SectionCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const analytics = marksData?.analytics || {};
  const examWise = analytics.examWise || {};
  const totalExams = Object.keys(examWise).length;
  const overallPercentage = marksData?.summary?.overallPercentage || 0;
  const gradeInfo = getOverallGradeInfo(overallPercentage);
  const selectedExam = selectedExamId ? examWise[selectedExamId] : null;

  const tabs = ["info", "academic", "marks", "attendance"];

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => isReadOnly ? navigate(-1) : navigate("/students")}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {currentStudent.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">ID: {currentStudent.studentCode}</p>
          </div>
        </div>
        {!isReadOnly && (
          <Link
            to={`/students/${id}/edit`}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit</span>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-4 sm:gap-6 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-0 border-b-2 text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Info Tab */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Profile" icon={UserCircleIcon}>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div
                className={`w-14 h-14 ${getRandomColor(currentStudent.fullName)} rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}
              >
                {getInitials(currentStudent.fullName)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{currentStudent.fullName}</p>
                <p className="text-sm text-gray-500">Student</p>
                <p className="text-xs text-gray-400">
                  Added: {formatDate(currentStudent.createdAt)}
                </p>
              </div>
            </div>
            <InfoRow label="Gender" value={currentStudent.gender === "M" ? "Male" : currentStudent.gender === "F" ? "Female" : "Other"} icon={UserCircleIcon} />
            <InfoRow label="Date of Birth" value={formatDate(currentStudent.dateOfBirth)} icon={CakeIcon} />
            <InfoRow label="Age" value={calculateAge(currentStudent.dateOfBirth)} icon={CalendarIcon} />
            <InfoRow label="Blood Group" value={currentStudent.bloodGroup || "-"} icon={HeartIcon} />
            <InfoRow label="Religion" value={currentStudent.religion || "-"} />
            <InfoRow label="Caste" value={currentStudent.casteName || "-"} />
            <InfoRow label="Category" value={currentStudent.category || "-"} />
          </SectionCard>

          <SectionCard title="Contact Information" icon={PhoneIcon}>
            <InfoRow label="Phone" value={currentStudent.phoneNumber} icon={PhoneIcon} />
            <InfoRow label="Father's Name" value={currentStudent.fatherFullName} icon={UserCircleIcon} />
            <InfoRow label="Mother's Name" value={currentStudent.motherFullName} icon={UserCircleIcon} />
            <InfoRow label="Guardian" value={currentStudent.guardian} />
            <InfoRow label="Relation" value={currentStudent.relationOfGuardian} />
            <InfoRow label="Occupation" value={currentStudent.occupationOfGuardian} icon={BriefcaseIcon} />
          </SectionCard>

          <SectionCard title="Address" icon={MapPinIcon}>
            <InfoRow label="House" value={currentStudent.houseName} />
            <InfoRow label="Street" value={currentStudent.streetName} />
            <InfoRow label="Post Office" value={currentStudent.postOffice} />
            <InfoRow label="Pincode" value={currentStudent.pincode} />
          </SectionCard>

          <SectionCard title="Academic Info" icon={AcademicCapIcon}>
            <InfoRow label="Admission No" value={currentStudent.admissionNo} />
            <InfoRow label="Admission Date" value={formatDate(currentStudent.admissionDate)} />
            <InfoRow label="Class" value={`${currentStudent.className} ${currentStudent.division || ""}`.trim()} />
            <InfoRow label="Roll Number" value={currentStudent.rollNumber} />
            <InfoRow label="Academic Year" value={currentStudent.academicYearId?.name || "-"} />
            <InfoRow 
              label="Status" 
              value={
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  currentStudent.status === "active"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    : currentStudent.status === "inactive"
                    ? "bg-gray-50 text-gray-600 ring-1 ring-gray-500/20"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                }`}>
                  {currentStudent.status}
                </span>
              } 
            />
          </SectionCard>

          {currentStudent.parentIds && currentStudent.parentIds.length > 0 && (
            <SectionCard title="Connected Parent Accounts" icon={UserCircleIcon}>
              <div className="space-y-3">
                {currentStudent.parentIds.map((parent) => (
                  <div key={parent._id} className="flex flex-col py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{parent.fullName}</span>
                      <Link to={`/parents/${parent._id}`} className="inline-flex items-center gap-0.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                        View Parent details
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                      <span>Email: {parent.email || '-'}</span>
                      <span>Phone: {parent.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* Academic Tab */}
      {activeTab === "academic" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard title="Academic Profile" icon={AcademicCapIcon}>
            <InfoRow label="Class & Division" value={academicInfo?.className || currentStudent?.className || currentStudent?.classId?.displayName || "-"} />
            <InfoRow label="Roll Number" value={academicInfo?.rollNumber || currentStudent?.rollNumber || "-"} />
            <InfoRow label="Admission No" value={academicInfo?.admissionNo || currentStudent?.admissionNo || "-"} />
            <InfoRow label="Admission Date" value={academicInfo?.admissionDate ? formatDate(academicInfo.admissionDate) : (currentStudent?.admissionDate ? formatDate(currentStudent.admissionDate) : "-")} />
            <InfoRow label="Medium of Instruction" value={academicInfo?.instructionMedium || currentStudent?.instructionMedium || "Malayalam"} />
            <InfoRow label="Academic Year" value={academicInfo?.academicYear || currentStudent?.academicYearId?.name || currentStudent?.academicYearId?.year || "-"} />
            <InfoRow label="Status" value={academicInfo?.status || currentStudent?.status || "Active"} />
          </SectionCard>

          <SectionCard title="Language Subjects" icon={BookOpenIcon}>
            {loadingAcademic ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <>
                <InfoRow label="First Language 1" value={academicInfo?.firstLanguagePaper1?.name || (typeof academicInfo?.firstLanguagePaper1 === 'string' ? academicInfo.firstLanguagePaper1 : null) || currentStudent?.firstLanguagePaper1?.name || (typeof currentStudent?.firstLanguagePaper1 === 'string' ? currentStudent.firstLanguagePaper1 : null) || "-"} />
                <InfoRow label="First Language 2" value={academicInfo?.firstLanguagePaper2?.name || (typeof academicInfo?.firstLanguagePaper2 === 'string' ? academicInfo.firstLanguagePaper2 : null) || currentStudent?.firstLanguagePaper2?.name || (typeof currentStudent?.firstLanguagePaper2 === 'string' ? currentStudent.firstLanguagePaper2 : null) || "-"} />
                <InfoRow label="Third Language" value={academicInfo?.thirdLanguage?.name || (typeof academicInfo?.thirdLanguage === 'string' ? academicInfo.thirdLanguage : null) || currentStudent?.thirdLanguage?.name || (typeof currentStudent?.thirdLanguage === 'string' ? currentStudent.thirdLanguage : null) || "-"} />
                <InfoRow label="Additional Language" value={academicInfo?.additionalLanguage?.name || (typeof academicInfo?.additionalLanguage === 'string' ? academicInfo.additionalLanguage : null) || currentStudent?.additionalLanguage?.name || (typeof currentStudent?.additionalLanguage === 'string' ? currentStudent.additionalLanguage : null) || "-"} />
              </>
            )}
          </SectionCard>
        </div>
      )}

      {/* Marks Tab - Professional Minimal Design */}
      {activeTab === "marks" && (
        <div className="space-y-6">
          {loadingMarks ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (marksData && totalExams > 0) ? (
            <>
              {/* Hero Section - Overall Performance */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="relative px-6 py-8 md:px-8 md:py-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 opacity-50" />
                  
                  <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <svg className="w-20 h-20 md:w-24 md:h-24">
                          <circle
                            className="text-gray-100"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="38"
                            cx="40"
                            cy="40"
                          />
                          <circle
                            className="text-emerald-500 transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={2 * Math.PI * 38 * (1 - overallPercentage / 100)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="38"
                            cx="40"
                            cy="40"
                            transform="rotate(-90 40 40)"
                          />
                          <text
                            x="40"
                            y="45"
                            textAnchor="middle"
                            className="text-xl md:text-2xl font-bold fill-gray-900"
                            dy=".3em"
                          >
                            {Math.round(overallPercentage)}%
                          </text>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Overall Performance</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-3xl md:text-4xl font-bold ${gradeInfo.color}`}>
                            {gradeInfo.grade}
                          </span>
                          <span className="text-sm text-gray-400">Grade</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Based on <span className="font-medium text-gray-900">{totalExams}</span> exams
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrintAll}
                        title="Print Marklist"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-emerald-700 hover:border-gray-300 transition-all shadow-sm"
                      >
                        <PrinterIcon className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">Print Marklist</span>
                      </button>
                      <button
                        onClick={handleExportAll}
                        title="Download Marklist PDF"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Export PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Exams</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{totalExams}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subjects</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{marksData?.summary?.totalSubjects || 0}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Obtained</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{marksData?.summary?.totalMarksObtained || 0}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Maximum Marks</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{marksData?.summary?.totalMaxMarks || 0}</p>
                </div>
              </div>

              {/* Exam Selector Tabs */}
              {totalExams > 0 && (
                <div className="border-b border-gray-200">
                  <div className="flex flex-wrap gap-1 -mb-px">
                    <button
                      onClick={() => setSelectedExamId("all")}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                        selectedExamId === "all"
                          ? 'bg-white text-emerald-600 border border-b-0 border-gray-200 font-semibold shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      All Exams ({totalExams})
                    </button>
                    {Object.entries(examWise).map(([examId, exam]) => (
                      <button
                        key={examId}
                        onClick={() => setSelectedExamId(examId)}
                        className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                          selectedExamId === examId
                            ? 'bg-white text-emerald-600 border border-b-0 border-gray-200 font-semibold shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {exam.examName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Mark Lists */}
              <div className="space-y-6">
                {(selectedExamId === "all"
                  ? Object.entries(examWise)
                  : (selectedExamId && examWise[selectedExamId] ? [[selectedExamId, examWise[selectedExamId]]] : Object.entries(examWise))
                ).map(([examId, exam]) => {
                  const examPercentage = exam.totalMaxMarks > 0 
                    ? ((exam.totalMarks / exam.totalMaxMarks) * 100).toFixed(1)
                    : "0.0";
                  const examGradeInfo = getOverallGradeInfo(parseFloat(examPercentage));
                  const hasPractical = exam.subjects?.some(s => (s.practicalScore || 0) > 0);
                  const totalTheory = exam.subjects?.reduce((sum, s) => sum + (s.theoryScore || 0), 0) || 0;
                  const totalCE = exam.subjects?.reduce((sum, s) => sum + (s.ceScore || 0), 0) || 0;
                  const totalPractical = exam.subjects?.reduce((sum, s) => sum + (s.practicalScore || 0), 0) || 0;
                  const passedCount = exam.subjects?.filter(s => !s.isAbsent && (s.totalScore || 0) >= (s.passingMarks || 40)).length || 0;
                  const allPassed = exam.subjects && exam.subjects.length > 0 && passedCount === exam.subjects.length;

                  return (
                    <div key={examId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      {/* Exam Header */}
                      <div className="px-5 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                              <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-semibold text-gray-900">{exam.examName}</h3>
                                {allPassed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                    Passed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">
                                    {passedCount}/{exam.subjects?.length || 0} Passed
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                                <span className="capitalize font-medium text-gray-600">{exam.examType || 'Term Exam'}</span>
                                <span>•</span>
                                <span className="capitalize">{exam.term} Term</span>
                                <span>•</span>
                                <span>{exam.subjects?.length || 0} Subjects</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Stats & Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="text-right">
                                <div className="text-[11px] text-gray-500">Total Marks</div>
                                <div className="text-sm font-bold text-gray-900">
                                  {exam.totalMarks} <span className="text-xs font-normal text-gray-400">/ {exam.totalMaxMarks}</span>
                                </div>
                              </div>
                              <div className="h-6 w-px bg-gray-200" />
                              <div className="text-right">
                                <div className="text-[11px] text-gray-500">Percentage</div>
                                <div className={`text-sm font-bold ${examGradeInfo.color}`}>
                                  {examPercentage}%
                                </div>
                              </div>
                              <span className={`inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 text-xs font-bold rounded ${getGradeColor(examGradeInfo.grade)}`}>
                                {examGradeInfo.grade}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleViewExamMarklist(examId)}
                                disabled={viewingExamId === examId}
                                title="View & Print Marklist PDF"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-emerald-700 hover:border-emerald-300 transition-all disabled:opacity-50"
                              >
                                {viewingExamId === examId ? (
                                  <LoadingSpinner size="xs" />
                                ) : (
                                  <EyeIcon className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                                <span>View PDF</span>
                              </button>

                              <button
                                onClick={() => handleDownloadExamMarklist(examId, exam.examName)}
                                disabled={downloadingExamId === examId}
                                title="Download Marklist PDF"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-50"
                              >
                                {downloadingExamId === examId ? (
                                  <LoadingSpinner size="xs" />
                                ) : (
                                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                )}
                                <span>Marklist</span>
                              </button>

                              <button
                                onClick={() => handleDownloadReportCard(examId, exam.examName)}
                                disabled={downloadingReportCardId === examId}
                                title="Download Official Report Card PDF"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
                              >
                                {downloadingReportCardId === examId ? (
                                  <LoadingSpinner size="xs" />
                                ) : (
                                  <DocumentTextIcon className="w-3.5 h-3.5" />
                                )}
                                <span>Report Card</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mark List Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                              <th className="px-4 py-2.5 w-12 text-center">#</th>
                              <th className="px-4 py-2.5">Subject</th>
                              <th className="px-4 py-2.5 text-center">Theory (TE)</th>
                              <th className="px-4 py-2.5 text-center">CE</th>
                              {hasPractical && <th className="px-4 py-2.5 text-center">Practical</th>}
                              <th className="px-4 py-2.5 text-center font-bold text-gray-800">Total Marks</th>
                              <th className="px-4 py-2.5 text-center">Max Marks</th>
                              <th className="px-4 py-2.5 text-center">%</th>
                              <th className="px-4 py-2.5 text-center">Grade</th>
                              <th className="px-4 py-2.5 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {exam.subjects?.map((subject, idx) => {
                              const totalMarks = subject.totalScore !== undefined && subject.totalScore !== null
                                ? subject.totalScore
                                : ((subject.theoryScore || 0) + (subject.ceScore || 0) + (subject.practicalScore || 0));
                              const pct = subject.maxMarks > 0 ? (totalMarks / subject.maxMarks) * 100 : 0;
                              const isPassing = !subject.isAbsent && totalMarks >= (subject.passingMarks || 40);
                              const pctColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-blue-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600';

                              return (
                                <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                                  <td className="px-4 py-3 text-xs text-center text-gray-400 font-medium">{idx + 1}</td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{subject.subjectName}</div>
                                    {subject.subjectCode && (
                                      <div className="text-[11px] text-gray-400 font-mono">{subject.subjectCode}</div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center text-gray-700">
                                    {subject.isAbsent ? (
                                      <span className="text-xs text-rose-500 font-medium">AB</span>
                                    ) : (
                                      subject.theoryScore ?? '-'
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center font-medium text-purple-700">
                                    {subject.ceScore ?? '-'}
                                  </td>
                                  {hasPractical && (
                                    <td className="px-4 py-3 text-center text-gray-600">
                                      {subject.practicalScore || '-'}
                                    </td>
                                  )}
                                  <td className="px-4 py-3 text-center font-bold text-gray-900">
                                    {totalMarks}
                                  </td>
                                  <td className="px-4 py-3 text-center text-gray-500">
                                    {subject.maxMarks}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`font-semibold ${pctColor}`}>
                                      {pct.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center justify-center min-w-[42px] px-2 py-0.5 text-xs font-bold rounded-md ${getGradeColor(subject.grade)}`}>
                                      {subject.grade}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {subject.isAbsent ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-600/20">
                                        Absent
                                      </span>
                                    ) : isPassing ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                                        Passed
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">
                                        Needs Impr.
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-gray-50/70 border-t-2 border-gray-200 font-semibold text-xs text-gray-800">
                            <tr>
                              <td className="px-4 py-3 text-center text-gray-500 uppercase tracking-wider" colSpan={2}>
                                Total ({exam.subjects?.length || 0} Subjects)
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">{totalTheory}</td>
                              <td className="px-4 py-3 text-center text-purple-700">{totalCE}</td>
                              {hasPractical && <td className="px-4 py-3 text-center text-gray-600">{totalPractical}</td>}
                              <td className="px-4 py-3 text-center font-bold text-gray-900 text-sm">{exam.totalMarks}</td>
                              <td className="px-4 py-3 text-center text-gray-600 text-sm">{exam.totalMaxMarks}</td>
                              <td className="px-4 py-3 text-center text-emerald-600 font-bold">{examPercentage}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center justify-center min-w-[42px] px-2 py-0.5 text-xs font-bold rounded-md ${getGradeColor(examGradeInfo.grade)}`}>
                                  {examGradeInfo.grade}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {allPassed ? (
                                  <span className="text-emerald-700 font-bold">Passed</span>
                                ) : (
                                  <span className="text-amber-700 font-medium">{passedCount}/{exam.subjects?.length || 0} Passed</span>
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subject-wise Performance Summary */}
              {analytics.subjectWise && Object.keys(analytics.subjectWise).length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Subject-wise Performance Summary</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Average performance across all exams</p>
                  </div>
                  <div className="p-5">
                    <div className="space-y-4">
                      {Object.entries(analytics.subjectWise).map(([subject, data]) => (
                        <div key={subject} className="group">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium text-gray-700">{subject}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${
                                data.averagePercentage >= 75 ? 'text-emerald-600' :
                                data.averagePercentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                              }`}>
                                {data.averagePercentage?.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-400">({data.count} exams)</span>
                            </div>
                          </div>
                          <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
                              style={{ 
                                width: `${data.averagePercentage || 0}%`,
                                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Insights */}
              {totalExams > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <TrophyIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Performance Insight</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {overallPercentage >= 85 ? "Excellent performance! Keep up the great work!" :
                         overallPercentage >= 70 ? "Good performance! A little more effort can take you to the top." :
                         overallPercentage >= 50 ? "Satisfactory performance. Focus on improving weaker areas." :
                         "Needs improvement. Consider extra help for challenging subjects."}
                      </p>
                      {overallPercentage < 75 && (
                        <p className="text-xs text-amber-600 mt-2">
                          💡 Tip: Focus on subjects where you scored below 60% for better results.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">No Marks Available</h3>
              <p className="text-sm text-gray-500">No marks have been entered for this student yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="space-y-5">
          {loadingAttendance ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : attendanceData && attendanceData.length > 0 ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-3 flex justify-between items-center">
                <div className="flex items-center gap-2 flex-wrap">
                  <BookOpenIcon className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedAcademicYearId}
                    onChange={(e) => {
                      setSelectedAcademicYearId(e.target.value);
                      setAttendanceData(null);
                    }}
                    className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {academicYears.map((year) => (
                      <option key={year._id} value={year._id}>{year.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={loadAttendance} className="text-sm text-emerald-600 hover:text-emerald-700">
                  Refresh
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Month</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Days</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Present</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Absent</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">%</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendanceData.map((record) => {
                        const percentage = record.percentage || 0;
                        let status = "", statusColor = "";
                        if (percentage >= 75) { status = "Good"; statusColor = "bg-emerald-50 text-emerald-700"; }
                        else if (percentage >= 60) { status = "Average"; statusColor = "bg-amber-50 text-amber-700"; }
                        else if (percentage > 0) { status = "Poor"; statusColor = "bg-rose-50 text-rose-700"; }
                        else { status = "Not Recorded"; statusColor = "bg-gray-50 text-gray-600"; }

                        return (
                          <tr key={record._id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{record.monthName || `${record.month}/${record.year}`}</td>
                            <td className="px-3 py-2 text-sm text-center text-gray-600">{record.totalWorkingDays || 25}</td>
                            <td className="px-3 py-2 text-sm text-center font-semibold text-emerald-600">{record.presentDays || 0}</td>
                            <td className="px-3 py-2 text-sm text-center text-rose-600">{record.absentDays || 0}</td>
                            <td className="px-3 py-2 text-sm text-center font-semibold">{percentage.toFixed(1)}%</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${statusColor}`}>{status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total Days</p>
                  <p className="text-lg font-bold text-gray-900">
                    {attendanceData.reduce((sum, r) => sum + (r.totalWorkingDays || 0), 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Present</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {attendanceData.reduce((sum, r) => sum + (r.presentDays || 0), 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Overall</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {attendanceData.length > 0
                      ? ((attendanceData.reduce((sum, r) => sum + r.presentDays, 0) /
                          attendanceData.reduce((sum, r) => sum + r.totalWorkingDays, 0)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No attendance records found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDetails;