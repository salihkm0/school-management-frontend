// src/components/reports/AttendanceAnalyticsView.jsx
import React, { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useAdminTeacherClasses } from '../../hooks/useAdminTeacherClasses'
import { fetchAttendanceAnalytics } from '../../services/analyticsService'
import {
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  TrophyIcon,
  MagnifyingGlassIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ATTENDANCE_MONTHS = [
  { label: 'All Months (Full Academic Year)', value: '' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
]

const AttendanceAnalyticsView = ({ availableClasses: passedClasses, isStaff: passedIsStaff }) => {
  const { user } = useSelector((state) => state.auth)
  const isStaff = passedIsStaff !== undefined ? passedIsStaff : (user?.role === 'staff')
  const { myClasses: hookClasses } = useAdminTeacherClasses('class-teacher')
  const availableClasses = (passedClasses && passedClasses.length > 0) ? passedClasses : hookClasses

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [attendanceData, setAttendanceData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('attention') // 'attention' | 'perfect' | 'all'
  const [searchTerm, setSearchTerm] = useState('')
  const [entrySearch, setEntrySearch] = useState('')

  useEffect(() => {
    if (isStaff && availableClasses.length > 0 && !selectedClass) {
      const firstClassId = availableClasses[0]._id || availableClasses[0].id
      if (firstClassId) setSelectedClass(firstClassId.toString())
    }
  }, [isStaff, availableClasses])

  useEffect(() => {
    loadAttendanceAnalytics()
  }, [selectedClass, selectedMonth])

  const loadAttendanceAnalytics = async () => {
    setIsLoading(true)
    try {
      const res = await fetchAttendanceAnalytics({
        classId: selectedClass || undefined,
        month: selectedMonth ? parseInt(selectedMonth) : undefined,
      })
      setAttendanceData(res?.data || res)
    } catch (error) {
      console.error('Failed to load attendance analytics:', error)
      toast.error('Failed to load attendance analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Roll No', 'Student Name', 'Class', 'Present Days', 'Total Days', 'Absent Days', 'Percentage']
    const csvRows = [
      headers.join(','),
      ...data.map((row) => [
        row.rollNumber || '',
        `"${String(row.studentName || row.fullName || row.name || '').replace(/"/g, '""')}"`,
        `"${String(row.className || '').replace(/"/g, '""')}"`,
        row.presentDays ?? '',
        row.totalWorkingDays ?? '',
        row.absentDays ?? '',
        `${row.percentage ?? 0}%`
      ].join(','))
    ]

    const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(csvBlob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const summary = attendanceData?.summary || {}
  const rawDistribution = attendanceData?.distribution
  const distribution = useMemo(() => {
    if (!rawDistribution) {
      return {
        excellent: { count: 0, percentage: 0 },
        good: { count: 0, percentage: 0 },
        average: { count: 0, percentage: 0 },
        critical: { count: 0, percentage: 0 }
      }
    }
    if (Array.isArray(rawDistribution)) {
      const findCat = (name) =>
        rawDistribution.find((d) => d.category?.toLowerCase() === name.toLowerCase()) || { count: 0, percentage: 0 }
      return {
        excellent: findCat('excellent'),
        good: findCat('good'),
        average: findCat('average'),
        critical: findCat('critical')
      }
    }
    return {
      excellent: rawDistribution.excellent || { count: 0, percentage: 0 },
      good: rawDistribution.good || { count: 0, percentage: 0 },
      average: rawDistribution.average || { count: 0, percentage: 0 },
      critical: rawDistribution.critical || { count: 0, percentage: 0 }
    }
  }, [rawDistribution])
  const monthlyTrends = attendanceData?.monthlyTrends || []
  const classWiseComparison = attendanceData?.classWiseComparison || []
  const breakdown = attendanceData?.breakdown || {}

  const needsAttentionList = breakdown.needsAttention || []
  const perfectAttendanceList = breakdown.perfectAttendance || []
  const allStudentsList = breakdown.allStudents || []

  // Current list based on active tab
  let currentList = []
  if (activeTab === 'attention') currentList = needsAttentionList
  else if (activeTab === 'perfect') currentList = perfectAttendanceList
  else currentList = allStudentsList

  // Search filter
  const filteredList = currentList.filter((s) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    const sName = (s.studentName || s.fullName || s.name || '').toLowerCase()
    return (
      sName.includes(q) ||
      (s.rollNumber && String(s.rollNumber).includes(q)) ||
      (s.className && s.className.toLowerCase().includes(q))
    )
  })

  // Attendance Entry Progress (like Mark Entry Progress)
  const entryProgress = attendanceData?.entryProgress || null
  const progressClasses = entryProgress?.classes || []
  const progressMonths = entryProgress?.months || []

  const filteredEntryClasses = useMemo(() => {
    if (!entrySearch.trim()) return progressClasses
    const q = entrySearch.toLowerCase().trim()
    return progressClasses.filter((c) =>
      (c.className && c.className.toLowerCase().includes(q)) ||
      (c.teacherShortName && c.teacherShortName.toLowerCase().includes(q)) ||
      (c.classTeacherName && c.classTeacherName.toLowerCase().includes(q))
    )
  }, [progressClasses, entrySearch])

  const avgPct = summary.averagePercentage ?? 0

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isStaff ? 'Teaching Class' : 'Filter by Class (Optional)'}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50 hover:bg-white transition-colors text-sm"
            >
              {!isStaff && <option value="">All Classes</option>}
              {availableClasses.map((cls) => {
                const baseName = cls.name || cls.className || ''
                const section = cls.section || ''
                const displayName = cls.displayName || (section ? `${baseName} ${section}` : baseName)
                return (
                  <option key={cls._id || cls.id} value={cls._id || cls.id}>
                    {displayName}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Month (Optional)
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50 hover:bg-white transition-colors text-sm"
            >
              {ATTENDANCE_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(selectedClass || selectedMonth) && !isStaff && (
              <button
                onClick={() => {
                  setSelectedClass('')
                  setSelectedMonth('')
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={loadAttendanceAnalytics}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : attendanceData ? (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Average Attendance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Attendance</span>
                <div className={`p-2 rounded-lg ${avgPct >= 85 ? 'bg-emerald-50 text-emerald-600' : avgPct >= 75 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${avgPct >= 85 ? 'text-emerald-600' : avgPct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgPct.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">overall rate</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Total {summary.totalPresentDays?.toLocaleString() || 0} student-days present
              </div>
            </div>

            {/* Total Students & Working Days */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Students</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <UserGroupIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {summary.totalStudents?.toLocaleString() || 0}
                </span>
                <span className="text-xs text-gray-500">enrolled</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {summary.totalWorkingDays || 0} working days recorded
              </div>
            </div>

            {/* Good Standing (>=75%) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Good Standing (≥75%)</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <TrophyIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {summary.goodStandingCount?.toLocaleString() || 0}
                </span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {summary.goodStandingPercentage || 0}%
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {summary.perfectCount || 0} students have 100% attendance
              </div>
            </div>

            {/* Needs Attention (<75%) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Needs Attention (&lt;75%)</span>
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">
                  {summary.needsAttentionCount?.toLocaleString() || 0}
                </span>
                <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                  {summary.needsAttentionPercentage || 0}%
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {summary.criticalCount || 0} students in critical zone (&lt;60%)
              </div>
            </div>
          </div>

          {/* Attendance Entry Progress (like Mark Entry Progress) */}
          {progressClasses && progressClasses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900">Attendance Entry Progress</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {entryProgress?.overallStats?.completedClasses || 0} / {entryProgress?.overallStats?.totalClasses || progressClasses.length} Completed
                    </span>
                    {(entryProgress?.overallStats?.remainingClasses || 0) > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {entryProgress?.overallStats?.remainingClasses} Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Class-wise monthly attendance submission progress with class teacher allocations
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quick Search */}
                  <div className="relative min-w-[200px]">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter class or teacher..."
                      value={entrySearch}
                      onChange={(e) => setEntrySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[480px]">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200">
                    <tr>
                      <th className="px-3.5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap sticky left-0 bg-gray-50 z-30 border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb]">
                        Class
                      </th>
                      <th className="px-3.5 py-3 text-center font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">
                        Class Teacher
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200 min-w-[130px]">
                        Overall Progress
                      </th>
                      {progressMonths.map((m) => (
                        <th key={m.month} className="px-3 py-3 text-center font-semibold text-gray-700 whitespace-nowrap min-w-[84px]">
                          {m.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEntryClasses.length === 0 ? (
                      <tr>
                        <td colSpan={3 + progressMonths.length} className="py-8 text-center text-gray-400">
                          No classes match your search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredEntryClasses.map((cls, i) => (
                        <tr key={cls.classId || i} className="hover:bg-gray-50/70 transition-colors">
                          {/* Sticky Class */}
                          <td className="px-3.5 py-2.5 font-bold text-gray-900 whitespace-nowrap sticky left-0 bg-white border-r border-gray-100 z-10 shadow-[1px_0_0_0_#f3f4f6]">
                            <div className="flex items-center gap-1.5">
                              <span>{cls.className}</span>
                              {cls.section && <span className="text-gray-400 font-normal">({cls.section})</span>}
                            </div>
                          </td>

                          {/* Class Teacher Short Form Pill */}
                          <td className="px-3.5 py-2.5 text-center whitespace-nowrap border-r border-gray-100">
                            <span
                              className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700 border border-purple-200 shadow-xs cursor-default"
                              title={cls.classTeacherName ? `Class Teacher: ${cls.classTeacherName}` : 'No class teacher assigned'}
                            >
                              {cls.teacherShortName || '—'}
                            </span>
                          </td>

                          {/* Overall Progress */}
                          <td className="px-4 py-2.5 text-center border-r border-gray-100 bg-gray-50/20">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`text-xs font-bold ${
                                  cls.completionPercentage === 100
                                    ? 'text-emerald-600'
                                    : cls.completionPercentage > 0
                                    ? 'text-blue-600'
                                    : 'text-gray-400'
                                }`}
                              >
                                {cls.completionPercentage || 0}%
                              </span>
                              <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    cls.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${cls.completionPercentage || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Month Columns */}
                          {cls.monthsProgress?.map((m) => {
                            const pct = m.percentage || 0;
                            const isFuture = !m.isElapsed;

                            if (isFuture) {
                              return (
                                <td key={m.month} className="px-2 py-2.5 text-center text-gray-300 text-xs">
                                  —
                                </td>
                              );
                            }

                            return (
                              <td key={m.month} className="px-2 py-2.5 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span
                                    className={`text-xs font-bold ${
                                      pct === 100
                                        ? 'text-emerald-600'
                                        : pct > 0
                                        ? 'text-blue-600'
                                        : 'text-amber-600 font-semibold'
                                    }`}
                                  >
                                    {pct === 100 ? '100%' : pct > 0 ? `${pct}%` : 'Pending'}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {m.currentRecords}/{m.expectedRecords}
                                  </span>
                                  {m.teacherShortName && (
                                    <div
                                      className="flex flex-wrap items-center justify-center gap-1 mt-0.5"
                                      title={cls.classTeacherName ? `Teacher: ${cls.classTeacherName}` : ''}
                                    >
                                      <span
                                        className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                                          pct === 100
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : pct > 0
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold'
                                        }`}
                                      >
                                        {m.teacherShortName}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Standing Distribution & Monthly Trends Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution Bars */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Attendance Distribution</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Students categorized by percentage standing</p>
                </div>
                <ChartBarIcon className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="space-y-4">
                {/* Excellent >=90% */}
                <div>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Excellent (≥ 90%)
                    </span>
                    <span className="text-gray-600 font-semibold">
                      {distribution.excellent?.count || 0} ({distribution.excellent?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(distribution.excellent?.percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Good 75-89% */}
                <div>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      Good (75% - 89%)
                    </span>
                    <span className="text-gray-600 font-semibold">
                      {distribution.good?.count || 0} ({distribution.good?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(distribution.good?.percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Average 60-74% */}
                <div>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Average (60% - 74%)
                    </span>
                    <span className="text-gray-600 font-semibold">
                      {distribution.average?.count || 0} ({distribution.average?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(distribution.average?.percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Critical <60% */}
                <div>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      Critical (&lt; 60%)
                    </span>
                    <span className="text-gray-600 font-semibold text-red-600">
                      {distribution.critical?.count || 0} ({distribution.critical?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(distribution.critical?.percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Monthly Attendance Trends</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Average attendance across academic calendar</p>
                </div>
                <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
              </div>

              {monthlyTrends.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No monthly trend data available for current selection.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
                  {monthlyTrends.map((trend) => {
                    const pct = trend.averagePercentage || 0
                    const barColor = pct >= 85 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'
                    return (
                      <div key={trend.month}>
                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                          <span>{trend.monthName} ({trend.totalWorkingDays ?? trend.workingDays ?? 0} days)</span>
                          <span className={pct >= 85 ? 'text-emerald-600 font-bold' : pct >= 75 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${barColor} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Class-Wise Comparison (when viewing all classes) */}
          {!selectedClass && classWiseComparison.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Class-Wise Attendance Ranking</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Classes sorted by highest average attendance rate</p>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {classWiseComparison.length} classes
                </span>
              </div>
              <div className="overflow-x-auto max-h-[320px]">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">#</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Class</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Teacher</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Average Rate</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Total Students</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Good Standing</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Critical Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {classWiseComparison.map((c, idx) => (
                      <tr key={c.classId || idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-gray-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-800">{c.className}</td>
                        <td className="px-4 py-2.5 text-center">
                          {c.teacherShortName ? (
                            <span
                              className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700 border border-purple-200"
                              title={c.classTeacherName ? `Class Teacher: ${c.classTeacherName}` : ''}
                            >
                              {c.teacherShortName}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              c.averagePercentage >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.averagePercentage >= 75
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {c.averagePercentage?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{c.totalStudents}</td>
                        <td className="px-4 py-2.5 text-center text-emerald-600 font-medium">{c.goodStandingCount}</td>
                        <td className="px-4 py-2.5 text-center">
                          {c.criticalCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              {c.criticalCount} alert
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Student Breakdown Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header & Tabs */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Student Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Explore individual attendance records and reports</p>
              </div>

              {/* Segmented Tab */}
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('attention')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === 'attention'
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Needs Attention ({needsAttentionList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('perfect')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === 'perfect'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  100% Attendance ({perfectAttendanceList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Students ({allStudentsList.length})
                </button>
              </div>
            </div>

            {/* Filter Search and Export bar */}
            <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, roll no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => exportToCSV(filteredList, `attendance_${activeTab}_students`)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Export CSV ({filteredList.length})
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Roll No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Student Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Class</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Present Days</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Total Days</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Absent</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                        {searchTerm ? 'No students matching search criteria.' : 'No student records in this category.'}
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((student, idx) => {
                      const pct = student.percentage ?? 0
                      const badgeBg =
                        pct >= 90
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : pct >= 75
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : pct >= 60
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'

                      return (
                        <tr key={student.studentId || idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-gray-400 font-medium">{idx + 1}</td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{student.rollNumber || '-'}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{student.studentName || student.fullName || student.name || '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-600">{student.className || '-'}</td>
                          <td className="px-4 py-2.5 text-center text-emerald-700 font-medium">{student.presentDays ?? 0}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{student.totalWorkingDays ?? 0}</td>
                          <td className="px-4 py-2.5 text-center text-red-600 font-medium">{student.absentDays ?? 0}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeBg}`}>
                              {pct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default AttendanceAnalyticsView
