// src/pages/staff/StaffAttendancePage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  Calendar,
  Users,
  Search,
  RefreshCw,
  Edit2,
  X,
  Check,
  Download,
  Filter
} from 'lucide-react'
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
  const { isLoading: attendanceLoading } = useSelector((state) => state.attendance) // Fix: Add this line
  
  const [myClasses, setMyClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [summary, setSummary] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [attendanceData, setAttendanceData] = useState({})
  const [isSaving, setIsSaving] = useState(false)

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
  }, [teacherClassTeacherClasses, classIdFromUrl, selectedClass])

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
    
    if (!currentAcademicYear) return
    
    try {
      await dispatch(fetchTeacherClassTeacherClasses({ 
        teacherId: staffId, 
        academicYearId: currentAcademicYear._id 
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
    let absentDays = value === "" ? "" : parseInt(value);
    if (typeof absentDays === 'number' && !isNaN(absentDays)) {
      if (absentDays < 0) absentDays = 0;
      if (absentDays > workingDays) absentDays = workingDays;
    }
    const presentDays = absentDays === "" ? workingDays : workingDays - absentDays;
    
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
        const absentDays = (studentAttendance?.absentDays !== undefined && studentAttendance?.absentDays !== "") ? studentAttendance.absentDays : 0
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
      const successCount = Array.isArray(result.results?.success) ? result.results.success.length : (result.results?.success || 0);
      
      if (successCount > 0) {
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
    
    const newData = {}
    summary?.studentDetails?.forEach(student => {
      newData[student.studentId] = {
        absentDays: validAbsent,
        presentDays: workingDays - validAbsent,
        totalWorkingDays: workingDays
      }
    })
    setAttendanceData(newData)
    toast.success(`Set all students to ${validAbsent} absent day${validAbsent !== 1 ? 's' : ''}`)
  }

  const filteredStudents = summary?.studentDetails?.filter(student =>
    student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const exportToExcel = () => {
    if (!summary?.studentDetails) return
    
    const exportData = summary.studentDetails.map(student => {
      const workingDaysVal = summary.workingDays || summary.template?.totalWorkingDays || 25
      const presentDays = attendanceData[student.studentId]?.presentDays || student.presentDays || 0
      const percentage = (presentDays / workingDaysVal) * 100
      
      return {
        'Student Name': student.studentName,
        'Roll Number': student.rollNumber,
        'Admission No': student.admissionNo,
        'Working Days': workingDaysVal,
        'Present Days': presentDays,
        'Absent Days': attendanceData[student.studentId]?.absentDays || student.absentDays || 0,
        'Attendance Percentage': `${percentage.toFixed(1)}%`,
        'Status': percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : 'Poor'
      }
    })
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Attendance_${selectedClass?.name}_${selectedMonth}_${selectedYear}`)
    XLSX.writeFile(wb, `attendance_${selectedClass?.name}_${selectedMonth}_${selectedYear}.xlsx`)
    toast.success('Attendance exported successfully')
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
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-emerald-500" />
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

  const workingDays = summary?.workingDays || summary?.template?.totalWorkingDays || 25

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 rounded-xl p-2.5">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Attendance Management</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage student attendance for your class</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Attendance</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadAttendanceData()
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  loadSummary()
                  loadAttendanceData()
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Class Selection */}
        {myClasses.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-700">Select Class</h2>
              <span className="text-xs text-gray-400">{myClasses.length} class{myClasses.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {myClasses.map((cls) => (
                <button
                  key={cls._id}
                  onClick={() => {
                    setSelectedClass(cls)
                    setIsEditing(false)
                    setSearchTerm('')
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedClass?._id === cls._id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  {cls.displayName || `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`}
                  {cls.studentCount !== undefined && (
                    <span className={`ml-2 text-xs ${selectedClass?._id === cls._id ? 'text-emerald-100' : 'text-gray-400'}`}>
                      ({cls.studentCount})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters Card */}
        {selectedClass && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Month</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => {
                      setSelectedMonth(parseInt(e.target.value))
                      setIsEditing(false)
                    }} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Year</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value))
                      setIsEditing(false)
                    }} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Working Days</label>
                  <input
                    type="number" onWheel={(e) => e.target.blur()}
                    value={workingDays}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                   />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={exportToExcel}
                    disabled={!summary?.studentDetails?.length}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions - Only in Edit Mode */}
              {isEditing && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Quick Actions</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSetAll(0, workingDays)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                    >
                      All Present (0 absent)
                    </button>
                    <button
                      onClick={() => handleSetAll(2, workingDays)}
                      className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-100 transition-colors"
                    >
                      2 Days Absent
                    </button>
                    <button
                      onClick={() => handleSetAll(5, workingDays)}
                      className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors"
                    >
                      5 Days Absent
                    </button>
                    <button
                      onClick={() => handleSetAll(workingDays, workingDays)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                    >
                      All Absent ({workingDays} days)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {summary && !loadingSummary && selectedClass && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalStudents || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Average Attendance</p>
              <p className="text-2xl font-semibold text-emerald-600">{summary.averageAttendance || 0}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Working Days</p>
              <p className="text-2xl font-semibold text-gray-900">{workingDays}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Good Standing</p>
              <p className="text-2xl font-semibold text-emerald-600">{summary.goodStanding || 0}</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {summary?.studentDetails?.length > 0 && selectedClass && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, roll number, or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(loadingSummary || attendanceLoading) && <LoadingSpinner />}

        {/* Attendance Table */}
        {!loadingSummary && summary?.studentDetails && summary.studentDetails.length > 0 && selectedClass && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.map((student, idx) => {
                    const studentAttendance = attendanceData[student.studentId]
                    const absentDays = studentAttendance?.absentDays !== undefined ? studentAttendance.absentDays : ""
                    const presentDays = workingDays - (absentDays === "" ? 0 : absentDays)
                    const percentage = (presentDays / workingDays) * 100
                    const statusColor = percentage >= 75 ? 'bg-emerald-50 text-emerald-700' : percentage >= 60 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                    const statusText = percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : 'Poor'
                    
                    return (
                      <tr key={student.studentId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{student.admissionNo}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">{workingDays}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="text-sm font-medium text-emerald-600">{presentDays}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {isEditing ? (
                            <input
                              type="number" onWheel={(e) => e.target.blur()}
                              value={absentDays}
                              onChange={(e) => handleAbsentChange(student.studentId, e.target.value, workingDays)}
                              className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              min="0"
                              max={workingDays}
                            />
                          ) : (
                            <span className="text-sm text-gray-700">{absentDays}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`text-sm font-medium ${percentage >= 75 ? 'text-emerald-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* No Results Message */}
            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No students found matching your search</p>
              </div>
            )}
          </div>
        )}

        {/* No Data Message */}
        {!loadingSummary && selectedClass && summary?.studentDetails?.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Students Found
            </h3>
            <p className="text-gray-500 text-sm">
              No students are enrolled in this class.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffAttendancePage