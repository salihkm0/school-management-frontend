// src/components/dashboard/AdminDashboard.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import StatsCards from './StatsCards'
import RecentActivities from './RecentActivities'
import AdminCharts from './AdminCharts'
import QuickActions from './QuickActions'
import { fetchDashboardStats, updateStats, addActivity } from '../../store/slices/dashboardSlice'
import useSocket from '../../hooks/useSocket'
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  BookOpenIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const { stats, isLoading } = useSelector((state) => state.dashboard || { stats: {}, isLoading: false })
  const { user } = useSelector((state) => state.auth || {})
  const { socket, isConnected } = useSocket()
  
  const [pendingApprovals, setPendingApprovals] = useState({
    staffRequests: 3,
    parentRequests: 5,
    pendingPayments: 12
  })

  // School performance metrics
  const [schoolMetrics, setSchoolMetrics] = useState({
    averageAttendance: { value: 89, change: 5, trend: 'up' },
    passPercentage: { value: 87, change: 3, trend: 'up' },
    topPerformers: { value: 145, change: 12, trend: 'up' }
  })

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  // Socket listeners for real-time dashboard updates
  useEffect(() => {
    if (socket && isConnected) {
      const handleDashboardUpdate = (data) => {
        dispatch(updateStats(data))
      }

      const handleNewActivity = (activity) => {
        const formattedActivity = {
          id: activity._id || activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.activityType || activity.type,
          timestamp: activity.createdAt || activity.timestamp,
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

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const safeStats = stats || {
    totalStudents: 0,
    totalStaff: 0,
    totalClasses: 0,
    currentExams: 0,
    attendanceToday: 0,
    fullAPlusCount: 0,
    academicYear: null,
  }

  // Upcoming events data
  const upcomingEvents = [
    { id: 1, title: 'Parent-Teacher Meeting', date: '2024-01-20', type: 'Meeting', priority: 'high' },
    { id: 2, title: 'Final Exams Begin', date: '2024-01-25', type: 'Exam', priority: 'high' },
    { id: 3, title: 'Sports Day', date: '2024-01-30', type: 'Event', priority: 'medium' },
    { id: 4, title: 'Holiday - Republic Day', date: '2024-01-26', type: 'Holiday', priority: 'low' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting()}, {user?.name?.split(' ')[0] || 'Admin'}!
            </h1>
            <p className="text-gray-500 mt-1">
              Here's what's happening with your school today.
            </p>
          </div>
          {!isConnected && (
            <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Reconnecting...
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <StatsCards stats={safeStats} isLoading={isLoading} />

        {/* School Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Attendance */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Average Attendance</p>
              <CalendarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {schoolMetrics.averageAttendance.value}%
            </p>
            <div className="flex items-center gap-2 mt-2">
              {schoolMetrics.averageAttendance.trend === 'up' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${schoolMetrics.averageAttendance.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {schoolMetrics.averageAttendance.change}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${schoolMetrics.averageAttendance.value}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pass Percentage */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Pass Percentage</p>
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {schoolMetrics.passPercentage.value}%
            </p>
            <div className="flex items-center gap-2 mt-2">
              {schoolMetrics.passPercentage.trend === 'up' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${schoolMetrics.passPercentage.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {schoolMetrics.passPercentage.change}%
              </span>
              <span className="text-xs text-gray-400">vs last term</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${schoolMetrics.passPercentage.value}%` }}
                />
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Top Performers (A+)</p>
              <TrophyIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {schoolMetrics.topPerformers.value}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {schoolMetrics.topPerformers.trend === 'up' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${schoolMetrics.topPerformers.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {schoolMetrics.topPerformers.change}%
              </span>
              <span className="text-xs text-gray-400">vs last term</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AdminCharts />
          </div>
          <div className="lg:col-span-1">
            <QuickActions userRole="admin" />
          </div>
        </div>

        {/* Upcoming Events & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Important dates and deadlines</p>
                </div>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View Calendar →
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          event.priority === 'high' ? 'bg-red-100 text-red-700' :
                          event.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {event.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{event.type}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700">
                      <span className="text-sm">Details →</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <RecentActivities />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard