import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { fetchDutyStats } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { ChartBarIcon, UserGroupIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'

const DutyStats = () => {
  const dispatch = useDispatch()
  const [stats, setStats] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [staffList, setStaffList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    loadStaff()
  }, [])

  useEffect(() => {
    loadStats()
  }, [selectedStaff, selectedYear, selectedMonth])

  const loadStaff = async () => {
    try {
      const res = await dispatch(fetchStaff({ limit: 100 }))
      setStaffList(res.payload?.data || [])
    } catch (error) {
      console.error('Failed to load staff:', error)
    }
  }

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const params = {}
      if (selectedStaff) params.staffId = selectedStaff
      if (selectedYear) params.year = selectedYear
      if (selectedMonth) params.month = selectedMonth
      
      const res = await dispatch(fetchDutyStats(params))
      setStats(res.payload)
    } catch (error) { 
      console.error('Failed to load stats:', error)
    }
    finally { setIsLoading(false) }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duty Statistics</h1>
        <p className="text-gray-500 mt-1">View duty assignment analytics and reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Staff Member</label>
            <select 
              value={selectedStaff} 
              onChange={(e) => setSelectedStaff(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">All Staff</option>
              {staffList.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">{stats.summary?.totalDuties || 0}</p>
                  <p className="text-sm opacity-80">Total Duties</p>
                </div>
                <ChartBarIcon className="w-8 h-8 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">{stats.summary?.totalStaff || 0}</p>
                  <p className="text-sm opacity-80">Staff Involved</p>
                </div>
                <UserGroupIcon className="w-8 h-8 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">{stats.summary?.totalHours || 0}</p>
                  <p className="text-sm opacity-80">Total Hours</p>
                </div>
                <ClockIcon className="w-8 h-8 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">{stats.summary?.averagePerStaff || 0}</p>
                  <p className="text-sm opacity-80">Avg per Staff</p>
                </div>
                <CalendarIcon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          </div>

          {/* Staff-wise Distribution Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold">Staff-wise Duty Distribution</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Duties</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(stats.staffStats || {}).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No duty data available
                      </td>
                    </tr>
                  ) : (
                    Object.entries(stats.staffStats || {}).map(([id, data]) => (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{data.staffName}</td>
                        <td className="px-6 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {data.totalDuties}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center text-gray-600">{data.totalHours}</td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(data.byType || {}).map(([type, count]) => (
                              <span key={type} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {type}: {count}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Duties */}
          {stats.recentDuties && stats.recentDuties.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold">Recent Duty Assignments</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.recentDuties.slice(0, 10).map((duty, idx) => (
                  <div key={idx} className="px-6 py-3 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{duty.staffName}</p>
                        <p className="text-sm text-gray-500 capitalize">{duty.dutyType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {duty.duties?.length} day{duty.duties?.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(duty.assignedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DutyStats