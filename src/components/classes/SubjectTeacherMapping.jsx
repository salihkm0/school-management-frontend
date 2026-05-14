// src/components/classes/SubjectTeacherMapping.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon, 
  UserGroupIcon, 
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon as CloseIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { fetchClassById } from '../../store/slices/classSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import classService from '../../services/classService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const SubjectTeacherMapping = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentClass, isLoading } = useSelector((state) => state.classes)
  const { staff } = useSelector((state) => state.staff)
  const { subjects } = useSelector((state) => state.subjects)
  const [assignments, setAssignments] = useState([])
  const [subjectTeachers, setSubjectTeachers] = useState([])
  const [newAssignment, setNewAssignment] = useState({ subjectId: '', teacherId: '', periodsPerWeek: 1 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    dispatch(fetchClassById(id))
    dispatch(fetchStaff({ role: 'teacher', limit: 100 }))
    dispatch(fetchSubjects({ limit: 100 }))
    loadSubjectTeachers()
  }, [dispatch, id])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadSubjectTeachers = async () => {
    try {
      const res = await classService.getClassSubjectTeachers(id)
      setSubjectTeachers(res.subjectTeachers || [])
      setAssignments(res.subjectTeachers || [])
    } catch (error) {
      console.error('Failed to load subject teachers:', error)
      toast.error('Failed to load subject teachers')
    }
  }

  const handleAdd = async () => {
    if (!newAssignment.subjectId || !newAssignment.teacherId) {
      toast.error('Please select subject and teacher')
      return
    }
    setIsSubmitting(true)
    try {
      await classService.assignSubjectTeacher(id, newAssignment.subjectId, newAssignment.teacherId, newAssignment.periodsPerWeek)
      toast.success('Teacher assigned successfully')
      loadSubjectTeachers()
      setNewAssignment({ subjectId: '', teacherId: '', periodsPerWeek: 1 })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to assign teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to assign teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (subjectId) => {
    if (!window.confirm('Are you sure you want to remove this teacher assignment?')) return
    
    setIsSubmitting(true)
    try {
      await classService.removeSubjectTeacher(id, subjectId)
      toast.success('Teacher removed successfully')
      loadSubjectTeachers()
      setOpenMenuId(null)
    } catch (error) {
      console.error('Failed to remove teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to remove teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAvailableSubjects = () => {
    const assignedSubjectIds = subjectTeachers.map(st => st.subjectId?._id || st.subjectId)
    let available = currentClass?.subjects?.filter(s => !assignedSubjectIds.includes(s._id)) || []
    
    if (searchTerm) {
      available = available.filter(s => 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return available
  }

  const clearSearch = () => setSearchTerm('')
  const hasActiveSearch = searchTerm

  if (isLoading) return <LoadingSpinner />

  const totalSubjects = currentClass?.subjects?.length || 0
  const assignedCount = subjectTeachers.length
  const remainingCount = totalSubjects - assignedCount

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/classes/${id}`)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Subject-Teacher Mapping</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Assign teachers to subjects for <span className="font-medium text-gray-700">{currentClass?.displayName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Subjects</p>
          <p className="text-xl font-bold text-gray-900">{totalSubjects}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Assigned</p>
          <p className="text-xl font-bold text-emerald-600">{assignedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="text-xl font-bold text-amber-600">{remainingCount}</p>
        </div>
      </div>

      {/* Add Assignment Button */}
      {!showForm && remainingCount > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Assign Teacher to Subject</span>
        </button>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">New Assignment</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search within available subjects */}
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search available subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <select
                value={newAssignment.subjectId}
                onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select Subject</option>
                {getAvailableSubjects().map(s => (
                  <option key={s._id} value={s._id}>{s.name} {s.code && `(${s.code})`}</option>
                ))}
              </select>
              {hasActiveSearch && getAvailableSubjects().length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No subjects match "{searchTerm}"</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
              <select
                value={newAssignment.teacherId}
                onChange={(e) => setNewAssignment({ ...newAssignment, teacherId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select Teacher</option>
                {staff.map(s => (
                  <option key={s._id} value={s._id}>{s.name} {s.staffCode && `(${s.staffCode})`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periods/Week</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newAssignment.periodsPerWeek}
                  onChange={(e) => setNewAssignment({ ...newAssignment, periodsPerWeek: parseInt(e.target.value) || 1 })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  min="1"
                  max="12"
                />
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Assign</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Current Assignments ({subjectTeachers.length})</h3>
        </div>
        {subjectTeachers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No teachers assigned yet</p>
            {remainingCount > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Assign your first teacher →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Periods/Week</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjectTeachers.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {item.subjectId?.name || item.subjectName}
                        </span>
                        {(item.subjectId?.code || item.subjectCode) && (
                          <span className="text-xs text-gray-400">({item.subjectId?.code || item.subjectCode})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-xs">
                            {(item.teacherId?.name || item.teacherName)?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{item.teacherId?.name || item.teacherName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                        {item.periodsPerWeek} periods/week
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative" ref={menuRef}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === item.subjectId?._id || item.subjectId ? (item.subjectId?._id || item.subjectId) : index ? null : index)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        {/* Confirm remove on click - direct delete with confirmation */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-blue-800">About Subject-Teacher Mapping</p>
          <p className="text-xs text-blue-700 mt-1">
            Teachers assigned here will be able to enter marks for their subjects. 
            Class teachers can enter marks for all subjects by default.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SubjectTeacherMapping