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
  CalendarIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { fetchParentById, connectStudent, removeStudentConnection } from '../../store/slices/parentSlice'
import { fetchStudents } from '../../store/slices/studentSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ParentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentParent, isLoading } = useSelector((state) => state.parents)
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

  const students = currentParent.connections || []
  const verifiedCount = students.filter(s => s.studentFullName).length
  const pendingCount = students.length - verifiedCount

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/parents')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{currentParent.fullName}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1"><EnvelopeIcon className="w-3 h-3" /> {currentParent.email}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> {currentParent.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/parents/${id}/edit`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all">
            <PencilIcon className="w-4 h-4" />
            Edit Parent
          </Link>
          <button onClick={() => setShowConnectModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all">
            <PlusIcon className="w-4 h-4" />
            Connect Student
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-lg font-bold text-gray-900">{students.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Verified</p>
          <p className="text-lg font-bold text-emerald-600">{verifiedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Registered</p>
          <p className="text-sm font-medium text-gray-600">{new Date(currentParent.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Parent Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Parent Information</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <BriefcaseIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Occupation</p>
                <p className="text-sm text-gray-800">{currentParent.occupation || 'Not specified'}</p>
              </div>
            </div>
            {currentParent.alternatePhone && (
              <div className="flex items-start gap-2">
                <PhoneIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Alternate Phone</p>
                  <p className="text-sm text-gray-800">{currentParent.alternatePhone}</p>
                </div>
              </div>
            )}
            {currentParent.address && (
              <div className="flex items-start gap-2">
                <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
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
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">Connected Students</h2>
              <span className="inline-flex px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{students.length}</span>
            </div>
          </div>
          
          {students.length === 0 ? (
            <div className="p-8 text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No students connected yet</p>
              <button onClick={() => setShowConnectModal(true)} className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium">Connect a student →</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {students.map((student, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                          {student.studentCode}
                        </span>
                        {student.studentFullName ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                            <CheckCircleIcon className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                            <ClockIcon className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {student.studentFullName && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-gray-500">Student Name:</span> 
                            <span className="text-gray-800">{student.studentFullName}</span>
                            {student.currentDetails?._id && (
                              <Link to={`/students/${student.currentDetails._id}`} className="inline-flex items-center gap-0.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium ml-2">
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span>View</span>
                              </Link>
                            )}
                          </div>
                        )}
                        <div><span className="text-gray-500">Relation:</span> <span className="ml-1 text-gray-800 capitalize">{student.relation}</span></div>
                        <div><span className="text-gray-500">Connected:</span> <span className="ml-1 text-gray-800">{new Date(student.connectedSince).toLocaleDateString()}</span></div>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedStudentCode(student.studentCode); setShowRemoveModal(true); }} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <TrashIcon className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConnectModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <PlusIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Connect Student</h2>
              </div>
              <button onClick={() => setShowConnectModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Student Information Required:</p>
                <p className="text-xs text-blue-700 mt-1">Enter the student's unique code and date of birth as provided by the school.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Code *</label>
                <input type="text" value={studentCode} onChange={(e) => setStudentCode(e.target.value.toUpperCase())} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Enter student code" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <select value={relation} onChange={(e) => setRelation(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setShowConnectModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleConnectStudent} disabled={isConnecting} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {isConnecting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <PlusIcon className="w-4 h-4" />}
                <span>Connect</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRemoveModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center"><TrashIcon className="w-5 h-5 text-rose-600" /></div>
                <div><h3 className="text-lg font-semibold text-gray-900">Remove Connection</h3><p className="text-sm text-gray-500">This action cannot be undone</p></div>
              </div>
              <p className="text-gray-600 mb-5">Are you sure you want to remove this student connection? The parent will no longer have access to this student's information.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowRemoveModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleRemoveStudent} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700">Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentDetails