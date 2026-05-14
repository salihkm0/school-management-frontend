// src/components/subjects/SubjectList.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { fetchSubjects, deleteSubject } from '../../store/slices/subjectSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import useDebounce from '../../hooks/useDebounce'

const SubjectList = () => {
  const dispatch = useDispatch()
  const { subjects, isLoading, pagination } = useSelector((state) => state.subjects)
  const [searchInput, setSearchInput] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)
  const debouncedSearch = useDebounce(searchInput, 500)

  useEffect(() => {
    dispatch(fetchSubjects({ 
      search: debouncedSearch, 
      type: filterType,
      department: filterDepartment,
      limit: 20,
      page: currentPage
    }))
  }, [dispatch, debouncedSearch, filterType, filterDepartment, currentPage])

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
    if (selectedSubject) {
      await dispatch(deleteSubject(selectedSubject._id))
      setShowDeleteModal(false)
      setSelectedSubject(null)
      setOpenMenuId(null)
    }
  }

  const handlePageChange = (page) => setCurrentPage(page)
  const clearSearch = () => setSearchInput('')
  const clearFilters = () => {
    setFilterType('')
    setFilterDepartment('')
    setSearchInput('')
    setCurrentPage(1)
  }
  
  const hasActiveFilters = searchInput || filterType || filterDepartment
  const totalSubjects = pagination?.total || subjects.length

  // Get unique departments from subjects
  const departments = [...new Set(subjects.map(s => s.department).filter(Boolean))]

  if (isLoading && subjects.length === 0) return <LoadingSpinner />

  const getTypeBadge = (type) => {
    const styles = {
      core: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20',
      elective: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20',
      optional: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20'
    }
    return styles[type] || styles.optional
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Subjects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all subjects offered in the school</p>
        </div>
        <div className="flex gap-2">
          <Link to="/subjects/template" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all">
            <DocumentArrowUpIcon className="w-4 h-4" />
            <span>Templates</span>
          </Link>
          <Link to="/subjects/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm">
            <PlusIcon className="w-4 h-4" />
            <span>Add Subject</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
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
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
              {(searchInput ? 1 : 0) + (filterType ? 1 : 0) + (filterDepartment ? 1 : 0)}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
            <XMarkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Clear all</span>
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                <option value="">All Types</option>
                <option value="core">Core</option>
                <option value="elective">Elective</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
              <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                <option value="">All Departments</option>
                <option value="Languages">Languages</option>
                <option value="Sciences">Sciences</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Social Sciences">Social Sciences</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Humanities">Humanities</option>
                {departments.filter(d => !['Languages', 'Sciences', 'Mathematics', 'Social Sciences', 'Computer Science', 'Commerce', 'Humanities'].includes(d)).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Subjects</p>
          <p className="text-xl font-bold text-gray-900">{totalSubjects}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Core Subjects</p>
          <p className="text-xl font-bold text-emerald-600">{subjects.filter(s => s.type === 'core').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Elective</p>
          <p className="text-xl font-bold text-blue-600">{subjects.filter(s => s.type === 'elective').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Optional</p>
          <p className="text-xl font-bold text-gray-600">{subjects.filter(s => s.type === 'optional').length}</p>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-gray-500">
          {totalSubjects > 0 ? (
            <>Showing <span className="font-medium text-gray-900">{((currentPage - 1) * 20) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * 20, totalSubjects)}</span> of <span className="font-medium text-gray-900">{totalSubjects}</span> subjects</>
          ) : 'No subjects found'}
        </p>
      </div>

      {/* Subjects Table */}
      {subjects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No Subjects Found</h3>
          <p className="text-sm text-gray-500">{searchInput ? `No subjects matching "${searchInput}"` : 'No subjects found'}</p>
          {searchInput && <button onClick={clearSearch} className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm">Clear search →</button>}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Credit Hrs</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((subject) => (
                  <tr key={subject._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-semibold text-sm">{subject.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{subject.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono hidden sm:table-cell">{subject.code}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getTypeBadge(subject.type)}`}>
                        {subject.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{subject.department || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{subject.creditHours || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/subjects/${subject._id}`} className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors" title="View Details">
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <Link to={`/subjects/${subject._id}/edit`} className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors" title="Edit Subject">
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <button onClick={() => { setSelectedSubject(subject); setShowDeleteModal(true); }} className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="Delete Subject">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination?.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">Page {currentPage} of {pagination.pages}</div>
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum = pagination.pages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= pagination.pages - 2 ? pagination.pages - 4 + i : currentPage - 2 + i;
                    return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`min-w-[32px] h-8 px-2 text-sm rounded-lg ${currentPage === pageNum ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{pageNum}</button>
                  })}
                </div>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.pages} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center"><TrashIcon className="w-5 h-5 text-rose-600" /></div>
                <div><h3 className="text-base font-semibold text-gray-900">Deactivate Subject</h3><p className="text-xs text-gray-500">This will mark the subject as inactive</p></div>
              </div>
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to deactivate <span className="font-medium text-gray-900">{selectedSubject?.name}</span>?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700">Deactivate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubjectList