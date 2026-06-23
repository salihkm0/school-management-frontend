import React, { useState, useEffect, useRef } from 'react'
import { 
  XMarkIcon, DocumentArrowUpIcon, ServerStackIcon,
  CloudArrowUpIcon, BookOpenIcon, AcademicCapIcon,
  PlusCircleIcon, MinusCircleIcon
} from '@heroicons/react/24/outline'
import { historicalImportService } from '../../../services/historicalImportService'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAcademicYears } from '../../../store/slices/academicYearSlice'
import examService from '../../../services/examService'
import toast from 'react-hot-toast'

const SUBJECTS_8 = [
  { code: 'LAN',    label: 'Language I',    maxMarks: 50, ceMarks: 10 },
  { code: 'MAL',    label: 'Malayalam II',  maxMarks: 50, ceMarks: 10 },
  { code: 'ENG',    label: 'English',       maxMarks: 50, ceMarks: 10 },
  { code: 'HIN',    label: 'Hindi',         maxMarks: 50, ceMarks: 10 },
  { code: 'SS',     label: 'Social Science',maxMarks: 50, ceMarks: 10 },
  { code: 'PHY',    label: 'Physics',       maxMarks: 25, ceMarks: 5 },
  { code: 'CHE',    label: 'Chemistry',     maxMarks: 25, ceMarks: 5 },
  { code: 'BIO',    label: 'Biology',       maxMarks: 25, ceMarks: 5 },
  { code: 'MATHS',  label: 'Maths',         maxMarks: 50, ceMarks: 10 },
];

const SUBJECTS_9_10 = [
  { code: 'LAN',    label: 'Language I',    maxMarks: 50, ceMarks: 10 },
  { code: 'MAL',    label: 'Malayalam II',  maxMarks: 50, ceMarks: 10 },
  { code: 'ENG',    label: 'English',       maxMarks: 100, ceMarks: 20 },
  { code: 'HIN',    label: 'Hindi',         maxMarks: 50, ceMarks: 10 },
  { code: 'SS',     label: 'Social Science',maxMarks: 100, ceMarks: 20 },
  { code: 'PHY',    label: 'Physics',       maxMarks: 50, ceMarks: 10 },
  { code: 'CHE',    label: 'Chemistry',     maxMarks: 50, ceMarks: 10 },
  { code: 'BIO',    label: 'Biology',       maxMarks: 50, ceMarks: 10 },
  { code: 'MATHS',  label: 'Maths',         maxMarks: 100, ceMarks: 20 },
];

const BUILTIN_PRESETS = {
  class_8: {
    label: '8',
    description: 'all subjects max 50 (40+ 10)',
    icon: BookOpenIcon,
    subjects: SUBJECTS_8,
  },
  class_9_10: {
    label: '9/10',
    description: 'ENG,SS,MATHS max 100 (80 +20) other max 50 (40+ 10)',
    icon: AcademicCapIcon,
    subjects: SUBJECTS_9_10,
  },
};

const AddHistoricalDataModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch()
  const { academicYears } = useSelector(state => state.academicYears)
  const [activeTab, setActiveTab] = useState('db') // 'db' or 'xls'
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [academicYearId, setAcademicYearId] = useState('')
  const [examId, setExamId] = useState('')
  const [availableExams, setAvailableExams] = useState([])
  
  // Upload State
  const [file, setFile] = useState(null)
  const [academicYear, setAcademicYear] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('class_8')
  const [subjects, setSubjects] = useState(BUILTIN_PRESETS.class_8.subjects.map(s => ({ ...s })))
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const applyPreset = (key) => {
    setSelectedPreset(key)
    if (BUILTIN_PRESETS[key]) {
      setSubjects(BUILTIN_PRESETS[key].subjects.map(s => ({ ...s })))
    }
  }

  const updateSubject = (i, key, val) =>
    setSubjects((prev) => { const c = [...prev]; c[i] = { ...c[i], [key]: key === 'maxMarks' ? Number(val) : val }; return c; });
  const addSubject = () => setSubjects((prev) => [...prev, { code: '', label: '', maxMarks: 50 }]);
  const removeSubject = (i) => setSubjects((prev) => prev.filter((_, idx) => idx !== i));
  
  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (academicYearId) {
      examService.getExams({ academicYearId, status: 'published' })
        .then(res => setAvailableExams(res.data?.exams || res.data || []))
        .catch(err => console.error(err))
    } else {
      setAvailableExams([])
      setExamId('')
    }
  }, [academicYearId])

  const handleDbGenerate = async (e) => {
    e.preventDefault()
    if (!academicYearId || !examId) {
      toast.error('Please select both academic year and exam')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await historicalImportService.generateFromDB(academicYearId, examId)
      if (res.data?.success) {
        toast.success(res.data.message || 'Records generated successfully')
        onSuccess()
      } else {
        toast.error(res.data?.message || 'Failed to generate records')
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select an XLS/XLSX file')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('academicYear', academicYear)
      fd.append('notes', notes)
      fd.append('preset', selectedPreset)
      fd.append('subjectConfig', JSON.stringify(subjects))
      
      const res = await historicalImportService.upload(fd, (ev) => {
        if (ev.total) {
          setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
        }
      })
      if (res.data?.success) {
        toast.success(res.data.message || 'File uploaded and processed successfully!')
        onSuccess()
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mb-16">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Add Historical Data</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('db')}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${
              activeTab === 'db' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ServerStackIcon className="w-4 h-4" />
            Generate from DB
          </button>
          <button
            onClick={() => setActiveTab('xls')}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 ${
              activeTab === 'xls' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DocumentArrowUpIcon className="w-4 h-4" />
            Import XLS
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'db' ? (
            <form onSubmit={handleDbGenerate} className="space-y-6 max-w-3xl mx-auto">
              <p className="text-sm text-gray-600">
                This will create a permanent snapshot of the selected published Exam for the academic year.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map(year => (
                    <option key={year._id} value={year._id}>{year.name}</option>
                  ))}
                </select>
              </div>
              {academicYearId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Exam</label>
                  <select
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                    required
                  >
                    <option value="">Select Exam</option>
                    {availableExams.map(ex => (
                      <option key={ex._id || ex.id} value={ex._id || ex.id}>{ex.name || ex.displayName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition px-6 py-2.5 rounded-lg font-semibold text-sm shadow"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Records'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFileUpload} className="space-y-6">
              
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
                  {Object.entries(BUILTIN_PRESETS).map(([key, presetObj]) => {
                    const Icon = presetObj.icon;
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
                            {presetObj.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{presetObj.description}</p>
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
                        type="number" onWheel={(e) => e.target.blur()}
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
              {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading…</span><span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!file || isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition px-6 py-2.5 rounded-lg font-semibold text-sm shadow"
                >
                  {isSubmitting ? 'Uploading & Processing...' : 'Upload & Import'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddHistoricalDataModal
