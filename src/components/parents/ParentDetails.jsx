// src/components/parents/ParentDetails.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeftIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  BriefcaseIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { fetchParentById, connectStudent, removeStudentConnection } from '../../store/slices/parentSlice'
import { fetchStudents } from '../../store/slices/studentSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmModal from '../common/Modal'
import toast from 'react-hot-toast'

const ParentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentParent, isLoading } = useSelector((state) => state.parents)
  const { students } = useSelector((state) => state.students)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [studentCode, setStudentCode] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [relation, setRelation] = useState('father')
  const [selectedStudentCode, setSelectedStudentCode] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    dispatch(fetchParentById(id))
    dispatch(fetchStudents({ limit: 100 }))
  }, [dispatch, id])

  const handleConnectStudent = async () => {
    if (!studentCode || !dateOfBirth) {
      toast.error('Please enter student code and date of birth')
      return
    }
    
    setIsConnecting(true)
    try {
      await dispatch(connectStudent({ parentId: id, studentCode, dateOfBirth, relation })).unwrap()
      toast.success('Student connected successfully')
      setShowConnectModal(false)
      setStudentCode('')
      setDateOfBirth('')
      dispatch(fetchParentById(id))
    } catch (error) {
      toast.error(error.message || 'Failed to connect student')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleRemoveStudent = async () => {
    if (selectedStudentCode) {
      await dispatch(removeStudentConnection({ parentId: id, studentCode: selectedStudentCode }))
      toast.success('Student connection removed')
      setShowRemoveModal(false)
      setSelectedStudentCode(null)
      dispatch(fetchParentById(id))
    }
  }

  if (isLoading || !currentParent) return <LoadingSpinner />

  const verifiedCount = currentParent.students?.filter(s => s.studentFullName).length || 0
  const pendingCount = (currentParent.students?.length || 0) - verifiedCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/parents')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentParent.fullName}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <EnvelopeIcon className="w-4 h-4" />
                {currentParent.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <PhoneIcon className="w-4 h-4" />
                {currentParent.phone}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Connect Student
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{currentParent.students?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Registered</p>
          <p className="text-md font-medium text-gray-600">{new Date(currentParent.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parent Information Card */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Parent Information</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <BriefcaseIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Occupation</p>
                <p className="text-sm text-gray-800">{currentParent.occupation || 'Not specified'}</p>
              </div>
            </div>
            {currentParent.alternatePhone && (
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Alternate Phone</p>
                  <p className="text-sm text-gray-800">{currentParent.alternatePhone}</p>
                </div>
              </div>
            )}
            {currentParent.address && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-800">
                    {typeof currentParent.address === 'string' 
                      ? currentParent.address 
                      : `${currentParent.address.street || ''} ${currentParent.address.city || ''} ${currentParent.address.state || ''}`.trim() || 'Not specified'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connected Students Card */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-primary-600" />
              Connected Students
              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                {currentParent.students?.length || 0}
              </span>
            </h2>
          </div>
          
          {currentParent.students?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No students connected yet</p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Connect a student →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {currentParent.students.map((student, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                          {student.studentCode}
                        </span>
                        {student.studentFullName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            <CheckCircleIcon className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                            <ClockIcon className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {student.studentFullName && (
                          <div>
                            <span className="text-gray-500">Student Name:</span>
                            <span className="ml-2 text-gray-700">{student.studentFullName}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Relation:</span>
                          <span className="ml-2 text-gray-700 capitalize">{student.relation}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Connected:</span>
                          <span className="ml-2 text-gray-700">
                            {new Date(student.connectedSince).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudentCode(student.studentCode)
                        setShowRemoveModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove connection"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connect Student Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Connect Student</h2>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-medium">Student Information Required:</p>
                <p className="text-xs mt-1">Enter the student's unique code and date of birth as provided by the school.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Code *
                </label>
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Enter student code"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectStudent}
                disabled={isConnecting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    <span>Connect Student</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false)
          setSelectedStudentCode(null)
        }}
        onConfirm={handleRemoveStudent}
        title="Remove Student Connection"
        message="Are you sure you want to remove this student connection? The parent will no longer have access to this student's information."
        confirmText="Remove"
        confirmVariant="danger"
      />
    </div>
  )
}

export default ParentDetails