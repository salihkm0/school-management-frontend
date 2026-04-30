// src/pages/parent/MyChildrenPage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  ChartBarIcon,
  CreditCardIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { fetchMyChildren, fetchMyParentProfile, connectStudent } from '../../store/slices/parentSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const MyChildrenPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth || {})
  const { myChildren, currentParent, isLoading } = useSelector((state) => state.parents || { myChildren: [] })
  
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
    loadParentProfile()
  }, [dispatch])

  useEffect(() => {
    if (parentId) {
      loadChildren()
    }
  }, [parentId])

  const loadParentProfile = async () => {
    try {
      const result = await dispatch(fetchMyParentProfile()).unwrap()
      if (result.success && result.data) {
        setParentId(result.data._id)
      }
    } catch (error) {
      console.error('Failed to load parent profile:', error)
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

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'text-emerald-600'
    if (percentage >= 60) return 'text-amber-600'
    return 'text-rose-600'
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold">My Children</h1>
                <p className="text-primary-100 mt-1">
                  View and manage your children's academic information
                </p>
              </div>
              <button
                onClick={() => setShowConnectModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <UserPlusIcon className="w-5 h-5" />
                <span>Add Child</span>
              </button>
            </div>
          </div>
        </div>

        {/* Children List */}
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all"
            >
              <UserPlusIcon className="w-5 h-5" />
              <span>Connect Your Child</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myChildren.map((child) => {
              const attendancePercentage = child.attendancePercentage || 85
              const performanceGrade = child.performanceGrade || 'B+'
              
              return (
                <div key={child._id || child.studentId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                  {/* Card Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{child.fullName || child.studentName}</h3>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <span className="text-sm text-gray-500">Class: {child.className || child.class?.displayName || 'N/A'}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">Roll No: {child.rollNumber || 'N/A'}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500 capitalize">Relation: {child.relation || 'Guardian'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/my-child-attendance?studentId=${child._id || child.studentId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Attendance"
                        >
                          <CalendarIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/my-child-results?studentId=${child._id || child.studentId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Results"
                        >
                          <ChartBarIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/fee-payment?studentId=${child._id || child.studentId}`)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Pay Fees"
                        >
                          <CreditCardIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Attendance</p>
                        <p className={`text-2xl font-bold ${getAttendanceColor(attendancePercentage)}`}>
                          {attendancePercentage}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div 
                            className={`h-1.5 rounded-full ${attendancePercentage >= 75 ? 'bg-emerald-500' : attendancePercentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${attendancePercentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Performance</p>
                        <p className={`text-2xl font-bold inline-block px-3 py-1 rounded-lg ${
                          performanceGrade.startsWith('A') ? 'text-emerald-600 bg-emerald-50' :
                          performanceGrade.startsWith('B') ? 'text-blue-600 bg-blue-50' :
                          'text-amber-600 bg-amber-50'
                        }`}>
                          {performanceGrade}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/my-child-attendance?studentId=${child._id || child.studentId}`)}
                          className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          View Full Attendance
                        </button>
                        <button
                          onClick={() => navigate(`/my-child-results?studentId=${child._id || child.studentId}`)}
                          className="px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          View Results
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
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
    </div>
  )
}

export default MyChildrenPage