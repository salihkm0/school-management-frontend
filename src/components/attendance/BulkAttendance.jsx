// src/components/attendance/BulkAttendance.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchStudents } from '../../store/slices/studentSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { bulkCreateAttendance, fetchAttendanceByClass } from '../../store/slices/attendanceSlice'
import { 
  ArrowDownTrayIcon,
  ArrowPathIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const BulkAttendance = () => {
  const dispatch = useDispatch()
  const { classes } = useSelector((state) => state.classes)
  const { students, isLoading: studentsLoading } = useSelector((state) => state.students)
  const { academicYears } = useSelector((state) => state.academicYears)
  
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [attendanceData, setAttendanceData] = useState({})
  const [totalWorkingDays, setTotalWorkingDays] = useState(25)
  const [holidays, setHolidays] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [result, setResult] = useState(null)
  const [template, setTemplate] = useState(null)
  const [loadingStudents, setLoadingStudents] = useState(false)

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  // Load students when class changes
  useEffect(() => {
    if (selectedClass) {
      setLoadingStudents(true)
      dispatch(fetchStudents({ classId: selectedClass, limit: 1000 })).finally(() => {
        setLoadingStudents(false)
      })
      setAttendanceData({})
      setTemplate(null)
    }
  }, [dispatch, selectedClass])

  // Load existing attendance data when class/month/year changes AND students are loaded
  useEffect(() => {
    if (selectedClass && selectedMonth && selectedYear && students.length > 0) {
      loadExistingAttendance()
    }
  }, [selectedClass, selectedMonth, selectedYear, students.length])

  const loadExistingAttendance = async () => {
    setIsLoading(true)
    try {
      const response = await dispatch(fetchAttendanceByClass({ 
        classId: selectedClass, 
        year: selectedYear, 
        month: selectedMonth 
      })).unwrap()
      
      console.log('API Response:', response)
      
      // Get template info from response root
      if (response.template) {
        setTemplate(response.template)
        setTotalWorkingDays(response.template.totalWorkingDays)
        setHolidays(response.template.holidays || [])
      } else {
        setTemplate(null)
        setTotalWorkingDays(response.workingDays || 25)
      }
      
      const workingDaysVal = response.workingDays || totalWorkingDays || 25
      
      // Create a map of existing attendance records
      const existingData = {}
      if (response.attendance && response.attendance.length > 0) {
        response.attendance.forEach(record => {
          const studentId = record.studentId?._id || record.studentId
          if (studentId) {
            // Use absentDays from record (which should be 0 if not entered)
            let absentDays = record.absentDays || 0
            let presentDays = record.presentDays || 0
            
            existingData[studentId] = {
              absentDays: absentDays,
              presentDays: presentDays,
              totalWorkingDays: record.totalWorkingDays || workingDaysVal,
              isNewRecord: record.isNewRecord || false
            }
          }
        })
      }
      
      // Initialize data for ALL students
      const completeData = {}
      students.forEach(student => {
        if (existingData[student._id]) {
          // Use existing data if available
          completeData[student._id] = existingData[student._id]
        } else {
          // Default: ALL PRESENT (0 absent, workingDays present) for new entries
          completeData[student._id] = {
            absentDays: 0,
            presentDays: workingDaysVal,
            totalWorkingDays: workingDaysVal
          }
        }
      })
      
      setAttendanceData(completeData)
      const dataCount = Object.keys(existingData).length
      console.log(`Loaded ${dataCount} existing records, initialized ${students.length} total students`)
    } catch (error) {
      console.error('Failed to load existing attendance:', error)
      toast.error('Failed to load attendance data')
      // Initialize with default values even on error
      const defaultData = {}
      students.forEach(student => {
        defaultData[student._id] = {
          absentDays: 0,
          presentDays: totalWorkingDays,
          totalWorkingDays: totalWorkingDays
        }
      })
      setAttendanceData(defaultData)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAbsentChange = (studentId, value) => {
    let absentDays = 0
    if (value !== '' && value !== null && value !== undefined) {
      absentDays = parseInt(value) || 0
    }
    // Ensure absentDays does not exceed totalWorkingDays
    const validAbsent = Math.min(Math.max(absentDays, 0), totalWorkingDays)
    const presentDays = totalWorkingDays - validAbsent
    
    setAttendanceData(prev => ({ 
      ...prev, 
      [studentId]: { 
        absentDays: validAbsent,
        presentDays: presentDays,
        totalWorkingDays
      } 
    }))
  }

  const handleSetAll = (absentDays) => {
    const validAbsent = Math.min(Math.max(absentDays, 0), totalWorkingDays)
    const presentDays = totalWorkingDays - validAbsent
    const newData = {}
    students.forEach(student => {
      newData[student._id] = { 
        absentDays: validAbsent, 
        presentDays: presentDays,
        totalWorkingDays
      }
    })
    setAttendanceData(newData)
    toast.success(`Set all students to ${validAbsent} absent days, ${presentDays} present days`)
  }

  const handleSubmit = async () => {
    if (!selectedClass) {
      toast.error('Please select a class')
      return
    }

    if (totalWorkingDays < 1 || totalWorkingDays > 31) {
      toast.error('Total working days must be between 1 and 31')
      return
    }

    const currentAcademicYear = academicYears.find(y => y.isCurrent);
    const selectedClassData = classes.find(c => c._id === selectedClass);
    const academicYearId = currentAcademicYear?._id || selectedClassData?.academicYearId;

    if (!academicYearId) {
      toast.error('Academic year not found. Please set up an academic year first.')
      return
    }

    // Build attendance list - use the actual absentDays from state
    const attendanceList = students.map(s => {
      const absentDays = attendanceData[s._id]?.absentDays !== undefined ? attendanceData[s._id].absentDays : 0
      const presentDays = totalWorkingDays - absentDays
      
      return {
        studentId: s._id,
        studentName: s.fullName,
        classId: selectedClass,
        academicYearId: academicYearId,
        year: selectedYear,
        month: selectedMonth,
        totalWorkingDays: totalWorkingDays,
        absentDays: absentDays,
        presentDays: presentDays,
        holidays: holidays.filter(h => h.name && h.date)
      }
    })
    
    console.log('Sending attendance list:', attendanceList)
    
    setIsSubmitting(true)
    setResult(null)
    
    try {
      const response = await dispatch(bulkCreateAttendance(attendanceList)).unwrap()
      setResult(response.results)
      
      if (response.results?.success?.length > 0) {
        toast.success(`Saved ${response.results.success.length} attendance records`)
      }
      if (response.results?.failed?.length > 0) {
        toast.error(`${response.results.failed.length} records failed`)
        console.error('Failed records:', response.results.failed)
      }
      
      // Reload data after save
      await loadExistingAttendance()
    } catch (error) { 
      console.error('Failed to save attendance:', error)
      toast.error(error.response?.data?.message || 'Failed to save attendance')
      setResult({ success: [], failed: [], warnings: [] })
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const downloadTemplate = () => {
    const headers = ['Student Code', 'Student Name', 'Roll Number', 'Absent Days']
    const rows = students.map(s => [
      s.studentCode || '',
      s.fullName || '',
      s.rollNumber || '',
      attendanceData[s._id]?.absentDays !== undefined ? attendanceData[s._id].absentDays : 0
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${selectedClass}_${selectedMonth}_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }

  const filteredStudents = students.filter(student =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentCode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const months = Array.from({ length: 12 }, (_, i) => ({ 
    value: i + 1, 
    name: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) 
  }))
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const getStats = () => {
    let totalPresent = 0
    let totalStudentsWithData = 0
    students.forEach(student => {
      const absent = attendanceData[student._id]?.absentDays || 0
      const present = totalWorkingDays - absent
      totalPresent += present
      if (attendanceData[student._id] !== undefined) totalStudentsWithData++
    })
    const totalPossibleDays = totalStudentsWithData * totalWorkingDays
    const avgAttendance = totalPossibleDays > 0 ? (totalPresent / totalPossibleDays) * 100 : 0
    return { totalPresent, avgAttendance, totalStudentsWithData }
  }

  const stats = getStats()

  // Show loading while students are being fetched
  if (loadingStudents || (selectedClass && studentsLoading)) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Attendance Entry</h1>
          <p className="text-gray-500 mt-1">Enter monthly attendance for all students in a class</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setSelectedClass('')
              setAttendanceData({})
              setResult(null)
              setSearchTerm('')
              setHolidays([])
              setTemplate(null)
            }}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={downloadTemplate}
            disabled={!selectedClass || students.length === 0}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Download Template</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class *</label>
            <select 
              value={selectedClass} 
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setAttendanceData({})
                setTemplate(null)
              }} 
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
            <input 
              type="number" 
              value={totalWorkingDays} 
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-50"
            />
          </div>
        </div>

        {/* Quick Actions */}
        {selectedClass && students.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSetAll(0)}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
              >
                All Present (0 absent)
              </button>
              <button
                onClick={() => handleSetAll(2)}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200"
              >
                2 Days Absent
              </button>
              <button
                onClick={() => handleSetAll(5)}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200"
              >
                5 Days Absent
              </button>
              <button
                onClick={() => handleSetAll(10)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
              >
                10 Days Absent
              </button>
              <button
                onClick={() => handleSetAll(totalWorkingDays)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
              >
                All Absent ({totalWorkingDays} days)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600">Total Students</p>
            <p className="text-2xl font-bold text-blue-700">{students.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600">Students with Data</p>
            <p className="text-2xl font-bold text-green-700">{stats.totalStudentsWithData}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-600">Average Attendance</p>
            <p className="text-2xl font-bold text-purple-700">{stats.avgAttendance.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Search */}
      {selectedClass && students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or student code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Result Summary */}
      {result && (result.success?.length > 0 || result.failed?.length > 0) && (
        <div className={`rounded-xl p-4 ${result.failed?.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center space-x-2">
            {result.failed?.length > 0 ? (
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            ) : (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            )}
            <span className="font-medium">
              {result.success?.length || 0} records saved successfully
              {result.failed?.length > 0 && `, ${result.failed.length} failed`}
              {result.warnings?.length > 0 && `, ${result.warnings.length} warnings`}
            </span>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {selectedClass && students.length === 0 && !loadingStudents && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No students found in this class. Please add students first.</p>
        </div>
      )}

      {selectedClass && students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent Days</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present Days</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student, idx) => {
                  const absent = attendanceData[student._id]?.absentDays !== undefined ? attendanceData[student._id].absentDays : 0
                  const present = totalWorkingDays - absent
                  const percentage = totalWorkingDays > 0 ? (present / totalWorkingDays) * 100 : 0
                  const percentageColor = percentage >= 75 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                  
                  return (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-xs text-gray-500">{student.studentCode}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <input
                          type="number"
                          value={absent}
                          onChange={(e) => handleAbsentChange(student._id, e.target.value)}
                          className="w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-primary-500"
                          min="0"
                          max={totalWorkingDays}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-green-600 font-medium">{present}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`font-medium ${percentageColor}`}>
                          {percentage.toFixed(1)}%
                        </span>
                       </td>
                     </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Submit Bar */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </span>
              ) : (
                'Save All Records'
              )}
            </button>
          </div>
        </div>
      )}

      {isLoading && <LoadingSpinner />}
    </div>
  )
}

export default BulkAttendance