// src/components/attendance/AttendanceList.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAttendanceByClass, fetchAttendanceSummary } from '../../store/slices/attendanceSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import * as XLSX from 'xlsx'

const AttendanceList = () => {
  const dispatch = useDispatch()
  const { classAttendance, isLoading } = useSelector((state) => state.attendance)
  const { classes } = useSelector((state) => state.classes)
  const [summary, setSummary] = useState(null)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedClass) {
      loadAttendance()
      loadSummary()
    }
  }, [dispatch, selectedClass, selectedMonth, selectedYear])

  const loadAttendance = async () => {
    await dispatch(fetchAttendanceByClass({ 
      classId: selectedClass, 
      year: selectedYear, 
      month: selectedMonth 
    }))
  }

  const loadSummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await dispatch(fetchAttendanceSummary({ 
        classId: selectedClass, 
        year: selectedYear,
        month: selectedMonth 
      })).unwrap()
      setSummary(res)
    } catch (error) {
      console.error('Failed to load summary:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const studentDetails = summary?.studentDetails || []
  const template = summary?.template

  const filteredStudents = studentDetails.filter(student =>
    student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)

  const exportToExcel = () => {
    const exportData = studentDetails.map(student => ({
      'Student Name': student.studentName,
      'Roll Number': student.rollNumber,
      'Admission No': student.admissionNo,
      'Working Days': student.totalWorkingDays,
      'Present Days': student.presentDays,
      'Absent Days': student.absentDays,
      'Attendance Percentage': `${student.percentage.toFixed(1)}%`,
      'Status': student.status
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report')
    XLSX.writeFile(wb, `attendance_${selectedClass}_${selectedMonth}_${selectedYear}.xlsx`)
    toast.success('Exported successfully')
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ 
    value: i + 1, 
    name: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) 
  }))
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const hasActiveFilters = selectedClass

  if (isLoading && !classAttendance) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)} 
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          >
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
            ))}
          </select>
          
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))} 
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          >
            {months.map(m => (<option key={m.value} value={m.value}>{m.name}</option>))}
          </select>
          
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          >
            {years.map(y => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">1</span>}
          </button>
          <button
            onClick={exportToExcel}
            disabled={!selectedClass || studentDetails.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                <option value="">All Classes</option>
                {classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                {months.map(m => (<option key={m.value} value={m.value}>{m.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                {years.map(y => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Template Info */}
      {template && (
        <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
          <InformationCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <span className="font-medium">Template: {template.name}</span> • Working Days: {template.totalWorkingDays} • Holidays: {template.holidays?.length || 0}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {selectedClass && summary && !loadingSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total Students</p>
            <p className="text-lg font-bold text-gray-900">{summary.totalStudents}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Avg Attendance</p>
            <p className="text-lg font-bold text-emerald-600">{summary.averageAttendance}%</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Good (&gt;75%)</p>
            <p className="text-lg font-bold text-emerald-600">{summary.goodStanding}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Needs Attention</p>
            <p className="text-lg font-bold text-amber-600">{summary.needsAttention}</p>
          </div>
        </div>
      )}

      {/* Search */}
      {selectedClass && studentDetails.length > 0 && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      )}

      {/* Attendance Table */}
      {isLoading || loadingSummary ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : selectedClass ? (
        studentDetails.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Student Name</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Present</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Absent</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">%</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentStudents.map((student, index) => {
                    const percentage = student.percentage
                    const statusColor = percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : percentage >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    const statusText = percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : 'Poor'
                    
                    return (
                      <tr key={student.studentId} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-sm text-gray-500">{indexOfFirstItem + index + 1}</td>
                        <td className="px-3 py-2">
                          <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                          <div className="text-xs text-gray-500">{student.admissionNo}</div>
                        </td>
                        <td className="px-3 py-2 text-center text-sm text-emerald-600 font-medium">{student.presentDays || 0}</td>
                        <td className="px-3 py-2 text-center text-sm text-rose-600">{student.absentDays || 0}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-sm font-medium ${percentage >= 75 ? 'text-emerald-600' : percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${statusColor}`}>{statusText}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-3 py-2 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-gray-500 text-center sm:text-left">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50">
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50">
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No attendance records found</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">Select a class to view attendance</p>
        </div>
      )}
    </div>
  )
}

export default AttendanceList