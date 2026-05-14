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
  UserPlusIcon,
  XMarkIcon,
  ChevronRightIcon
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
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Children</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage your children's academic information</p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <UserPlusIcon className="w-4 h-4" />
          <span>Add Child</span>
        </button>
      </div>

      {/* Children List */}
      {myChildren.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No Children Connected</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
            You haven't connected any children to your account yet.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>Connect Your Child</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {myChildren.map((child) => {
            const attendancePercentage = child.attendancePercentage || 85
            const performanceGrade = child.performanceGrade || 'B+'
            const childId = child._id || child.studentId
            
            return (
              <div key={childId} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                {/* Card Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
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
                          <span>•</span>
                          <span className="capitalize">Relation: {child.relation || 'Guardian'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/my-child-attendance?studentId=${childId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Attendance"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/my-child-results?studentId=${childId}&name=${encodeURIComponent(child.fullName || child.studentName)}`)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                        title="View Results"
                      >
                        <ChartBarIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/fee-payment?studentId=${childId}`)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                        title="Pay Fees"
                      >
                        <CreditCardIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Attendance</p>
                      <p className={`text-lg font-bold ${getAttendanceColor(attendancePercentage)}`}>
                        {attendancePercentage}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-1.5 rounded-full ${attendancePercentage >= 75 ? 'bg-emerald-500' : attendancePercentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${attendancePercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Performance</p>
                      <p className={`text-lg font-bold inline-block px-2 py-0.5 rounded-md ${
                        performanceGrade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                        performanceGrade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {performanceGrade}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigate(`/my-child-attendance?studentId=${childId}`)}
                        className="px-2 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        View Attendance
                      </button>
                      <button
                        onClick={() => navigate(`/my-child-results?studentId=${childId}`)}
                        className="px-2 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors"
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

      {/* Connect Student Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConnectModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <UserPlusIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Connect Your Child</h2>
              </div>
              <button onClick={() => setShowConnectModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Need help?</p>
                <p className="text-xs text-blue-700 mt-1">Enter your child's student code and date of birth.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Code *</label>
                <input type="text" name="studentCode" value={connectForm.studentCode} onChange={handleConnectChange} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${formErrors.studentCode ? 'border-rose-500' : 'border-gray-200'}`} placeholder="Enter student code" />
                {formErrors.studentCode && <p className="mt-1 text-xs text-rose-500">{formErrors.studentCode}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input type="date" name="dateOfBirth" value={connectForm.dateOfBirth} onChange={handleConnectChange} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${formErrors.dateOfBirth ? 'border-rose-500' : 'border-gray-200'}`} />
                {formErrors.dateOfBirth && <p className="mt-1 text-xs text-rose-500">{formErrors.dateOfBirth}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <select name="relation" value={connectForm.relation} onChange={handleConnectChange} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${formErrors.relation ? 'border-rose-500' : 'border-gray-200'}`}>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
                {formErrors.relation && <p className="mt-1 text-xs text-rose-500">{formErrors.relation}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setShowConnectModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleConnectStudent} disabled={isConnecting} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {isConnecting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <UserPlusIcon className="w-4 h-4" />}
                <span>Connect</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyChildrenPage