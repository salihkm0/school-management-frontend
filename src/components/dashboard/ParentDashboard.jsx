// src/components/dashboard/ParentDashboard.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  UserGroupIcon, 
  CalendarIcon,
  BellIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  TrophyIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { fetchParentDashboard } from '../../store/slices/dashboardSlice'
import { fetchMyChildren, connectStudent, fetchMyParentProfile } from '../../store/slices/parentSlice'
import useSocket from '../../hooks/useSocket'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ParentDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth || {})
  const { parentData: dashboardData, isLoading: dashboardLoading, error: dashboardError, lastUpdated } = useSelector((state) => state.dashboard || {})
  const { myChildren, isLoading: childrenLoading, currentParent } = useSelector((state) => state.parents || { myChildren: [] })
  const { socket, isConnected } = useSocket()
  
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [parentId, setParentId] = useState(null)
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false)
  const [connectForm, setConnectForm] = useState({
    studentCode: '',
    dateOfBirth: '',
    relation: 'father'
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadParentData()
    const interval = setInterval(() => loadParentData(true), 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    if (parentId && user?.role === 'parent') {
      dispatch(fetchMyChildren())
    }
  }, [parentId, dispatch, user])

  useEffect(() => {
    if (socket && isConnected && parentId) {
      const handleChildUpdate = (data) => {
        toast.info(`${data.childName}'s ${data.updateType} has been updated`)
        loadParentData()
        dispatch(fetchMyChildren())
      }
      socket.on(`parent:${parentId}:update`, handleChildUpdate)
      socket.emit('subscribe:parent', parentId)
      return () => {
        socket.off(`parent:${parentId}:update`, handleChildUpdate)
      }
    }
  }, [socket, isConnected, parentId, dispatch])

  const loadParentData = async (silent = false) => {
    try {
      const result = await dispatch(fetchParentDashboard()).unwrap()
      if (result?.parentInfo?.id) {
        setParentId(result.parentInfo.id)
        localStorage.setItem('parentId', result.parentInfo.id)
      }
      if (!silent) {
        setShowRefreshIndicator(true)
        setTimeout(() => setShowRefreshIndicator(false), 2000)
      }
    } catch (error) {
      console.error('Failed to load parent dashboard:', error)
      if (user?.role === 'parent' && !silent) {
        toast.error('Unable to load parent dashboard. Please refresh the page.')
      }
    }
  }

  const handleConnectChange = (e) => {
    setConnectForm({
      ...connectForm,
      [e.target.name]: e.target.value
    })
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: null
      })
    }
  }

  const validateConnectForm = () => {
    const errors = {}
    if (!connectForm.studentCode.trim()) {
      errors.studentCode = 'Student code is required'
    }
    if (!connectForm.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    }
    if (!connectForm.relation) {
      errors.relation = 'Please select relationship'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleConnectStudent = async () => {
    if (!validateConnectForm()) return
    if (!parentId) {
      toast.error('Parent profile not found. Please refresh the page.')
      return
    }
    setIsConnecting(true)
    try {
      const result = await dispatch(connectStudent({
        parentId: parentId,
        studentCode: connectForm.studentCode,
        dateOfBirth: connectForm.dateOfBirth,
        relation: connectForm.relation
      })).unwrap()
      if (result.success) {
        toast.success(result.message || 'Student connected successfully')
        setShowConnectModal(false)
        setConnectForm({
          studentCode: '',
          dateOfBirth: '',
          relation: 'father'
        })
        await loadParentData()
        await dispatch(fetchMyChildren())
      }
    } catch (error) {
      console.error('Failed to connect student:', error)
      toast.error(error.message || 'Failed to connect student')
    } finally {
      setIsConnecting(false)
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getAttendanceColor = (percentage) => {
    const num = parseFloat(percentage)
    if (num >= 75) return 'text-emerald-600'
    if (num >= 60) return 'text-amber-600'
    return 'text-rose-600'
  }

  const getAttendanceBgColor = (percentage) => {
    const num = parseFloat(percentage)
    if (num >= 75) return 'bg-emerald-500'
    if (num >= 60) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  const getGradeColor = (grade) => {
    if (!grade || grade === 'N/A') return 'bg-gray-100 text-gray-700'
    if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700'
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700'
    if (grade.startsWith('C')) return 'bg-amber-100 text-amber-700'
    return 'bg-rose-100 text-rose-700'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isLoading = dashboardLoading || childrenLoading
  const children = dashboardData?.children || myChildren || []
  const quickStats = dashboardData?.quickStats || {}
  const upcomingEvents = dashboardData?.upcomingEvents || []
  const announcements = dashboardData?.announcements || []
  const parentInfo = dashboardData?.parentInfo || {}
  const academicYear = dashboardData?.academicYear || {}

  if (user?.role !== 'parent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationCircleIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Access Restricted</h3>
          <p className="text-sm text-gray-500">This dashboard is only accessible to parents. You are logged in as {user?.role}.</p>
        </div>
      </div>
    )
  }

  if (isLoading && !dashboardData) return <LoadingSpinner />

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">Unable to Load Dashboard</h3>
          <p className="text-sm text-gray-500">{dashboardError}</p>
          <button onClick={() => loadParentData()} className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Refresh Indicator */}
      {showRefreshIndicator && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          Dashboard updated
        </div>
      )}

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              {greeting()}, {parentInfo.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Parent'}! 👋
            </h1>
            <p className="text-emerald-100 text-sm mt-0.5">Track your children's academic progress here.</p>
            {academicYear?.name && (
              <p className="text-emerald-100/80 text-xs mt-1">{academicYear.name}</p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-emerald-100 text-xs">Connected Children</p>
            <p className="text-3xl font-bold">{quickStats.totalChildren || children.length}</p>
          </div>
        </div>
        {!isConnected && (
          <div className="mt-3 bg-amber-500/20 text-amber-100 px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1">
            <ExclamationCircleIcon className="w-3 h-3" />
            Reconnecting... Some updates may be delayed.
          </div>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Children</p>
            <UserGroupIcon className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{quickStats.totalChildren || children.length}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Avg Attendance</p>
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{parseFloat(quickStats.averageAttendance || 0).toFixed(1)}%</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Avg Performance</p>
            <AcademicCapIcon className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{parseFloat(quickStats.averagePerformance || 0).toFixed(1)}%</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Notifications</p>
            <BellIcon className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{quickStats.unreadNotifications || 0}</p>
        </div>
      </div>

      {/* Children Section */}
      {children.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No Children Connected</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
            You haven't connected any children to your account yet.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>Connect Your Child</span>
          </button>
        </div>
      ) : (
        <>
          {/* Children Cards */}
          <div className="space-y-4">
            {children.map((child, index) => {
              const attendancePercentage = parseFloat(child.attendancePercentage || 0)
              const performance = child.performance || { percentage: 0, grade: 'N/A' }
              const performancePercentage = parseFloat(performance.percentage || 0)
              const upcomingExams = child.upcomingExams || []
              
              return (
                <div key={child._id || child.studentId || index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Child Header */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-700 font-semibold text-base">
                          {child.fullName?.charAt(0) || child.studentName?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{child.fullName || child.studentName}</h3>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                          <span>Class: {child.className || 'N/A'}</span>
                          <span>•</span>
                          <span>Admission: {child.admissionNo || 'N/A'}</span>
                          <span>•</span>
                          <span className="capitalize">Relation: {child.relation}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/my-child-attendance?studentId=${child._id || child.studentId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Attendance
                      </button>
                      <button 
                        onClick={() => navigate(`/my-child-results?studentId=${child._id || child.studentId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                        className="px-3 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        Results
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Attendance */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500">Attendance</p>
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className={`text-xl font-bold ${getAttendanceColor(attendancePercentage)}`}>
                          {attendancePercentage.toFixed(1)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div className={`h-1.5 rounded-full ${getAttendanceBgColor(attendancePercentage)}`} style={{ width: `${Math.min(attendancePercentage, 100)}%` }} />
                        </div>
                      </div>

                      {/* Performance/Grade */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500">Performance</p>
                          <ChartBarIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        {performancePercentage > 0 ? (
                          <>
                            <p className="text-xl font-bold text-gray-900">{performancePercentage.toFixed(1)}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(performancePercentage, 100)}%` }} />
                            </div>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-gray-500">No results yet</p>
                        )}
                      </div>

                      {/* Grade */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500">Current Grade</p>
                          <TrophyIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${getGradeColor(performance.grade)}`}>
                          {performance.grade || 'N/A'}
                        </span>
                      </div>

                      {/* Upcoming Exams Count */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-500">Upcoming Exams</p>
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-2xl font-bold text-amber-600">{upcomingExams.length}</p>
                        <p className="text-xs text-gray-500">exams scheduled</p>
                      </div>
                    </div>

                    {/* Upcoming Exams List */}
                    {upcomingExams.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-700 mb-2">📚 Upcoming Exams:</p>
                        <div className="flex flex-wrap gap-2">
                          {upcomingExams.slice(0, 4).map((exam, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                              <span>{exam.name?.replace(' - undefined', '') || 'Exam'}</span>
                              <span className="text-amber-500">•</span>
                              <span>{exam.daysLeft === 0 ? 'Today' : `${exam.daysLeft}d left`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Another Child Button */}
          <div className="text-center">
            <button 
              onClick={() => setShowConnectModal(true)} 
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <UserPlusIcon className="w-4 h-4" />
              <span>Add Another Child</span>
            </button>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-xs text-gray-500 mt-0.5">Common tasks at your fingertips</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => navigate('/calendar')} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Calendar</span>
            </button>
            <button onClick={() => navigate('/notifications')} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <BellIcon className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Notifications</span>
            </button>
            <button onClick={() => navigate('/academic-progress')} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Progress</span>
            </button>
            <button onClick={() => navigate('/reports')} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Events & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Upcoming Events</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">School calendar events</p>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingEvents.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      event.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                      event.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {event.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500">{event.type}</p>
                    {event.daysLeft !== undefined && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-emerald-600">{event.daysLeft === 0 ? 'Today' : `${event.daysLeft} days left`}</p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <BellIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Announcements</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Important updates from school</p>
          </div>
          <div className="divide-y divide-gray-100">
            {announcements.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent announcements</p>
                <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
              </div>
            ) : (
              announcements.slice(0, 5).map((announcement) => (
                <div key={announcement.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{announcement.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(announcement.date)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Connect Student Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Connect Your Child</h2>
              </div>
              <button onClick={() => setShowConnectModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-sm font-medium text-blue-800">📌 Need help?</p>
                <p className="text-xs text-blue-700 mt-1">Enter your child's student code and date of birth as provided by the school.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Code *</label>
                <input
                  type="text"
                  name="studentCode"
                  value={connectForm.studentCode}
                  onChange={handleConnectChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${formErrors.studentCode ? 'border-rose-500' : 'border-gray-200'}`}
                  placeholder="e.g., 1808339938"
                />
                {formErrors.studentCode && <p className="mt-1 text-xs text-rose-500">{formErrors.studentCode}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={connectForm.dateOfBirth}
                  onChange={handleConnectChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${formErrors.dateOfBirth ? 'border-rose-500' : 'border-gray-200'}`}
                />
                {formErrors.dateOfBirth && <p className="mt-1 text-xs text-rose-500">{formErrors.dateOfBirth}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <select
                  name="relation"
                  value={connectForm.relation}
                  onChange={handleConnectChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${formErrors.relation ? 'border-rose-500' : 'border-gray-200'}`}
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
                {formErrors.relation && <p className="mt-1 text-xs text-rose-500">{formErrors.relation}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => setShowConnectModal(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConnectStudent} 
                disabled={isConnecting} 
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Connect Child</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentDashboard