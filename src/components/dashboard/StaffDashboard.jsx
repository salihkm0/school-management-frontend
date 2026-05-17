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
} from '@heroicons/react/24/outline'
import useSocket from '../../hooks/useSocket'
import { fetchStaffDashboard, updateStats, addActivity } from '../../store/slices/dashboardSlice'
import LoadingSpinner from '../common/LoadingSpinner'

const StaffDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { staffData: dashboardData, isLoading, error, lastUpdated } = useSelector((state) => state.dashboard || {})
  const { user } = useSelector((state) => state.auth || {})
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

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
      case 'medium': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
      case 'low': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
      default: return 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const quickStats = dashboardData?.quickStats || { classesTaught: 0, subjectsTaught: 0, totalStudents: 0, pendingTasks: 0 }
  const todaySchedule = dashboardData?.todaySchedule || []
  const pendingTasks = dashboardData?.pendingTasks || []
  const upcomingDuties = dashboardData?.upcomingDuties || []
  const recentActivities = dashboardData?.recentActivities || []
  const classTeacherInfo = dashboardData?.classTeacherInfo || null
  const academicYear = dashboardData?.academicYear || {}

  // Get class teacher classes
  const classTeacherClasses = classTeacherInfo?.classes || []
  const averageAttendance = classTeacherInfo?.averageAttendance || '0'
  const pendingParentRequests = classTeacherInfo?.pendingParentRequests || 0

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Refresh Indicator */}
      {showRefreshIndicator && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          Dashboard updated
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              {greeting()}, {staffInfo.name?.split(' ')[0] || 'Teacher'}! 👋
            </h1>
            <p className="text-emerald-100 text-sm mt-0.5">
              Staff Code: {staffInfo.staffCode || 'N/A'} • {staffInfo.role ? staffInfo.role.charAt(0).toUpperCase() + staffInfo.role.slice(1) : 'Staff'}
            </p>
            {academicYear?.name && (
              <p className="text-emerald-100/80 text-xs mt-1">{academicYear.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isConnected && (
              <div className="bg-amber-500/20 text-amber-100 px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" />
                Reconnecting...
              </div>
            )}
            {lastUpdated && (
              <div className="text-emerald-100/70 text-xs">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Classes Taught</p>
              <p className="text-2xl font-bold text-gray-900">{quickStats.classesTaught || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpenIcon className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{quickStats.subjectsTaught || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{quickStats.totalStudents || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending Tasks</p>
              <p className="text-2xl font-bold text-amber-600">{quickStats.pendingTasks || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Today's Schedule</h2>
            </div>
            <button onClick={() => navigate('/classes/timetable')} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {todaySchedule.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CalendarIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No classes scheduled for today</p>
                <p className="text-xs text-gray-400 mt-1">Enjoy your day off!</p>
              </div>
            ) : (
              todaySchedule.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <BookOpenIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.subject || 'Class'}</p>
                    <p className="text-xs text-gray-500">{item.className} • {item.time || 'Regular period'}</p>
                    {item.room && <p className="text-xs text-gray-400">Room: {item.room}</p>}
                  </div>
                  <button 
                    onClick={() => navigate(`/attendance?classId=${item.classId}`)} 
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
                  >
                    Mark Attendance
                  </button>
                </div>
              ))
            )}
            {todaySchedule.length > 4 && (
              <button onClick={() => navigate('/classes/timetable')} className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 py-2">
                +{todaySchedule.length - 4} more classes
              </button>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Pending Tasks</h2>
            </div>
            <span className="text-xs text-gray-500">{pendingTasks.length} tasks pending</span>
          </div>
          <div className="p-4 space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm text-gray-500">No pending tasks!</p>
                <p className="text-xs text-gray-400 mt-1">Great job staying on top of everything</p>
              </div>
            ) : (
              pendingTasks.slice(0, 3).map((task) => (
                <div 
                  key={task.id} 
                  className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-all hover:shadow-sm"
                  onClick={() => navigate(task.link)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-xs text-gray-400">📅 Deadline: {task.deadline}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
            {pendingTasks.length > 3 && (
              <button className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 py-2 font-medium">
                View all {pendingTasks.length} tasks →
              </button>
            )}
          </div>
        </div>

        {/* Upcoming Duties */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Upcoming Duties</h2>
            </div>
            <button onClick={() => navigate('/duties')} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            {upcomingDuties.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BriefcaseIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No upcoming duties assigned</p>
                <p className="text-xs text-gray-400 mt-1">You're all set!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingDuties.slice(0, 4).map((duty) => (
                  <div key={duty.id} className="p-3 bg-amber-50 rounded-xl border border-amber-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-amber-700 capitalize">{duty.type}</span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full capitalize">{duty.shift}</span>
                    </div>
                    <p className="text-xs text-gray-600">📍 {duty.location}</p>
                    <p className="text-xs text-amber-600 mt-2">📅 {formatDate(duty.date)}</p>
                    <span className="inline-block mt-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full capitalize">
                      {duty.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {upcomingDuties.length > 4 && (
              <button onClick={() => navigate('/duties')} className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 py-3 mt-3 font-medium">
                View all {upcomingDuties.length} duties →
              </button>
            )}
          </div>
        </div>

        {/* Class Teacher Info */}
        {classTeacherClasses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">Class Teacher Responsibilities</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Classes you're responsible for</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {classTeacherClasses.map((cls) => (
                  <div key={cls.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{cls.name}</p>
                        <p className="text-xs text-gray-500">{cls.studentCount || 0} students</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/attendance?classId=${cls.id}`)} 
                        className="px-2 py-1 text-xs font-medium bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Mark Attendance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Average Attendance</p>
                  <p className="text-xl font-bold text-emerald-600">{averageAttendance}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Pending Parent Requests</p>
                  <p className="text-xl font-bold text-amber-600">{pendingParentRequests}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <PlusCircleIcon className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Common tasks at your fingertips</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Staff Information</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-sm font-medium text-gray-900">{quickStats.subjectsTaught || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Classes</p>
              <p className="text-sm font-medium text-gray-900">{quickStats.classesTaught || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Students</p>
              <p className="text-sm font-medium text-gray-900">{quickStats.totalStudents || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard