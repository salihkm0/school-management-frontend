// src/pages/parent/MyChildAttendancePage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  CalendarIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      const attendanceRecords = Array.isArray(data) ? data : (data.data || [])
      setAttendanceData(attendanceRecords)
      
      const totalDays = attendanceRecords.reduce((sum, r) => sum + (r.totalWorkingDays || 0), 0)
      const totalPresent = attendanceRecords.reduce((sum, r) => sum + (r.presentDays || 0), 0)
      const overallPercentage = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0
      
      setSummary({ totalDays, totalPresent, totalAbsent: totalDays - totalPresent, overallPercentage })
    } catch (error) { console.error('Failed to load attendance:', error) }
    finally { setIsLoading(false) }
  }

  const getStatusBadge = (percentage) => {
    if (percentage >= 75) return { color: 'bg-emerald-100 text-emerald-700', label: 'Good' }
    if (percentage >= 60) return { color: 'bg-amber-100 text-amber-700', label: 'Average' }
    return { color: 'bg-rose-100 text-rose-700', label: 'Needs Improvement' }
  }

  const formatMonth = (year, month) => {
    return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })
  }

  const availableYears = [...new Set(attendanceData.map(r => r.year))].sort((a, b) => b - a)
  const filteredAttendance = attendanceData.filter(r => r.year === selectedYear)
  const sortedAttendance = [...filteredAttendance].sort((a, b) => b.month - a.month)

  if (childrenLoading) return <LoadingSpinner />

  if (myChildren.length === 0) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-800 mb-1">No Children Connected</h2>
          <p className="text-sm text-gray-500">Please connect your children first from the dashboard.</p>
          <button onClick={() => navigate('/my-children')} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            <ArrowLeftIcon className="w-4 h-4" /> Go to My Children
          </button>
        </div>
      </div>
    )
  }

  const overallStatus = summary ? getStatusBadge(summary.overallPercentage) : { color: '', label: '' }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/my-children')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Attendance Record</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your child's daily attendance</p>
        </div>
      </div>

      {/* Student Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
        <div className="flex flex-wrap gap-2">
          {myChildren.map((child) => {
            const childId = child._id || child.studentId
            const isSelected = selectedChild?._id === child._id || selectedChild?.studentId === child.studentId
            const isLoadingStudent = loadingChildId === childId
            
            return (
              <button
                key={childId}
                onClick={() => handleChildSelect(child)}
                disabled={isLoadingStudent}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-2 ${
                  isSelected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isLoadingStudent ? 'opacity-50 cursor-wait' : ''}`}
              >
                {isLoadingStudent ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {child.fullName?.charAt(0) || child.studentName?.charAt(0) || 'S'}
                  </div>
                )}
                {child.fullName || child.studentName}
              </button>
            )
          })}
        </div>
      </div>

      {/* Attendance Content */}
      {selectedChild && (
        <div>
          {/* Student Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-700 font-semibold text-base">
                  {selectedChild.fullName?.charAt(0) || selectedChild.studentName?.charAt(0) || 'S'}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{selectedChild.fullName || selectedChild.studentName}</h2>
                <p className="text-xs text-gray-500">Class: {selectedChild.className || 'N/A'} | Roll: {selectedChild.rollNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading attendance records...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Working Days</p>
                    <p className="text-lg font-bold text-gray-900">{summary.totalDays}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Present</p>
                    <p className="text-lg font-bold text-emerald-600">{summary.totalPresent}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Absent</p>
                    <p className="text-lg font-bold text-rose-600">{summary.totalAbsent}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">Overall</p>
                    <div>
                      <p className="text-lg font-bold text-emerald-600">{summary.overallPercentage.toFixed(1)}%</p>
                      <span className={`inline-block px-1.5 py-0.5 text-xs rounded-full ${overallStatus.color}`}>{overallStatus.label}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Year Filter */}
              {availableYears.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-3 flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Year:</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500">
                      {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>
                  </div>
                  <button onClick={() => loadAttendance(selectedChild?._id || selectedChild?.studentId)} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50">
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attendance Table */}
              {sortedAttendance.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-800 mb-1">No Records</h3>
                  <p className="text-sm text-gray-500">No attendance records for {selectedYear}</p>
                </div>
              ) : (
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
                        {sortedAttendance.map((record, idx) => {
                          const percentage = record.percentage || 0
                          const status = getStatusBadge(percentage)
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatMonth(record.year, record.month)} {record.year}</td>
                              <td className="px-3 py-2 text-center text-sm text-gray-600">{record.totalWorkingDays}</td>
                              <td className="px-3 py-2 text-center text-sm text-emerald-600 font-medium">{record.presentDays}</td>
                              <td className="px-3 py-2 text-center text-sm text-rose-600">{record.absentDays}</td>
                              <td className="px-3 py-2 text-center"><span className={`text-sm font-medium ${percentage >= 75 ? 'text-emerald-600' : percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{percentage.toFixed(1)}%</span></td>
                              <td className="px-3 py-2 text-center"><span className={`inline-block px-2 py-0.5 text-xs rounded-md ${status.color}`}>{status.label}</span></td>
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
                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium text-emerald-600">{summary.overallPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 rounded-full h-2 transition-all" style={{ width: `${summary.overallPercentage}%` }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default MyChildAttendancePage