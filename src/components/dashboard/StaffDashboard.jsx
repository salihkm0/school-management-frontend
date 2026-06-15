// src/components/dashboard/StaffDashboard.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpenIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BriefcaseIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  PlusCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  UsersIcon,
  DocumentTextIcon,
  BellIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import useSocket from '../../hooks/useSocket'
import { fetchStaffDashboard, updateStats, addActivity } from '../../store/slices/dashboardSlice'
import LoadingSpinner from '../common/LoadingSpinner'

// Stat Card Component
const StatCard = ({ config, value, trend }) => {
  const Icon = config.icon
  const display = config.unit === "₹"
    ? `₹${Number(value || 0).toLocaleString("en-IN")}`
    : config.suffix === '%'
    ? `${Number(value || 0).toFixed(1)}%`
    : Number(value || 0).toLocaleString()

  const TrendIcon = trend?.value > 0 ? ArrowUpIcon : trend?.value < 0 ? ArrowDownIcon : MinusIcon
  const trendColor = trend?.value > 0 ? "text-emerald-600" : trend?.value < 0 ? "text-rose-600" : "text-gray-500"

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${config.animation}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{config.label}</p>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${config.bgColor}`}>
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">{display}</div>
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-semibold mt-1 ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-400 font-normal ml-1">vs last month</span>
            </div>
          )}
        </div>
      </div>
      <div className={`h-0.5 bg-gradient-to-r ${config.gradient} w-0 hover:w-full transition-all duration-300`} />
    </div>
  )
}

// Recent Activities Component
const RecentActivities = ({ activities = [], isLoading = false }) => {
  const getActivityIcon = (type) => {
    const iconMap = {
      user_login: <UsersIcon className="w-4 h-4" />,
      user_logout: <UsersIcon className="w-4 h-4" />,
      student_added: <UsersIcon className="w-4 h-4" />,
      exam_created: <BookOpenIcon className="w-4 h-4" />,
      exam_published: <DocumentTextIcon className="w-4 h-4" />,
      attendance_marked: <CalendarIcon className="w-4 h-4" />,
      default: <BellIcon className="w-4 h-4" />,
    }
    return iconMap[type] || iconMap.default
  }

  const getActivityColor = (type) => {
    const colorMap = {
      user_login: 'bg-emerald-500',
      user_logout: 'bg-gray-500',
      student_added: 'bg-emerald-500',
      exam_created: 'bg-purple-500',
      exam_published: 'bg-amber-500',
      attendance_marked: 'bg-blue-500',
      default: 'bg-gray-500',
    }
    return colorMap[type] || colorMap.default
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now'
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-medium text-gray-900">Recent Activities</h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Latest updates</p>
      </div>
      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[400px]">
        {!activities || activities.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No recent activities</p>
            <p className="text-xs text-gray-400 mt-1">Activities will appear here as they happen</p>
          </div>
        ) : (
          activities.slice(0, 6).map((activity, index) => (
            <div key={activity.id || index} className="px-4 py-3 hover:bg-gray-50/50 transition-colors duration-150 group">
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${getActivityColor(activity.type)} rounded-full ring-2 ring-white`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{activity.title}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                      {activity.performedByRole || 'System'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{activity.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <ClockIcon className="w-3 h-3" />
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const StaffDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { staffData: dashboardData, isLoading, error, lastUpdated } = useSelector((state) => state.dashboard || {})
  const { socket, isConnected } = useSocket()
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(() => loadDashboardData(true), 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    if (socket && isConnected) {
      const handleDashboardUpdate = (data) => {
        dispatch(updateStats(data))
        setShowRefreshIndicator(true)
        setTimeout(() => setShowRefreshIndicator(false), 3000)
      }
      const handleNewActivity = (activity) => dispatch(addActivity(activity))
      
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
      await dispatch(fetchStaffDashboard())
    } else {
      try {
        await dispatch(fetchStaffDashboard()).unwrap()
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
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">Unable to Load Dashboard</h3>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => loadDashboardData()} className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Extract data from API response
  const staffInfo = dashboardData?.staffInfo || {}
  const classTeacherInfo = dashboardData?.classTeacherInfo || null
  const subjectClasses = dashboardData?.subjectClasses || []
  const recentActivities = dashboardData?.recentActivities || []
  const academicYear = dashboardData?.academicYear || {}

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Refresh Indicator */}
      {showRefreshIndicator && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          Dashboard updated
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-4 sm:p-5 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting()}, {staffInfo.name?.split(' ')[0] || 'Teacher'}! 👋
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Staff Code: {staffInfo.staffCode || 'N/A'} • {staffInfo.role ? staffInfo.role.charAt(0).toUpperCase() + staffInfo.role.slice(1) : 'Staff'}
            </p>
            {academicYear?.name && (
              <p className="text-emerald-100/80 text-xs mt-1">{academicYear.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            {!isConnected && (
              <div className="text-amber-200 text-xs inline-flex items-center gap-1 font-medium">
                <ExclamationCircleIcon className="w-4 h-4" />
                Reconnecting...
              </div>
            )}
            {lastUpdated && isConnected && (
              <div className="text-emerald-50 text-xs font-medium flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Class Assignments */}
      <div className="space-y-6">
        {classTeacherInfo && classTeacherInfo.class && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Class Teacher For</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl border border-emerald-100 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0"></div>
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <h3 className="text-xl font-bold text-gray-900">{classTeacherInfo.class.name}</h3>
                  <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">Class Teacher</div>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-3 relative z-10">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{classTeacherInfo.class.studentCount} Students</span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between relative z-10">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Avg Attendance</p>
                    <p className="text-sm font-semibold text-gray-700">{classTeacherInfo.averageAttendance}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Requests</p>
                    <p className="text-sm font-semibold text-gray-700">{classTeacherInfo.pendingParentRequests}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {subjectClasses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpenIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Subjects Taught</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {subjectClasses.map(cls => (
                <div key={cls.id} className="bg-white rounded-xl border border-blue-100 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0"></div>
                  <div className="flex items-center justify-between mb-2 relative z-10">
                    <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2 relative z-10">
                    {cls.subjects?.map((sub, idx) => (
                      <span key={idx} className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Main Area: Recent Activities & Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 flex flex-col">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <PlusCircleIcon className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Common tasks at your fingertips</p>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button onClick={() => navigate('/attendance')} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Mark Attendance</span>
                </button>
                <button onClick={() => navigate('/exams/marks')} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Enter Marks</span>
                </button>
                <button onClick={() => navigate('/classes/timetable')} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BookOpenIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">View Schedule</span>
                </button>
                <button onClick={() => navigate('/reports')} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ChartBarIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Reports</span>
                </button>
              </div>
            </div>
          </div>

          {/* Staff Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">Staff Information</h2>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{staffInfo.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Staff Code</p>
                  <p className="text-sm font-medium text-gray-900">{staffInfo.staffCode || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{staffInfo.role || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{staffInfo.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{staffInfo.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Subjects Taught</p>
                  <p className="text-sm font-medium text-gray-900">{dashboardData?.quickStats?.subjectsTaught || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Area: Recent Activities */}
        <div className="lg:col-span-1 h-[600px] flex">
          <RecentActivities activities={recentActivities} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard