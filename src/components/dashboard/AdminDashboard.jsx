// src/components/dashboard/AdminDashboard.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import StatsCards from './StatsCards'
import RecentActivities from './RecentActivities'
import AdminCharts from './AdminCharts'
import QuickActions from './QuickActions'
import { fetchAdminDashboard, updateStats, addActivity } from '../../store/slices/dashboardSlice'
import useSocket from '../../hooks/useSocket'
import { 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'

const safeNumber = (value, defaultValue = 0, decimals = 1) => {
  if (value === null || value === undefined) return defaultValue
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return defaultValue
  return decimals ? num.toFixed(decimals) : num
}

const safeNumberValue = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? defaultValue : num
}

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const { adminData: dashboardData, isLoading, error, lastUpdated } = useSelector((state) => state.dashboard || {})
  const { user } = useSelector((state) => state.auth || {})
  const { socket, isConnected } = useSocket()
  
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(() => loadDashboardData(true), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    if (socket && isConnected) {
      const handleDashboardUpdate = (data) => {
        dispatch(updateStats(data))
        setShowRefreshIndicator(true)
        setTimeout(() => setShowRefreshIndicator(false), 3000)
      }

      const handleNewActivity = (activity) => {
        const formattedActivity = {
          id: activity._id || activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.activityType || activity.type,
          severity: activity.severity,
          timestamp: activity.createdAt || activity.timestamp,
          performedBy: activity.performedBy,
          performedByRole: activity.performedByRole
        }
        dispatch(addActivity(formattedActivity))
      }

      socket.on('dashboard:updated', handleDashboardUpdate)
      socket.on('activity:created', handleNewActivity)
      socket.emit('subscribe:dashboard')

      return () => {
        socket.off('dashboard:updated', handleDashboardUpdate)
        socket.off('activity:created', handleNewActivity)
      }
    }
  }, [socket, isConnected, dispatch])

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      await dispatch(fetchAdminDashboard())
    } else {
      try {
        await dispatch(fetchAdminDashboard()).unwrap()
        setShowRefreshIndicator(true)
        setTimeout(() => setShowRefreshIndicator(false), 2000)
      } catch (error) {
        console.error('Silent refresh failed:', error)
      }
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (isLoading && !dashboardData) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">Unable to Load Dashboard</h3>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => loadDashboardData()} className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const summary = dashboardData?.summary || {
    totalStudents: 0, totalStaff: 0, totalClasses: 0, currentExams: 0,
    attendancePercentage: 0, fullAPlusCount: 0
  }

  const attendancePercentage = safeNumberValue(summary.attendancePercentage, 0)
  const attendancePercentageFormatted = safeNumber(summary.attendancePercentage, 0, 1)
  const examPerformance = dashboardData?.examPerformance || { passPercentage: 0, trend: 'stable', topPerformers: 0 }
  const topClasses = dashboardData?.topClasses || []

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Refresh Indicator */}
      {showRefreshIndicator && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          Dashboard updated
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {greeting()}, {user?.name?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your school today.</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">Last updated: {new Date(lastUpdated).toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadDashboardData(true)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          {!isConnected && (
            <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs flex items-center gap-1">
              <ExclamationTriangleIcon className="w-3 h-3" />
              Reconnecting...
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={{
        totalStudents: safeNumberValue(summary.totalStudents),
        totalStaff: safeNumberValue(summary.totalStaff),
        totalClasses: safeNumberValue(summary.totalClasses),
        currentExams: safeNumberValue(summary.currentExams),
        attendanceToday: attendancePercentageFormatted,
        fullAPlusCount: safeNumberValue(summary.fullAPlusCount),
      }} isLoading={isLoading} />

      {/* Performance Metrics - Mobile responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Average Attendance</p>
            <CalendarIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900">{attendancePercentageFormatted}%</p>
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-emerald-500 rounded-full h-1.5 transition-all" style={{ width: `${Math.min(attendancePercentage, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Pass Percentage</p>
            <ChartBarIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900">{safeNumber(examPerformance.passPercentage, 0, 1)}%</p>
          <div className="flex items-center gap-1 mt-1">
            {examPerformance.trend === 'up' ? (
              <ArrowTrendingUpIcon className="w-3 h-3 text-emerald-500" />
            ) : examPerformance.trend === 'down' ? (
              <ArrowTrendingDownIcon className="w-3 h-3 text-rose-500" />
            ) : null}
            <span className={`text-xs ${examPerformance.trend === 'up' ? 'text-emerald-600' : examPerformance.trend === 'down' ? 'text-rose-600' : 'text-gray-500'}`}>
              vs last term
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 rounded-full h-1.5 transition-all" style={{ width: `${Math.min(safeNumberValue(examPerformance.passPercentage), 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Top Performers (A+)</p>
            <TrophyIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900">{safeNumberValue(examPerformance.topPerformers)}</p>
          <p className="text-xs text-gray-400 mt-2">students achieved A+ grade</p>
        </div>
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AdminCharts />
        </div>
        <div className="lg:col-span-1">
          <QuickActions userRole="admin" />
        </div>
      </div>

      {/* Top Performing Classes */}
      {topClasses && topClasses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Top Performing Classes</h2>
            <p className="text-xs text-gray-500 mt-0.5">Based on exam results</p>
          </div>
          <div className="divide-y divide-gray-100">
            {topClasses.slice(0, 5).map((classItem, index) => (
              <div key={classItem.classId || index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-300 w-6">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{classItem.className}</p>
                    <p className="text-xs text-gray-500">{safeNumberValue(classItem.studentCount)} students</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-emerald-600">{safeNumber(classItem.averagePercentage, 0, 1)}%</p>
                  <div className="w-24 bg-gray-100 rounded-full h-1 mt-1">
                    <div className="bg-emerald-500 rounded-full h-1" style={{ width: `${Math.min(safeNumberValue(classItem.averagePercentage), 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Events */}
        <RecentActivities />
      </div>
    </div>
  )
}

export default AdminDashboard