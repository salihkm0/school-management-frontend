// src/pages/staff/StaffAttendancePage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  PencilIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchTeacherClassTeacherClasses, clearTeacherClasses } from '../../store/slices/classSlice'
import { fetchAttendanceSummary, bulkCreateAttendance, fetchAttendanceByClass } from '../../store/slices/attendanceSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const StaffAttendancePage = () => {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const classIdFromUrl = searchParams.get('classId')
  const { user } = useSelector((state) => state.auth)
  const { staff, isLoading: staffLoading } = useSelector((state) => state.staff)
  const { teacherClassTeacherClasses, isLoading: classesLoading } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { classAttendance, isLoading: attendanceLoading } = useSelector((state) => state.attendance)
  
  const [myClasses, setMyClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [summary, setSummary] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [attendanceData, setAttendanceData] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const itemsPerPage = 20

  useEffect(() => {
    loadData()
    return () => {
      dispatch(clearTeacherClasses())
    }
  }, [dispatch])

  useEffect(() => {
    if (academicYears.length > 0) {
      const currentYear = academicYears.find(y => y.isCurrent)
      setCurrentAcademicYear(currentYear)
    }
  }, [academicYears])

  useEffect(() => {
    if (staff.length > 0 && user && currentAcademicYear) {
      getMyClassTeacherClasses()
    }
  }, [staff, user, currentAcademicYear])

  useEffect(() => {
    if (teacherClassTeacherClasses.length > 0) {
      setMyClasses(teacherClassTeacherClasses)
      
      if (classIdFromUrl) {
        const classFromUrl = teacherClassTeacherClasses.find(c => c._id === classIdFromUrl)
        if (classFromUrl) {
          setSelectedClass(classFromUrl)
        } else if (teacherClassTeacherClasses.length > 0 && !selectedClass) {
          setSelectedClass(teacherClassTeacherClasses[0])
        }
      } else if (teacherClassTeacherClasses.length > 0 && !selectedClass) {
        setSelectedClass(teacherClassTeacherClasses[0])
      }
    }
  }, [teacherClassTeacherClasses, classIdFromUrl])

  useEffect(() => {
    if (selectedClass) {
      loadSummary()
      loadAttendanceData()
    }
  }, [selectedClass, selectedMonth, selectedYear])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        dispatch(fetchStaff({ limit: 100 })),
        dispatch(fetchAcademicYears({ limit: 10 }))
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMyClassTeacherClasses = async () => {
    const currentStaff = staff.find(s => {
      const staffUserId = s.userId?._id || s.userId
      return staffUserId === user?.id
    })
    
    if (!currentStaff) return
    
    const staffId = currentStaff._id
    
    try {
      await dispatch(fetchTeacherClassTeacherClasses({ 
        teacherId: staffId, 
        academicYearId: currentAcademicYear?._id 
      })).unwrap()
    } catch (error) {
      console.error('Failed to fetch teacher classes:', error)
    }
  }

  const loadSummary = async () => {
    if (!selectedClass) return
    setLoadingSummary(true)
    try {
      const res = await dispatch(fetchAttendanceSummary({ 
        classId: selectedClass._id, 
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

  const loadAttendanceData = async () => {
    if (!selectedClass) return
    try {
      const response = await dispatch(fetchAttendanceByClass({ 
        classId: selectedClass._id, 
        year: selectedYear, 
        month: selectedMonth 
      })).unwrap()
      
      const workingDaysVal = response.workingDays || summary?.workingDays || 25
      
      const existingData = {}
      if (response.attendance && response.attendance.length > 0) {
        response.attendance.forEach(record => {
          const studentId = record.studentId?._id || record.studentId
          if (studentId) {
            existingData[studentId] = {
              absentDays: record.absentDays || 0,
              presentDays: record.presentDays || workingDaysVal - (record.absentDays || 0),
              totalWorkingDays: record.totalWorkingDays || workingDaysVal
            }
          }
        })
      }
      
      setAttendanceData(existingData)
    } catch (error) {
      console.error('Failed to load attendance data:', error)
    }
  }

  const handleAbsentChange = (studentId, value, workingDays) => {
    let absentDays = parseInt(value) || 0
    if (absentDays < 0) absentDays = 0
    if (absentDays > workingDays) absentDays = workingDays
    const presentDays = workingDays - absentDays
    
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        absentDays,
        presentDays,
        totalWorkingDays: workingDays
      }
    }))
  }

  const handleSaveAttendance = async () => {
    if (!selectedClass) return
    
    setIsSaving(true)
    try {
      const workingDaysVal = summary?.workingDays || 25
      const currentAcademicYearData = currentAcademicYear || academicYears.find(y => y.isCurrent)
      
      if (!currentAcademicYearData) {
        toast.error('Academic year not found')
        return
      }
      
      const attendanceList = summary?.studentDetails?.map(student => {
        const studentAttendance = attendanceData[student.studentId]
        const absentDays = studentAttendance?.absentDays !== undefined ? studentAttendance.absentDays : 0
        const presentDays = workingDaysVal - absentDays
        
        return {
          studentId: student.studentId,
          studentName: student.studentName,
          classId: selectedClass._id,
          academicYearId: currentAcademicYearData._id,
          year: selectedYear,
          month: selectedMonth,
          totalWorkingDays: workingDaysVal,
          absentDays: absentDays,
          presentDays: presentDays,
          holidays: summary?.template?.holidays || []
        }
      })
      
      const result = await dispatch(bulkCreateAttendance(attendanceList)).unwrap()
      
      if (result.results?.success?.length > 0) {
        toast.success(`Saved ${result.results.success.length} attendance records`)
        setIsEditing(false)
        await loadSummary()
        await loadAttendanceData()
      } else {
        toast.error('Failed to save attendance records')
      }
    } catch (error) {
      console.error('Failed to save attendance:', error)
      toast.error(error.response?.data?.message || 'Failed to save attendance')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetAll = (absentDays, workingDays) => {
    let validAbsent = parseInt(absentDays) || 0
    if (validAbsent < 0) validAbsent = 0
    if (validAbsent > workingDays) validAbsent = workingDays
    const presentDays = workingDays - validAbsent
    
    const newData = {}
    summary?.studentDetails?.forEach(student => {
      newData[student.studentId] = {
        absentDays: validAbsent,
        presentDays: presentDays,
        totalWorkingDays: workingDays
      }
    })
    setAttendanceData(newData)
    toast.success(`Set all students to ${validAbsent} absent days`)
  }

  const filteredStudents = summary?.studentDetails?.filter(student =>
    student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)

  const exportToExcel = () => {
    if (!summary?.studentDetails) return
    
    const exportData = summary.studentDetails.map(student => ({
      'Student Name': student.studentName,
      'Roll Number': student.rollNumber,
      'Admission No': student.admissionNo,
      'Working Days': summary.workingDays || summary.template?.totalWorkingDays,
      'Present Days': attendanceData[student.studentId]?.presentDays || student.presentDays || 0,
      'Absent Days': attendanceData[student.studentId]?.absentDays || student.absentDays || 0,
      'Attendance Percentage': `${((attendanceData[student.studentId]?.presentDays || student.presentDays || 0) / (summary.workingDays || summary.template?.totalWorkingDays || 1) * 100).toFixed(1)}%`,
      'Status': ((attendanceData[student.studentId]?.presentDays || student.presentDays || 0) / (summary.workingDays || summary.template?.totalWorkingDays || 1) * 100) >= 75 ? 'Good' : 
                 ((attendanceData[student.studentId]?.presentDays || student.presentDays || 0) / (summary.workingDays || summary.template?.totalWorkingDays || 1) * 100) >= 60 ? 'Average' : 'Poor'
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Attendance_${selectedClass?.name}_${selectedMonth}_${selectedYear}`)
    XLSX.writeFile(wb, `attendance_${selectedClass?.name}_${selectedMonth}_${selectedYear}.xlsx`)
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ 
    value: i + 1, 
    name: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) 
  }))
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  if (isLoading || staffLoading || classesLoading) {
    return <LoadingSpinner />
  }

  if (myClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Classes Assigned
            </h3>
            <p className="text-gray-500">
              You are not assigned as a class teacher for any class.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const workingDays = summary?.workingDays || summary?.template?.totalWorkingDays || 25

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-xl p-3">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Attendance Management</h1>
                <p className="text-primary-100 mt-1">
                  Manage attendance for your class (Class Teacher)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit Attendance</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadAttendanceData()
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  loadSummary()
                  loadAttendanceData()
                }}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Selection */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">My Class</h2>
          <div className="flex flex-wrap gap-3">
            {myClasses.map((cls) => (
              <button
                key={cls._id}
                onClick={() => {
                  setSelectedClass(cls)
                  setIsEditing(false)
                }}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedClass?._id === cls._id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {cls.displayName || `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {/* Month/Year Selection */}
        {selectedClass && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value))
                    setIsEditing(false)
                  }} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value))
                    setIsEditing(false)
                  }} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                <input
                  type="number"
                  value={workingDays}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={exportToExcel}
                  disabled={!summary?.studentDetails?.length}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  Export to Excel
                </button>
              </div>
            </div>

            {isEditing && (
              <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSetAll(0, workingDays)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                  >
                    All Present (0 absent)
                  </button>
                  <button
                    onClick={() => handleSetAll(2, workingDays)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200"
                  >
                    2 Days Absent
                  </button>
                  <button
                    onClick={() => handleSetAll(5, workingDays)}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200"
                  >
                    5 Days Absent
                  </button>
                  <button
                    onClick={() => handleSetAll(workingDays, workingDays)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                  >
                    All Absent ({workingDays} days)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Summary */}
        {summary && !loadingSummary && selectedClass && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-blue-700">{summary.totalStudents || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Average Attendance</p>
              <p className="text-2xl font-bold text-green-700">{summary.averageAttendance || 0}%</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
              <p className="text-sm text-yellow-600 font-medium">Working Days</p>
              <p className="text-2xl font-bold text-yellow-700">{workingDays}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-600 font-medium">Good Standing</p>
              <p className="text-2xl font-bold text-purple-700">{summary.goodStanding || 0}</p>
            </div>
          </div>
        )}

        {/* Search */}
        {summary?.studentDetails?.length > 0 && selectedClass && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, roll number, or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-10 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {(loadingSummary || attendanceLoading) && <LoadingSpinner />}

        {/* Attendance Table */}
        {!loadingSummary && summary?.studentDetails && summary.studentDetails.length > 0 && selectedClass && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Working Days</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentStudents.map((student, index) => {
                    const studentAttendance = attendanceData[student.studentId]
                    const absentDays = studentAttendance?.absentDays !== undefined ? studentAttendance.absentDays : (student.absentDays || 0)
                    const presentDays = workingDays - absentDays
                    const percentage = (presentDays / workingDays) * 100
                    const statusColor = percentage >= 75 ? 'bg-green-100 text-green-800' : percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : percentage > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    const statusText = percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : percentage > 0 ? 'Poor' : 'Not Recorded'
                    
                    return (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{indexOfFirstItem + index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                          <div className="text-xs text-gray-500">{student.admissionNo}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">{workingDays}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-green-600 font-medium">{presentDays}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={absentDays}
                              onChange={(e) => handleAbsentChange(student.studentId, e.target.value, workingDays)}
                              className="w-20 px-2 py-1 border rounded-lg text-center focus:ring-2 focus:ring-primary-500"
                              min="0"
                              max={workingDays}
                            />
                          ) : (
                            <span className="text-sm text-red-600">{absentDays}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`text-sm font-medium ${percentage >= 75 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {percentage.toFixed(1)}%
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
        )}

        {/* No Data Message */}
        {!loadingSummary && selectedClass && summary?.studentDetails?.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Students Found
            </h3>
            <p className="text-gray-500">
              No students are enrolled in this class.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffAttendancePage