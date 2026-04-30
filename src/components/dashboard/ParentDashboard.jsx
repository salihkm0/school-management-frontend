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
  ClockIcon
} from '@heroicons/react/24/outline'
import { fetchMyChildren, connectStudent, fetchMyParentProfile } from '../../store/slices/parentSlice'
import useSocket from '../../hooks/useSocket'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ParentDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth || {})
  const { myChildren, isLoading, currentParent } = useSelector((state) => state.parents || { myChildren: [] })
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
  const [isParent, setIsParent] = useState(false)

  useEffect(() => {
    // Check if user role is parent
    if (user?.role === 'parent') {
      setIsParent(true)
      loadParentProfile()
    } else {
      // For non-parent users, don't try to load parent profile
      console.log('User is not a parent, skipping parent profile load')
    }
  }, [dispatch, user])

  useEffect(() => {
    if (parentId && isParent) {
      loadChildren()
    }
  }, [parentId, isParent])

  const loadParentProfile = async () => {
    try {
      const result = await dispatch(fetchMyParentProfile()).unwrap()
      if (result.success && result.data) {
        const fetchedParentId = result.data._id
        setParentId(fetchedParentId)
        localStorage.setItem('parentId', fetchedParentId)
      }
    } catch (error) {
      console.error('Failed to load parent profile:', error)
      // Don't show error toast for non-parent users
      if (user?.role === 'parent') {
        toast.error('Unable to load parent profile. Please contact support.')
      }
    }
  }

  const loadChildren = async () => {
    await dispatch(fetchMyChildren())
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
        await loadChildren()
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

  if (isLoading) {
    return <LoadingSpinner />
  }

  // If user is not parent, show a message
  if (!isParent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationCircleIcon className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Access Restricted</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              This dashboard is only accessible to parents. You are logged in as {user?.role}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wait for parentId to load */}
        {!parentId && !isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationCircleIcon className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Unable to load your parent profile. Please contact the school administrator.
            </p>
          </div>
        ) : (
          <>
            {/* Welcome Card */}
            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {greeting()}, {user?.name?.split(' ')[0] || 'Parent'}!
                    </h1>
                    <p className="text-gray-500 mt-1">
                      Welcome to your parent dashboard. Track your children's academic progress here.
                    </p>
                    {!isConnected && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <ExclamationCircleIcon className="w-3 h-3" />
                        Real-time connection lost. Some updates may be delayed.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Connected Children</p>
                      <p className="text-2xl font-bold text-primary-600">{myChildren.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Children Section */}
            {myChildren.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-12 h-12 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Children Connected</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  You haven't connected any children to your account yet. Add your child using their student code and date of birth.
                </p>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all shadow-sm hover:shadow-md"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  <span>Connect Your Child</span>
                </button>
              </div>
            ) : (
              <>
                {/* Children Cards */}
                <div className="space-y-6">
                  {myChildren.map((child, index) => {
                    const attendancePercentage = child.attendancePercentage || child.attendance?.average || 85
                    const performanceGrade = child.performanceGrade || child.performance?.overallGrade || 'B+'
                    
                    return (
                      <div key={child._id || child.studentId || index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                        {/* Child Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-600 font-bold text-lg">
                                  {child.fullName?.charAt(0) || child.studentName?.charAt(0) || 'S'}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">{child.fullName || child.studentName}</h3>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-0.5">
                                  <span>Class: {child.className || child.class?.displayName || child.classId?.name || 'N/A'}</span>
                                  <span>•</span>
                                  <span>Roll No: {child.rollNumber || 'N/A'}</span>
                                  <span>•</span>
                                  <span className="capitalize">Relation: {child.relation || child.relationship || 'Guardian'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => navigate(`/my-child-attendance?studentId=${child._id || child.studentId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                              >
                                <CalendarIcon className="w-4 h-4" />
                                Attendance
                              </button>
                              <button 
                                onClick={() => navigate(`/my-child-results?studentId=${child._id || child.studentId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                                className="px-4 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2"
                              >
                                <ChartBarIcon className="w-4 h-4" />
                                Results
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Attendance Card */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">Attendance</p>
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                              </div>
                              <p className={`text-2xl font-bold ${getAttendanceColor(attendancePercentage)}`}>
                                {attendancePercentage}%
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div 
                                  className={`h-1.5 rounded-full ${getAttendanceBgColor(attendancePercentage)}`}
                                  style={{ width: `${attendancePercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Performance Card */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">Performance</p>
                                <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                              </div>
                              <p className={`text-2xl font-bold inline-block px-3 py-1 rounded-lg ${
                                performanceGrade.startsWith('A') ? 'text-emerald-600 bg-emerald-50' :
                                performanceGrade.startsWith('B') ? 'text-blue-600 bg-blue-50' :
                                'text-amber-600 bg-amber-50'
                              }`}>
                                {performanceGrade}
                              </p>
                            </div>

                            {/* Fee Status Card */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">Fee Status</p>
                                <CreditCardIcon className="w-5 h-5 text-gray-400" />
                              </div>
                              <p className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5" />
                                Paid
                              </p>
                            </div>

                            {/* Upcoming Exams Card */}
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">Upcoming Exams</p>
                                <ClockIcon className="w-5 h-5 text-gray-400" />
                              </div>
                              <p className="text-2xl font-bold text-primary-600">
                                {child.upcomingExams?.length || 2}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">exams scheduled</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <button 
                    onClick={() => navigate('/fee-payment')}
                    className="group p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
                  >
                    <CreditCardIcon className="w-6 h-6 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-gray-800">Pay Fees</p>
                    <p className="text-xs text-gray-500 mt-0.5">View and pay fees</p>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 mt-2 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="group p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
                  >
                    <BellIcon className="w-6 h-6 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-gray-800">Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">School announcements</p>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 mt-2 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button 
                    onClick={() => navigate('/my-child-attendance')}
                    className="group p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
                  >
                    <CalendarIcon className="w-6 h-6 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-gray-800">View Attendance</p>
                    <p className="text-xs text-gray-500 mt-0.5">Track attendance</p>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 mt-2 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button 
                    onClick={() => navigate('/my-child-results')}
                    className="group p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
                  >
                    <DocumentTextIcon className="w-6 h-6 text-primary-500 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-gray-800">View Results</p>
                    <p className="text-xs text-gray-500 mt-0.5">Exam results</p>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 mt-2 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>

                {/* Add Another Child Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Add Another Child</span>
                  </button>
                </div>
              </>
            )}

            {/* Connect Student Modal */}
            {showConnectModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <UserPlusIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Connect Your Child</h2>
                    </div>
                    <button
                      onClick={() => setShowConnectModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                      <p className="font-medium">Need help?</p>
                      <p className="text-xs mt-1">Enter your child's student code and date of birth as provided by the school.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student Code *
                      </label>
                      <input
                        type="text"
                        name="studentCode"
                        value={connectForm.studentCode}
                        onChange={handleConnectChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                          formErrors.studentCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter student code"
                      />
                      {formErrors.studentCode && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.studentCode}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={connectForm.dateOfBirth}
                        onChange={handleConnectChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                          formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.dateOfBirth && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.dateOfBirth}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship *
                      </label>
                      <select
                        name="relation"
                        value={connectForm.relation}
                        onChange={handleConnectChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                          formErrors.relation ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                      </select>
                      {formErrors.relation && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.relation}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                      onClick={() => setShowConnectModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConnectStudent}
                      disabled={isConnecting}
                      className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
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
          </>
        )}
      </div>
    </div>
  )
}

export default ParentDashboard