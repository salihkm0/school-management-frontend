// src/components/classes/SubjectTeacherMapping.jsx
import React, { useEffect, useState } from 'react'
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
  ChevronRightIcon
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

  useEffect(() => {
    dispatch(fetchClassById(id))
    dispatch(fetchStaff({ role: 'teacher', limit: 100 }))
    dispatch(fetchSubjects({ limit: 100 }))
    loadSubjectTeachers()
  }, [dispatch, id])

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
    } catch (error) {
      console.error('Failed to remove teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to remove teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAvailableSubjects = () => {
    const assignedSubjectIds = subjectTeachers.map(st => st.subjectId?._id || st.subjectId)
    return currentClass?.subjects?.filter(s => !assignedSubjectIds.includes(s._id)) || []
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/classes/${id}`)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject-Teacher Mapping</h1>
          <p className="text-gray-500 mt-1">
            Assign teachers to subjects for <span className="font-medium text-gray-700">{currentClass?.displayName}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Subjects</p>
          <p className="text-2xl font-bold text-gray-900">{currentClass?.subjects?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Assigned Teachers</p>
          <p className="text-2xl font-bold text-green-600">{subjectTeachers.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Remaining Subjects</p>
          <p className="text-2xl font-bold text-orange-600">
            {(currentClass?.subjects?.length || 0) - subjectTeachers.length}
          </p>
        </div>
      </div>

      {/* Add Assignment Button */}
      {!showForm && getAvailableSubjects().length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Assign Teacher to Subject</span>
        </button>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">New Assignment</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={newAssignment.subjectId}
                onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Select Subject</option>
                {getAvailableSubjects().map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select
                value={newAssignment.teacherId}
                onChange={(e) => setNewAssignment({ ...newAssignment, teacherId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Select Teacher</option>
                {staff.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  min="1"
                  max="12"
                />
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center gap-2"
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
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Current Assignments</h3>
        </div>
        {subjectTeachers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No teachers assigned yet</p>
            {getAvailableSubjects().length > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Assign your first teacher →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periods/Week</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {subjectTeachers.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {item.subjectId?.name || item.subjectName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-xs">
                            {(item.teacherId?.name || item.teacherName)?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{item.teacherId?.name || item.teacherName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {item.periodsPerWeek} periods/week
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemove(item.subjectId?._id || item.subjectId)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 ml-auto"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubjectTeacherMapping