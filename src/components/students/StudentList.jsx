// src/components/students/StudentList.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  FunnelIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { fetchStudents, deleteStudent } from '../../store/slices/studentSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const StudentList = () => {
  const dispatch = useDispatch()
  const { students, isLoading, pagination } = useSelector((state) => state.students)
  const { classes } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  
  const { classId: urlClassId } = useParams()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    search: '',
    classId: urlClassId || '',
    academicYearId: '',
    status: 'active',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)
  
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      search: '',
      classId: urlClassId || '',
      academicYearId: '',
      status: 'active',
    }
  })

  // Listen to URL classId changes
  useEffect(() => {
    if (urlClassId && urlClassId !== searchParams.classId) {
      setSearchParams(prev => ({ ...prev, classId: urlClassId, page: 1 }))
      reset({ ...watch(), classId: urlClassId })
    }
  }, [urlClassId])

  const searchValue = watch('search')

  useEffect(() => {
    loadData()
  }, [searchParams])

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

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

  const loadData = () => {
    dispatch(fetchStudents(searchParams))
  }

  const handleSearch = (data) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      search: data.search,
      classId: data.classId,
      academicYearId: data.academicYearId,
      status: data.status,
    })
    setShowFilters(false)
  }

  const handleReset = () => {
    reset({
      search: '',
      classId: urlClassId || '',
      academicYearId: '',
      status: 'active',
    })
    setSearchParams({
      page: 1,
      limit: 20,
      search: '',
      classId: urlClassId || '',
      academicYearId: '',
      status: 'active',
    })
    setShowFilters(false)
  }

  const handleDelete = async () => {
    if (selectedStudent) {
      await dispatch(deleteStudent(selectedStudent._id))
      setShowDeleteModal(false)
      setSelectedStudent(null)
      setOpenMenuId(null)
      loadData()
    }
  }

  const handlePageChange = (newPage) => {
    setSearchParams({ ...searchParams, page: newPage })
  }

  const handleExport = () => {
    if (!students || students.length === 0) {
      toast.error('No students to export')
      return
    }

    const exportData = students.map((student, index) => ({
      'SL No': index + 1,
      'Admission No': student.admissionNo,
      'Student Name': student.fullName,
      'Class': student.classId ? `${student.classId.name} ${student.classId.section || ''}`.trim() : 'N/A',
      'Roll No': student.rollNumber || 'N/A',
      'Gender': student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other',
      'Contact': student.contact?.primaryPhone || 'N/A',
      'Status': student.status
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
    
    // Auto-size columns roughly
    const colWidths = [
      { wch: 6 }, // SL No
      { wch: 15 }, // Admission No
      { wch: 25 }, // Student Name
      { wch: 10 }, // Class
      { wch: 8 }, // Roll No
      { wch: 10 }, // Gender
      { wch: 15 }, // Contact
      { wch: 10 }, // Status
    ]
    worksheet['!cols'] = colWidths

    XLSX.writeFile(workbook, `Students_Export_${new Date().getTime()}.xlsx`)
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
      inactive: 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20',
      discontinued: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
      transferred: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
      completed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    }
    return styles[status] || styles.active
  }

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      discontinued: 'Discontinued',
      transferred: 'Transferred',
      completed: 'Completed',
    }
    return labels[status] || status
  }

  const hasActiveFilters = Boolean(
    searchParams.search || 
    (!urlClassId && searchParams.classId) || 
    (searchParams.status && searchParams.status !== 'active')
  )

  const activeFilterCount = [
    searchParams.search,
    !urlClassId && searchParams.classId,
    searchParams.status && searchParams.status !== 'active'
  ].filter(Boolean).length;

  if (isLoading && students.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {urlClassId && (
            <button
              onClick={() => {
                const currentClass = classes.find(c => c._id === urlClassId)
                if (currentClass) {
                  const yearId = currentClass.academicYearId?._id || currentClass.academicYearId;
                  if (yearId) {
                    navigate(`/students/years/${yearId}/standards/${encodeURIComponent(currentClass.name)}`)
                  } else {
                    navigate(`/students/standards/${encodeURIComponent(currentClass.name)}`)
                  }
                } else {
                  navigate('/students')
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Students {urlClassId && classes.find(c => c._id === urlClassId) ? `- ${classes.find(c => c._id === urlClassId).name} ${classes.find(c => c._id === urlClassId).section || ''}` : ''}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage all student records and academic information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/students/promotion-list"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            <AcademicCapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Promotion List</span>
            <span className="sm:hidden">Promote</span>
          </Link>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>
          <Link
            to="/students/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, admission number, or student code..."
            value={searchValue}
            onChange={(e) => {
              const value = e.target.value
              reset({ ...watch(), search: value })
              if (value === '') {
                handleReset()
                return
              }
              const timeoutId = setTimeout(() => {
                handleSearch({ ...watch(), search: value })
              }, 500)
              return () => clearTimeout(timeoutId)
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all"
          />
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
            {hasActiveFilters && activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <form onSubmit={handleSubmit(handleSearch)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {!urlClassId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                  <select
                    {...register('classId')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.displayName || cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Academic Year filter removed as per user request */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                  <option value="transferred">Transferred</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-gray-500">
          {pagination.total > 0 ? (
            <>Showing <span className="font-medium text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-900">{pagination.total}</span> students</>
          ) : (
            'No students found'
          )}
        </p>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Admission No
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Student Code
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Status
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No students found</p>
                      <Link to="/students/new" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                        Add your first student →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-medium text-emerald-700">
                            {student.fullName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                            {student.fullName}
                          </div>
                          <div className="text-xs text-gray-500 block sm:hidden">
                            {student.admissionNo}
                          </div>
                          <div className="text-xs text-gray-500 hidden sm:block">
                            {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 font-mono hidden sm:table-cell">
                      {student.admissionNo}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 font-mono hidden md:table-cell">
                      {student.studentCode}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {student.className} {student.division}
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(student.status)}`}>
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      {/* Desktop: Show all icons */}
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <Link
                          to={`/students/${student._id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/students/${student._id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Edit Student"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedStudent(student)
                            setShowDeleteModal(true)
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Student"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Mobile: 3-dot menu */}
                      <div className="relative sm:hidden" ref={menuRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === student._id ? null : student._id)
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        
                        {openMenuId === student._id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 animate-in fade-in zoom-in duration-100">
                            <Link
                              to={`/students/${student._id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <EyeIcon className="w-4 h-4" />
                              <span>View</span>
                            </Link>
                            <Link
                              to={`/students/${student._id}/edit`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>Edit</span>
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedStudent(student)
                                setShowDeleteModal(true)
                                setOpenMenuId(null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum
                  if (pagination.pages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i
                  } else {
                    pageNum = pagination.page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-1.5 sm:px-2 text-xs sm:text-sm rounded-lg transition-colors ${
                        pagination.page === pageNum
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
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <TrashIcon className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Student</h3>
                  <p className="text-xs sm:text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">{selectedStudent?.fullName}</span>? 
                This will permanently remove the student record from the system.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentList