// src/components/parents/ParentList.jsx
import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  EyeIcon, 
  UserPlusIcon, 
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { fetchParents, removeStudentConnection } from '../../store/slices/parentSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmModal from '../common/Modal'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'

const ParentList = () => {
  const dispatch = useDispatch()
  const { parents, isLoading } = useSelector((state) => state.parents)
  const [searchInput, setSearchInput] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedParent, setSelectedParent] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Use custom debounce hook
  const debouncedSearch = useDebounce(searchInput, 500)

  // Fetch parents when debounced search changes
  useEffect(() => {
    console.log('Fetching parents with search:', debouncedSearch)
    dispatch(fetchParents({ search: debouncedSearch, limit: 100 }))
  }, [dispatch, debouncedSearch])

  const handleRemoveStudent = (parent, studentCode) => {
    setSelectedParent(parent)
    setSelectedStudent(studentCode)
    setShowDeleteModal(true)
  }

  const confirmRemoveStudent = async () => {
    if (selectedParent && selectedStudent) {
      await dispatch(removeStudentConnection({ parentId: selectedParent._id, studentCode: selectedStudent }))
      toast.success('Student connection removed')
      setShowDeleteModal(false)
      setSelectedParent(null)
      setSelectedStudent(null)
      // Refresh the list
      dispatch(fetchParents({ search: debouncedSearch, limit: 100 }))
    }
  }

  const clearSearch = () => {
    setSearchInput('')
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
  }

  // Prevent any form submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  if (isLoading && parents.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parents Directory</h1>
          <p className="text-gray-500 mt-1">Manage parent accounts and student connections</p>
        </div>
        <Link 
          to="/parents/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span>Register Parent</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Parents</p>
          <p className="text-2xl font-bold text-gray-900">{parents.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">
            {parents.reduce((sum, p) => sum + (p.students?.length || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Active Connections</p>
          <p className="text-2xl font-bold text-green-600">
            {parents.reduce((sum, p) => sum + (p.students?.filter(s => s.studentFullName).length || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pending Connections</p>
          <p className="text-2xl font-bold text-orange-600">
            {parents.reduce((sum, p) => sum + (p.students?.filter(s => !s.studentFullName).length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search Bar - No form element */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or student code..."
            value={searchInput}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Parents Table */}
      {parents.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Parents Found</h3>
          <p className="text-gray-500">No parent records found matching your search criteria.</p>
          {searchInput && (
            <button
              onClick={clearSearch}
              className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Clear search →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {parents.map((parent) => (
                  <tr key={parent._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {parent.fullName?.charAt(0)?.toUpperCase() || 'P'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{parent.fullName}</p>
                          <p className="text-xs text-gray-500">{parent.occupation || 'No occupation'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                          <span className="truncate max-w-[180px]">{parent.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <PhoneIcon className="w-4 h-4 text-gray-400" />
                          <span>{parent.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {parent.students?.length === 0 ? (
                          <span className="text-sm text-gray-400">No students</span>
                        ) : (
                          <>
                            {parent.students.slice(0, 2).map((student, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  student.studentFullName
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {student.studentCode}
                              </span>
                            ))}
                            {parent.students.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{parent.students.length - 2}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(parent.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/parents/${parent._id}`}
                        className="inline-flex p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedParent(null)
          setSelectedStudent(null)
        }}
        onConfirm={confirmRemoveStudent}
        title="Remove Student Connection"
        message="Are you sure you want to remove this student connection? The parent will no longer have access to this student's information."
        confirmText="Remove"
        confirmVariant="danger"
      />
    </div>
  )
}

export default ParentList