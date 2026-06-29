// src/components/classes/ClassList.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  UserGroupIcon, 
  BookOpenIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { fetchClasses, deleteClass, syncAllTemplates } from '../../store/slices/classSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import useDebounce from '../../hooks/useDebounce'

const ClassList = () => {
  const dispatch = useDispatch()
  const { classes, isLoading, pagination } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  const [selectedYear, setSelectedYear] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)
  const debouncedSearch = useDebounce(searchInput, 500)

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const currentYear = academicYears.find(y => y.isCurrent)
      setSelectedYear(currentYear?._id || academicYears[0]?._id || '')
    }
  }, [academicYears, selectedYear])

  useEffect(() => {
    if (selectedYear) {
      dispatch(fetchClasses({ 
        academicYearId: selectedYear, 
        limit: 20, 
        page: currentPage,
        search: debouncedSearch 
      }))
    }
  }, [dispatch, selectedYear, debouncedSearch, currentPage])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
    if (selectedClass) {
      await dispatch(deleteClass({ id: selectedClass._id }))
      setShowDeleteModal(false)
      setSelectedClass(null)
      setOpenMenuId(null)
      dispatch(fetchClasses({ academicYearId: selectedYear, limit: 20, page: currentPage, search: debouncedSearch }))
    }
  }

  const handleSyncTemplates = async () => {
    if (selectedYear) {
      setIsSyncingTemplates(true)
      try {
        await dispatch(syncAllTemplates(selectedYear)).unwrap()
        setShowSyncModal(false)
      } catch (error) {
        console.error('Failed to sync templates:', error)
      } finally {
        setIsSyncingTemplates(false)
      }
    }
  }

  const handlePageChange = (page) => setCurrentPage(page)
  const clearSearch = () => setSearchInput('')
  const hasActiveFilters = searchInput

  const totalClasses = pagination?.total || classes.length

  if (isLoading && classes.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all classes and sections</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedYear && (
            <button 
              onClick={() => setShowSyncModal(true)} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Sync Templates</span>
            </button>
          )}
          <Link to="/classes/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm">
            <PlusIcon className="w-4 h-4" />
            <span>Add Class</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by class name or teacher..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">1</span>}
          </button>
          <div className="flex-1 sm:w-48">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">Select Year</option>
              {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                <option value="">All Years</option>
                {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Classes</p>
          <p className="text-xl font-bold text-gray-900">{totalClasses}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-xl font-bold text-gray-900">{classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Avg Students</p>
          <p className="text-xl font-bold text-gray-900">
            {totalClasses > 0 ? Math.round(classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0) / totalClasses) : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Subjects</p>
          <p className="text-xl font-bold text-gray-900">{classes.reduce((sum, cls) => sum + (cls.subjects?.length || 0), 0)}</p>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-gray-500">
          {totalClasses > 0 ? (
            <>Showing <span className="font-medium text-gray-900">{((currentPage - 1) * 20) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * 20, totalClasses)}</span> of <span className="font-medium text-gray-900">{totalClasses}</span> classes</>
          ) : 'No classes found'}
        </p>
      </div>

      {/* Classes Table - Redesigned for better action buttons */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {classes.length === 0 ? (
          <div className="p-12 text-center">
            <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">No Classes Found</h3>
            <p className="text-sm text-gray-500">{searchInput ? `No classes matching "${searchInput}"` : 'No classes found'}</p>
            {searchInput && <button onClick={clearSearch} className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm">Clear search →</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Class Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Subjects</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes.map((cls) => (
                  <tr key={cls._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cls.displayName || cls.name}</div>
                          <div className="text-xs text-gray-500">Section: {cls.section || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {cls.classTeacherName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-medium text-xs">{cls.classTeacherName.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <span className="text-sm text-gray-700 truncate max-w-[180px]">{cls.classTeacherName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <UserGroupIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{cls.studentCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <BookOpenIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{cls.subjects?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Always show icons on all devices - no dropdown menu */}
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/classes/${cls._id}`}
                          className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/classes/${cls._id}/edit`}
                          className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Edit Class"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => { setSelectedClass(cls); setShowDeleteModal(true); }}
                          className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
        )}

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">Page {currentPage} of {pagination.pages}</div>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum
                  if (pagination.pages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[32px] h-8 px-2 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden border border-rose-200">
            <div className="p-4 sm:p-6 bg-rose-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <TrashIcon className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-rose-900">Delete Class</h3>
                  <p className="text-xs sm:text-sm text-rose-700">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-rose-800 mb-5 sm:mb-6">
                Are you sure you want to delete <span className="font-bold">{selectedClass?.name} {selectedClass?.section && `- ${selectedClass.section}`}</span>? All associated data will be removed.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm shadow-rose-600/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Templates Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSyncingTemplates && setShowSyncModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <ArrowPathIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sync All Templates</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Apply templates to all classes in current year</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
                Are you sure you want to sync subject templates for all classes in the selected academic year? This will update the subjects for all matching classes.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowSyncModal(false)}
                  disabled={isSyncingTemplates}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSyncTemplates}
                  disabled={isSyncingTemplates}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSyncingTemplates && <LoadingSpinner className="w-4 h-4 text-white" />}
                  <span>{isSyncingTemplates ? 'Syncing...' : 'Start Sync'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassList