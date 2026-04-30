// src/components/classes/ClassList.jsx
import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  UserGroupIcon, 
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { fetchClasses, deleteClass } from '../../store/slices/classSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmModal from '../common/Modal'
import useDebounce from '../../hooks/useDebounce'

const ClassList = () => {
  const dispatch = useDispatch()
  const { classes, isLoading } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  const [selectedYear, setSelectedYear] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)

  // Load academic years on mount
  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  // Set default selected year when academic years load
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const currentYear = academicYears.find(y => y.isCurrent)
      setSelectedYear(currentYear?._id || academicYears[0]?._id || '')
    }
  }, [academicYears, selectedYear])

  // Fetch classes when selected year or debounced search changes
  useEffect(() => {
    if (selectedYear) {
      console.log('Fetching classes for year:', selectedYear, 'search:', debouncedSearch)
      dispatch(fetchClasses({ academicYearId: selectedYear, limit: 100, search: debouncedSearch }))
    }
  }, [dispatch, selectedYear, debouncedSearch])

  const handleDelete = async () => {
    if (selectedClass) {
      await dispatch(deleteClass({ id: selectedClass._id }))
      setShowDeleteModal(false)
      setSelectedClass(null)
      // Refresh the list
      dispatch(fetchClasses({ academicYearId: selectedYear, limit: 100, search: debouncedSearch }))
    }
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleYearChange = (e) => {
    const value = e.target.value
    setSelectedYear(value)
    setSearchInput('') // Clear search when changing year
  }

  if (isLoading && classes.length === 0) {
    return <LoadingSpinner />
  }

  // Filter classes locally for display (already filtered by API, but we can do additional client-side filtering if needed)
  const displayClasses = classes

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">Manage all classes and sections</p>
        </div>
        <Link 
          to="/classes/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Class</span>
        </Link>
      </div>

      {/* Filters - No form element */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select 
              value={selectedYear} 
              onChange={handleYearChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select Year</option>
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Class</label>
            <input
              type="text"
              placeholder="Search by class name or teacher..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Classes</p>
          <p className="text-2xl font-bold text-gray-900">{displayClasses.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">
            {displayClasses.reduce((sum, cls) => sum + (cls.studentCount || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Avg. Students/Class</p>
          <p className="text-2xl font-bold text-gray-900">
            {displayClasses.length > 0 
              ? Math.round(displayClasses.reduce((sum, cls) => sum + (cls.studentCount || 0), 0) / displayClasses.length)
              : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Subjects</p>
          <p className="text-2xl font-bold text-gray-900">
            {displayClasses.reduce((sum, cls) => sum + (cls.subjects?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Classes Table */}
      {displayClasses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Classes Found</h3>
          <p className="text-gray-500">
            {searchInput 
              ? `No classes found matching "${searchInput}"` 
              : 'No classes found for the selected academic year.'}
          </p>
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Clear search →
            </button>
          )}
          {!searchInput && (
            <Link 
              to="/classes/new" 
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Your First Class</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {displayClasses.map((cls) => (
                  <tr key={cls._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{cls.displayName || cls.name}</p>
                          <p className="text-xs text-gray-500">Section: {cls.section || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cls.classTeacherName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {cls.classTeacherName.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700">{cls.classTeacherName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{cls.studentCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <BookOpenIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{cls.subjects?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/classes/${cls._id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/classes/${cls._id}/edit`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Class"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => { setSelectedClass(cls); setShowDeleteModal(true) }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Class"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => { setShowDeleteModal(false); setSelectedClass(null) }} 
        onConfirm={handleDelete} 
        title="Delete Class" 
        message={`Are you sure you want to delete ${selectedClass?.displayName || selectedClass?.name}? This action cannot be undone.`} 
        confirmText="Delete" 
        confirmVariant="danger" 
      />
    </div>
  )
}

export default ClassList