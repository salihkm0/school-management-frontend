// src/pages/admin/HistoricalImport.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { historicalImportService } from '../../services/historicalImportService';

// ─── Subject config matching real XLS column layout ──────────────────────────
//
//  Class 8/9:  A=SL B=ClassCode C=RegNo D=Name E=UID(skip) F=Gender G=Language H=Category
//              I=LAN  J=MAL II  K=ENG  L=HIN  M=SS  N=PHY  O=CHE  P=BIO  Q=MATHS
//              R=Total  S=Division/Result
//
//  Class 10:   A=SL B=ClassCode C=RegNo D=Name E=Gender F=Language G=Category
//              H=LAN  I=MAL II  J=ENG  K=HIN  L=SS  M=PHY  N=CHE  O=BIO  P=MATHS
//              Q=Total  R=Division/Result
// ─────────────────────────────────────────────────────────────────────────────

const SUBJECTS_9 = [
  { code: 'LAN',    label: 'Language',   maxMarks: 40 },
  { code: 'MAL II', label: 'Mal II',     maxMarks: 40 },
  { code: 'ENG',    label: 'English',    maxMarks: 40 },
  { code: 'HIN',    label: 'Hindi',      maxMarks: 40 },
  { code: 'SS',     label: 'Soc. Sci',   maxMarks: 40 },
  { code: 'PHY',    label: 'Physics',    maxMarks: 40 },
  { code: 'CHE',    label: 'Chemistry',  maxMarks: 40 },
  { code: 'BIO',    label: 'Biology',    maxMarks: 40 },
  { code: 'MATHS',  label: 'Maths',      maxMarks: 40 },
];

const SUBJECTS_10 = [
  { code: 'LAN',    label: 'Language',   maxMarks: 40 },
  { code: 'MAL II', label: 'Mal II',     maxMarks: 40 },
  { code: 'ENG',    label: 'English',    maxMarks: 40 },
  { code: 'HIN',    label: 'Hindi',      maxMarks: 40 },
  { code: 'SS',     label: 'Soc. Sci',   maxMarks: 40 },
  { code: 'PHY',    label: 'Physics',    maxMarks: 40 },
  { code: 'CHE',    label: 'Chemistry',  maxMarks: 40 },
  { code: 'BIO',    label: 'Biology',    maxMarks: 40 },
  { code: 'MATHS',  label: 'Maths',      maxMarks: 40 },
];

const DEFAULT_SUBJECTS = SUBJECTS_9;

const BUILTIN_PRESETS = {
  class_8_9: {
    label: 'Class 8 / 9',
    description: 'Subjects: cols I–Q \u2022 Total: R \u2022 Result: S \u2022 Col E = UID (auto-skipped)',
    icon: BookOpenIcon,
    subjects: SUBJECTS_9,
  },
  class_10_sslc: {
    label: 'Class 10',
    description: 'Subjects: cols H–P \u2022 Total: Q \u2022 Result: R \u2022 No UID column',
    icon: AcademicCapIcon,
    subjects: SUBJECTS_10,
  },
};


