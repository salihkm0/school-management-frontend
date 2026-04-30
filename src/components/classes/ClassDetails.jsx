// src/pages/classes/ClassDetails.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  PencilIcon, 
  ArrowLeftIcon, 
  UserGroupIcon, 
  BookOpenIcon, 
  UserIcon, 
  AcademicCapIcon,
  PlusIcon,
  XMarkIcon,
  UserPlusIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { fetchClassById, clearCurrentClass, assignClassTeacher, syncClassSubjects } from '../../store/slices/classSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ClassDetails = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams() // This gets the ID from URL
  console.log('Class ID from URL params:', id)
  
  const { currentClass, isLoading } = useSelector((state) => state.classes)
  const { staff } = useSelector((state) => state.staff)
  const { academicYears } = useSelector((state) => state.academicYears)
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (id && id !== 'undefined') {
      console.log('Fetching class with ID:', id)
      dispatch(fetchClassById(id))
      dispatch(fetchStaff({ limit: 100, role: 'teacher' }))
      dispatch(fetchAcademicYears({ limit: 10, isActive: true }))
    } else {
      console.error('Invalid class ID:', id)
      toast.error('Invalid class ID')
    }
    
    return () => { 
      dispatch(clearCurrentClass()) 
    }
  }, [dispatch, id])

  const handleAssignTeacher = async () => {
    if (!selectedTeacher) {
      toast.error('Please select a teacher')
      return
    }
    
    // Validate that we have a valid class ID
    if (!id || id === 'undefined') {
      toast.error('Invalid class ID. Please refresh the page.')
      return
    }
    
    setIsSubmitting(true)
    try {
      // Get current academic year - use the class's academic year or find current
      let currentYearId = currentClass?.academicYearId?._id || currentClass?.academicYearId
      
      if (!currentYearId && academicYears.length > 0) {
        const currentYear = academicYears.find(y => y.isCurrent)
        currentYearId = currentYear?._id
      }
      
      if (!currentYearId) {
        toast.error('Academic year not found. Please set up an academic year first.')
        return
      }
      
      console.log('Assigning teacher with:', {
        classId: id,
        staffId: selectedTeacher,
        academicYearId: currentYearId
      })
      
      // Call the API with the correct class ID from URL params
      const result = await dispatch(assignClassTeacher({ 
        classId: id,  // Use the id from useParams, NOT currentClass._id
        staffId: selectedTeacher, 
        academicYearId: currentYearId
      })).unwrap()
      
      console.log('Assignment result:', result)
      toast.success('Class teacher assigned successfully')
      setShowTeacherModal(false)
      setSelectedTeacher('')
      // Refresh class data
      dispatch(fetchClassById(id))
    } catch (error) {
      console.error('Failed to assign teacher:', error)
      toast.error(error.message || 'Failed to assign class teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveTeacher = async () => {
    // Validate that we have a valid class ID
    if (!id || id === 'undefined') {
      toast.error('Invalid class ID. Please refresh the page.')
      return
    }
    
    if (!window.confirm('Are you sure you want to remove the class teacher?')) return
    
    setIsSubmitting(true)
    try {
      console.log('Removing teacher from class:', id)
      
      // Call API to remove teacher by passing null
      const result = await dispatch(assignClassTeacher({ 
        classId: id,  // Use the id from useParams
        staffId: null,
        academicYearId: null,
        remove: true
      })).unwrap()
      
      console.log('Removal result:', result)
      toast.success('Class teacher removed successfully')
      dispatch(fetchClassById(id))
    } catch (error) {
      console.error('Failed to remove teacher:', error)
      toast.error(error.message || 'Failed to remove class teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Sync subjects from template
  const handleSyncSubjects = async () => {
    if (!id || id === 'undefined') {
      toast.error('Invalid class ID')
      return
    }
    
    if (!window.confirm('This will sync subjects from the class template. Existing subjects will be kept. Continue?')) return
    
    setIsSyncing(true)
    try {
      const result = await dispatch(syncClassSubjects(id)).unwrap()
      toast.success(result.message || 'Subjects synced successfully from template')
      dispatch(fetchClassById(id))
    } catch (error) {
      console.error('Failed to sync subjects:', error)
      toast.error(error.message || 'Failed to sync subjects')
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading || !currentClass) return <LoadingSpinner />

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  )

  const academicYearName = currentClass?.academicYearId?.name || 
    (typeof currentClass?.academicYearId === 'string' ? currentClass?.academicYearId : 'Current Year')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/classes')} 
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentClass.displayName || currentClass.name}</h1>
            <p className="text-gray-500">{academicYearName}</p>
            <p className="text-xs text-gray-400">Class ID: {id}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSyncSubjects}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync from Template'}</span>
          </button>
          <Link 
            to={`/classes/${id}/edit`} 
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
            <span>Edit Class</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Information Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AcademicCapIcon className="w-5 h-5 mr-2 text-primary-500" />
            Class Information
          </h2>
          <InfoRow label="Class Name" value={currentClass.name} />
          <InfoRow label="Section" value={currentClass.section || '-'} />
          <InfoRow label="Capacity" value={currentClass.capacity || '-'} />
          <InfoRow label="Total Students" value={currentClass.studentCount || 0} />
        </div>

        {/* Class Teacher Card with Assignment Option */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-primary-500" />
              Class Teacher
            </div>
            <div className="flex gap-2">
              {!currentClass.classTeacherId ? (
                <button
                  onClick={() => setShowTeacherModal(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  <UserPlusIcon className="w-3 h-3" />
                  Assign
                </button>
              ) : (
                <button
                  onClick={handleRemoveTeacher}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  <TrashIcon className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
          </h2>
          {currentClass.classTeacherId ? (
            <div>
              <InfoRow label="Name" value={currentClass.classTeacherName || currentClass.classTeacherId?.name} />
              <InfoRow label="Email" value={currentClass.classTeacherId?.email || '-'} />
              <InfoRow label="Phone" value={currentClass.classTeacherId?.phone || '-'} />
              <InfoRow label="Staff Code" value={currentClass.classTeacherId?.staffCode || '-'} />
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <UserIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No class teacher assigned</p>
              <p className="text-xs mt-1">Click the Assign button to add a class teacher</p>
            </div>
          )}
          <Link 
            to={`/classes/${id}/subject-teachers`} 
            className="mt-4 inline-block text-primary-600 text-sm hover:text-primary-700"
          >
            Manage Subject Teachers →
          </Link>
        </div>

        {/* Subjects Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BookOpenIcon className="w-5 h-5 mr-2 text-primary-500" />
            Subjects ({currentClass.subjects?.length || 0})
          </h2>
          {currentClass.subjects?.length === 0 ? (
            <div className="text-center py-4">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No subjects assigned</p>
              <button
                onClick={handleSyncSubjects}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Click here to sync from template
              </button>
            </div>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {currentClass.subjects?.map(s => (
                <li key={s._id} className="text-sm py-1 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-900">{s.name}</span>
                  {s.code && <span className="text-gray-400 ml-2">({s.code})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <UserGroupIcon className="w-5 h-5 mr-2 text-primary-500" />
          Students ({currentClass.studentCount || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll Number</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentClass.students?.slice(0, 10).map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{s.fullName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{s.admissionNo}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{s.rollNumber || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentClass.studentCount > 10 && (
            <p className="text-center text-gray-500 text-sm mt-4 pt-2 border-t">
              + {currentClass.studentCount - 10} more students
            </p>
          )}
        </div>
      </div>

      {/* Assign Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTeacherModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b bg-gradient-to-r from-primary-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Assign Class Teacher</h3>
              <p className="text-sm text-gray-500 mt-1">Select a teacher to be the class teacher for {currentClass.displayName}</p>
              <p className="text-xs text-gray-400 mt-1">Class ID: {id}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Teacher *
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Select a teacher...</option>
                  {staff.filter(s => s.role === 'teacher' || s.role === 'principal').map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.staffCode || teacher.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only teachers and principals can be assigned as class teachers.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTeacherModal(false)
                  setSelectedTeacher('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTeacher}
                disabled={isSubmitting || !selectedTeacher}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Assigning...' : 'Assign Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassDetails