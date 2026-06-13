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
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedClass) {
      setLoadingStudents(true)
      dispatch(fetchStudents({ classId: selectedClass, limit: 1000 })).finally(() => {
        setLoadingStudents(false)
      })
      setAttendanceData({})
      setTemplate(null)
      setCurrentPage(1)
    }
  }, [dispatch, selectedClass])

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
      
      if (response.template) {
        setTemplate(response.template)
        setTotalWorkingDays(response.template.totalWorkingDays)
        setHolidays(response.template.holidays || [])
      } else {
        setTemplate(null)
        setTotalWorkingDays(response.workingDays || 25)
      }
      
      const workingDaysVal = response.workingDays || totalWorkingDays || 25
      
      const existingData = {}
      if (response.attendance && response.attendance.length > 0) {
        response.attendance.forEach(record => {
          const studentId = record.studentId?._id || record.studentId
          if (studentId) {
            existingData[studentId] = {
              absentDays: record.absentDays || 0,
              presentDays: record.presentDays || 0,
              totalWorkingDays: record.totalWorkingDays || workingDaysVal,
              isNewRecord: record.isNewRecord || false
            }
          }
        })
      }
      
      const completeData = {}
      students.forEach(student => {
        if (existingData[student._id]) {
          completeData[student._id] = existingData[student._id]
        } else {
          completeData[student._id] = {
            absentDays: "",
            presentDays: workingDaysVal,
            totalWorkingDays: workingDaysVal
          }
        }
      })
      
      setAttendanceData(completeData)
    } catch (error) {
      console.error('Failed to load existing attendance:', error)
      const defaultData = {}
      students.forEach(student => {
        defaultData[student._id] = {
          absentDays: "",
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
    let absentDays = value === "" ? "" : parseInt(value)
    if (typeof absentDays === 'number' && !isNaN(absentDays)) {
      absentDays = Math.min(Math.max(absentDays, 0), totalWorkingDays)
    }
    const presentDays = absentDays === "" ? totalWorkingDays : totalWorkingDays - absentDays
    
    setAttendanceData(prev => ({ 
      ...prev, 
      [studentId]: { 
        absentDays,
        presentDays,
        totalWorkingDays
      } 
    }))
  }

  const handleSetAll = (absentDays) => {
    const validAbsent = Math.min(Math.max(absentDays, 0), totalWorkingDays)
    const presentDays = totalWorkingDays - validAbsent
    const newData = {}
    students.forEach(student => {
      newData[student._id] = { absentDays: validAbsent, presentDays: presentDays, totalWorkingDays }
    })
    setAttendanceData(newData)
    toast.success(`Set all students to ${validAbsent} absent days, ${presentDays} present days`)
  }

  const handleSubmit = async () => {
    if (!selectedClass) {
      toast.error('Please select a class')
      return
    }

    const currentAcademicYear = academicYears.find(y => y.isCurrent)
    const selectedClassData = classes.find(c => c._id === selectedClass)
    const academicYearId = currentAcademicYear?._id || selectedClassData?.academicYearId

    if (!academicYearId) {
      toast.error('Academic year not found')
      return
    }

    const attendanceList = students.map(s => {
      const absentDays = (attendanceData[s._id]?.absentDays !== undefined && attendanceData[s._id]?.absentDays !== "") ? attendanceData[s._id].absentDays : 0
      return {
        studentId: s._id,
        studentName: s.fullName,
        classId: selectedClass,
        academicYearId: academicYearId,
        year: selectedYear,
        month: selectedMonth,
        totalWorkingDays: totalWorkingDays,
        absentDays: absentDays,
        presentDays: totalWorkingDays - absentDays,
        holidays: holidays.filter(h => h.name && h.date)
      }
    })
    
    setIsSubmitting(true)
    setResult(null)
    
    try {
      const response = await dispatch(bulkCreateAttendance(attendanceList)).unwrap()
      setResult(response.results)
      
      const successCount = Array.isArray(response.results?.success) ? response.results.success.length : (response.results?.success || 0);
      if (response.results?.failed?.length > 0) {
        toast.error(`${response.results.failed.length} records failed`)
      }
      
      await loadExistingAttendance()
    } catch (error) { 
      console.error('Failed to save attendance:', error)
      toast.error(error.response?.data?.message || 'Failed to save attendance')
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const downloadTemplate = () => {
    const headers = ['Student Code', 'Student Name', 'Roll Number', 'Absent Days']
    const rows = students.map(s => [s.studentCode || '', s.fullName || '', s.rollNumber || '', attendanceData[s._id]?.absentDays || 0])
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
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

  const currentStudents = filteredStudents

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) }))
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

  if (loadingStudents || (selectedClass && studentsLoading)) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <button
          onClick={() => { setSelectedClass(''); setAttendanceData({}); setResult(null); setSearchTerm(''); setCurrentPage(1); }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Reset</span>
        </button>
        <button
          onClick={downloadTemplate}
          disabled={!selectedClass || students.length === 0}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          <span>Download Template</span>
        </button>
      </div>

      {/* Filters Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class *</label>
            <select 
              value={selectedClass} 
              onChange={(e) => { setSelectedClass(e.target.value); setCurrentPage(1); }} 
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">Select Class</option>
              {classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))} 
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              {months.map(m => (<option key={m.value} value={m.value}>{m.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              {years.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
        </div>

        {/* Working Days Display */}
        {selectedClass && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Working Days:</span>
              <span className="font-semibold text-gray-900">{totalWorkingDays} days</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {selectedClass && students.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-600 mb-2">Quick Actions</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleSetAll(0)} className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors">All Present</button>
              <button onClick={() => handleSetAll(2)} className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors">2 Days Absent</button>
              <button onClick={() => handleSetAll(5)} className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors">5 Days Absent</button>
              <button onClick={() => handleSetAll(10)} className="px-3 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded-md hover:bg-rose-200 transition-colors">10 Days Absent</button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total Students</p>
            <p className="text-xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">With Data</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalStudentsWithData}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Avg Attendance</p>
            <p className="text-xl font-bold text-emerald-600">{stats.avgAttendance.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Search */}
      {selectedClass && students.length > 0 && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, roll number, or student code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Result Summary */}
      {result && (result.success?.length > 0 || result.failed?.length > 0) && (
        <div className={`rounded-lg p-3 ${result.failed?.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
          <div className="flex items-center gap-2">
            {result.failed?.length > 0 ? (
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
            ) : (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            )}
            <span className="text-sm font-medium">
              {result.success?.length || 0} records saved
              {result.failed?.length > 0 && `, ${result.failed.length} failed`}
            </span>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {selectedClass && students.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent Days</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present Days</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentStudents.map((student, idx) => {
                  const absent = attendanceData[student._id]?.absentDays !== undefined ? attendanceData[student._id].absentDays : ""
                  const present = totalWorkingDays - (absent === "" ? 0 : absent)
                  const percentage = totalWorkingDays > 0 ? (present / totalWorkingDays) * 100 : 0
                  const percentageColor = percentage >= 75 ? 'text-emerald-600' : percentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                  
                  return (
                    <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-xs text-gray-500">{student.studentCode}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number" onWheel={(e) => e.target.blur()}
                          value={absent}
                          onChange={(e) => handleAbsentChange(student._id, e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          min="0"
                          max={totalWorkingDays}
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-emerald-600 font-medium">{present}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-sm font-medium ${percentageColor}`}>{percentage.toFixed(1)}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2"><LoadingSpinner size="sm" /> Saving...</span>
              ) : (
                'Save All Records'
              )}
            </button>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No students found in this class</p>
        </div>
      ) : null}

      {isLoading && <LoadingSpinner />}
    </div>
  )
}

export default BulkAttendance