// ─── Small helpers ────────────────────────────────────────────────────────────
const statusIcon = (status) => {
  if (status === 'done')  return <CheckCircleIcon  className="h-4 w-4 text-emerald-500" />;
  if (status === 'error') return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
  return <ClockIcon className="h-4 w-4 text-amber-500 animate-pulse" />;
};
const statusBadge = (status) => {
  const map = {
    done:       'bg-emerald-100 text-emerald-700',
    error:      'bg-red-100 text-red-700',
    processing: 'bg-amber-100 text-amber-700',
  };
  const labels = { done: 'Ready', error: 'Error', processing: 'Processing…' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || map.processing}`}>
      {labels[status] || 'Processing…'}
    </span>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function HistoricalImport() {
  const [view, setView]                   = useState('list');
  const [imports, setImports]             = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [groups, setGroups]               = useState([]);
  const [students, setStudents]           = useState([]);
  const [studentTotal, setStudentTotal]   = useState(0);
  const [loading, setLoading]             = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [pdfLoading, setPdfLoading]       = useState(null);
  const [studentPdfLoading, setStudentPdfLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Filters — single "class" selection replaces the old grade/division/sheet trio
  const [selectedClass, setSelectedClass]     = useState(null); // full group object
  const [filterLanguage, setFilterLanguage]   = useState('');
  const [searchTerm, setSearchTerm]           = useState('');
  const [currentPage, setCurrentPage]         = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const PAGE_LIMIT = 50;

  // Upload state
  const [file, setFile]                   = useState(null);
  const [academicYear, setAcademicYear]   = useState('');
  const [notes, setNotes]                 = useState('');
  const [selectedPreset, setSelectedPreset] = useState('class_8_9');
  const [subjects, setSubjects]           = useState(DEFAULT_SUBJECTS);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadId, setUploadId]           = useState(null);
  const [uploadStatus, setUploadStatus]   = useState(null);
  const pollRef    = useRef(null);
  const fileInputRef = useRef(null);

  // ── Preset ────────────────────────────────────────────────────────────────
  const applyPreset = (key) => {
    setSelectedPreset(key);
    if (BUILTIN_PRESETS[key]) setSubjects(BUILTIN_PRESETS[key].subjects.map((s) => ({ ...s })));
  };

  // ── Load imports ──────────────────────────────────────────────────────────
  const loadImports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await historicalImportService.getAll();
      setImports(res.data?.data || []);
    } catch { toast.error('Failed to load imports'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { loadImports(); }, [loadImports]);

  // ── Poll upload ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uploadId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res  = await historicalImportService.getStatus(uploadId);
        const data = res.data?.data;
        setUploadStatus(data);
        if (data?.status === 'done' || data?.status === 'error') {
          clearInterval(pollRef.current);
          loadImports();
          data.status === 'done'
            ? toast.success(`✅ Imported ${data.totalStudents} students!`)
            : toast.error(`Import failed: ${data.errorMessage}`);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [uploadId, loadImports]);

  // ── Open batch detail ─────────────────────────────────────────────────────
  const openBatch = async (batch) => {
    setSelectedBatch(batch);
    setView('detail');
    setSelectedClass(null);
    setFilterLanguage(''); setSearchTerm(''); setCurrentPage(1);
    setStudents([]);
    try {
      const res = await historicalImportService.getById(batch._id);
      setSelectedBatch(res.data?.data);
      setGroups(res.data?.groups || []);
    } catch { toast.error('Failed to load batch details'); }
  };

  // ── Load students ─────────────────────────────────────────────────────────
  const loadStudents = useCallback(async (page = currentPage) => {
    if (!selectedBatch) return;
    setStudentLoading(true);
    try {
      const res = await historicalImportService.getStudents(selectedBatch._id, {
        grade:     selectedClass?._id?.grade     || undefined,
        division:  selectedClass?._id?.division  || undefined,
        sheetName: selectedClass?._id?.sheetName || undefined,
        language:  filterLanguage || undefined,
        search:    searchTerm     || undefined,
        page,
        limit: PAGE_LIMIT,
      });
      setStudents(res.data?.data || []);
      setStudentTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
      setCurrentPage(page);
    } catch { toast.error('Failed to load students'); }
    finally   { setStudentLoading(false); }
  }, [selectedBatch, selectedClass, filterLanguage, searchTerm, currentPage]);

  useEffect(() => {
    if (view === 'detail' && selectedBatch?._id) loadStudents(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedBatch, selectedClass, filterLanguage, searchTerm]);

  // ── PDF downloads ─────────────────────────────────────────────────────────
  const handleDownloadPdf = async (batchId, filters = {}) => {
    const key = batchId + JSON.stringify(filters);
    setPdfLoading(key);
    try {
      await historicalImportService.downloadPdf(batchId, filters);
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF generation failed — check server logs'); }
    finally   { setPdfLoading(null); }
  };

  const handleDownloadStudentPdf = async (student) => {
    setStudentPdfLoading(student._id);
    try {
      await historicalImportService.downloadStudentPdf(student._id, student.name, student.admissionNo);
      toast.success(`Downloaded mark sheet for ${student.name}`);
    } catch { toast.error('Failed to generate student PDF'); }
    finally   { setStudentPdfLoading(null); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this import and ALL student data? This cannot be undone.')) return;
    setDeleteLoading(id);
    try {
      await historicalImportService.deleteImport(id);
      toast.success('Deleted');
      setImports((prev) => prev.filter((b) => b._id !== id));
      if (view === 'detail' && selectedBatch?._id === id) setView('list');
    } catch { toast.error('Failed to delete'); }
    finally   { setDeleteLoading(null); }
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select an XLS file'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('academicYear', academicYear);
    fd.append('notes', notes);
    fd.append('subjectConfig', JSON.stringify(subjects));
    setUploadProgress(0); setUploadStatus(null);
    try {
      const res = await historicalImportService.upload(fd, (ev) =>
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100)));
      setUploadId(res.data?.importId);
      setUploadStatus({ status: 'processing' });
      toast('File uploaded — processing…', { icon: '⏳' });
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
  };

  // ── Subject helpers ───────────────────────────────────────────────────────
  const updateSubject = (i, key, val) =>
    setSubjects((prev) => { const c = [...prev]; c[i] = { ...c[i], [key]: key === 'maxMarks' ? Number(val) : val }; return c; });
  const addSubject    = () => setSubjects((prev) => [...prev, { code: '', label: '', maxMarks: 40 }]);
  const removeSubject = (i) => setSubjects((prev) => prev.filter((_, idx) => idx !== i));

  // ── Filter options ────────────────────────────────────────────────────────
  // Build section label exactly matching the XLS heading:
  //   "10 M (ENG MEDIUM, MALAYALAM GIRLS & BOYS)"
  const sectionLabel = (g) => {
    const { grade, division, medium, languageGroup } = g._id;
    const inner = [medium, languageGroup].filter(Boolean).join(', ');
    return inner ? `${grade} ${division} (${inner})` : `${grade} ${division}`;
  };

  // Group by sheetName (= Excel tab) for <optgroup>
  const sheetGroups = groups.reduce((acc, g) => {
    const sheet = g._id.sheetName || 'Unknown Sheet';
    if (!acc[sheet]) acc[sheet] = [];
    acc[sheet].push(g);
    return acc;
  }, {});

  const LANGUAGE_OPTIONS = ['Malayalam', 'Arabic', 'Urdu', 'Hindi'];

  // ── Computed PDF key ──────────────────────────────────────────────────────────
  const currentPdfKey = selectedBatch?._id + JSON.stringify({
    grade: selectedClass?._id?.grade, division: selectedClass?._id?.division,
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER — LIGHT THEME
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        {view !== 'list' && (
          <button
            onClick={() => setView('list')}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 shadow-sm transition"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Historical Mark Records</h1>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">
            Import last-year student mark data from XLS files and download PDF mark lists
          </p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => { setView('upload'); setUploadId(null); setUploadStatus(null); setFile(null); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white transition px-4 py-2 rounded-lg font-semibold text-sm shadow"
          >
            <CloudArrowUpIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Import XLS</span>
            <span className="sm:hidden">Import</span>
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          LIST VIEW
      ════════════════════════════════════════════════════════════════════ */}
      {view === 'list' && (
        <div>
          {loading && (
            <div className="text-center py-20 text-gray-400">Loading imports…</div>
          )}

          {!loading && imports.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <CloudArrowUpIcon className="h-14 w-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">No historical data imported yet.</p>
              <p className="text-gray-400 text-sm mt-1">Upload your first XLS file to get started.</p>
              <button
                onClick={() => setView('upload')}
                className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow"
              >
                Import your first XLS file
              </button>
            </div>
          )}

          {!loading && imports.length > 0 && (
            <div className="grid gap-4">
              {imports.map((batch) => (
                <div
                  key={batch._id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {statusIcon(batch.status)}
                      <span className="font-semibold text-gray-900 truncate">{batch.fileName}</span>
                      {statusBadge(batch.status)}
                    </div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>📅 {batch.academicYear}</span>
                      <span>👥 {batch.totalStudents?.toLocaleString() || 0} students</span>
                      <span>📋 {batch.sheets?.length || 0} sheets</span>
                      <span>🕒 {new Date(batch.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    {batch.status === 'error' && (
                      <p className="text-red-500 text-xs mt-1">{batch.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    {batch.status === 'done' && (
                      <>
                        <button
                          onClick={() => openBatch(batch)}
                          className="flex items-center gap-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg transition font-medium"
                        >
                          <AdjustmentsHorizontalIcon className="h-4 w-4" />
                          View & Filter
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(batch._id)}
                          disabled={!!pdfLoading}
                          className="flex items-center gap-1.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          All PDF
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(batch._id)}
                      disabled={deleteLoading === batch._id}
                      className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {deleteLoading === batch._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          UPLOAD VIEW
      ════════════════════════════════════════════════════════════════════ */}
      {view === 'upload' && (
        <form onSubmit={handleUpload} className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">

            {/* File picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                XLS / XLSX File <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  file
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudArrowUpIcon className={`h-10 w-10 mx-auto mb-2 ${file ? 'text-indigo-500' : 'text-gray-400'}`} />
                {file ? (
                  <p className="text-indigo-700 font-semibold">{file.name}</p>
                ) : (
                  <>
                    <p className="text-gray-600 font-medium">Click to browse or drag & drop</p>
                    <p className="text-gray-400 text-xs mt-1">.xls and .xlsx supported (max 20 MB)</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </div>
            </div>

            {/* Preset selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Grade Level Preset</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(BUILTIN_PRESETS).map(([key, preset]) => {
                  const Icon = preset.icon;
                  const isActive = selectedPreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <div>
                        <p className={`text-sm font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {preset.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-gray-400 text-xs mt-2">
                Select the correct grade level to auto-set max marks. You can still edit below.
              </p>
            </div>

            {/* Academic year + notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Academic Year
                  <span className="text-gray-400 text-xs font-normal ml-1">(auto-detected)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025-2026"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 8th grade only"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>

            {/* Subject configuration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">Subject Columns & Max Marks</label>
                <button
                  type="button"
                  onClick={addSubject}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Add Subject
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {subjects.map((subj, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Code"
                      value={subj.code}
                      onChange={(e) => updateSubject(i, 'code', e.target.value)}
                      className="w-24 bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-900 text-xs focus:border-indigo-400 outline-none font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Label"
                      value={subj.label}
                      onChange={(e) => updateSubject(i, 'label', e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-900 text-xs focus:border-indigo-400 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={subj.maxMarks}
                      onChange={(e) => updateSubject(i, 'maxMarks', e.target.value)}
                      className="w-14 bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-900 text-xs focus:border-indigo-400 outline-none text-center"
                    />
                    <button type="button" onClick={() => removeSubject(i)} className="text-red-400 hover:text-red-600 transition">
                      <MinusCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-2">
                Total max: <strong className="text-gray-600">{subjects.reduce((s, x) => s + (x.maxMarks || 0), 0)}</strong> marks
              </p>
            </div>

            {/* Upload progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading…</span><span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Processing status */}
            {uploadStatus && (
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                uploadStatus.status === 'done'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : uploadStatus.status === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                {statusIcon(uploadStatus.status)}
                <span>
                  {uploadStatus.status === 'processing'
                    ? 'Parsing XLS file…'
                    : uploadStatus.status === 'done'
                    ? `✅ Done! ${uploadStatus.totalStudents} students imported across ${uploadStatus.sheets?.length} sheet(s)`
                    : `❌ ${uploadStatus.errorMessage}`}
                </span>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!file || uploadStatus?.status === 'processing'}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition px-6 py-2.5 rounded-lg font-semibold text-sm shadow"
              >
                {uploadStatus?.status === 'processing' ? 'Processing…' : 'Upload & Import'}
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DETAIL VIEW
      ════════════════════════════════════════════════════════════════════ */}
      {view === 'detail' && selectedBatch && (
        <div>

          {/* Batch info bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{selectedBatch.fileName}</p>
              <p className="text-gray-500 text-sm">
                {selectedBatch.academicYear} · {selectedBatch.totalStudents?.toLocaleString()} students
              </p>
            </div>
            <button
              onClick={() => handleDownloadPdf(selectedBatch._id, {
                grade:     selectedClass?._id?.grade,
                division:  selectedClass?._id?.division,
                sheetName: selectedClass?._id?.sheetName,
              })}
              disabled={!!pdfLoading}
              className="flex items-center gap-1.5 text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              {pdfLoading === currentPdfKey
                ? 'Generating…'
                : selectedClass
                  ? `PDF — ${sectionLabel(selectedClass)}`
                  : 'PDF — All Classes'}
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              {/* ── Class selector (main filter) ────────────────────────────── */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Class</label>
                <select
                  value={selectedClass ? JSON.stringify(selectedClass._id) : ''}
                  onChange={(e) => {
                    if (!e.target.value) { setSelectedClass(null); return; }
                    const id = JSON.parse(e.target.value);
                    const found = groups.find((g) =>
                      g._id.grade === id.grade &&
                      g._id.division === id.division &&
                      g._id.sheetName === id.sheetName
                    );
                    setSelectedClass(found || null);
                  }}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                >
                  <option value="">All Classes ({selectedBatch?.totalStudents} students)</option>
                  {Object.entries(sheetGroups).map(([sheetName, sheetItems]) => (
                    <optgroup key={sheetName} label={sheetName}>
                      {sheetItems.map((g) => (
                        <option key={JSON.stringify(g._id)} value={JSON.stringify(g._id)}>
                          {sectionLabel(g)} — {g.count} students
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedClass && (
                  <p className="text-xs text-indigo-500 mt-1 font-medium">
                    {selectedClass._id.sheetName}
                  </p>
                )}
              </div>

              {/* ── Language filter ─────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Language</label>
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                >
                  <option value="">All Languages</option>
                  {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* ── Name search ──────────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Search Name</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Student name…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-gray-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Active filter summary */}
            <div className="flex flex-wrap gap-2 mt-3 items-center">
              {selectedClass && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {sectionLabel(selectedClass)}
                  <button onClick={() => setSelectedClass(null)} className="ml-1 hover:text-indigo-900">×</button>
                </span>
              )}
              {filterLanguage && (
                <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {filterLanguage}
                  <button onClick={() => setFilterLanguage('')} className="ml-1 hover:text-teal-900">×</button>
                </span>
              )}
              <p className="text-xs text-gray-400 ml-auto">
                <strong className="text-gray-600">{studentTotal}</strong> students
                {students.length < studentTotal && (
                  <span> &middot; showing <strong className="text-gray-600">{students.length}</strong></span>
                )}
              </p>
            </div>
          </div>

          {/* Student table */}
          {studentLoading ? (
            <div className="text-center py-14 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
              Loading students…
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-14 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
              No students match the filters
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full text-sm bg-white">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">SL</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Adm No</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Gen</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Language</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Cat</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Gr</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Div</th>
                    {(selectedBatch.subjectConfig || DEFAULT_SUBJECTS).map((s) => (
                      <th key={s.code} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {s.code}<br />
                        <span className="text-gray-400 normal-case font-normal">/{s.maxMarks}</span>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Result</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, i) => (
                    <tr
                      key={s._id}
                      className={`transition-colors ${i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/40 hover:bg-gray-100/60'}`}
                    >
                      <td className="px-3 py-2 text-gray-400 text-xs">{s.slNo || i + 1}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs font-mono">{s.admissionNo}</td>
                      <td className="px-3 py-2 text-gray-900 font-semibold max-w-[160px] truncate text-xs">{s.name}</td>
                      <td className="px-3 py-2 text-center text-gray-500 text-xs">{s.gender}</td>
                      <td className="px-3 py-2 text-center text-gray-500 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          s.language === 'Arabic'    ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          s.language === 'Malayalam' ? 'bg-teal-50 text-teal-700 border border-teal-100'   :
                          s.language === 'Urdu'      ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>{s.language || '-'}</span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-500 text-xs">{s.category}</td>
                      <td className="px-3 py-2 text-center text-gray-700 text-xs font-medium">{s.grade}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-1.5 py-0.5 rounded font-semibold border border-indigo-100">
                          {s.division}
                        </span>
                      </td>
                      {(selectedBatch.subjectConfig || DEFAULT_SUBJECTS).map((subj) => {
                        const found = s.subjects?.find((x) => x.subjectCode === subj.code);
                        const val   = found?.obtained ?? '-';
                        const pct   = found ? (found.obtained / (found.maxMarks || 40)) * 100 : -1;
                        return (
                          <td
                            key={subj.code}
                            className={`px-2 py-2 text-center text-xs font-mono font-semibold ${
                              pct < 0 ? 'text-gray-300' :
                              pct >= 80 ? 'text-emerald-600' :
                              pct >= 60 ? 'text-blue-600'   :
                              pct >= 40 ? 'text-amber-600'  : 'text-red-600'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center text-gray-900 font-bold text-xs">{s.total}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-mono border border-gray-200">
                          {s.divisionResult || '-'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => handleDownloadStudentPdf(s)}
                          disabled={studentPdfLoading === s._id}
                          title={`Download mark sheet for ${s.name}`}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition disabled:opacity-50"
                        >
                          {studentPdfLoading === s._id
                            ? <span className="text-xs px-0.5">…</span>
                            : <DocumentArrowDownIcon className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-500">
                Page <strong className="text-gray-800">{currentPage}</strong> of{' '}
                <strong className="text-gray-800">{totalPages}</strong>
                {' '}·{' '}
                <span className="text-gray-400">{studentTotal} total students</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadStudents(currentPage - 1)}
                  disabled={currentPage <= 1 || studentLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                {/* Page number pills */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const p = startPage + idx;
                  return p <= totalPages ? (
                    <button
                      key={p}
                      onClick={() => loadStudents(p)}
                      disabled={studentLoading}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        p === currentPage
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ) : null;
                })}
                <button
                  onClick={() => loadStudents(currentPage + 1)}
                  disabled={currentPage >= totalPages || studentLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
