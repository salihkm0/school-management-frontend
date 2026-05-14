// src/components/dashboard/ParentDashboard.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  UserGroupIcon, 
  CreditCardIcon,
  CalendarIcon,
  BellIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  TrophyIcon,
  HomeIcon,
  PhoneIcon
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
  const { parentData: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useSelector((state) => state.dashboard || {})
  const { myChildren, isLoading: childrenLoading, currentParent } = useSelector((state) => state.parents || { myChildren: [] })
  const { socket, isConnected } = useSocket()
  
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [parentId, setParentId] = useState(null)
  const [connectForm, setConnectForm] = useState({
    studentCode: '',
    dateOfBirth: '',
    relation: 'father'
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadParentData()
    const interval = setInterval(() => {
      dispatch(fetchParentDashboard())
    }, 3 * 60 * 1000)
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
        dispatch(fetchParentDashboard())
        dispatch(fetchMyChildren())
      }
      socket.on(`parent:${parentId}:update`, handleChildUpdate)
      socket.emit('subscribe:parent', parentId)
      return () => {
        socket.off(`parent:${parentId}:update`, handleChildUpdate)
      }
    }
  }, [socket, isConnected, parentId, dispatch])

  const loadParentData = async () => {
    try {
      const result = await dispatch(fetchParentDashboard()).unwrap()
      if (result?.parentInfo?.id) {
        setParentId(result.parentInfo.id)
        localStorage.setItem('parentId', result.parentInfo.id)
      }
    } catch (error) {
      console.error('Failed to load parent dashboard:', error)
      if (user?.role === 'parent') {
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
        await dispatch(fetchMyChildren())
        await dispatch(fetchParentDashboard())
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
    if (percentage >= 75) return 'text-emerald-600'
    if (percentage >= 60) return 'text-amber-600'
    return 'text-rose-600'
  }

  const getAttendanceBgColor = (percentage) => {
    if (percentage >= 75) return 'bg-emerald-500'
    if (percentage >= 60) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  const isLoading = dashboardLoading || childrenLoading
  const children = dashboardData?.children || myChildren || []
  const quickStats = dashboardData?.quickStats || {}
  const feeStatus = dashboardData?.feeStatus || {}
  const upcomingEvents = dashboardData?.upcomingEvents || []
  const announcements = dashboardData?.announcements || []
  const parentInfo = dashboardData?.parentInfo || {}

  if (user?.role !== 'parent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center max-w-md">
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
          <button onClick={loadParentData} className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Welcome Card - Responsive */}
        <div className="mb-5">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {greeting()}, {parentInfo.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Parent'}!
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Track your children's academic progress here.</p>
                {!isConnected && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-3 h-3" />
                    Real-time connection lost. Some updates may be delayed.
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-500">Connected Children</p>
                <p className="text-2xl font-bold text-emerald-600">{quickStats.totalChildren || children.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards - Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Attendance</p>
            <p className="text-lg font-bold text-gray-900">{quickStats.averageAttendance || 0}%</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Performance</p>
            <p className="text-lg font-bold text-gray-900">{quickStats.averagePerformance || 0}%</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Unread</p>
            <p className="text-lg font-bold text-gray-900">{quickStats.unreadNotifications || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Fee Due</p>
            <p className="text-lg font-bold text-rose-600">₹{feeStatus.due?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Children Section */}
        {children.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
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
            <div className="space-y-4 mb-6">
              {children.map((child, index) => {
                const attendancePercentage = child.attendancePercentage || 85
                const performance = child.performance || { percentage: 0, grade: 'N/A' }
                
                return (
                  <div key={child._id || child.studentId || index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Child Header - Responsive */}
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
                            <span>Roll: {child.rollNumber || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigate(`/my-child-attendance?studentId=${child._id || child.studentId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          Attendance
                        </button>
                        <button 
                          onClick={() => navigate(`/my-child-results?studentId=${child._id || child.studentId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                          className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors"
                        >
                          Results
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid - Responsive */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Attendance</p>
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <p className={`text-lg font-bold ${getAttendanceColor(attendancePercentage)}`}>
                            {attendancePercentage}%
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                            <div className={`h-1 rounded-full ${getAttendanceBgColor(attendancePercentage)}`} style={{ width: `${attendancePercentage}%` }} />
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Grade</p>
                            <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <p className={`text-lg font-bold inline-block px-2 py-0.5 rounded-md ${
                            performance.grade?.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                            performance.grade?.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {performance.grade || 'N/A'}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Fee</p>
                            <CreditCardIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <p className="text-lg font-bold text-gray-900">₹{feeStatus.paid?.toLocaleString() || 0}</p>
                          {feeStatus.due > 0 && <p className="text-xs text-rose-500">Due: ₹{feeStatus.due}</p>}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Exams</p>
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <p className="text-lg font-bold text-emerald-600">{child.upcomingExams?.length || 0}</p>
                          <p className="text-xs text-gray-500">upcoming</p>
                        </div>
                      </div>

                      {/* Upcoming Exams List */}
                      {child.upcomingExams && child.upcomingExams.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-1.5">Upcoming Exams:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {child.upcomingExams.slice(0, 3).map((exam, idx) => (
                              <span key={idx} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                {exam.name} {exam.daysLeft === 0 ? '(Today)' : `(${exam.daysLeft}d)`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions - Responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <button onClick={() => navigate('/fee-payment')} className="group flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <CreditCardIcon className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-medium text-gray-700">Pay Fees</p>
              </button>
              <button onClick={() => navigate('/notifications')} className="group flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <BellIcon className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-medium text-gray-700">Notifications</p>
              </button>
              <button onClick={() => navigate('/calendar')} className="group flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <CalendarIcon className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-medium text-gray-700">Calendar</p>
              </button>
              <button onClick={() => navigate('/academic-progress')} className="group flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <DocumentTextIcon className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-medium text-gray-700">Progress</p>
              </button>
            </div>

            {/* Add Another Child Button */}
            <div className="text-center mb-6">
              <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <UserPlusIcon className="w-4 h-4" />
                <span>Add Another Child</span>
              </button>
            </div>
          </>
        )}

        {/* Upcoming Events & Announcements - Responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming Events</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingEvents.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">No upcoming events</div>
              ) : (
                upcomingEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      {event.daysLeft !== undefined && (
                        <span className="text-xs text-emerald-600">{event.daysLeft === 0 ? 'Today' : `${event.daysLeft}d`}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{new Date(event.date).toLocaleDateString()} • {event.type}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Announcements</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {announcements.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">No recent announcements</div>
              ) : (
                announcements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{announcement.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(announcement.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Connect Student Modal - Responsive */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <UserPlusIcon className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Connect Your Child</h2>
                </div>
                <button onClick={() => setShowConnectModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800">Need help?</p>
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
                    placeholder="Enter student code"
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
                <button onClick={() => setShowConnectModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleConnectStudent} disabled={isConnecting} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
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
    </div>
  )
}

export default ParentDashboard