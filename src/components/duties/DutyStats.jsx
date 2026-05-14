// src/components/duties/DutyStats.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { fetchDutyStats } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CalendarIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'

const DutyStats = () => {
  const dispatch = useDispatch()
  const [stats, setStats] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [staffList, setStaffList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { loadStaff() }, [])
  useEffect(() => { loadStats() }, [selectedStaff, selectedYear, selectedMonth])

  const loadStaff = async () => {
    try {
      const res = await dispatch(fetchStaff({ limit: 100 }))
      setStaffList(res.payload?.data || [])
    } catch (error) { console.error('Failed to load staff:', error) }
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
    } catch (error) { console.error('Failed to load stats:', error) }
    finally { setIsLoading(false) }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const months = [
    { value: '', label: 'All Months' }, { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' }, { value: '5', label: 'May' },
    { value: '6', label: 'June' }, { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' }, { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]
  const hasActiveFilters = selectedStaff || selectedYear !== new Date().getFullYear() || selectedMonth

  const clearFilters = () => {
    setSelectedStaff('')
    setSelectedYear(new Date().getFullYear())
    setSelectedMonth('')
  }

  if (isLoading) return <LoadingSpinner />

  const getDutyTypeName = (type) => {
    const names = { exam: 'Exam', invigilation: 'Invigilation', supervision: 'Supervision', hall_monitor: 'Hall Monitor', security: 'Security', sports: 'Sports', arts: 'Arts', workshop: 'Workshop' }
    return names[type] || type
  }

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="">All Staff</option>
            {staffList.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
            {years.map(year => (<option key={year} value={year}>{year}</option>))}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
            {months.map(month => (<option key={month.value} value={month.value}>{month.label}</option>))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${showFilters || hasActiveFilters ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
              {[selectedStaff, selectedYear !== new Date().getFullYear(), selectedMonth].filter(Boolean).length}
            </span>}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between"><div><p className="text-xs text-gray-500">Total Duties</p><p className="text-xl font-bold text-gray-900">{stats.summary?.totalDuties || 0}</p></div><ChartBarIcon className="w-8 h-8 text-gray-300" /></div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between"><div><p className="text-xs text-gray-500">Staff Involved</p><p className="text-xl font-bold text-gray-900">{stats.summary?.totalStaff || 0}</p></div><UserGroupIcon className="w-8 h-8 text-gray-300" /></div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between"><div><p className="text-xs text-gray-500">Total Hours</p><p className="text-xl font-bold text-gray-900">{stats.summary?.totalHours || 0}</p></div><ClockIcon className="w-8 h-8 text-gray-300" /></div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between"><div><p className="text-xs text-gray-500">Average per Staff</p><p className="text-xl font-bold text-gray-900">{stats.summary?.averagePerStaff || 0}</p></div><CalendarIcon className="w-8 h-8 text-gray-300" /></div>
            </div>
          </div>

          {/* Staff-wise Distribution Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Staff-wise Duty Distribution</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff Name</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Total Duties</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">By Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(stats.staffStats || {}).length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">No duty data available</td></tr>
                  ) : (
                    Object.entries(stats.staffStats || {}).map(([id, data]) => (
                      <tr key={id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{data.staffName}</td>
                        <td className="px-3 py-2 text-center"><span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">{data.totalDuties}</span></td>
                        <td className="px-3 py-2 text-center text-sm text-gray-600">{data.totalHours}</td>
                        <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{Object.entries(data.byType || {}).map(([type, count]) => (<span key={type} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{getDutyTypeName(type)}: {count}</span>))}</div></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Duties */}
          {stats.recentDuties && stats.recentDuties.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Recent Duty Assignments</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.recentDuties.slice(0, 10).map((duty, idx) => (
                  <div key={idx} className="px-4 py-3 hover:bg-gray-50/50">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div><p className="text-sm font-medium text-gray-900">{duty.staffName}</p><p className="text-xs text-gray-500 capitalize">{getDutyTypeName(duty.dutyType)}</p></div>
                      <div className="text-right"><p className="text-sm text-gray-600">{duty.duties?.length} day{duty.duties?.length !== 1 ? 's' : ''}</p><p className="text-xs text-gray-400">{new Date(duty.assignedAt).toLocaleDateString()}</p></div>
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