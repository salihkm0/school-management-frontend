// src/components/parents/ParentList.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  EyeIcon, 
  UserPlusIcon, 
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserGroupIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { fetchParents, removeStudentConnection } from '../../store/slices/parentSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'

const ParentList = () => {
  const dispatch = useDispatch()
  const { parents, isLoading, pagination } = useSelector((state) => state.parents)
  const [searchInput, setSearchInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const menuRef = useRef(null)
  
  const debouncedSearch = useDebounce(searchInput, 500)

  useEffect(() => {
    dispatch(fetchParents({ 
      search: debouncedSearch, 
      limit: 20,
      page: currentPage,
      status: filterStatus === 'all' ? undefined : filterStatus
    }))
  }, [dispatch, debouncedSearch, currentPage, filterStatus])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const clearSearch = () => {
    setSearchInput('')
    setCurrentPage(1)
  }
  
  const handlePageChange = (page) => {
    setCurrentPage(page)
    setOpenMenuId(null)
  }

  const hasActiveFilters = searchInput || filterStatus !== 'all'

  const totalParents = pagination?.total || parents.length

  if (isLoading && parents.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Parents Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage parent accounts and student connections</p>
        </div>
        <Link to="/parents/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm">
          <UserPlusIcon className="w-4 h-4" />
          <span>Register Parent</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Parents</p>
          <p className="text-xl font-bold text-gray-900">{totalParents}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-xl font-bold text-gray-900">{parents.reduce((sum, p) => sum + (p.students?.length || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Verified</p>
          <p className="text-xl font-bold text-emerald-600">{parents.reduce((sum, p) => sum + (p.students?.filter(s => s.studentFullName).length || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-amber-600">{parents.reduce((sum, p) => sum + (p.students?.filter(s => !s.studentFullName).length || 0), 0)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or student code..."
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
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                {(searchInput ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={() => { setSearchInput(''); setFilterStatus('all'); setCurrentPage(1); }} className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-gray-500">
          {totalParents > 0 ? (
            <>Showing <span className="font-medium text-gray-900">{((currentPage - 1) * 20) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * 20, totalParents)}</span> of <span className="font-medium text-gray-900">{totalParents}</span> parents</>
          ) : 'No parents found'}
        </p>
      </div>

      {/* Parents Table */}
      {parents.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">No Parents Found</h3>
          <p className="text-sm text-gray-500">No parent records found</p>
          {searchInput && <button onClick={clearSearch} className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm">Clear search →</button>}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Registered</th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parents.map((parent) => (
                  <tr key={parent._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-emerald-700">{parent.fullName?.charAt(0)?.toUpperCase() || 'P'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{parent.fullName}</p>
                          <p className="text-xs text-gray-500 block sm:hidden">{parent.email}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">{parent.occupation || 'No occupation'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1 truncate max-w-[180px]">
                          <EnvelopeIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{parent.email}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <PhoneIcon className="w-3 h-3 text-gray-400" />
                          <span>{parent.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(parent.students || []).slice(0, 2).map((student, idx) => (
                          <span key={idx} className={`inline-flex px-1.5 py-0.5 text-xs rounded-full ${student.studentFullName ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {student.studentCode}
                          </span>
                        ))}
                        {(parent.students || []).length > 2 && (
                          <span className="inline-flex px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                            +{(parent.students || []).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      {/* Desktop: Show eye and edit icons */}
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <Link
                          to={`/parents/${parent._id}`}
                          className="inline-flex p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/parents/${parent._id}/edit`}
                          className="inline-flex p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Parent"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                      </div>
                      
                      {/* Mobile: 3-dot menu */}
                      <div className="relative sm:hidden" ref={menuRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === parent._id ? null : parent._id)
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        
                        {openMenuId === parent._id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <Link
                              to={`/parents/${parent._id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <EyeIcon className="w-4 h-4" />
                              <span>View Details</span>
                            </Link>
                            <Link
                              to={`/parents/${parent._id}/edit`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>Edit Parent</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination?.pages > 1 && (
            <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">Page {currentPage} of {pagination.pages}</div>
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className={`min-w-[28px] h-7 px-1.5 text-xs rounded-lg transition-colors ${
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
      )}
    </div>
  )
}

export default ParentList