import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal, 
  Eye, 
  X, 
  Printer, 
  GraduationCap, 
  Award, 
  Users, 
  Percent, 
  Calendar,
  Building,
  Phone,
  CheckCircle2,
  AlertCircle
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
  if (pct === null || pct === undefined) return 'text-gray-400';
  if (pct >= 90) return 'text-emerald-700 font-bold';
  if (pct >= 80) return 'text-green-700 font-bold';
  if (pct >= 70) return 'text-blue-700 font-semibold';
  if (pct >= 60) return 'text-sky-700 font-medium';
  if (pct >= 50) return 'text-amber-700 font-medium';
  if (pct >= 40) return 'text-orange-700 font-medium';
  return 'text-red-600 font-semibold';
};

const StudentOutsourcingView = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [records, setRecords] = useState([]);
  const [metadata, setMetadata] = useState({
    exams: [],
    standards: [],
    classes: [],
    academicYear: null
  });

  // Filter & Search Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [markMode, setMarkMode] = useState('both'); // 'both', 'total', 'te'
  const [minPercentage, setMinPercentage] = useState('');
  const [maxPercentage, setMaxPercentage] = useState('');
  const [rollNumberFilter, setRollNumberFilter] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [sortBy, setSortBy] = useState('standard'); // 'standard', 'rollNumber', 'admissionNo', 'name', 'percentage'
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination Controls
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('all'); // '25', '50', '100', 'all'
  const [totalRecords, setTotalRecords] = useState(0);

  // Column visibility controls
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
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

  // Fetch Outsource Records from backend
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        standard: selectedStandard,
        classId: selectedClassId,
        grade: selectedGrade,
        markMode,
        gender: selectedGender,
        sortBy,
        sortOrder,
        page,
        limit: pageSize,
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
    setSelectedStandard('all');
    setSelectedClassId('all');
    setSelectedGrade('all');
    setMarkMode('both');
    setMinPercentage('');
    setMaxPercentage('');
    setRollNumberFilter('');
    setSelectedGender('all');
    setSortBy('standard');
    setSortOrder('asc');
    setPage(1);
  };

  // KPI calculations on current records
  const kpis = useMemo(() => {
    if (!records.length) {
      return { total: 0, avgPercentage: 0, passedCount: 0, aPlusCount: 0 };
    }
    let sumPct = 0;
    let countWithMarks = 0;
    let aPlus = 0;
    let passed = 0;

    records.forEach((r) => {
      const pct = markMode === 'te' ? r.overallTePercentage : r.overallTotalPercentage;
      if (pct !== null && pct !== undefined) {
        sumPct += pct;
        countWithMarks++;
        if (pct >= 90) aPlus++;
        if (pct >= 40) passed++;
      }
    });

    return {
      total: totalRecords || records.length,
      avgPercentage: countWithMarks > 0 ? (sumPct / countWithMarks).toFixed(1) : 0,
      passedCount: passed,
      aPlusCount: aPlus,
    };
  }, [records, totalRecords, markMode]);

  // Handle Excel Export
  const handleExportExcel = async () => {
    setExporting(true);
    const toastId = toast.loading('Generating Excel spreadsheet...');

    try {
      // If currently paginated, fetch all records for the export
      let exportData = records;
      if (pageSize !== 'all') {
        const params = {
          standard: selectedStandard,
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

      if (!exportData.length) {
        toast.error('No data to export', { id: toastId });
        setExporting(false);
        return;
      }

      // Build Sheet Data
      const rows = [];

      // Metadata Info Rows
      rows.push(['PPM HIGHER SECONDARY SCHOOL, KOTTUKKARA']);
      rows.push(['STUDENT OUTSOURCING & CONSOLIDATED MARKS MASTER SHEET']);
      rows.push([
        `Academic Year: ${metadata.academicYear?.year || 'Current'}`,
        `Generated Date: ${new Date().toLocaleDateString('en-IN')}`,
        `Total Students: ${exportData.length}`,
        `Marks Mode: ${markMode === 'te' ? 'Theory Exam (TE)' : markMode === 'total' ? 'TE + CE Total' : 'TE & Total (Both)'}`,
      ]);
      rows.push([]); // Empty row

      // Build Dynamic Table Headers
      const headers = [
        'Sl No',
        'Roll No',
        'Admission No',
        'Student Name',
        'Class',
        'Division',
        'Gender',
        'Date of Birth',
        'Phone Number',
        'Parent / Guardian',
        'Category',
        'Religion',
        'Address',
      ];

      // Add exam columns
      metadata.exams.forEach((ex) => {
        const exName = ex.name || 'Exam';
        if (markMode === 'te') {
          headers.push(`${exName} TE Marks`);
          headers.push(`${exName} TE Max`);
          headers.push(`${exName} TE %`);
          headers.push(`${exName} TE Grade`);
        } else if (markMode === 'total') {
          headers.push(`${exName} Total Marks`);
          headers.push(`${exName} Total Max`);
          headers.push(`${exName} %`);
          headers.push(`${exName} Grade`);
        } else {
          headers.push(`${exName} TE`);
          headers.push(`${exName} Total (TE+CE)`);
          headers.push(`${exName} Max`);
          headers.push(`${exName} %`);
          headers.push(`${exName} Grade`);
        }
      });

      // Overall columns
      if (markMode === 'te') {
        headers.push('Overall TE Marks');
        headers.push('Overall TE Max');
        headers.push('Overall TE %');
        headers.push('Overall TE Grade');
      } else if (markMode === 'total') {
        headers.push('Overall Total Marks');
        headers.push('Overall Max Marks');
        headers.push('Overall %');
        headers.push('Overall Grade');
      } else {
        headers.push('Overall TE Marks');
        headers.push('Overall Total Marks');
        headers.push('Overall Max Marks');
        headers.push('Overall %');
        headers.push('Overall Grade');
      }

      rows.push(headers);

      // Populate Data Rows
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

        // Exams data
        metadata.exams.forEach((ex) => {
          const em = st.examMarks ? st.examMarks[ex._id] : null;
          if (em) {
            if (markMode === 'te') {
              row.push(em.teScore !== null ? em.teScore : '-');
              row.push(em.teMax || '-');
              row.push(em.tePercentage !== null ? `${em.tePercentage}%` : '-');
              row.push(em.teGrade || '-');
            } else if (markMode === 'total') {
              row.push(em.totalScore !== null ? em.totalScore : '-');
              row.push(em.totalMax || '-');
              row.push(em.totalPercentage !== null ? `${em.totalPercentage}%` : '-');
              row.push(em.totalGrade || '-');
            } else {
              row.push(em.teScore !== null ? em.teScore : '-');
              row.push(em.totalScore !== null ? em.totalScore : '-');
              row.push(em.totalMax || '-');
              row.push(em.totalPercentage !== null ? `${em.totalPercentage}%` : '-');
              row.push(em.grade || em.totalGrade || '-');
            }
          } else {
            const colCount = markMode === 'both' ? 5 : 4;
            for (let i = 0; i < colCount; i++) row.push('-');
          }
        });

        // Overall columns
        if (markMode === 'te') {
          row.push(st.cumTeScore || 0);
          row.push(st.cumTeMax || 0);
          row.push(st.overallTePercentage !== null ? `${st.overallTePercentage}%` : '-');
          row.push(st.overallTeGrade || '-');
        } else if (markMode === 'total') {
          row.push(st.cumTotalScore || 0);
          row.push(st.cumTotalMax || 0);
          row.push(st.overallTotalPercentage !== null ? `${st.overallTotalPercentage}%` : '-');
          row.push(st.overallGrade || '-');
        } else {
          row.push(st.cumTeScore || 0);
          row.push(st.cumTotalScore || 0);
          row.push(st.cumTotalMax || 0);
          row.push(st.overallTotalPercentage !== null ? `${st.overallTotalPercentage}%` : '-');
          row.push(st.overallGrade || '-');
        }

        rows.push(row);
      });

      // Create sheet and workbook
      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Auto column widths
      const colWidths = headers.map((h, i) => {
        let maxLen = Math.max(
          h.length,
          ...rows.slice(4).map((r) => (r[i] ? r[i].toString().length : 0))
        );
        return { wch: Math.min(Math.max(maxLen + 3, 10), 35) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student_Outsource_Data');

      const fileName = `Student_Outsource_Master_${selectedStandard === 'all' ? 'All_Classes' : `Class_${selectedStandard}`}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Excel downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export Excel', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedStandard !== 'all') count++;
    if (selectedClassId !== 'all') count++;
    if (selectedGrade !== 'all') count++;
    if (markMode !== 'both') count++;
    if (minPercentage !== '' || maxPercentage !== '') count++;
    if (rollNumberFilter.trim()) count++;
    if (selectedGender !== 'all') count++;
    return count;
  }, [
    searchTerm,
    selectedStandard,
    selectedClassId,
    selectedGrade,
    markMode,
    minPercentage,
    maxPercentage,
    rollNumberFilter,
    selectedGender,
  ]);

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Student Outsourcing & Master Records
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Consolidated master sheet containing student full details, all terminal exam marks, overall % & grades
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              disabled={exporting || loading}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export to Excel (.xlsx)'}
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all cursor-pointer"
              title="Print master table"
            >
              <Printer className="w-4 h-4 mr-2 text-gray-600" />
              Print
            </button>

            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`inline-flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                showFiltersPanel
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-bold rounded-full bg-primary-600 text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={fetchRecords}
              disabled={loading}
              className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 transition-all cursor-pointer"
              title="Reload data"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── KPI Summary Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Total Students</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{kpis.total}</div>
            <span className="text-[11px] text-slate-500">Matching criteria</span>
          </div>

          <div className="bg-indigo-50/80 rounded-xl p-3.5 border border-indigo-200/60">
            <div className="flex items-center justify-between text-indigo-600 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Exams Tracked</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-900">
              {metadata.exams.length}
            </div>
            <span className="text-[11px] text-indigo-600 font-medium truncate block">
              {metadata.exams.map((e) => e.name).join(', ') || 'No exams'}
            </span>
          </div>

          <div className="bg-emerald-50/80 rounded-xl p-3.5 border border-emerald-200/60">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Average %</span>
              <Percent className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900">
              {kpis.avgPercentage}%
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Schoolwide overall</span>
          </div>

          <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-200/60">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Distinctions (A+)</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-900">{kpis.aPlusCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Overall 90% or above</span>
          </div>
        </div>
      </div>

      {/* ── Expandable Filter Panel ─────────────────────────────────────────── */}
      {showFiltersPanel && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 space-y-4 transition-all animate-fadeIn">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <Filter className="w-4 h-4 text-primary-600" />
              Advanced Filters & Scope
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All Filters ({activeFiltersCount})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Search Student</label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Name, Adm No, Roll No, Phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </form>
            </div>

            {/* Standard Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Standard / Grade</label>
              <select
                value={selectedStandard}
                onChange={(e) => {
                  setSelectedStandard(e.target.value);
                  setSelectedClassId('all');
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="all">All Standards (Whole School)</option>
                {metadata.standards.map((std) => (
                  <option key={std} value={std}>
                    Standard {std}
                  </option>
                ))}
              </select>
            </div>

            {/* Division / Class Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Division / Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="all">All Divisions</option>
                {metadata.classes
                  .filter((c) => selectedStandard === 'all' || c.name === selectedStandard)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.section}
                    </option>
                  ))}
              </select>
            </div>

            {/* Marks Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Marks View Mode</label>
              <select
                value={markMode}
                onChange={(e) => setMarkMode(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white font-medium text-gray-800"
              >
                <option value="both">Both (TE & TE+CE Side-by-Side)</option>
                <option value="total">TE + CE Total Only</option>
                <option value="te">TE (Theory Exam) Only</option>
              </select>
            </div>

            {/* Grade Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Overall Grade</label>
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="all">All Grades</option>
                <option value="A+">A+ (90% - 100%)</option>
                <option value="A">A (80% - 89%)</option>
                <option value="B+">B+ (70% - 79%)</option>
                <option value="B">B (60% - 69%)</option>
                <option value="C+">C+ (50% - 59%)</option>
                <option value="C">C (40% - 49%)</option>
                <option value="D+">D+ (30% - 39%)</option>
                <option value="D">D (20% - 29%)</option>
                <option value="E">E (Below 20%)</option>
              </select>
            </div>

            {/* Min & Max Percentage Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Percentage Range (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min %"
                  min="0"
                  max="100"
                  value={minPercentage}
                  onChange={(e) => setMinPercentage(e.target.value)}
                  className="w-1/2 px-2.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max %"
                  min="0"
                  max="100"
                  value={maxPercentage}
                  onChange={(e) => setMaxPercentage(e.target.value)}
                  className="w-1/2 px-2.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Roll Number Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Specific Roll No</label>
              <input
                type="text"
                placeholder="e.g. 15"
                value={rollNumberFilter}
                onChange={(e) => setRollNumberFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select
                value={selectedGender}
                onChange={(e) => {
                  setSelectedGender(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="all">All Genders</option>
                <option value="M">Boys (M)</option>
                <option value="F">Girls (F)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Column Toggle Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs">
            <span className="text-gray-500 font-semibold">Toggle Profile Columns:</span>
            {Object.keys(columnVisibility).map((key) => (
              <label
                key={key}
                className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  columnVisibility[key]
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={columnVisibility[key]}
                  onChange={() =>
                    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className="sr-only"
                />
                {key.toUpperCase()}
              </label>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-500 font-semibold">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white font-semibold text-gray-700"
              >
                <option value="all">All (Master Sheet)</option>
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Master Data Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p className="text-sm text-gray-500 mt-4">Loading student outsourcing master records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center px-4">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No student records found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
              No students match your selected filters. Try broadening your search or resetting the filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-gray-200">
              {/* Table Header */}
              <thead className="bg-slate-900 text-slate-100 uppercase tracking-wider text-[11px] font-bold sticky top-0 z-20">
                <tr>
                  {/* Sticky Identification Columns */}
                  <th className="py-3.5 px-3 bg-slate-900 sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.15)] text-center w-12">
                    #
                  </th>
                  <th
                    onClick={() => {
                      setSortBy('rollNumber');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-3.5 px-3 bg-slate-900 sticky left-12 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.15)] cursor-pointer hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-1">
                      Roll
                      <ChevronUpDownIcon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortBy('admissionNo');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-3.5 px-3.5 bg-slate-900 cursor-pointer hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-1">
                      Adm No
                      <ChevronUpDownIcon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-3.5 px-4 bg-slate-900 cursor-pointer hover:bg-slate-800 min-w-[180px]"
                  >
                    <div className="flex items-center gap-1">
                      Student Name
                      <ChevronUpDownIcon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortBy('standard');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-3.5 px-3 bg-slate-900 cursor-pointer hover:bg-slate-800 text-center"
                  >
                    Class
                  </th>

                  {/* Optional Profile Columns */}
                  {columnVisibility.gender && <th className="py-3.5 px-3 text-center">Gender</th>}
                  {columnVisibility.dob && <th className="py-3.5 px-3 text-center">DOB</th>}
                  {columnVisibility.phone && <th className="py-3.5 px-3">Phone</th>}
                  {columnVisibility.parent && <th className="py-3.5 px-3">Parent / Guardian</th>}
                  {columnVisibility.category && <th className="py-3.5 px-3">Category</th>}
                  {columnVisibility.address && <th className="py-3.5 px-3 min-w-[180px]">Address</th>}

                  {/* Dynamic Exam Columns */}
                  {metadata.exams.map((ex) => (
                    <th
                      key={ex._id}
                      className="py-3.5 px-3 text-center bg-slate-800 border-l border-slate-700 min-w-[120px]"
                    >
                      <div className="font-bold text-white tracking-normal normal-case text-xs">
                        {ex.name}
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium">
                        {markMode === 'te'
                          ? 'TE Score • Grade'
                          : markMode === 'total'
                          ? 'Total • Grade'
                          : 'TE • Total • %'}
                      </div>
                    </th>
                  ))}

                  {/* Overall Cumulative Performance Columns */}
                  <th
                    onClick={() => {
                      setSortBy('percentage');
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    }}
                    className="py-3.5 px-4 bg-indigo-950 border-l-2 border-indigo-500 cursor-pointer hover:bg-indigo-900 text-center min-w-[140px]"
                  >
                    <div className="flex items-center justify-center gap-1 text-indigo-200">
                      Overall %
                      <ChevronUpDownIcon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-[10px] text-indigo-300 font-normal">
                      {markMode === 'te' ? 'Cumulative TE' : 'Cumulative Total'}
                    </div>
                  </th>
                  <th className="py-3.5 px-3.5 bg-indigo-950 text-center text-indigo-200">
                    Grade
                  </th>
                  <th className="py-3.5 px-3 text-center">Action</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100 bg-white font-medium text-gray-800">
                {records.map((st, idx) => {
                  const rowNum = pageSize === 'all' ? idx + 1 : (page - 1) * Number(pageSize) + idx + 1;
                  const displayPct = markMode === 'te' ? st.overallTePercentage : st.overallTotalPercentage;
                  const displayGrade = markMode === 'te' ? st.overallTeGrade : st.overallGrade;

                  return (
                    <tr
                      key={st._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Sticky Identification Columns */}
                      <td className="py-3 px-3 bg-white group-hover:bg-slate-50 sticky left-0 z-10 text-center font-bold text-gray-400 text-[11px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        {rowNum}
                      </td>
                      <td className="py-3 px-3 bg-white group-hover:bg-slate-50 sticky left-12 z-10 font-bold text-gray-900 text-center shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        {st.rollNumber !== '-' ? (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800">
                            {st.rollNumber}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-gray-600 font-semibold text-[11px]">
                        {st.admissionNo}
                      </td>
                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="font-bold text-gray-900 text-[13px] hover:text-primary-600 transition-colors cursor-pointer" onClick={() => setSelectedStudentModal(st)}>
                          {st.fullName}
                        </div>
                        {st.fullNameMalayalam && (
                          <div className="text-[10px] text-gray-400">{st.fullNameMalayalam}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-gray-800">
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {st.classDisplay}
                        </span>
                      </td>

                      {/* Optional Columns */}
                      {columnVisibility.gender && (
                        <td className="py-3 px-3 text-center text-gray-600 font-semibold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              st.gender === 'F'
                                ? 'bg-pink-50 text-pink-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {st.gender}
                          </span>
                        </td>
                      )}
                      {columnVisibility.dob && (
                        <td className="py-3 px-3 text-center text-gray-600 font-mono text-[11px]">
                          {st.dateOfBirth}
                        </td>
                      )}
                      {columnVisibility.phone && (
                        <td className="py-3 px-3 text-gray-700 font-mono text-[11px]">
                          {st.phoneNumber}
                        </td>
                      )}
                      {columnVisibility.parent && (
                        <td className="py-3 px-3 text-gray-700 text-xs truncate max-w-[140px]">
                          {st.parentName}
                        </td>
                      )}
                      {columnVisibility.category && (
                        <td className="py-3 px-3 text-gray-600 text-xs">
                          {st.category}
                        </td>
                      )}
                      {columnVisibility.address && (
                        <td className="py-3 px-3 text-gray-600 text-xs truncate max-w-[200px]" title={st.address}>
                          {st.address}
                        </td>
                      )}

                      {/* Dynamic Exam Marks Columns */}
                      {metadata.exams.map((ex) => {
                        const em = st.examMarks ? st.examMarks[ex._id] : null;
                        if (!em) {
                          return (
                            <td
                              key={ex._id}
                              className="py-3 px-3 text-center text-gray-300 border-l border-gray-100 text-xs"
                            >
                              -
                            </td>
                          );
                        }

                        if (markMode === 'te') {
                          return (
                            <td
                              key={ex._id}
                              className="py-3 px-3 text-center border-l border-gray-100"
                            >
                              <div className="font-bold text-gray-900">
                                {em.teScore} <span className="text-gray-400 font-normal text-[10px]">/{em.teMax}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-0.5">
                                <span className={getPercentageColor(em.tePercentage)}>
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
                              className="py-3 px-3 text-center border-l border-gray-100"
                            >
                              <div className="font-bold text-gray-900">
                                {em.totalScore} <span className="text-gray-400 font-normal text-[10px]">/{em.totalMax}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-0.5">
                                <span className={getPercentageColor(em.totalPercentage)}>
                                  {em.totalPercentage}%
                                </span>
                                <span className={`px-1 py-0.2 rounded text-[9.5px] border ${getGradeBadge(em.totalGrade)}`}>
                                  {em.totalGrade}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // Both mode (shows TE and Total)
                        return (
                          <td
                            key={ex._id}
                            className="py-3 px-3 text-center border-l border-gray-100 text-[11px]"
                          >
                            <div className="flex items-center justify-center gap-1.5 font-bold">
                              <span className="text-blue-700" title="TE Score">
                                {em.teScore}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="text-emerald-700" title="Total Score">
                                {em.totalScore}
                              </span>
                              <span className="text-gray-400 font-normal text-[9.5px]">
                                /{em.totalMax}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 mt-0.5">
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

                      {/* Overall Cumulative Performance Columns */}
                      <td className="py-3 px-4 bg-indigo-50/40 border-l-2 border-indigo-500 text-center">
                        <div className="font-bold text-indigo-950 text-sm">
                          {displayPct !== null ? `${displayPct}%` : '-'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-normal">
                          {markMode === 'te'
                            ? `${st.cumTeScore} / ${st.cumTeMax}`
                            : `${st.cumTotalScore} / ${st.cumTotalMax}`}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 bg-indigo-50/40 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs border shadow-xs inline-block ${getGradeBadge(
                            displayGrade
                          )}`}
                        >
                          {displayGrade || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedStudentModal(st)}
                          className="p-1.5 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors cursor-pointer"
                          title="View student profile & marks breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Table Footer & Pagination ─────────────────────────────────────────── */}
        {!loading && records.length > 0 && (
          <div className="py-3.5 px-5 bg-slate-50 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              Showing <span className="font-bold text-gray-900">{records.length}</span> of{' '}
              <span className="font-bold text-gray-900">{totalRecords}</span> students
              {selectedStandard !== 'all' && ` (Standard ${selectedStandard})`}
            </div>

            {pageSize !== 'all' && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 font-bold text-gray-800">
                  Page {page}
                </span>
                <button
                  disabled={page * Number(pageSize) >= totalRecords}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Student Details Modal ────────────────────────────────────────────── */}
      {selectedStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                  {selectedStudentModal.rollNumber || '#'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedStudentModal.fullName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Admission No: {selectedStudentModal.admissionNo} • Class: {selectedStudentModal.classDisplay}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 text-xs text-gray-700">
              {/* Personal Details Grid */}
              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-3">
                  Personal & Contact Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Gender</span>
                    <span className="font-semibold">{selectedStudentModal.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Date of Birth</span>
                    <span className="font-semibold">{selectedStudentModal.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Phone Number</span>
                    <span className="font-semibold">{selectedStudentModal.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Parent / Guardian</span>
                    <span className="font-semibold">{selectedStudentModal.parentName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Category / Caste</span>
                    <span className="font-semibold">{selectedStudentModal.category} {selectedStudentModal.casteName ? `(${selectedStudentModal.casteName})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Blood Group</span>
                    <span className="font-semibold">{selectedStudentModal.bloodGroup}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-gray-400 block text-[10px]">Address</span>
                    <span className="font-semibold">{selectedStudentModal.address}</span>
                  </div>
                </div>
              </div>

              {/* All Terminal Exams Breakdown */}
              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-3">
                  All Terminal Exams Marks
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Exam Name</th>
                        <th className="py-2.5 px-3 text-center">TE Marks</th>
                        <th className="py-2.5 px-3 text-center">Total (TE+CE)</th>
                        <th className="py-2.5 px-3 text-center">Max</th>
                        <th className="py-2.5 px-3 text-center">Percentage</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {metadata.exams.map((ex) => {
                        const em = selectedStudentModal.examMarks
                          ? selectedStudentModal.examMarks[ex._id]
                          : null;
                        return (
                          <tr key={ex._id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-semibold text-gray-900">{ex.name}</td>
                            <td className="py-2.5 px-3 text-center text-blue-700 font-bold">
                              {em?.teScore !== null && em?.teScore !== undefined ? em.teScore : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                              {em?.totalScore !== null && em?.totalScore !== undefined ? em.totalScore : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-gray-500">
                              {em?.totalMax || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {em?.totalPercentage !== null && em?.totalPercentage !== undefined ? `${em.totalPercentage}%` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {em?.grade ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] border ${getGradeBadge(em.grade)}`}>
                                  {em.grade}
                                </span>
                              ) : (
                                '-'
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
                        <td className="py-2.5 px-3 text-center text-gray-600">{selectedStudentModal.cumTotalMax}</td>
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
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedStudentModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 cursor-pointer text-xs"
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

// ChevronUpDownIcon helper
function ChevronUpDownIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
  );
}

export default StudentOutsourcingView;
