// src/components/exams/ExamList.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react'
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
  AcademicCapIcon,
  BeakerIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { fetchExams, deleteExam, publishExam, cloneExam } from '../../store/slices/examSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmModal from '../common/Modal'
import toast from 'react-hot-toast'
import useDebounce from '../../hooks/useDebounce'

const ExamList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
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
  const itemsPerPage = 10
  const searchTimeoutRef = useRef(null)
  
  // Use debounce to prevent rapid re-renders
  const debouncedSearch = useDebounce(searchInput, 500)

  // Load academic years only once on mount
  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  // Set initial selected year when academic years load
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const currentYear = academicYears.find(y => y.isCurrent)
      setSelectedYear(currentYear?._id || academicYears[0]?._id || '')
    }
  }, [academicYears, selectedYear])

  // Fetch exams with debounced search - only table data updates
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

  // Filter exams client-side (no API call for these)
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
      // Refresh the list after delete
      dispatch(fetchExams({ academicYearId: selectedYear, limit: 100, search: debouncedSearch || undefined }))
    }
  }

  const handlePublish = async (id) => {
    await dispatch(publishExam(id))
    toast.success('Exam published successfully')
    // Refresh the list after publish
    dispatch(fetchExams({ academicYearId: selectedYear, limit: 100, search: debouncedSearch || undefined }))
  }

  const handleClone = async () => {
    if (selectedExam && cloneYear) {
      await dispatch(cloneExam({ id: selectedExam._id, newAcademicYearId: cloneYear }))
      setShowCloneModal(false)
      setSelectedExam(null)
      setCloneYear('')
      // Refresh the list after clone
      dispatch(fetchExams({ academicYearId: selectedYear, limit: 100, search: debouncedSearch || undefined }))
    }
  }

  const handleReview = (examId) => {
    navigate(`/exams/${examId}/review`)
  }

  const handleEnterMarks = (examId) => {
    navigate(`/exams/marks?examId=${examId}`)
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
  }

  const clearSearch = () => {
    setSearchInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const getStatusBadge = (status) => {
    const config = { 
      draft: { color: 'bg-gray-100 text-gray-700', icon: '📝', label: 'Draft' },
      submitted: { color: 'bg-yellow-100 text-yellow-800', icon: '📤', label: 'Submitted' },
      reviewed: { color: 'bg-blue-100 text-blue-800', icon: '✓', label: 'Reviewed' },
      published: { color: 'bg-green-100 text-green-800', icon: '🎉', label: 'Published' }
    }
    const { color, icon, label } = config[status] || config.draft
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <span className="mr-1">{icon}</span>
        {label}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const types = {
      first: { color: 'bg-emerald-100 text-emerald-800', label: 'First Term' },
      second: { color: 'bg-teal-100 text-teal-800', label: 'Second Term' },
      final: { color: 'bg-purple-100 text-purple-800', label: 'Final Exam' },
      mid: { color: 'bg-amber-100 text-amber-800', label: 'Mid Term' },
      quarterly: { color: 'bg-sky-100 text-sky-800', label: 'Quarterly' },
      half_yearly: { color: 'bg-indigo-100 text-indigo-800', label: 'Half Yearly' },
      annual: { color: 'bg-rose-100 text-rose-800', label: 'Annual' },
      unit_test: { color: 'bg-lime-100 text-lime-800', label: 'Unit Test' },
      class_test: { color: 'bg-orange-100 text-orange-800', label: 'Class Test' }
    }
    const { color, label } = types[type] || { color: 'bg-gray-100 text-gray-800', label: type }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
  }

  const stats = {
    total: exams.length,
    draft: exams.filter(e => e.overallStatus === 'draft').length,
    submitted: exams.filter(e => e.overallStatus === 'submitted').length,
    reviewed: exams.filter(e => e.overallStatus === 'reviewed').length,
    published: exams.filter(e => e.overallStatus === 'published').length
  }

  const canEnterMarks = (exam) => {
    return exam.overallStatus !== 'published' && exam.overallStatus !== 'reviewed'
  }

  // Check if table data is loading
  const showTableLoader = isLoading || isTableLoading

  return (
    <div className="space-y-6">
      {/* Header Section - Static, doesn't re-render on search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
          <p className="text-gray-500 mt-1">Manage and track all your examinations</p>
        </div>
        <Link 
          to="/exams/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create New Exam</span>
        </Link>
      </div>

      {/* Stats Cards - Static, doesn't re-render on search */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Exams</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Draft</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Submitted</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.submitted}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Reviewed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold text-green-600">{stats.published}</p>
        </div>
      </div>

      {/* Filters Section - Static form elements that don't cause full page refresh */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            >
              <option value="">Select Year</option>
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by exam name or type..."
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
              {searchInput && (
                <button 
                  onClick={clearSearch} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Exam Type</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            >
              <option value="all">All Types</option>
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="final">Final Exam</option>
              <option value="mid">Mid Term</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section - Only this part should show loading/refresh */}
      <div className="relative">
        {/* Table Loading Overlay */}
        {showTableLoader && paginatedExams.length === 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
            <LoadingSpinner />
          </div>
        )}
        
        {paginatedExams.length === 0 && !showTableLoader ? (
          <div className="bg-white rounded-lg border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpenIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Exams Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            {(searchInput || filterStatus !== 'all' || filterType !== 'all') && (
              <button
                onClick={() => { setSearchInput(''); setFilterStatus('all'); setFilterType('all'); }}
                className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Clear all filters →
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedExams.map((exam) => (
                      <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <BookOpenIcon className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{exam.displayName || exam.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {exam.examType?.replace('_', ' ')} • {exam.term} Term
                              </p>
                            </div>
                          </div>
                         </td>
                        <td className="px-6 py-4">
                          {getTypeBadge(exam.examType)}
                         </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span>{new Date(exam.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <ClockIcon className="w-4 h-4" />
                              <span>to {new Date(exam.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                         </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <UsersIcon className="w-4 h-4 text-gray-400" />
                            <span>{exam.classIds?.length} class{exam.classIds?.length !== 1 ? 'es' : ''}</span>
                          </div>
                         </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(exam.overallStatus)}
                         </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Link to={`/exams/${exam._id}`} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="View Details">
                              <EyeIcon className="w-4 h-4" />
                            </Link>
                            <Link to={`/exams/${exam._id}/edit`} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit Exam">
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                            {canEnterMarks(exam) && (
                              <button 
                                onClick={() => handleEnterMarks(exam._id)} 
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                title="Enter Marks"
                              >
                                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                              </button>
                            )}
                            {exam.overallStatus === 'submitted' && (
                              <button onClick={() => handleReview(exam._id)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Review Marks">
                                <ClipboardDocumentIcon className="w-4 h-4" />
                              </button>
                            )}
                            {exam.overallStatus !== 'published' && exam.overallStatus !== 'reviewed' && exam.overallStatus !== 'submitted' && (
                              <button onClick={() => handlePublish(exam._id)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Publish Exam">
                                <CheckBadgeIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => { setSelectedExam(exam); setShowCloneModal(true) }} className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Clone Exam">
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedExam(exam); setShowDeleteModal(true) }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Exam">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-100">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredExams.length)} of {filteredExams.length} exams
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => { setShowDeleteModal(false); setSelectedExam(null) }} 
        onConfirm={handleDelete} 
        title="Delete Exam" 
        message={`Are you sure you want to delete "${selectedExam?.displayName || selectedExam?.name}"? This action cannot be undone.`} 
        confirmText="Delete" 
        confirmVariant="danger" 
      />
      
      <ConfirmModal 
        isOpen={showCloneModal} 
        onClose={() => { setShowCloneModal(false); setSelectedExam(null); setCloneYear('') }} 
        onConfirm={handleClone} 
        title="Clone Exam" 
        message={
          <div className="space-y-3">
            <p className="text-gray-700">Clone <span className="font-semibold">{selectedExam?.displayName || selectedExam?.name}</span> to:</p>
            <select 
              value={cloneYear} 
              onChange={(e) => setCloneYear(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select Academic Year</option>
              {academicYears.filter(y => y._id !== selectedExam?.academicYearId).map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        } 
        confirmText="Clone" 
        confirmVariant="primary" 
      />
    </div>
  )
}

export default ExamList