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
  ArrowRightIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import useSocket from '../../hooks/useSocket'
import { fetchStaffDashboard, updateStats, addActivity } from '../../store/slices/dashboardSlice'
import LoadingSpinner from '../common/LoadingSpinner'

const StaffDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { staffData: dashboardData, isLoading, error } = useSelector((state) => state.dashboard || {})
  const { user } = useSelector((state) => state.auth || {})
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    dispatch(fetchStaffDashboard())
    const interval = setInterval(() => {
      dispatch(fetchStaffDashboard())
    }, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    if (socket && isConnected) {
      const handleDashboardUpdate = (data) => {
        dispatch(updateStats(data))
      }
      socket.on('dashboard:updated', handleDashboardUpdate)
      socket.emit('subscribe:dashboard')
      return () => {
        socket.off('dashboard:updated', handleDashboardUpdate)
      }
    }
  }, [socket, isConnected, dispatch])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
      case 'medium': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
      case 'low': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
      default: return 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20'
    }
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'class': return <BookOpenIcon className="w-4 h-4" />
      case 'meeting': return <UserGroupIcon className="w-4 h-4" />
      case 'duty': return <BriefcaseIcon className="w-4 h-4" />
      default: return <CalendarIcon className="w-4 h-4" />
    }
  }

  if (isLoading && !dashboardData) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">Unable to Load Dashboard</h3>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => dispatch(fetchStaffDashboard())} className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const staffInfo = dashboardData?.staffInfo || {}
  const quickStats = dashboardData?.quickStats || { classesTaught: 0, subjectsTaught: 0, totalStudents: 0, pendingTasks: 0 }
  const todaySchedule = dashboardData?.todaySchedule || []
  const pendingTasks = dashboardData?.pendingTasks || []
  const upcomingDuties = dashboardData?.upcomingDuties || []
  const classTeacherInfo = dashboardData?.classTeacherInfo || null

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Welcome Banner - Responsive */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-4 sm:p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">
              {greeting()}, {staffInfo.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Teacher'}!
            </h1>
            <p className="text-emerald-100 text-sm mt-0.5">Staff Code: {staffInfo.staffCode || 'N/A'}</p>
          </div>
          {!isConnected && (
            <div className="bg-amber-500/20 text-amber-100 px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1 w-fit">
              <ExclamationCircleIcon className="w-3 h-3" />
              Reconnecting...
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats - Responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Classes Today</p>
              <p className="text-xl font-bold text-gray-900">{quickStats.classesTaught || 0}</p>
            </div>
            <BookOpenIcon className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Students</p>
              <p className="text-xl font-bold text-gray-900">{quickStats.totalStudents || 0}</p>
            </div>
            <UserGroupIcon className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{quickStats.pendingTasks || 0}</p>
            </div>
            <ClipboardDocumentListIcon className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Attendance</p>
              <p className="text-xl font-bold text-gray-900">{classTeacherInfo?.averageAttendance || 0}%</p>
            </div>
            <CheckCircleIcon className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-900">Today's Schedule</h2>
            <button onClick={() => navigate('/attendance/timetable')} className="text-xs text-emerald-600 hover:text-emerald-700">
              View All →
            </button>
          </div>
          <div className="p-4 space-y-2">
            {todaySchedule.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No classes scheduled for today</div>
            ) : (
              todaySchedule.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    item.type === 'class' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.subject}</p>
                    <p className="text-xs text-gray-500 truncate">{item.className} • {item.time}</p>
                    {item.room && <p className="text-xs text-gray-400 truncate">Room: {item.room}</p>}
                  </div>
                  {item.type === 'class' && (
                    <button onClick={() => navigate(`/attendance?classId=${item.classId}`)} className="text-xs text-emerald-600 hover:text-emerald-700 whitespace-nowrap">
                      Mark
                    </button>
                  )}
                </div>
              ))
            )}
            {todaySchedule.length > 4 && (
              <button onClick={() => navigate('/attendance/timetable')} className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1">
                +{todaySchedule.length - 4} more
              </button>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-900">Pending Tasks</h2>
            <span className="text-xs text-gray-500">{pendingTasks.length} tasks</span>
          </div>
          <div className="p-4 space-y-2">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No pending tasks! Great job!</div>
            ) : (
              pendingTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(task.link)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 truncate">{task.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Deadline: {task.deadline}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              ))
            )}
            {pendingTasks.length > 3 && (
              <button className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 py-2 mt-2">
                View all {pendingTasks.length} tasks →
              </button>
            )}
          </div>
        </div>

        {/* Upcoming Duties */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-900">Upcoming Duties</h2>
            <button onClick={() => navigate('/duties')} className="text-xs text-emerald-600 hover:text-emerald-700">
              View All →
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingDuties.length === 0 ? (
                <div className="col-span-full text-center py-6 text-sm text-gray-500">No upcoming duties assigned</div>
              ) : (
                upcomingDuties.slice(0, 3).map((duty) => (
                  <div key={duty.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-amber-700">{duty.type}</span>
                      <span className="text-xs text-gray-500">{duty.shift}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{duty.location}</p>
                    <p className="text-xs text-amber-600 mt-2">📅 {new Date(duty.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
            {upcomingDuties.length > 3 && (
              <button onClick={() => navigate('/duties')} className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 py-3 mt-2">
                View all {upcomingDuties.length} duties →
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions for Staff */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => navigate('/attendance')} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <CalendarIcon className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-xs font-medium text-gray-700">Mark Attendance</span>
              </button>
              <button onClick={() => navigate('/exams/marks')} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <ClipboardDocumentListIcon className="w-6 h-6 text-purple-500 mb-2" />
                <span className="text-xs font-medium text-gray-700">Enter Marks</span>
              </button>
              <button onClick={() => navigate('/classes/timetable')} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <BookOpenIcon className="w-6 h-6 text-emerald-500 mb-2" />
                <span className="text-xs font-medium text-gray-700">View Schedule</span>
              </button>
              <button onClick={() => navigate('/reports')} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-amber-500 mb-2" />
                <span className="text-xs font-medium text-gray-700">Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Info Card */}
      {staffInfo.name && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Staff Information</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-500">Name</p>
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
                <p className="text-xs text-gray-500">Contact</p>
                <p className="text-sm font-medium text-gray-900">{staffInfo.phone || staffInfo.email || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffDashboard