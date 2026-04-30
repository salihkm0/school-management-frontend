import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAttendanceSummary } from '../../store/slices/attendanceSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'

const AttendanceSummary = () => {
  const dispatch = useDispatch()
  const { summary, isLoading } = useSelector((state) => state.attendance)
  const { classes } = useSelector((state) => state.classes)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedClass) {
      dispatch(fetchAttendanceSummary({ 
        classId: selectedClass, 
        year: selectedYear,
        month: selectedMonth || undefined
      }))
    }
  }, [dispatch, selectedClass, selectedYear, selectedMonth])

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const months = [
    { value: '', name: 'Full Year' },
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ]

  const getStatusBadge = (percentage) => {
    if (percentage >= 75) return 'bg-green-100 text-green-800'
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Summary</h1>
          <p className="text-gray-500 mt-1">View attendance analytics and reports</p>
        </div>
        <button
          onClick={() => {
            setSelectedClass('')
            setSelectedYear(new Date().getFullYear())
            setSelectedMonth('')
          }}
          className="flex items-center space-x-2 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)} 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select Class</option>
          {classes.map(c => (
            <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
          ))}
        </select>
        
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : '')} 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Template Info */}
      {summary?.template && (
        <div className="bg-blue-50 rounded-lg p-4 flex items-start space-x-3">
          <CalendarIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <span className="font-medium">Template: {summary.template.name}</span> • 
            Working Days: {summary.workingDays} • 
            Holidays: {summary.holidaysCount} 
            {summary.holidays?.length > 0 && (
              <span className="block text-xs text-blue-600 mt-1">
                Holidays: {summary.holidays.map(h => h.name).join(', ')}
              </span>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : summary ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <UserGroupIcon className="w-8 h-8 opacity-50" />
                <span className="text-2xl font-bold">{summary.totalStudents || 0}</span>
              </div>
              <p className="mt-2 text-sm opacity-90">Total Students</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <ChartBarIcon className="w-8 h-8 opacity-50" />
                <span className="text-2xl font-bold">{summary.averageAttendance || 0}%</span>
              </div>
              <p className="mt-2 text-sm opacity-90">Average Attendance</p>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <CheckCircleIcon className="w-8 h-8 opacity-50" />
                <span className="text-2xl font-bold">{summary.goodStanding || 0}</span>
              </div>
              <p className="mt-2 text-sm opacity-90">Good Standing (&gt;75%)</p>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <ExclamationTriangleIcon className="w-8 h-8 opacity-50" />
                <span className="text-2xl font-bold">{summary.needsAttention || 0}</span>
              </div>
              <p className="mt-2 text-sm opacity-90">Needs Attention (&lt;60%)</p>
            </div>
          </div>

          {/* Monthly Trend (only for full year view) */}
          {!selectedMonth && Object.keys(summary.monthlySummary || {}).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance Trend</h2>
              <div className="space-y-3">
                {Object.entries(summary.monthlySummary).map(([month, data]) => (
                  <div key={month}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{new Date(2000, parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' })}</span>
                      <span className="font-medium">{data.averagePercentage?.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 rounded-full h-2 transition-all duration-500" 
                        style={{ width: `${data.averagePercentage || 0}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Details Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Student-wise Attendance</h2>
              <p className="text-sm text-gray-500 mt-1">
                Working Days: {summary.workingDays} | Holidays: {summary.holidaysCount}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Holidays</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.studentDetails?.map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{student.admissionNo || '-'}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-center text-sm text-green-600 font-medium">{student.presentDays}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-center text-sm text-red-600">{student.absentDays}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-center text-sm text-blue-600">{student.holidaysCount}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <span className={`text-sm font-medium ${student.percentage >= 75 ? 'text-green-600' : student.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {student.percentage > 0 ? `${student.percentage.toFixed(1)}%` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(student.percentage)}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No attendance data available for this selection</p>
        </div>
      ) : null}
    </div>
  )
}

export default AttendanceSummary