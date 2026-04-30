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
  InformationCircleIcon
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
  const [itemsPerPage] = useState(20)
  const [loadingSummary, setLoadingSummary] = useState(false)

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

  const getAttendanceForStudent = (studentId) => {
    const record = classAttendance?.attendance?.find(a => a.studentId?._id === studentId || a.studentId === studentId)
    return record
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
      'Holidays': student.holidays,
      'Attendance Percentage': `${student.percentage.toFixed(1)}%`,
      'Status': student.status
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report')
    XLSX.writeFile(wb, `attendance_${selectedClass}_${selectedMonth}_${selectedYear}.xlsx`)
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ 
    value: i + 1, 
    name: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) 
  }))
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-500 mt-1">View and manage student attendance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setSelectedClass('')
              setSelectedMonth(new Date().getMonth() + 1)
              setSelectedYear(new Date().getFullYear())
              setSummary(null)
            }}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={exportToExcel}
            disabled={!selectedClass || studentDetails.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>
                  {c.displayName || c.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Template Info */}
        {template && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start space-x-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <span className="font-medium">Template Applied:</span> {template.name} • 
              Working Days: {template.totalWorkingDays} • 
              Holidays: {template.holidays?.length || 0}
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      {selectedClass && summary && !loadingSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600">Total Students</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalStudents}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600">Average Attendance</p>
            <p className="text-2xl font-bold text-green-700">{summary.averageAttendance}%</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-sm text-yellow-600">Good Standing (&gt;75%)</p>
            <p className="text-2xl font-bold text-yellow-700">{summary.goodStanding}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-red-600">Needs Attention (&lt;60%)</p>
            <p className="text-2xl font-bold text-red-700">{summary.needsAttention}</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {isLoading || loadingSummary ? (
        <LoadingSpinner />
      ) : selectedClass ? (
        studentDetails.length > 0 ? (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                      {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th> */}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Working Days</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                      {/* <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Holidays</th> */}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentStudents.map((student, index) => {
                      const percentage = student.percentage
                      const statusColor = percentage >= 75 ? 'bg-green-100 text-green-800' : percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : percentage > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      const statusText = percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : percentage > 0 ? 'Poor' : 'Not Recorded'
                      
                      return (
                        <tr key={student.studentId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                            <div className="text-xs text-gray-500">{student.admissionNo}</div>
                          </td>
                          {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '-'}</td> */}
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">{template?.totalWorkingDays || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-green-600 font-medium">{student.presentDays || 0}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-red-600">{student.absentDays || 0}</td>
                          {/* <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-blue-600">{student.holidays || 0}</td> */}
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`text-sm font-medium ${percentage >= 75 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : percentage > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} students
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg disabled:opacity-50 hover:bg-white"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg disabled:opacity-50 hover:bg-white"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">No students found in this class</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">Please select a class to view attendance records</p>
        </div>
      )}
    </div>
  )
}

export default AttendanceList