// src/pages/parent/MyChildAttendancePage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  CalendarIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { fetchMyChildren } from '../../store/slices/parentSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import * as XLSX from 'xlsx'

const MyChildAttendancePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { myChildren, isLoading: childrenLoading } = useSelector((state) => state.parents || { myChildren: [] })
  
  const [selectedChild, setSelectedChild] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingChildId, setLoadingChildId] = useState(null)

  useEffect(() => {
    loadChildren()
  }, [dispatch])

  useEffect(() => {
    if (myChildren.length > 0 && !selectedChild) {
      const firstChild = myChildren[0]
      setSelectedChild(firstChild)
      loadAttendance(firstChild._id || firstChild.studentId)
    }
  }, [myChildren])

  const loadChildren = async () => {
    await dispatch(fetchMyChildren())
  }

  const handleChildSelect = async (child) => {
    // Don't do anything if already loading or same child
    if (loadingChildId) return
    
    const childId = child._id || child.studentId
    const currentChildId = selectedChild?._id || selectedChild?.studentId
    
    if (currentChildId === childId) return
    
    setLoadingChildId(childId)
    setSelectedChild(child)
    setAttendanceData([])
    setSummary(null)
    
    await loadAttendance(childId)
    setLoadingChildId(null)
  }

  const loadAttendance = async (childId) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5055/api/attendance/student/${childId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      const attendanceRecords = Array.isArray(data) ? data : (data.data || [])
      setAttendanceData(attendanceRecords)
      
      const totalDays = attendanceRecords.reduce((sum, record) => sum + (record.totalWorkingDays || 0), 0)
      const totalPresent = attendanceRecords.reduce((sum, record) => sum + (record.presentDays || 0), 0)
      const overallPercentage = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0
      
      setSummary({
        totalDays,
        totalPresent,
        totalAbsent: totalDays - totalPresent,
        overallPercentage,
      })
    } catch (error) {
      console.error('Failed to load attendance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (percentage) => {
    if (percentage >= 75) return { color: 'bg-emerald-100 text-emerald-800', label: 'Good' }
    if (percentage >= 60) return { color: 'bg-amber-100 text-amber-800', label: 'Average' }
    return { color: 'bg-rose-100 text-rose-800', label: 'Needs Improvement' }
  }

  const exportToExcel = () => {
    if (!attendanceData || attendanceData.length === 0) return
    
    const exportData = attendanceData.map(record => ({
      'Year': record.year,
      'Month': new Date(record.year, record.month - 1, 1).toLocaleString('default', { month: 'long' }),
      'Working Days': record.totalWorkingDays,
      'Present Days': record.presentDays,
      'Absent Days': record.absentDays,
      'Attendance Percentage': `${(record.percentage || 0).toFixed(1)}%`
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Attendance_${selectedChild?.fullName || selectedChild?.studentName}`)
    XLSX.writeFile(wb, `attendance_${selectedChild?.fullName || selectedChild?.studentName}.xlsx`)
  }

  const availableYears = [...new Set(attendanceData.map(record => record.year))].sort((a, b) => b - a)
  const filteredAttendance = attendanceData.filter(record => record.year === selectedYear)
  const sortedAttendance = [...filteredAttendance].sort((a, b) => b.month - a.month)

  if (childrenLoading) {
    return <LoadingSpinner />
  }

  if (myChildren.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-12 h-12 text-primary-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Children Connected</h2>
            <p className="text-gray-500">Please connect your children first from the dashboard.</p>
            <button
              onClick={() => navigate('/my-children')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Go to My Children
            </button>
          </div>
        </div>
      </div>
    )
  }

  const overallStatus = summary ? getStatusBadge(summary.overallPercentage) : { color: '', label: '' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/my-children')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to My Children
          </button>
          
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Attendance Record</h1>
                <p className="text-primary-100 mt-1 text-sm">
                  Track your child's daily attendance
                </p>
              </div>
              <button
                onClick={exportToExcel}
                disabled={!attendanceData?.length}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                Export to Excel
              </button>
            </div>
          </div>
        </div>

        {/* Student Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
          <div className="flex flex-wrap gap-3">
            {myChildren.map((child) => {
              const childId = child._id || child.studentId
              const isSelected = selectedChild?._id === child._id || selectedChild?.studentId === child.studentId
              const isLoadingStudent = loadingChildId === childId
              
              return (
                <button
                  key={childId}
                  onClick={() => handleChildSelect(child)}
                  disabled={isLoadingStudent}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isLoadingStudent ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isLoadingStudent ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                      {child.fullName?.charAt(0) || child.studentName?.charAt(0) || 'S'}
                    </div>
                  )}
                  {child.fullName || child.studentName}
                </button>
              )
            })}
          </div>
        </div>

        {/* Details Section */}
        {selectedChild && (
          <div>
            {/* Student Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-primary-600 font-bold text-lg">
                      {selectedChild.fullName?.charAt(0) || selectedChild.studentName?.charAt(0) || 'S'}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{selectedChild.fullName || selectedChild.studentName}</h2>
                  <p className="text-sm text-gray-500">
                    Class: {selectedChild.className || selectedChild.class?.displayName || 'N/A'} | 
                    Roll No: {selectedChild.rollNumber || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading attendance records...</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500">Total Working Days</p>
                      <p className="text-2xl font-bold text-gray-800">{summary.totalDays}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500">Present Days</p>
                      <p className="text-2xl font-bold text-emerald-600">{summary.totalPresent}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500">Absent Days</p>
                      <p className="text-2xl font-bold text-rose-600">{summary.totalAbsent}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500">Overall Attendance</p>
                      <div>
                        <p className="text-2xl font-bold text-primary-600">{summary.overallPercentage.toFixed(1)}%</p>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${overallStatus.color}`}>
                          {overallStatus.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Year Filter */}
                {availableYears.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Select Year:</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => loadAttendance(selectedChild?._id || selectedChild?.studentId)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <ArrowPathIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Monthly Attendance Table */}
                {sortedAttendance.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Attendance Records</h3>
                    <p className="text-gray-500">No attendance records found for {selectedYear}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Working Days</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {sortedAttendance.map((record, index) => {
                            const percentage = record.percentage || 0
                            const status = getStatusBadge(percentage)
                            const monthName = new Date(record.year, record.month - 1, 1).toLocaleString('default', { month: 'long' })
                            
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{monthName} {record.year}</td>
                                <td className="px-6 py-4 text-center text-sm text-gray-600">{record.totalWorkingDays}</td>
                                <td className="px-6 py-4 text-center text-sm text-emerald-600 font-medium">{record.presentDays}</td>
                                <td className="px-6 py-4 text-center text-sm text-rose-600">{record.absentDays}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`text-sm font-medium ${percentage >= 75 ? 'text-emerald-600' : percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                                    {status.label}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {summary && (
                  <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Overall Attendance Progress</span>
                      <span className="font-medium text-primary-600">{summary.overallPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${summary.overallPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>0%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyChildAttendancePage