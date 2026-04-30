import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  UserGroupIcon,
  ChartBarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { fetchStudents, deleteStudent } from '../../store/slices/studentSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmModal from '../common/Modal'

const StudentList = () => {
  const dispatch = useDispatch()
  const { students, isLoading, pagination } = useSelector((state) => state.students)
  const { classes } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    search: '',
    classId: '',
    academicYearId: '',
    status: 'active',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    loadData()
  }, [searchParams])

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

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
  }

  const handleReset = () => {
    reset({
      search: '',
      classId: '',
      academicYearId: '',
      status: 'active',
    })
    setSearchParams({
      page: 1,
      limit: 20,
      search: '',
      classId: '',
      academicYearId: '',
      status: 'active',
    })
  }

  const handleDelete = async () => {
    if (selectedStudent) {
      await dispatch(deleteStudent(selectedStudent._id))
      setShowDeleteModal(false)
      setSelectedStudent(null)
      loadData()
    }
  }

  const handlePageChange = (newPage) => {
    setSearchParams({ ...searchParams, page: newPage })
  }

  if (isLoading && students.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage all student records</p>
        </div>
        <div className="flex space-x-3">
          {/* Promotion List Button */}
          <Link
            to="/students/promotion-list"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <AcademicCapIcon className="w-5 h-5" />
            <span>Promotion List</span>
          </Link>
          
          {/* Import Button */}
          <Link
            to="/students/import"
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            <span>Import Students</span>
          </Link>
          
          {/* Add Student Button */}
          <Link
            to="/students/new"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Student</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <form onSubmit={handleSubmit(handleSearch)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              {...register('search')}
              type="text"
              placeholder="Search by name, admission no, or student code..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <select
              {...register('classId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.displayName || cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              {...register('academicYearId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year) => (
                <option key={year._id} value={year._id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              {...register('status')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
              <option value="transferred">Transferred</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 font-medium">
                        {student.fullName?.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-xs text-gray-500">{student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.admissionNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.studentCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.className} {student.division}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : student.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : student.status === 'discontinued'
                          ? 'bg-red-100 text-red-800'
                          : student.status === 'transferred'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/students/${student._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/students/${student._id}/edit`}
                        className="text-green-600 hover:text-green-800"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Link>
                      {/* <Link
                        to={`/students/${student._id}/marks`}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <ChartBarIcon className="w-5 h-5" />
                      </Link> */}
                      <button
                        onClick={() => {
                          setSelectedStudent(student)
                          setShowDeleteModal(true)
                        }}
                        className="text-red-600 hover:text-red-800"
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedStudent(null)
        }}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete ${selectedStudent?.fullName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}

export default StudentList