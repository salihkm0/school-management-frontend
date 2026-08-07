/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/staff/ClassMarksOverview/ClassMarksOverview.jsx
import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowLeftIcon,
  TableCellsIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronUpDownIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import { TrophyIcon } from '@heroicons/react/24/solid'
import api from '../../../services/api'
import examService from '../../../services/examService'
import classService from '../../../services/classService'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

// ─── Grade helpers ──────────────────────────────────────────────────────────
const getGradeInfo = (obtained, max) => {
  if (max <= 0) return { grade: '-', color: 'text-gray-400 bg-gray-100' }
  const pct = (obtained / max) * 100
  if (pct >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-100' }
  if (pct >= 80) return { grade: 'A',  color: 'text-green-700 bg-green-100' }
  if (pct >= 70) return { grade: 'B+', color: 'text-blue-700 bg-blue-100' }
  if (pct >= 60) return { grade: 'B',  color: 'text-cyan-700 bg-cyan-100' }
  if (pct >= 50) return { grade: 'C+', color: 'text-yellow-700 bg-yellow-100' }
  if (pct >= 40) return { grade: 'C',  color: 'text-orange-700 bg-orange-100' }
  if (pct >= 30) return { grade: 'D+', color: 'text-amber-700 bg-amber-100' }
  if (pct >= 20) return { grade: 'D',  color: 'text-red-600 bg-red-100' }
  return { grade: 'E', color: 'text-gray-600 bg-gray-100' }
}

const getPercentageBadge = (pct) => {
  if (pct >= 80) return 'text-emerald-700 bg-emerald-50'
  if (pct >= 60) return 'text-blue-700 bg-blue-50'
  if (pct >= 40) return 'text-yellow-700 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

// ─── Main Component ─────────────────────────────────────────────────────────
const ClassMarksOverview = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const isAdmin = user?.role === 'admin'

  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState(classId || '')
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExamsLoading, setIsExamsLoading] = useState(true)
  const [view, setView] = useState('table') // 'table' | 'card'
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('rank') // 'rank' | 'name' | 'percentage'
  const [isInitializing, setIsInitializing] = useState(!isAdmin && !classId)

  // Derive available classes based on selected exam
  const availableClasses = useMemo(() => {
    if (!selectedExamId) return []
    const exam = exams.find(e => e._id === selectedExamId)
    if (!exam) return []
    
    let examClasses = []
    
    if (exam.classIds && exam.classIds.length > 0 && typeof exam.classIds[0] === 'object') {
      examClasses = exam.classIds
    } else if (exam.classes && exam.classes.length > 0) {
      examClasses = exam.classes
    } else if (exam.classDetails && exam.classDetails.length > 0) {
      examClasses = exam.classDetails.map(c => ({
        _id: c.classId,
        name: c.className,
        displayName: c.className
      }))
    }

    if (isAdmin) {
      return examClasses
    } else {
      // For staff, only show exam classes they are assigned to
      return examClasses.filter(ec => classes.some(c => c._id === ec._id))
    }
  }, [selectedExamId, exams, classes, isAdmin])

  // Reset selected class when exam changes if the current class isn't in the new list
  useEffect(() => {
    if (selectedClassId && availableClasses.length > 0) {
      if (!availableClasses.some(c => c._id === selectedClassId)) {
        setSelectedClassId('')
        setData(null)
      }
    } else if (availableClasses.length === 1 && !selectedClassId) {
      setSelectedClassId(availableClasses[0]._id)
    }
  }, [selectedExamId, availableClasses])

  // Load marks when exam+class selected

  const loadExams = async () => {
    setIsExamsLoading(true)
    try {
      let resp;
      if (isAdmin) {
        resp = await examService.getExams({ limit: 100 })
      } else {
        const ayResp = await api.get('/academic-years', { params: { limit: 10 } })
        const ays = Array.isArray(ayResp.data?.data) 
          ? ayResp.data.data 
          : (ayResp.data?.academicYears || [])
        const currentYear = ays.find(y => y.isCurrent)
        resp = await examService.getStaffExams(currentYear?._id)
      }
      const list = resp?.data?.exams || resp?.data || resp?.exams || []
      setExams(Array.isArray(list) ? list : [])
    } catch (e) {
      toast.error('Failed to load exams')
    } finally {
      setIsExamsLoading(false)
    }
  }

  const loadClasses = async () => {
    if (isAdmin) {
      try {
        const resp = await api.get('/classes', { params: { limit: 200 } })
        setClasses(resp.data?.data?.classes || resp.data?.classes || [])
      } catch (e) {
        console.error('Failed to load classes', e)
      }
    } else {
      try {
        // Staff logic: get current academic year
        const ayResp = await api.get('/academic-years', { params: { limit: 10 } })
        const ays = Array.isArray(ayResp.data?.data) 
          ? ayResp.data.data 
          : (ayResp.data?.academicYears || [])
        const currentYear = ays.find(y => y.isCurrent)
        if (!currentYear) return

        // Get current staff ID
        const staffResp = await api.get('/staff', { params: { limit: 1000 } })
        const staffs = Array.isArray(staffResp.data?.data) 
          ? staffResp.data.data 
          : (staffResp.data?.staff || [])
        const currentStaff = staffs.find(s => {
          const uid = (s.userId?._id || s.userId)?.toString()
          const currentUserId = (user?._id || user?.id)?.toString()
          return uid && currentUserId && uid === currentUserId
        })
        
        if (!currentStaff) {
          setIsInitializing(false)
          return
        }

        // Get all classes for the teacher (class teacher and subject teacher)
        const resp = await classService.getTeacherClasses(currentStaff._id, currentYear._id)
        const myCls = resp?.data?.classes || resp?.classes || resp?.data || resp || []
        const clsList = Array.isArray(myCls) ? myCls : []
        setClasses(clsList)

        if (clsList.length > 0 && !selectedClassId) {
          setSelectedClassId(clsList[0]._id)
        }
      } catch (e) {
        console.error('Failed to load staff classes', e)
      } finally {
        setIsInitializing(false)
      }
    }
  }

  const loadMarks = async () => {
    setIsLoading(true)
    setData(null)
    try {
      const resp = await api.get(`/marks/class/${selectedExamId}/${selectedClassId}`)
      setData(resp.data?.data || resp.data)
    } catch (e) {
      toast.error('Failed to load marks')
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // Load exams + classes on mount
  useEffect(() => {
    loadExams()
    loadClasses()
  }, [])

  // Load marks when exam+class selected
  useEffect(() => {
    if (selectedExamId && selectedClassId) loadMarks()
  }, [selectedExamId, selectedClassId])

  const handleDownloadPDF = async () => {
    if (!selectedExamId || !selectedClassId) {
      toast.error('Please select both exam and class')
      return
    }
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' })
      const resp = await api.get(`/pdf/report-card/class-marks/download/${selectedClassId}/${selectedExamId}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      
      let filename = 'Class_Marks.pdf'
      const disposition = resp.headers['content-disposition'] || resp.headers['Content-Disposition']
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '')
        }
      } else {
        const classNameStr = data?.className || 'Class'
        const examNameStr = exams.find((e) => e._id === selectedExamId)?.name || 'Exam'
        filename = `Class_Marks_${classNameStr}_${examNameStr}.pdf`.replace(/\s+/g, '_')
      }
      
      link.setAttribute('download', filename)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('PDF downloaded successfully', { id: 'pdf-gen' })
    } catch (e) {
      console.error(e)
      toast.error('Failed to download PDF', { id: 'pdf-gen' })
    }
  }

  // Derive subjects list
  const subjects = useMemo(() => data?.subjects || data?.examSubjects || [], [data])

  // Build enriched student rows with totals, rank, percentage
  const studentRows = useMemo(() => {
    if (!data?.students) return []
    return data.students.map((student) => {
      let totalObtained = 0
      let totalMax = 0
      const subjectMarks = subjects.map((subj) => {
        const key = subj.examSubjectId?.toString()
        const sm = student.subjects?.find(
          (s) => (s.examSubjectId?.toString() || s.subjectId?.toString()) === key
        )
        const theory = sm?.theoryScore ?? 0
        const practical = sm?.practicalScore ?? 0
        const ce = sm?.ceMarks ?? sm?.ceScore ?? 0
        const total = sm?.isAbsent ? 0 : theory + practical + ce
        const max = subj.maxMarks || 100
        if (!sm?.isAbsent) {
          totalObtained += total
          totalMax += max
        }
        return {
          examSubjectId: key,
          name: subj.displayName || subj.subjectName,
          total,
          max,
          isAbsent: sm?.isAbsent || false,
          isEntered: sm?.isEntered || false,
          theory,
          practical,
          ce,
        }
      })
      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
      return {
        studentId: student.studentId,
        name: student.studentName,
        admissionNo: student.admissionNo || student.studentCode || '-',
        rollNumber: student.rollNumber,
        subjectMarks,
        totalObtained,
        totalMax,
        percentage,
        gradeInfo: getGradeInfo(totalObtained, totalMax),
      }
    })
  }, [data, subjects])

  // Sort + rank + filter
  const sorted = useMemo(() => {
    const copy = [...studentRows].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'percentage') return b.percentage - a.percentage
      return b.percentage - a.percentage // rank = % desc
    })
    return copy.map((s, i) => ({ ...s, rank: i + 1 }))
  }, [studentRows, sortBy])

  const filtered = useMemo(() =>
    sorted.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(search.toLowerCase())
    ), [sorted, search])

  // Summary stats
  const stats = useMemo(() => {
    if (!studentRows.length) return null
    const avg = studentRows.reduce((s, r) => s + r.percentage, 0) / studentRows.length
    const passCount = studentRows.filter((r) => r.percentage >= 40).length
    const completedSubjects = data?.subjectProgress 
      ? data.subjectProgress.filter(sp => sp.percentage === 100).length
      : subjects.filter((subj) => {
          const key = subj.examSubjectId?.toString()
          return studentRows.every((s) =>
            s.subjectMarks.find((sm) => sm.examSubjectId === key)?.isEntered
          )
        }).length
    return { avg, passCount, total: studentRows.length, completedSubjects }
  }, [studentRows, subjects])

  if (!isAdmin && !isInitializing && classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Classes Assigned
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              You are not assigned as a class teacher for any class.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const selectedClassObj = classes.find((c) => c._id === selectedClassId)
  const className = selectedClassObj ? (selectedClassObj.displayName || `${selectedClassObj.name} ${selectedClassObj.section || ''}`.trim()) : (data?.className || 'Class')
  const examName = exams.find((e) => e._id === selectedExamId)?.name || ''

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AcademicCapIcon className="w-7 h-7 text-emerald-500" />
              Class Marks Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View all students' exam marks across subjects
            </p>
          </div>
        </div>

        {/* Selectors */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Exam selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Exam</label>
              {isExamsLoading ? (
                <div className="text-sm text-gray-400 py-2.5">Loading exams…</div>
              ) : (
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">— Choose Exam —</option>
                  {exams.map((e) => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Class selector */}
            {(isAdmin || availableClasses.length > 0 || classes.length > 1) && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Class</label>
                {isInitializing ? (
                  <div className="text-sm text-gray-400 py-2.5">Loading classes…</div>
                ) : (
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    disabled={!selectedExamId}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">— Choose Class —</option>
                    {availableClasses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.displayName || `${c.name}${c.section ? `-${c.section}` : ''}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Reload */}
            {selectedExamId && selectedClassId && (
              <div className="flex items-end">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isLoading || !data}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 border border-gray-200 disabled:opacity-50 transition-all"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={loadMarks}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && <div className="flex justify-center py-16"><LoadingSpinner /></div>}

        {/* No selection */}
        {!isLoading && !data && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <ChartBarIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Select an exam{isAdmin ? ' and class' : ''} to view marks</p>
          </div>
        )}

        {/* Data loaded */}
        {!isLoading && data && (
          <>
            {!isAdmin && stats && stats.completedSubjects < subjects.length ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                <ExclamationCircleIcon className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Marks Pending</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  The class marks overview will be available once marks for all subjects have been submitted. Currently, {stats.completedSubjects} out of {subjects.length} subjects are completed.
                </p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Students', value: stats.total, icon: UserGroupIcon, color: 'text-blue-600 bg-blue-50' },
                      { label: 'Class Average', value: `${stats.avg.toFixed(1)}%`, icon: ChartBarIcon, color: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Pass Count', value: `${stats.passCount}/${stats.total}`, icon: CheckCircleIcon, color: 'text-green-600 bg-green-50' },
                      { label: 'Subjects Done', value: `${stats.completedSubjects}/${subjects.length}`, icon: ClockIcon, color: 'text-amber-600 bg-amber-50' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

            {/* Controls bar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-700">
                  {className} — <span className="text-emerald-600">{examName}</span>
                </p>
                <span className="text-xs text-gray-400">({filtered.length} students)</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student…"
                    className="pl-8 pr-6 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36 sm:w-48"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <XMarkIcon className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1.5">
                  <ChevronUpDownIcon className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs text-gray-700 focus:outline-none bg-transparent"
                  >
                    <option value="rank">Sort by Rank</option>
                    <option value="name">Sort by Name</option>
                    <option value="percentage">Sort by %</option>
                  </select>
                </div>

                {/* View toggle */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setView('table')}
                    className={`p-2 transition-colors ${view === 'table' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <TableCellsIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('card')}
                    className={`p-2 transition-colors ${view === 'card' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* TABLE VIEW */}
            {view === 'table' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[50px] border-r border-gray-200">
                          Rank
                        </th>
                        <th className="sticky left-[50px] bg-gray-50 z-10 px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[160px] border-r border-gray-200">
                          Student
                        </th>
                        {subjects.map((subj) => (
                          <th key={subj.examSubjectId} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap border-r border-gray-100">
                            <div>{subj.displayName || subj.subjectName}</div>
                            <div className="text-[10px] font-normal text-gray-400">/{subj.maxMarks || 100}</div>
                          </th>
                        ))}
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap border-l border-gray-200 bg-gray-100/60">
                          Total
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-100/60">
                          %
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-100/60">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={3 + subjects.length} className="py-10 text-center text-gray-400 text-sm">
                            No students found
                          </td>
                        </tr>
                      ) : filtered.map((student, idx) => (
                        <tr key={student.studentId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-emerald-50/30 transition-colors`}>
                          <td className="sticky left-0 px-4 py-2 text-center border-r border-gray-100 bg-inherit z-10">
                            {student.rank <= 3 ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${student.rank === 1 ? 'bg-yellow-100 text-yellow-700' : student.rank === 2 ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}`}>
                                {student.rank}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">{student.rank}</span>
                            )}
                          </td>
                          <td className="sticky left-[50px] px-4 py-2 border-r border-gray-100 bg-inherit z-10">
                            <p className="text-xs font-semibold text-gray-900">{student.name}</p>
                            <p className="text-[10px] text-gray-400">{student.admissionNo}</p>
                          </td>
                          {student.subjectMarks.map((sm) => (
                            <td key={sm.examSubjectId} className="px-2 py-2 text-center border-r border-gray-100">
                              {sm.isAbsent ? (
                                <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">AB</span>
                              ) : !sm.isEntered ? (
                                <span className="text-xs text-gray-300">—</span>
                              ) : (
                                <span className="text-xs font-mono font-semibold text-gray-900">
                                  {sm.total}<span className="text-gray-400 font-normal">/{sm.max}</span>
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center border-l border-gray-200 bg-gray-50/60">
                            <span className="text-xs font-bold font-mono text-gray-900">
                              {student.totalObtained}<span className="text-gray-400 font-normal">/{student.totalMax}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center bg-gray-50/60">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getPercentageBadge(student.percentage)}`}>
                              {student.percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center bg-gray-50/60">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${student.gradeInfo.color}`}>
                              {student.gradeInfo.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CARD VIEW */}
            {view === 'card' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
                    No students found
                  </div>
                ) : filtered.map((student) => (
                  <div key={student.studentId} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Card header */}
                    <div className="px-4 pt-4 pb-3 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">{student.name}</p>
                            <p className="text-[10px] text-gray-500">{student.admissionNo}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${student.gradeInfo.color}`}>
                            {student.gradeInfo.grade}
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            {student.rank <= 3 && <TrophyIcon className={`w-3 h-3 ${student.rank === 1 ? 'text-yellow-500' : student.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />}
                            #{student.rank}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.min(student.percentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${getPercentageBadge(student.percentage)} px-1.5 py-0.5 rounded`}>
                          {student.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Subject chips */}
                    <div className="p-3 space-y-1.5">
                      {student.subjectMarks.map((sm) => (
                        <div key={sm.examSubjectId} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate max-w-[60%]">{sm.name}</span>
                          {sm.isAbsent ? (
                            <span className="text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">AB</span>
                          ) : !sm.isEntered ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-semibold text-gray-900">{sm.total}/{sm.max}</span>
                              <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${getGradeInfo(sm.total, sm.max).color}`}>
                                {getGradeInfo(sm.total, sm.max).grade}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Card footer total */}
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Total</span>
                      <span className="text-xs font-bold font-mono text-gray-900">
                        {student.totalObtained}/{student.totalMax}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </>
        )}
      </div>
    </div>
  )
}

export default ClassMarksOverview
