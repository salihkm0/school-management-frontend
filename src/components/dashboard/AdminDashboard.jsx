// src/components/dashboard/AdminDashboard.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { fetchAdminDashboard, updateStats, addActivity } from '../../store/slices/dashboardSlice'
import useSocket from '../../hooks/useSocket'
import LoadingSpinner from '../common/LoadingSpinner'

// Heroicons
import {
  UsersIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  TrophyIcon,
  UserPlusIcon,
  BellIcon,
  BoltIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChartPieIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  FlagIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

// Chart Colors
const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#84cc16']

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, suffix = "" }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[120px]">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-gray-900">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{suffix}</span>
        </p>
      ))}
    </div>
  )
}

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

// Quick Action Button
const QuickAction = ({ action, onClick }) => {
  const Icon = action.icon
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-all group"
    >
      <div className={`w-10 h-10 rounded-xl ${action.bgColor} bg-opacity-10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
        <Icon className={`h-5 w-5 ${action.iconColor}`} />
      </div>
      <span className="text-xs font-medium text-gray-700 text-center line-clamp-1">{action.label}</span>
    </button>
  )
}

// Upcoming Events Component
const UpcomingEvents = ({ events = [] }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700'
      case 'medium': return 'bg-amber-100 text-amber-700'
      case 'low': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Exam': return <BookOpenIcon className="w-3 h-3" />
      case 'Meeting': return <UserGroupIcon className="w-3 h-3" />
      case 'Event': return <FlagIcon className="w-3 h-3" />
      case 'Holiday': return <CalendarIcon className="w-3 h-3" />
      default: return <CalendarIcon className="w-3 h-3" />
    }
  }

  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Upcoming Events</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">School calendar events</p>
        </div>
        <div className="px-4 py-8 text-center">
          <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No upcoming events</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Upcoming Events</h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">School calendar events</p>
      </div>
      <div className="divide-y divide-gray-100">
        {events.slice(0, 5).map((event, index) => (
          <div key={event.id || index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                    {getTypeIcon(event.type)}
                    {event.type}
                  </span>
                  <span className="text-xs text-gray-400">{event.daysLeft} days left</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-medium text-gray-900">Recent Activities</h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Latest updates from your school</p>
      </div>
      <div className="divide-y divide-gray-100">
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

// Pending Tasks Component
const PendingTasks = ({ tasks }) => {
  const taskItems = [
    { key: 'exams', label: 'Pending Exams', icon: BookOpenIcon, color: 'bg-purple-100 text-purple-600' },
    { key: 'duties', label: 'Pending Duties', icon: BriefcaseIcon, color: 'bg-amber-100 text-amber-600' },
    { key: 'attendance', label: 'Pending Attendance', icon: CalendarIcon, color: 'bg-blue-100 text-blue-600' },
  ]

  const total = (tasks?.exams || 0) + (tasks?.duties || 0) + (tasks?.attendance || 0)

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Pending Tasks</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Items requiring attention</p>
        </div>
        <div className="px-4 py-8 text-center">
          <CheckCircleIcon className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No pending tasks</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BellIcon className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Pending Tasks</h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Items requiring attention</p>
      </div>
      <div className="p-4 space-y-3">
        {taskItems.map((item) => {
          const count = tasks?.[item.key] || 0
          if (count === 0) return null
          const Icon = item.icon
          return (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{count}</span>
            </div>
          )
        })}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Pending</span>
            <span className="text-lg font-bold text-amber-600">{total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gender Distribution Chart
const GenderDistribution = ({ gender }) => {
  const data = [
    { name: 'Male', value: gender?.male || 0, color: '#3b82f6' },
    { name: 'Female', value: gender?.female || 0, color: '#ec4899' },
    { name: 'Other', value: gender?.other || 0, color: '#a855f7' },
  ].filter(item => item.value > 0)

  const total = (gender?.male || 0) + (gender?.female || 0) + (gender?.other || 0)

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Gender Distribution</h2>
          <p className="text-xs text-gray-500 mt-0.5">Student demographics</p>
        </div>
        <div className="p-8 text-center">
          <ChartPieIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Gender Distribution</h2>
        <p className="text-xs text-gray-500 mt-0.5">Student demographics</p>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} students`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Category Distribution
const CategoryDistribution = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Category Distribution</h2>
          <p className="text-xs text-gray-500 mt-0.5">Student categories</p>
        </div>
        <div className="p-8 text-center">
          <ChartBarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    )
  }

  const total = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Category Distribution</h2>
        <p className="text-xs text-gray-500 mt-0.5">Student categories</p>
      </div>
      <div className="p-4 space-y-3">
        {categories.map((cat, idx) => (
          <div key={cat._id}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 font-medium">{cat._id}</span>
              <span className="text-gray-700">{cat.count} students ({((cat.count / total) * 100).toFixed(1)}%)</span>
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                style={{ width: `${(cat.count / total) * 100}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Dashboard Component
const AdminDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { adminData: dashboardData, isLoading, error, lastUpdated } = useSelector((state) => state.dashboard || {})
  const { user } = useSelector((state) => state.auth || {})
  const { socket, isConnected } = useSocket()
  const [activeChart, setActiveChart] = useState('subjects')
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

  // Extract data from API response
  const summary = dashboardData?.summary || {}
  const demographics = dashboardData?.demographics || {}
  const recentActivities = dashboardData?.recentActivities || []
  const pendingTasks = dashboardData?.pendingTasks || {}
  const upcomingEvents = dashboardData?.upcomingEvents || []
  const examPerformance = dashboardData?.examPerformance || {}
  const topClasses = dashboardData?.topClasses || []
  const academicYear = dashboardData?.academicYear || {}
  
  // Real data from API for charts
  const subjectPerformance = dashboardData?.subjectPerformance || []
  const classDistribution = dashboardData?.classDistribution || []
  const gradeDistribution = dashboardData?.gradeDistribution || []

  const statConfigs = [
    { key: 'totalStudents', label: 'Total Students', icon: UsersIcon, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', gradient: 'from-blue-500 to-blue-600', animation: 'animate-fade-up stagger-1' },
    { key: 'totalStaff', label: 'Total Staff', icon: UserGroupIcon, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-600', animation: 'animate-fade-up stagger-2' },
    { key: 'totalClasses', label: 'Total Classes', icon: AcademicCapIcon, bgColor: 'bg-purple-50', iconColor: 'text-purple-600', gradient: 'from-purple-500 to-purple-600', animation: 'animate-fade-up stagger-3' },
    { key: 'currentExams', label: 'Active Exams', icon: BookOpenIcon, bgColor: 'bg-amber-50', iconColor: 'text-amber-600', gradient: 'from-amber-500 to-amber-600', animation: 'animate-fade-up stagger-4' },
    { key: 'attendancePercentage', label: 'Attendance Rate', icon: CalendarIcon, bgColor: 'bg-teal-50', iconColor: 'text-teal-600', gradient: 'from-teal-500 to-teal-600', animation: 'animate-fade-up stagger-5', suffix: '%' },
    { key: 'fullAPlusCount', label: 'A+ Students', icon: TrophyIcon, bgColor: 'bg-rose-50', iconColor: 'text-rose-600', gradient: 'from-rose-500 to-rose-600', animation: 'animate-fade-up stagger-6' },
  ]

  const quickActions = [
    { label: 'Add Student', icon: UserPlusIcon, path: '/students/new', bgColor: 'bg-blue-500', iconColor: 'text-blue-600' },
    { label: 'Add Staff', icon: UserGroupIcon, path: '/staff/new', bgColor: 'bg-emerald-500', iconColor: 'text-emerald-600' },
    { label: 'Create Exam', icon: BookOpenIcon, path: '/exams/new', bgColor: 'bg-purple-500', iconColor: 'text-purple-600' },
    { label: 'Mark Attendance', icon: CalendarIcon, path: '/attendance/bulk', bgColor: 'bg-amber-500', iconColor: 'text-amber-600' },
    { label: 'Generate Report', icon: ChartBarIcon, path: '/reports', bgColor: 'bg-rose-500', iconColor: 'text-rose-600' },
    { label: 'Send Notice', icon: BellIcon, path: '/notifications/send', bgColor: 'bg-indigo-500', iconColor: 'text-indigo-600' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Refresh Indicator */}
      {showRefreshIndicator && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          Dashboard updated
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0] || 'Admin'}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {academicYear?.name || 'Academic Year'} • Here's what's happening with your school today.
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">Last updated: {new Date(lastUpdated).toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              Reconnecting...
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {statConfigs.map((config, i) => {
          let value = summary[config.key]
          if (config.key === 'attendancePercentage') {
            value = parseFloat(summary.attendancePercentage) || 0
          }
          return (
            <StatCard 
              key={config.key} 
              config={config} 
              value={value || 0}
              trend={null}
            />
          )
        })}
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Average Attendance</p>
            <CalendarIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900">{parseFloat(summary.attendancePercentage || 0).toFixed(1)}%</p>
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-emerald-500 rounded-full h-1.5 transition-all" style={{ width: `${Math.min(parseFloat(summary.attendancePercentage || 0), 100)}%` }} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{summary.attendanceToday || 0} students present today</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Pass Percentage</p>
            <ChartBarIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900">{Number(examPerformance.passPercentage || 0).toFixed(1)}%</p>
          <div className="flex items-center gap-1 mt-1">
            {examPerformance.trend === 'up' ? (
              <ArrowUpIcon className="w-3 h-3 text-emerald-500" />
            ) : examPerformance.trend === 'down' ? (
              <ArrowDownIcon className="w-3 h-3 text-rose-500" />
            ) : (
              <MinusIcon className="w-3 h-3 text-gray-500" />
            )}
            <span className={`text-xs ${examPerformance.trend === 'up' ? 'text-emerald-600' : examPerformance.trend === 'down' ? 'text-rose-600' : 'text-gray-500'}`}>
              vs last term
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 rounded-full h-1.5 transition-all" style={{ width: `${Math.min(examPerformance.passPercentage || 0, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Top Performers (A+)</p>
            <TrophyIcon className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900">{Number(examPerformance.topPerformers || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">students achieved A+ grade</p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Chart Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Chart Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex gap-1 p-1 min-w-max">
                {[
                  { id: 'subjects', label: 'Subject Performance', icon: ChartBarIcon },
                  { id: 'distribution', label: 'Class Distribution', icon: ChartPieIcon },
                  { id: 'grades', label: 'Grade Distribution', icon: TrophyIcon },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveChart(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                        activeChart === tab.id
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {/* Subject Performance - Bar Chart */}
              {activeChart === 'subjects' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
                  {subjectPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={subjectPerformance} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <YAxis type="category" dataKey="subjectName" width={70} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip suffix="%" />} />
                        <Bar dataKey="averageScore" fill="#6366f1" name="Score (%)" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-gray-500 text-sm">
                      No subject performance data available. Results will appear once exams are published.
                    </div>
                  )}
                </div>
              )}

              {/* Class Distribution - Pie Chart */}
              {activeChart === 'distribution' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Class-wise Student Distribution</h3>
                  {classDistribution.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <ResponsiveContainer width="55%" height={220}>
                        <PieChart>
                          <Pie
                            data={classDistribution}
                            dataKey="studentCount"
                            nameKey="className"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {classDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} students`, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {classDistribution.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-xs text-gray-600 truncate flex-1">{item.className}</span>
                            <span className="text-xs font-semibold text-gray-900">{item.studentCount}</span>
                            <span className="text-xs text-gray-400">({item.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">
                      No class distribution data available.
                    </div>
                  )}
                </div>
              )}

              {/* Grade Distribution - Bar Chart */}
              {activeChart === 'grades' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Grade Distribution</h3>
                  {gradeDistribution.length > 0 ? (
                    <div className="space-y-3">
                      {gradeDistribution.map((grade, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">Grade {grade.grade}</span>
                            <div className="flex gap-3">
                              <span className="text-gray-700">{grade.count} students</span>
                              <span className="text-gray-400">({grade.percentage}%)</span>
                            </div>
                          </div>
                          <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                              style={{ width: `${grade.percentage}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Total Students Graded</p>
                            <p className="text-base font-bold text-gray-900">
                              {gradeDistribution.reduce((sum, g) => sum + g.count, 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Pass Percentage</p>
                            <p className="text-base font-bold text-emerald-600">
                              {gradeDistribution
                                .filter(g => !['F', 'D'].includes(g.grade))
                                .reduce((sum, g) => sum + g.count, 0) / gradeDistribution.reduce((sum, g) => sum + g.count, 0) * 100 || 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
                      No grade distribution data available.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BoltIcon className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Common tasks at your fingertips</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <QuickAction key={index} action={action} onClick={() => navigate(action.path)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics & Tasks Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <GenderDistribution gender={demographics.gender} />
        <CategoryDistribution categories={demographics.category} />
        <PendingTasks tasks={pendingTasks} />
      </div>

      {/* Top Classes & Upcoming Events */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top Performing Classes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Top Performing Classes</h2>
            <p className="text-xs text-gray-500 mt-0.5">Based on exam results</p>
          </div>
          <div className="divide-y divide-gray-100">
            {topClasses.length > 0 ? (
              topClasses.slice(0, 5).map((classItem, index) => (
                <div key={classItem.classId || index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-300 w-6">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{classItem.className}</p>
                      <p className="text-xs text-gray-500">{classItem.studentCount} students</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-emerald-600">{Number(classItem.averagePercentage || 0).toFixed(1)}%</p>
                    <div className="w-24 bg-gray-100 rounded-full h-1 mt-1">
                      <div className="bg-emerald-500 rounded-full h-1" style={{ width: `${Math.min(classItem.averagePercentage || 0, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">No class performance data available</div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <UpcomingEvents events={upcomingEvents} />
      </div>

      {/* Recent Activities */}
      <RecentActivities activities={recentActivities} isLoading={isLoading} />
    </div>
  )
}

export default AdminDashboard