// src/components/classes/ClassDetails.jsx
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
  TrashIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { fetchClassById, clearCurrentClass, assignClassTeacher, syncClassSubjects } from '../../store/slices/classSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ClassDetails = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentClass, isLoading } = useSelector((state) => state.classes)
  const { staff } = useSelector((state) => state.staff)
  const { academicYears } = useSelector((state) => state.academicYears)
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (id && id !== 'undefined') {
      dispatch(fetchClassById(id))
      dispatch(fetchStaff({ limit: 100, role: 'teacher' }))
      dispatch(fetchAcademicYears({ limit: 10, isActive: true }))
    }
    return () => { dispatch(clearCurrentClass()) }
  }, [dispatch, id])

  const handleAssignTeacher = async () => {
    if (!selectedTeacher) { toast.error('Please select a teacher'); return }
    if (!id || id === 'undefined') { toast.error('Invalid class ID'); return }
    
    setIsSubmitting(true)
    try {
      let currentYearId = currentClass?.academicYearId?._id || currentClass?.academicYearId
      if (!currentYearId && academicYears.length > 0) {
        const currentYear = academicYears.find(y => y.isCurrent)
        currentYearId = currentYear?._id
      }
      if (!currentYearId) { toast.error('Academic year not found'); return }
      
      await dispatch(assignClassTeacher({ classId: id, staffId: selectedTeacher, academicYearId: currentYearId })).unwrap()
      toast.success('Class teacher assigned successfully')
      setShowTeacherModal(false)
      setSelectedTeacher('')
      dispatch(fetchClassById(id))
    } catch (error) {
      toast.error(error.message || 'Failed to assign class teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveTeacher = async () => {
    if (!id || id === 'undefined') { toast.error('Invalid class ID'); return }
    if (!window.confirm('Are you sure you want to remove the class teacher?')) return
    
    setIsSubmitting(true)
    try {
      await dispatch(assignClassTeacher({ classId: id, staffId: null, academicYearId: null, remove: true })).unwrap()
      toast.success('Class teacher removed successfully')
      dispatch(fetchClassById(id))
    } catch (error) {
      toast.error(error.message || 'Failed to remove class teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSyncSubjects = async () => {
    if (!id || id === 'undefined') { toast.error('Invalid class ID'); return }
    if (!window.confirm('Sync subjects from template? Existing subjects will be kept.')) return
    
    setIsSyncing(true)
    try {
      await dispatch(syncClassSubjects(id)).unwrap()
      toast.success('Subjects synced successfully')
      dispatch(fetchClassById(id))
    } catch (error) {
      toast.error(error.message || 'Failed to sync subjects')
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading || !currentClass) return <LoadingSpinner />

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 last:border-0 gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  )

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/classes')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{currentClass.displayName || currentClass.name}</h1>
            <p className="text-xs text-gray-500">{currentClass.academicYearId?.name || 'Current Year'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSyncSubjects} disabled={isSyncing} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
            <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Template'}</span>
          </button>
          <Link to={`/classes/${id}/edit`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            <PencilIcon className="w-4 h-4" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Class Information */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">Class Information</h2>
            </div>
          </div>
          <div className="p-4 space-y-1">
            <InfoRow label="Class Name" value={currentClass.name} />
            <InfoRow label="Section" value={currentClass.section || '-'} />
            <InfoRow label="Capacity" value={currentClass.capacity || '-'} />
            <InfoRow label="Total Students" value={currentClass.studentCount || 0} />
          </div>
        </div>

        {/* Class Teacher */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">Class Teacher</h2>
            </div>
            {!currentClass.classTeacherId ? (
              <button onClick={() => setShowTeacherModal(true)} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                <UserPlusIcon className="w-3 h-3" /> Assign
              </button>
            ) : (
              <button onClick={handleRemoveTeacher} disabled={isSubmitting} className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700">
                <TrashIcon className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
          <div className="p-4">
            {currentClass.classTeacherId ? (
              <div className="space-y-1">
                <InfoRow label="Name" value={currentClass.classTeacherName || currentClass.classTeacherId?.name} />
                <InfoRow label="Email" value={currentClass.classTeacherId?.email || '-'} />
                <InfoRow label="Phone" value={currentClass.classTeacherId?.phone || '-'} />
              </div>
            ) : (
              <div className="text-center py-4">
                <UserIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No teacher assigned</p>
              </div>
            )}
            <Link to={`/classes/${id}/subject-teachers`} className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mt-3">
              Manage Subject Teachers <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">Subjects ({currentClass.subjects?.length || 0})</h2>
            </div>
          </div>
          <div className="p-4">
            {currentClass.subjects?.length === 0 ? (
              <div className="text-center py-4">
                <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No subjects assigned</p>
                <button onClick={handleSyncSubjects} className="mt-2 text-sm text-emerald-600 hover:text-emerald-700">Sync from template</button>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {currentClass.subjects?.slice(0, 15).map(s => (
                  <div key={s._id} className="text-sm py-1 border-b border-gray-100 last:border-0 flex justify-between">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    {s.code && <span className="text-xs text-gray-400">{s.code}</span>}
                  </div>
                ))}
                {currentClass.subjects?.length > 15 && <p className="text-xs text-gray-400 text-center pt-1">+{currentClass.subjects.length - 15} more</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Students ({currentClass.studentCount || 0})</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Admission No</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Roll No</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentClass.students?.slice(0, 10).map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{s.fullName}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{s.admissionNo}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 hidden sm:table-cell">{s.rollNumber || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentClass.studentCount > 10 && (
            <p className="text-center text-xs text-gray-400 py-3 border-t">+ {currentClass.studentCount - 10} more students</p>
          )}
        </div>
      </div>

      {/* Assign Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTeacherModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900">Assign Class Teacher</h3>
              <button onClick={() => setShowTeacherModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">Select a teacher for <span className="font-medium">{currentClass.displayName}</span></p>
              <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="">Select Teacher</option>
                {staff.filter(s => s.role === 'teacher' || s.role === 'principal').map(teacher => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name} ({teacher.staffCode || teacher.role})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => { setShowTeacherModal(false); setSelectedTeacher(''); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssignTeacher} disabled={isSubmitting || !selectedTeacher} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {isSubmitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassDetails