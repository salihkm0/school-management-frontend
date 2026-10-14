import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  RotateCcw, 
  SlidersHorizontal, 
  Eye, 
  X, 
  Printer, 
  Award, 
  Users, 
  Percent, 
  Calendar,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
  Building2,
  Phone,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Layers
} from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Grade Color Badges
const getGradeBadge = (grade) => {
  const map = {
    'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    'A': 'bg-green-100 text-green-800 border-green-300 font-semibold',
    'B+': 'bg-blue-100 text-blue-800 border-blue-300 font-semibold',
    'B': 'bg-sky-100 text-sky-800 border-sky-300 font-medium',
    'C+': 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
    'C': 'bg-orange-100 text-orange-800 border-orange-300 font-medium',
    'D+': 'bg-rose-100 text-rose-800 border-rose-300 font-medium',
    'D': 'bg-red-100 text-red-800 border-red-300 font-medium',
    'E': 'bg-gray-100 text-gray-700 border-gray-300 font-normal',
  };
  return map[grade] || 'bg-gray-100 text-gray-600 border-gray-200';
};

const getPercentageColor = (pct) => {
  if (pct === null || pct === undefined) return 'text-slate-400';
  if (pct >= 90) return 'text-emerald-700 font-bold';
  if (pct >= 80) return 'text-green-700 font-bold';
  if (pct >= 70) return 'text-blue-700 font-semibold';
  if (pct >= 60) return 'text-sky-700 font-medium';
  if (pct >= 50) return 'text-amber-700 font-medium';
  if (pct >= 40) return 'text-orange-700 font-medium';
  return 'text-rose-600 font-semibold';
};

const formatExamName = (name) => {
  if (!name) return 'Exam';
  let clean = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const lower = clean.toLowerCase();
  if (lower.includes('first mid term')) return 'First Mid Term Exam';
  if (lower.includes('first term')) return 'First Term Exam';
  if (lower.includes('second mid term')) return 'Second Mid Term Exam';
  if (lower.includes('second term')) return 'Second Term Exam';
  if (lower.includes('unit test 2') || lower.includes('unit_test_2')) return 'Unit Test 2';
  if (lower.includes('unit test 1') || lower.includes('unit_test_1')) return 'Unit Test 1';
  if (lower.includes('model')) return 'Model Exam';
  if (lower.includes('annual')) return 'Annual Exam';
  return clean;
};

// Standard Theme Configuration for UI Cards & Tabs
const STANDARD_THEMES = {
  '8': {
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-500',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ring: 'focus:ring-emerald-500',
    activeTab: 'bg-emerald-600 text-white shadow-sm'
  },
  '9': {
    gradient: 'from-blue-600 to-indigo-600',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    hoverBorder: 'hover:border-blue-500',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    ring: 'focus:ring-blue-500',
    activeTab: 'bg-blue-600 text-white shadow-sm'
  },
  '10': {
    gradient: 'from-purple-600 to-fuchsia-600',
    lightBg: 'bg-purple-50',
    border: 'border-purple-200',
    hoverBorder: 'hover:border-purple-500',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    ring: 'focus:ring-purple-500',
    activeTab: 'bg-purple-600 text-white shadow-sm'
  }
};

const getThemeForStandard = (std) => {
  return STANDARD_THEMES[std] || {
    gradient: 'from-indigo-600 to-slate-700',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    hoverBorder: 'hover:border-indigo-500',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    ring: 'focus:ring-indigo-500',
    activeTab: 'bg-indigo-600 text-white shadow-sm'
  };
};

const StudentOutsourcingView = () => {
  // Read initial standard from URL query param (?standard=8)
  const getInitialStandard = () => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get('standard');
      return s || null; // null represents Standards Directory Overview
    } catch (_) {
      return null;
    }
  };

  // State
  const [selectedStandard, setSelectedStandard] = useState(getInitialStandard);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [records, setRecords] = useState([]);
  const [metadata, setMetadata] = useState({
    exams: [],
    allExams: [],
    standards: [],
    classes: [],
    academicYear: null,
    standardsSummary: []
  });

  // Filter & Search Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [markMode, setMarkMode] = useState('both'); // 'both', 'total', 'te'
  const [minPercentage, setMinPercentage] = useState('');
  const [maxPercentage, setMaxPercentage] = useState('');
  const [rollNumberFilter, setRollNumberFilter] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [sortBy, setSortBy] = useState('rollNumber'); // default to rollNumber in standard view
  const [sortOrder, setSortOrder] = useState('asc');

  // Density & Popovers
  const [density, setDensity] = useState('comfortable'); // 'compact' | 'comfortable'
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination Controls
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('50'); // '25', '50', '100', 'all'
  const [totalRecords, setTotalRecords] = useState(0);

  // Column visibility controls
  const [columnVisibility, setColumnVisibility] = useState({
    gender: true,
    dob: true,
    phone: true,
    parent: true,
    category: false,
    address: false,
  });

  // Modal for individual student inspection
  const [selectedStudentModal, setSelectedStudentModal] = useState(null);

  // Sync selected standard with browser URL history
  const handleSelectStandard = (std) => {
    setSelectedStandard(std);
    setSelectedClassId('all');
    setPage(1);
    setSearchTerm('');
    setRollNumberFilter('');
    const url = new URL(window.location.href);
    if (std) {
      url.searchParams.set('standard', std);
    } else {
      url.searchParams.delete('standard');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Fetch Outsource Records from backend
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        standard: selectedStandard || 'all',
        classId: selectedClassId,
        grade: selectedGrade,
        markMode,
        gender: selectedGender,
        sortBy,
        sortOrder,
        page,
        limit: selectedStandard === null ? 1 : pageSize, // lightweight fetch if on overview
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (rollNumberFilter.trim()) params.rollNumber = rollNumberFilter.trim();
      if (minPercentage !== '') params.minPercentage = minPercentage;
      if (maxPercentage !== '') params.maxPercentage = maxPercentage;

      const res = await api.get('/students/outsource-records', { params });
      if (res.data?.success) {
        setRecords(res.data.data || []);
        setTotalRecords(res.data.total || 0);
        if (res.data.metadata) {
          setMetadata(res.data.metadata);
        }
      }
    } catch (err) {
      console.error('Failed to load outsource records:', err);
      toast.error('Failed to load student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [
    selectedStandard,
    selectedClassId,
    selectedGrade,
    markMode,
    selectedGender,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClassId('all');
    setSelectedGrade('all');
    setMarkMode('both');
    setMinPercentage('');
    setMaxPercentage('');
    setRollNumberFilter('');
    setSelectedGender('all');
    setSortBy('rollNumber');
    setSortOrder('asc');
    setPage(1);
  };

  // Sorting Handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'percentage' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedClassId !== 'all') count++;
    if (selectedGrade !== 'all') count++;
    if (markMode !== 'both') count++;
    if (minPercentage !== '' || maxPercentage !== '') count++;
    if (rollNumberFilter.trim()) count++;
    if (selectedGender !== 'all') count++;
    return count;
  }, [
    searchTerm,
    selectedClassId,
    selectedGrade,
    markMode,
    minPercentage,
    maxPercentage,
    rollNumberFilter,
    selectedGender,
  ]);

  // Handle Excel Export for the active standard
  const handleExportExcel = async () => {
    setExporting(true);
    const toastId = toast.loading(`Preparing Standard ${selectedStandard || 'All'} master Excel spreadsheet...`);

    try {
      let exportData = records;
      if (pageSize !== 'all') {
        const params = {
          standard: selectedStandard || 'all',
          classId: selectedClassId,
          grade: selectedGrade,
          markMode,
          gender: selectedGender,
          sortBy,
          sortOrder,
          limit: 'all',
        };
        if (searchTerm.trim()) params.search = searchTerm.trim();
        if (rollNumberFilter.trim()) params.rollNumber = rollNumberFilter.trim();
        if (minPercentage !== '') params.minPercentage = minPercentage;
        if (maxPercentage !== '') params.maxPercentage = maxPercentage;

        const res = await api.get('/students/outsource-records', { params });
        if (res.data?.success) {
          exportData = res.data.data || [];
        }
      }

      const rows = [];

      // Title & Metadata block
      rows.push(['PPM HIGHER SECONDARY SCHOOL, KOTTUKKARA']);
      rows.push([
        `STUDENT OUTSOURCE MASTER SHEET — STANDARD ${selectedStandard || 'ALL'}`,
        '',
        `Generated: ${new Date().toLocaleString()}`,
      ]);
      rows.push([
        `Mark Mode: ${markMode.toUpperCase()} | Total Students: ${exportData.length}`,
      ]);
      rows.push([]);

      // Headers Row
      const headers = [
        '#',
        'Roll No',
        'Admission No',
        'Student Name',
        'Standard',
        'Division',
        'Gender',
        'Date of Birth',
        'Phone Number',
        'Parent / Guardian',
        'Category / Caste',
        'Religion',
        'Address',
      ];

      // Exam dynamic columns (ONLY this standard's exams)
      metadata.exams.forEach((ex) => {
        const examLabel = ex.cleanName || formatExamName(ex.name);
        if (markMode === 'te') {
          headers.push(`${examLabel} (TE)`, `${examLabel} (Max)`, `${examLabel} (%)`, `${examLabel} (Grade)`);
        } else if (markMode === 'total') {
          headers.push(`${examLabel} (Total)`, `${examLabel} (Max)`, `${examLabel} (%)`, `${examLabel} (Grade)`);
        } else {
          headers.push(
            `${examLabel} (TE)`,
            `${examLabel} (Total TE+CE)`,
            `${examLabel} (Max)`,
            `${examLabel} (%)`,
            `${examLabel} (Grade)`
          );
        }
      });

      // Overall columns
      if (markMode === 'te') {
        headers.push('Cumulative TE Marks', 'Cumulative TE Max', 'Overall TE %', 'Overall TE Grade');
      } else if (markMode === 'total') {
        headers.push('Cumulative Total Marks', 'Cumulative Max', 'Overall %', 'Overall Grade');
      } else {
        headers.push('Cumulative TE', 'Cumulative Total', 'Cumulative Max', 'Overall %', 'Overall Grade');
      }

      rows.push(headers);

      // Data rows
      exportData.forEach((st, idx) => {
        const row = [
          idx + 1,
          st.rollNumber || '-',
          st.admissionNo || '-',
          st.fullName || '-',
          st.className || '-',
          st.division || '-',
          st.gender || '-',
          st.dateOfBirth || '-',
          st.phoneNumber || '-',
          st.parentName || '-',
          st.category || '-',
          st.religion || '-',
          st.address || '-',
        ];

        metadata.exams.forEach((ex) => {
          const em = st.examMarks ? st.examMarks[ex._id] : null;
          if (em) {
            if (markMode === 'te') {
              row.push(em.teScore ?? '-', em.teMax ?? '-', em.tePercentage !== null ? `${em.tePercentage}%` : '-', em.teGrade ?? '-');
            } else if (markMode === 'total') {
              row.push(em.totalScore ?? '-', em.totalMax ?? '-', em.totalPercentage !== null ? `${em.totalPercentage}%` : '-', em.totalGrade ?? '-');
            } else {
              row.push(
                em.teScore ?? '-',
                em.totalScore ?? '-',
                em.totalMax ?? '-',
                em.totalPercentage !== null ? `${em.totalPercentage}%` : '-',
                em.grade || em.totalGrade || '-'
              );
            }
          } else {
            const colCount = markMode === 'both' ? 5 : 4;
            for (let i = 0; i < colCount; i++) row.push('-');
          }
        });

        if (markMode === 'te') {
          row.push(st.cumTeScore || 0, st.cumTeMax || 0, st.overallTePercentage !== null ? `${st.overallTePercentage}%` : '-', st.overallTeGrade || '-');
        } else if (markMode === 'total') {
          row.push(st.cumTotalScore || 0, st.cumTotalMax || 0, st.overallTotalPercentage !== null ? `${st.overallTotalPercentage}%` : '-', st.overallGrade || '-');
        } else {
          row.push(st.cumTeScore || 0, st.cumTotalScore || 0, st.cumTotalMax || 0, st.overallTotalPercentage !== null ? `${st.overallTotalPercentage}%` : '-', st.overallGrade || '-');
        }

        rows.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const colWidths = headers.map((h, i) => {
        let maxLen = Math.max(h.length, ...rows.slice(4).map((r) => (r[i] ? r[i].toString().length : 0)));
        return { wch: Math.min(Math.max(maxLen + 3, 10), 35) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Std_${selectedStandard || 'All'}`);

      const fileName = `PPM_HSS_Standard_${selectedStandard || 'All'}_Student_Marks_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Spreadsheet exported successfully!', { id: toastId });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export Excel file', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // Divisions belonging to the currently selected standard
  const activeStandardClasses = useMemo(() => {
    if (!metadata.classes) return [];
    if (!selectedStandard || selectedStandard === 'all') return metadata.classes;
    return metadata.classes.filter((c) => c.name === selectedStandard);
  }, [metadata.classes, selectedStandard]);

  // Overall Total Active Students across all standards
  const totalSchoolStudents = useMemo(() => {
    if (!metadata.standardsSummary || metadata.standardsSummary.length === 0) return totalRecords;
    return metadata.standardsSummary.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);
  }, [metadata.standardsSummary, totalRecords]);

  // Row density class
  const cellPy = density === 'compact' ? 'py-1.5' : 'py-2.5';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 font-sans">
      
      {/* ═══════════════════════════════════════════════════════════════════════
          VIEW 1: STANDARDS DIRECTORY OVERVIEW (LIKE ADMIN STANDARDS LIST)
          Rendered when selectedStandard is null
         ═══════════════════════════════════════════════════════════════════════ */}
      {selectedStandard === null ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Outsource Academic Directory</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Academic Standards
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Select a standard to view its divisions, student profiles, and standard-specific terminal exam marks.
                </p>
              </div>

              {/* Total Statistics Pill */}
              <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</div>
                    <div className="text-lg font-black text-slate-900">
                      {totalSchoolStudents.toLocaleString()} <span className="text-xs font-normal text-slate-500">Students</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Standards Cards Grid */}
          {loading && (!metadata.standardsSummary || metadata.standardsSummary.length === 0) ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <LoadingSpinner />
              <p className="text-xs text-slate-500 mt-3 font-medium">Loading Academic Standards...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(metadata.standardsSummary || []).map((stdSummary) => {
                const std = stdSummary.standard;
                const theme = getThemeForStandard(std);
                const stdExams = stdSummary.exams || [];

                return (
                  <div
                    key={std}
                    onClick={() => handleSelectStandard(std)}
                    className={`group relative flex flex-col justify-between bg-white border ${theme.border} ${theme.hoverBorder} rounded-3xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden text-left`}
                  >
                    {/* Top Accent Gradient Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient} z-20`} />

                    {/* Background Decorative Glow */}
                    <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full ${theme.lightBg} opacity-40 group-hover:scale-150 transition-transform duration-500 pointer-events-none z-0`} />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div>
                      {/* Top Header inside Card */}
                      <div className="flex items-center justify-between mb-5">
                        <div className={`w-14 h-14 rounded-2xl ${theme.lightBg} ${theme.text} flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform duration-300`}>
                          <GraduationCap className="w-7 h-7" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${theme.badge}`}>
                            Standard {std}
                          </span>
                          <div className={`w-8 h-8 rounded-full ${theme.lightBg} ${theme.text} flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200`}>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Title & Stats */}
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-900 transition-colors">
                        Standard {std}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Complete student profiles and terminal examination marks
                      </p>

                      {/* Stat Chips */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Students</span>
                          </div>
                          <div className="text-base font-extrabold text-slate-900 mt-0.5">
                            {stdSummary.studentCount?.toLocaleString() || 0}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Divisions</span>
                          </div>
                          <div className="text-base font-extrabold text-slate-900 mt-0.5">
                            {stdSummary.divisionsCount || 0}{' '}
                            <span className="text-[10px] font-medium text-slate-500">
                              ({std} A - {std} {stdSummary.divisions ? stdSummary.divisions[stdSummary.divisions.length - 1] : ''})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Applicable Terminal Exams Section */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Terminal Exams for Standard {std}:</span>
                        </div>
                        {stdExams.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {stdExams.map((ex) => (
                              <span
                                key={ex._id}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50/80 text-indigo-800 text-[11px] font-semibold border border-indigo-200/70"
                              >
                                {ex.cleanName || formatExamName(ex.name)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No exams recorded yet</span>
                        )}
                      </div>
                    </div>

                      {/* Bottom CTA Button */}
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-900 text-white group-hover:bg-indigo-600 transition-colors shadow-xs`}
                        >
                          <span>Open Standard {std} Sheet</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════
            VIEW 2: STANDARD-SPECIFIC STUDENT MASTER SHEET
            Rendered when selectedStandard is set (e.g. '8', '9', '10')
           ═══════════════════════════════════════════════════════════════════════ */
        <>
          {/* ── Top Navigation & Filter Controls Bar (Fixed) ────────────────── */}
          <div className="bg-white border-b border-slate-200 px-4 py-2.5 shrink-0 z-20 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left Group: Back to Standards, Standard Switcher Tabs, Division, Search, Mode */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                
                {/* Back to Standards Directory Button */}
                <button
                  type="button"
                  onClick={() => handleSelectStandard(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs"
                  title="Back to Standards Directory"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Standards</span>
                </button>

                {/* Standard Switcher Tabs */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold select-none">
                  {(metadata.standards || ['8', '9', '10']).map((std) => {
                    const isActive = selectedStandard === std;
                    const theme = getThemeForStandard(std);
                    const stdSum = metadata.standardsSummary?.find((s) => s.standard === std);

                    return (
                      <button
                        key={std}
                        type="button"
                        onClick={() => handleSelectStandard(std)}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                          isActive
                            ? `${theme.activeTab}`
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <span>Std {std}</span>
                        {stdSum?.studentCount && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {stdSum.studentCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

                {/* Division Selector (Filtered to this Standard only!) */}
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setPage(1);
                    }}
                    className="pl-3 pr-7 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none shadow-2xs"
                  >
                    <option value="all">
                      All Divisions ({activeStandardClasses.length})
                    </option>
                    {activeStandardClasses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.section}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>

                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="relative min-w-[200px] sm:min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder={`Search Std ${selectedStandard} students...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/60 focus:bg-white placeholder-slate-400 font-medium"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setPage(1);
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Marks Mode Segmented Toggle */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold select-none">
                  <button
                    type="button"
                    onClick={() => setMarkMode('both')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      markMode === 'both'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Show both Theory Exam (TE) and Total Marks"
                  >
                    Both TE & Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkMode('total')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      markMode === 'total'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Show Total Marks only"
                  >
                    Total Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkMode('te')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      markMode === 'te'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Show Theory Exam marks only"
                  >
                    TE Only
                  </button>
                </div>

                {/* Grade Quick Filter */}
                <div className="relative">
                  <select
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setPage(1);
                    }}
                    className={`pl-2.5 pr-6 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer appearance-none transition-all ${
                      selectedGrade !== 'all'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <option value="all">All Grades</option>
                    <option value="A+">Grade A+ (90-100%)</option>
                    <option value="A">Grade A (80-89%)</option>
                    <option value="B+">Grade B+ (70-79%)</option>
                    <option value="B">Grade B (60-69%)</option>
                    <option value="C+">Grade C+ (50-59%)</option>
                    <option value="C">Grade C (40-49%)</option>
                    <option value="D+">Grade D+ (30-39%)</option>
                    <option value="D">Grade D (20-29%)</option>
                    <option value="E">Grade E (Below 20%)</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>

                {/* Advanced Filters Button */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                    showAdvancedFilters || activeFiltersCount > 0
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Right Action Tools: Count, Columns, Density, Export */}
              <div className="flex items-center gap-2">
                {/* Active Standard Record Tally Badge */}
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{totalRecords.toLocaleString()} Students (Std {selectedStandard})</span>
                </div>

                {/* Columns Visibility Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                    title="Toggle profile columns"
                  >
                    <span>Columns</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showColumnsMenu && (
                    <div className="absolute right-0 top-9 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 text-xs space-y-1 animate-fadeIn">
                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] px-2 py-1">
                        Profile Columns
                      </div>
                      {Object.keys(columnVisibility).map((key) => (
                        <label
                          key={key}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer font-medium text-slate-700"
                        >
                          <span className="capitalize">{key === 'dob' ? 'Date of Birth' : key}</span>
                          <input
                            type="checkbox"
                            checked={columnVisibility[key]}
                            onChange={() => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Density Switcher */}
                <button
                  type="button"
                  onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs cursor-pointer"
                  title={density === 'compact' ? 'Switch to Comfortable row spacing' : 'Switch to Compact row spacing'}
                >
                  {density === 'compact' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchRecords}
                  disabled={loading}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs cursor-pointer"
                  title="Refresh data"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {/* Excel Export Button */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting || records.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title={`Export Standard ${selectedStandard} students and marks to Excel`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Std {selectedStandard} (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Collapsible Advanced Filters Drawer */}
            {showAdvancedFilters && (
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => {
                      setSelectedGender(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
                  >
                    <option value="all">All Genders</option>
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="Filter by roll number..."
                    value={rollNumberFilter}
                    onChange={(e) => {
                      setRollNumberFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min % Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 50"
                    value={minPercentage}
                    onChange={(e) => {
                      setMinPercentage(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max % Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 100"
                    value={maxPercentage}
                    onChange={(e) => {
                      setMaxPercentage(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Main High-Performance Scrollable Table Area ─────────────────── */}
          <div className="flex-1 overflow-auto bg-slate-100">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <LoadingSpinner />
                <p className="text-xs text-slate-500 mt-3 font-medium">Loading Standard {selectedStandard} records & exam marks...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No student records found for Standard {selectedStandard}</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  No students match the current filters. Try changing division or clearing filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full text-left border-separate border-spacing-0">
                  {/* Sticky Table Header */}
                  <thead className="bg-slate-900 text-slate-200 sticky top-0 z-30 shadow-xs text-[11px] uppercase tracking-wider font-extrabold select-none">
                    <tr>
                      {/* Sticky Identification Columns */}
                      <th className="py-2.5 px-2 bg-slate-900 sticky left-0 z-40 text-center w-10 border-b border-r border-slate-800">
                        #
                      </th>

                      <th
                        onClick={() => handleSort('rollNumber')}
                        className="py-2.5 px-2 bg-slate-900 sticky left-10 z-40 text-center w-12 border-b border-r border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
                        title="Sort by Roll Number"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Roll</span>
                          {sortBy === 'rollNumber' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSort('admissionNo')}
                        className="py-2.5 px-3 bg-slate-900 sticky left-22 z-40 w-20 border-b border-r border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
                        title="Sort by Admission Number"
                      >
                        <div className="flex items-center gap-1">
                          <span>Adm No</span>
                          {sortBy === 'admissionNo' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSort('name')}
                        className="py-2.5 px-3 bg-slate-900 sticky left-42 z-40 min-w-[200px] border-b border-r border-slate-800 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.3)] cursor-pointer hover:bg-slate-800 transition-colors"
                        title="Sort by Student Name"
                      >
                        <div className="flex items-center gap-1">
                          <span>Student Name</span>
                          {sortBy === 'name' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSort('standard')}
                        className="py-2.5 px-2.5 bg-slate-900 text-center border-b border-r border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap"
                        title="Sort by Standard & Division"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Div</span>
                          {sortBy === 'standard' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          )}
                        </div>
                      </th>

                      {/* Optional Profile Columns */}
                      {columnVisibility.gender && (
                        <th className="py-2.5 px-2 bg-slate-900 text-center border-b border-r border-slate-800">
                          Gender
                        </th>
                      )}
                      {columnVisibility.dob && (
                        <th className="py-2.5 px-2.5 bg-slate-900 text-center border-b border-r border-slate-800 whitespace-nowrap">
                          DOB
                        </th>
                      )}
                      {columnVisibility.phone && (
                        <th className="py-2.5 px-3 bg-slate-900 border-b border-r border-slate-800">
                          Phone
                        </th>
                      )}
                      {columnVisibility.parent && (
                        <th className="py-2.5 px-3 bg-slate-900 border-b border-r border-slate-800 min-w-[130px]">
                          Parent / Guardian
                        </th>
                      )}
                      {columnVisibility.category && (
                        <th className="py-2.5 px-3 bg-slate-900 border-b border-r border-slate-800">
                          Category
                        </th>
                      )}
                      {columnVisibility.address && (
                        <th className="py-2.5 px-3 bg-slate-900 border-b border-r border-slate-800 min-w-[180px]">
                          Address
                        </th>
                      )}

                      {/* Dynamic Exam Columns (ONLY this standard's exams!) */}
                      {metadata.exams.map((ex) => {
                        const examTitle = ex.cleanName || formatExamName(ex.name);
                        return (
                          <th
                            key={ex._id}
                            className="py-2.5 px-3 text-center bg-slate-850 border-b border-r border-slate-800 min-w-[140px] max-w-[180px]"
                          >
                            <div className="font-bold text-white normal-case text-xs truncate" title={examTitle}>
                              {examTitle}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal tracking-normal normal-case">
                              {markMode === 'te' ? 'TE • Grade' : markMode === 'total' ? 'Total • Grade' : 'TE | Total • %'}
                            </div>
                          </th>
                        );
                      })}

                      {/* Overall Cumulative Performance Highlight Header */}
                      <th
                        onClick={() => handleSort('percentage')}
                        className="py-2.5 px-3 bg-indigo-950 text-indigo-100 border-b border-r border-indigo-800 text-center min-w-[110px] cursor-pointer hover:bg-indigo-900 transition-colors"
                        title="Sort by Overall Cumulative Percentage"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Overall %</span>
                          {sortBy === 'percentage' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                          )}
                        </div>
                        <div className="text-[9.5px] text-indigo-300 font-normal normal-case">
                          Cumulative Score
                        </div>
                      </th>

                      {/* Overall Grade Header */}
                      <th className="py-2.5 px-2.5 bg-indigo-950 text-indigo-100 border-b border-r border-indigo-800 text-center w-16">
                        Grade
                      </th>

                      {/* Action Header */}
                      <th className="py-2.5 px-2 bg-slate-900 border-b border-slate-800 text-center w-10">
                        Action
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-100 bg-white text-xs">
                    {records.map((st, idx) => {
                      const displayPct = markMode === 'te' ? st.overallTePercentage : st.overallTotalPercentage;
                      const displayGrade = markMode === 'te' ? st.overallTeGrade : st.overallGrade;

                      return (
                        <tr
                          key={st._id}
                          className="hover:bg-indigo-50/30 transition-colors duration-150 group"
                        >
                          {/* Row Index */}
                          <td className={`${cellPy} px-2 text-center text-slate-400 font-mono text-[10px] bg-white group-hover:bg-indigo-50/30 sticky left-0 z-20 border-b border-r border-slate-100`}>
                            {(page - 1) * (pageSize === 'all' ? 0 : Number(pageSize)) + idx + 1}
                          </td>

                          {/* Roll Number */}
                          <td className={`${cellPy} px-2 text-center font-bold text-slate-800 bg-white group-hover:bg-indigo-50/30 sticky left-10 z-20 border-b border-r border-slate-100 font-mono`}>
                            {st.rollNumber !== '-' ? (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-extrabold text-[11px]">
                                {st.rollNumber}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Admission Number */}
                          <td className={`${cellPy} px-3 text-slate-600 font-mono text-[11px] bg-white group-hover:bg-indigo-50/30 sticky left-22 z-20 border-b border-r border-slate-100`}>
                            {st.admissionNo}
                          </td>

                          {/* Student Name */}
                          <td className={`${cellPy} px-3 font-semibold text-slate-900 bg-white group-hover:bg-indigo-50/30 sticky left-42 z-20 border-b border-r border-slate-100 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.06)]`}>
                            <div className="flex flex-col">
                              <span className="uppercase tracking-tight font-bold">{st.fullName}</span>
                              {st.fullNameMalayalam && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {st.fullNameMalayalam}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Class & Division */}
                          <td className={`${cellPy} px-2.5 text-center text-slate-700 font-bold border-b border-r border-slate-100 whitespace-nowrap`}>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                              {st.className} {st.division}
                            </span>
                          </td>

                          {/* Optional Profile Columns */}
                          {columnVisibility.gender && (
                            <td className={`${cellPy} px-2 text-center text-slate-600 border-b border-r border-slate-100 font-semibold`}>
                              {st.gender}
                            </td>
                          )}

                          {columnVisibility.dob && (
                            <td className={`${cellPy} px-2.5 text-center text-slate-600 border-b border-r border-slate-100 whitespace-nowrap font-mono text-[10.5px]`}>
                              {st.dateOfBirth}
                            </td>
                          )}

                          {columnVisibility.phone && (
                            <td className={`${cellPy} px-3 text-slate-600 border-b border-r border-slate-100 font-mono text-[11px]`}>
                              {st.phoneNumber !== '-' ? (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{st.phoneNumber}</span>
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          )}

                          {columnVisibility.parent && (
                            <td className={`${cellPy} px-3 text-slate-600 border-b border-r border-slate-100 truncate max-w-[160px]`}>
                              {st.parentName}
                            </td>
                          )}

                          {columnVisibility.category && (
                            <td className={`${cellPy} px-3 text-slate-600 border-b border-r border-slate-100 whitespace-nowrap`}>
                              {st.category} {st.casteName && st.casteName !== '-' ? `(${st.casteName})` : ''}
                            </td>
                          )}

                          {columnVisibility.address && (
                            <td className={`${cellPy} px-3 text-slate-500 border-b border-r border-slate-100 truncate max-w-[200px] text-[11px]`}>
                              {st.address}
                            </td>
                          )}

                          {/* Dynamic Exam Columns (ONLY this standard's exams!) */}
                          {metadata.exams.map((ex) => {
                            const em = st.examMarks ? st.examMarks[ex._id] : null;

                            if (!em) {
                              return (
                                <td
                                  key={ex._id}
                                  className={`${cellPy} px-2.5 text-center text-slate-300 border-b border-r border-slate-100 font-mono`}
                                >
                                  —
                                </td>
                              );
                            }

                            if (markMode === 'te') {
                              return (
                                <td
                                  key={ex._id}
                                  className={`${cellPy} px-2.5 text-center border-b border-r border-slate-100`}
                                >
                                  <div className="font-bold text-slate-900 text-xs">
                                    {em.teScore} <span className="text-slate-400 font-normal text-[10px]">/{em.teMax}</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-0.5">
                                    <span className={`text-[10px] ${getPercentageColor(em.tePercentage)}`}>
                                      {em.tePercentage}%
                                    </span>
                                    <span className={`px-1 py-0.2 rounded text-[9.5px] border ${getGradeBadge(em.teGrade)}`}>
                                      {em.teGrade}
                                    </span>
                                  </div>
                                </td>
                              );
                            }

                            if (markMode === 'total') {
                              return (
                                <td
                                  key={ex._id}
                                  className={`${cellPy} px-2.5 text-center border-b border-r border-slate-100`}
                                >
                                  <div className="font-bold text-slate-900 text-xs">
                                    {em.totalScore} <span className="text-slate-400 font-normal text-[10px]">/{em.totalMax}</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1 mt-0.5">
                                    <span className={`text-[10px] ${getPercentageColor(em.totalPercentage)}`}>
                                      {em.totalPercentage}%
                                    </span>
                                    <span className={`px-1 py-0.2 rounded text-[9.5px] border ${getGradeBadge(em.totalGrade)}`}>
                                      {em.totalGrade}
                                    </span>
                                  </div>
                                </td>
                              );
                            }

                            // Both Mode (TE & Total cleanly separated)
                            return (
                              <td
                                key={ex._id}
                                className={`${cellPy} px-2.5 text-center border-b border-r border-slate-100`}
                              >
                                <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                                  <span className="text-blue-700" title="Theory Exam Marks">
                                    {em.teScore}
                                  </span>
                                  <span className="text-slate-300 font-normal">|</span>
                                  <span className="text-emerald-700" title="Total Marks (TE+CE)">
                                    {em.totalScore}
                                  </span>
                                  <span className="text-slate-400 font-normal text-[10px]">
                                    /{em.totalMax}
                                  </span>
                                </div>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                  <span className={`text-[10px] ${getPercentageColor(em.totalPercentage)}`}>
                                    {em.totalPercentage}%
                                  </span>
                                  <span className={`px-1 py-0.2 rounded text-[9px] border ${getGradeBadge(em.grade || em.totalGrade)}`}>
                                    {em.grade || em.totalGrade}
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          {/* Overall Cumulative Percentage */}
                          <td className={`${cellPy} px-3 text-center bg-indigo-50/40 border-b border-r border-indigo-100 whitespace-nowrap`}>
                            <div className="font-extrabold text-indigo-950 text-xs">
                              {displayPct !== null ? `${displayPct}%` : '—'}
                            </div>
                            <div className="text-[9.5px] text-slate-400 font-mono">
                              {markMode === 'te' ? `${st.cumTeScore}/${st.cumTeMax}` : `${st.cumTotalScore}/${st.cumTotalMax}`}
                            </div>
                          </td>

                          {/* Overall Grade */}
                          <td className={`${cellPy} px-2.5 text-center bg-indigo-50/40 border-b border-r border-indigo-100 whitespace-nowrap`}>
                            {displayGrade ? (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] border ${getGradeBadge(displayGrade)}`}>
                                {displayGrade}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Action (View Detail) */}
                          <td className={`${cellPy} px-2 text-center border-b border-slate-100`}>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentModal(st)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="View student report & exam breakdown"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Fixed Bottom Footer Bar ─────────────────────────────────────── */}
          <div className="bg-white border-t border-slate-200 px-4 py-2 shrink-0 z-20 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-900">{records.length}</span> of{' '}
              <span className="font-bold text-slate-900">{totalRecords.toLocaleString()}</span> students in{' '}
              <span className="font-bold text-indigo-700">Standard {selectedStandard}</span>
            </div>

            {/* Rows per page selector and pagination */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value);
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded border border-slate-200 bg-white font-bold text-slate-700 cursor-pointer"
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="250">250</option>
                  <option value="all">All ({totalRecords})</option>
                </select>
              </div>

              {pageSize !== 'all' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-bold text-slate-800">
                    Page {page} of {Math.ceil(totalRecords / Number(pageSize)) || 1}
                  </span>
                  <button
                    type="button"
                    disabled={page * Number(pageSize) >= totalRecords}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Student Details Modal ────────────────────────────────────────────── */}
      {selectedStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-sm font-mono">
                  {selectedStudentModal.rollNumber !== '-' ? selectedStudentModal.rollNumber : '#'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedStudentModal.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Admission No: {selectedStudentModal.admissionNo} • Class: {selectedStudentModal.classDisplay}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-700">
              {/* Personal Details Grid */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2.5">
                  Personal & Contact Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gender</span>
                    <span className="font-semibold text-slate-800">{selectedStudentModal.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{selectedStudentModal.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone Number</span>
                    <span className="font-semibold text-slate-800">{selectedStudentModal.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Parent / Guardian</span>
                    <span className="font-semibold text-slate-800">{selectedStudentModal.parentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Category / Caste</span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudentModal.category} {selectedStudentModal.casteName ? `(${selectedStudentModal.casteName})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Blood Group</span>
                    <span className="font-semibold text-slate-800">{selectedStudentModal.bloodGroup}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 block text-[10px]">Address</span>
                    <span className="font-semibold text-slate-800">{selectedStudentModal.address}</span>
                  </div>
                </div>
              </div>

              {/* All Terminal Exams Breakdown (Filtered strictly to student's standard's exams!) */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2.5">
                  Terminal Exams Marks ({selectedStudentModal.classDisplay})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Exam Name</th>
                        <th className="py-2.5 px-3 text-center">TE Marks</th>
                        <th className="py-2.5 px-3 text-center">Total (TE+CE)</th>
                        <th className="py-2.5 px-3 text-center">Max</th>
                        <th className="py-2.5 px-3 text-center">Percentage</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {metadata.exams.map((ex) => {
                        const em = selectedStudentModal.examMarks
                          ? selectedStudentModal.examMarks[ex._id]
                          : null;
                        const examTitle = ex.cleanName || formatExamName(ex.name);

                        return (
                          <tr key={ex._id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{examTitle}</td>
                            <td className="py-2.5 px-3 text-center text-blue-700 font-bold">
                              {em?.teScore !== null && em?.teScore !== undefined ? em.teScore : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                              {em?.totalScore !== null && em?.totalScore !== undefined ? em.totalScore : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500">
                              {em?.totalMax || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {em?.totalPercentage !== null && em?.totalPercentage !== undefined ? `${em.totalPercentage}%` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {em?.grade ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] border ${getGradeBadge(em.grade)}`}>
                                  {em.grade}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-indigo-50/80 font-bold border-t-2 border-indigo-200">
                      <tr>
                        <td className="py-2.5 px-3 text-indigo-950">OVERALL CUMULATIVE</td>
                        <td className="py-2.5 px-3 text-center text-blue-800">{selectedStudentModal.cumTeScore}</td>
                        <td className="py-2.5 px-3 text-center text-emerald-800">{selectedStudentModal.cumTotalScore}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{selectedStudentModal.cumTotalMax}</td>
                        <td className="py-2.5 px-3 text-center text-indigo-900 text-sm">{selectedStudentModal.overallTotalPercentage}%</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-xs border ${getGradeBadge(selectedStudentModal.overallGrade)}`}>
                            {selectedStudentModal.overallGrade}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStudentModal(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOutsourcingView;
