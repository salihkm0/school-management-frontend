// src/components/exams/ExamList.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon, 
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { fetchExams, deleteExam, publishExam, cloneExam } from '../../store/slices/examSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'

const ExamList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { exams, isLoading } = useSelector((state) => state.exams)
  const { academicYears } = useSelector((state) => state.academicYears)
  
  const [selectedYear, setSelectedYear] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneYear, setCloneYear] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuPosition, setMenuPosition] = useState({})
  const menuRefs = useRef({})
  
  const itemsPerPage = 10
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
      setIsTableLoading(true)
      dispatch(fetchExams({ 
        academicYearId: selectedYear, 
        limit: 100,
        search: debouncedSearch || undefined
      })).finally(() => {
        setIsTableLoading(false)
      })
      setCurrentPage(1)
    }
  }, [dispatch, selectedYear, debouncedSearch])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const filteredExams = React.useMemo(() => {
    let result = exams
    if (filterStatus !== 'all') {
      result = result.filter(exam => exam.overallStatus === filterStatus)
    }
    if (filterType !== 'all') {
      result = result.filter(exam => exam.examType === filterType)
    }
    return result
  }, [exams, filterStatus, filterType])

  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredExams.length / itemsPerPage)

  const handleDelete = async () => {
    if (selectedExam) {
      await dispatch(deleteExam(selectedExam._id))
      setShowDeleteModal(false)
      setSelectedExam(null)
      setOpenMenuId(null)
      dispatch(fetchExams({ academicYearId: selectedYear, limit: 100, search: debouncedSearch || undefined }))
    }
  }

  const handlePublish = async (id) => {
    await dispatch(publishExam(id))
    toast.success('Exam published successfully')
    dispatch(fetchExams({ academicYearId: selectedYear, limit: 100, search: debouncedSearch || undefined }))
    setOpenMenuId(null)
  }

  const handleClone = async () => {
    if (selectedExam && cloneYear) {
      await dispatch(cloneExam({ id: selectedExam._id, newAcademicYearId: cloneYear }))
      setShowCloneModal(false)
      setSelectedExam(null)
      setCloneYear('')
      setOpenMenuId(null)
      dispatch(fetchExams({ academicYearId: selectedYear, limit: 100, search: debouncedSearch || undefined }))
    }
  }

  const handleReview = (examId) => {
    navigate(`/exams/${examId}/review`)
    setOpenMenuId(null)
  }



  const clearSearch = () => {
    setSearchInput('')
  }

  const handleMenuClick = (examId, event) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const windowHeight = window.innerHeight
    
    // Calculate space below and above
    const spaceBelow = windowHeight - rect.bottom
    const spaceAbove = rect.top
    const menuHeight = 280 // Approximate menu height
    
    // Determine menu position
    let position = 'bottom'
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      position = 'top'
    }
    
    setMenuPosition(prev => ({ ...prev, [examId]: position }))
    setOpenMenuId(openMenuId === examId ? null : examId)
  }

  const getStatusBadge = (status) => {
    const config = { 
      draft: 'bg-gray-100 text-gray-600',
      submitted: 'bg-yellow-100 text-yellow-700',
      reviewed: 'bg-blue-100 text-blue-700',
      published: 'bg-green-100 text-green-700'
    }
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config[status] || config.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const typeLabels = {
      unit_test_1: 'Unit Test 1',
      unit_test_2: 'Unit Test 2',
      first_mid_term: 'First mid term examination',
      first_term: 'First term Examination',
      second_mid_term: 'Second mid term examination',
      second_term: 'Second term examination',
      model: 'Model examination',
      annual: 'Annual examination',
      custom: 'Custom'
    };
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        {typeLabels[type] || type?.replace('_', ' ')}
      </span>
    )
  }

  const stats = {
    total: exams.length,
    draft: exams.filter(e => e.overallStatus === 'draft').length,
    submitted: exams.filter(e => e.overallStatus === 'submitted').length,
    reviewed: exams.filter(e => e.overallStatus === 'reviewed').length,
    published: exams.filter(e => e.overallStatus === 'published').length
  }

  // Removed getActionButtons as we will use direct card buttons

  const showTableLoader = isLoading || isTableLoading

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Examinations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all your examinations</p>
        </div>
        <Link 
          to="/exams/new" 
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Exam</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Draft</p>
          <p className="text-xl font-semibold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Submitted</p>
          <p className="text-xl font-semibold text-yellow-600">{stats.submitted}</p>
        </div>
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Reviewed</p>
          <p className="text-xl font-semibold text-blue-600">{stats.reviewed}</p>
        </div>
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Published</p>
          <p className="text-xl font-semibold text-green-600">{stats.published}</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-md border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">Select Year</option>
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
              {searchInput && (
                <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Exam Type</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="unit_test_1">Unit Test 1</option>
              <option value="unit_test_2">Unit Test 2</option>
              <option value="first_mid_term">First mid term examination</option>
              <option value="first_term">First term Examination</option>
              <option value="second_mid_term">Second mid term examination</option>
              <option value="second_term">Second term examination</option>
              <option value="model">Model examination</option>
              <option value="annual">Annual examination</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative min-h-[400px]">
        {showTableLoader && paginatedExams.length === 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-md">
            <LoadingSpinner />
          </div>
        )}
        
        {paginatedExams.length === 0 && !showTableLoader ? (
          <div className="bg-white rounded-md border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpenIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-800 mb-1">No Exams Found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
            {(searchInput || filterStatus !== 'all' || filterType !== 'all') && (
              <button
                onClick={() => { setSearchInput(''); setFilterStatus('all'); setFilterType('all'); }}
                className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                Clear all filters →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedExams.map((exam) => {
                const canEditDelete = user?.role === 'admin' || exam.createdBy?._id === user?._id || exam.createdBy === user?._id;
                
                return (
                  <div key={exam._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="p-4 sm:p-5 border-b border-gray-100 flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpenIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900 line-clamp-1" title={exam.displayName || exam.name}>{exam.displayName || exam.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{exam.term?.charAt(0).toUpperCase() + exam.term?.slice(1)} Term</p>
                          </div>
                        </div>
                        {getStatusBadge(exam.overallStatus)}
                      </div>
                      
                      <div className="space-y-3 mb-5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span>{new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <UsersIcon className="w-4 h-4 text-gray-400" />
                          <span>{exam.classIds?.length || 0} Classes Included</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        {getTypeBadge(exam.examType)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                      <button
                        onClick={() => navigate(`/exams/${exam._id}`)}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      
                      {canEditDelete && (
                        <button
                          onClick={() => navigate(`/exams/${exam._id}/edit`)}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Exam"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      

                      {exam.overallStatus === 'submitted' && (
                        <button
                          onClick={() => handleReview(exam._id)}
                          className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 font-medium text-sm ml-1"
                          title="Review Marks"
                        >
                          <ChartBarIcon className="w-4 h-4" />
                          <span>Review</span>
                        </button>
                      )}
                      
                      {exam.overallStatus !== 'published' && exam.overallStatus !== 'reviewed' && exam.overallStatus !== 'submitted' && (
                        <button
                          onClick={() => handlePublish(exam._id)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Publish Exam"
                        >
                          <CheckBadgeIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => { setSelectedExam(exam); setShowCloneModal(true) }}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Clone Exam"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      
                      {canEditDelete && (
                        <button
                          onClick={() => { setSelectedExam(exam); setShowDeleteModal(true) }}
                          className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Exam"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center sm:justify-between px-3 sm:px-4 py-3 gap-3 sm:gap-0 bg-white rounded-md border border-gray-200 mt-4">
                <div className="text-xs text-gray-500 w-full text-center sm:text-left sm:w-auto">
                  {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredExams.length)} of {filteredExams.length}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[32px] h-8 px-2 text-sm rounded-md transition-colors ${
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowDeleteModal(false); setSelectedExam(null) }} />
          <div className="relative bg-white rounded-md shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Exam</h3>
              <p className="text-gray-600 mb-5">
                Are you sure you want to delete "{selectedExam?.displayName || selectedExam?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedExam(null) }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowCloneModal(false); setSelectedExam(null); setCloneYear('') }} />
          <div className="relative bg-white rounded-md shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Clone Exam</h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Clone "{selectedExam?.displayName || selectedExam?.name}" to:
                </p>
                <select 
                  value={cloneYear} 
                  onChange={(e) => setCloneYear(e.target.value)} 
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.filter(y => y._id !== selectedExam?.academicYearId).map(y => (
                    <option key={y._id} value={y._id}>{y.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => { setShowCloneModal(false); setSelectedExam(null); setCloneYear('') }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClone}
                  disabled={!cloneYear}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  Clone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamList