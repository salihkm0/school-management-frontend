// src/pages/staff/MyClassesPage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  Users,
  Calendar,
  BarChart2,
  CheckCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
  BookOpen
} from 'lucide-react'
import { fetchTeacherClassTeacherClasses, clearTeacherClasses } from '../../store/slices/classSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchStudentsByClass, updateStudent } from '../../store/slices/studentSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import BulkRollNumberUpdateModal from '../../components/classes/BulkRollNumberUpdateModal.jsx'
import toast from 'react-hot-toast'

const MyClassesPage = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { staff, isLoading: staffLoading } = useSelector((state) => state.staff)
  const { teacherClassTeacherClasses: teacherClasses, isLoading: classesLoading } = useSelector((state) => state.classes)
  const { students, isLoading: studentsLoading } = useSelector((state) => state.students)
  const { academicYears } = useSelector((state) => state.academicYears)
  
  const [selectedClass, setSelectedClass] = useState(null)
  const [classStudents, setClassStudents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditing, setIsEditing] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false)
  const itemsPerPage = 20

  useEffect(() => {
    loadData()
    return () => {
      dispatch(clearTeacherClasses())
    }
  }, [dispatch])

  useEffect(() => {
    if (academicYears.length > 0) {
      const currentYear = academicYears.find(y => y.isCurrent)
      setCurrentAcademicYear(currentYear)
    }
  }, [academicYears])

  useEffect(() => {
    if (staff.length > 0 && user && currentAcademicYear) {
      getMyClassTeacherClasses()
    }
  }, [staff, user, currentAcademicYear])

  useEffect(() => {
    if (selectedClass) {
      loadClassStudents()
    }
  }, [selectedClass])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        dispatch(fetchStaff({ limit: 1000 })),
        dispatch(fetchAcademicYears({ limit: 10 }))
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMyClassTeacherClasses = async () => {
    const currentStaff = staff.find(s => {
      const staffUserId = s.userId?._id || s.userId
      return staffUserId === user?.id
    })
    
    if (!currentStaff) return
    
    const staffId = currentStaff._id
    
    try {
      const result = await dispatch(fetchTeacherClassTeacherClasses({ 
        teacherId: staffId, 
        academicYearId: currentAcademicYear?._id 
      })).unwrap()
      
      if (result?.data?.length > 0) {
        setSelectedClass(result.data[0])
      }
    } catch (error) {
      console.error('Failed to fetch teacher classes:', error)
    }
  }

  const loadClassStudents = async () => {
    if (!selectedClass) return
    setIsLoading(true)
    try {
      await dispatch(fetchStudentsByClass(selectedClass._id))
      setClassStudents(students)
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditStudent = (student) => {
    setEditingStudent(student)
    setEditFormData({
      fullName: student.fullName || '',
      rollNumber: student.rollNumber || '',
      admissionNo: student.admissionNo || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      address: student.address || '',
      gender: student.gender || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
    })
    setIsEditing(true)
  }

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveStudent = async () => {
    if (!editingStudent) return
    
    setIsSaving(true)
    try {
      await dispatch(updateStudent({
        id: editingStudent._id,
        data: editFormData
      })).unwrap()
      
      toast.success('Student updated successfully')
      setIsEditing(false)
      setEditingStudent(null)
      await loadClassStudents()
    } catch (error) {
      console.error('Failed to update student:', error)
      toast.error(error.message || 'Failed to update student')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingStudent(null)
    setEditFormData({})
  }

  const filteredStudents = classStudents.filter(student =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)

  const handleRefresh = () => {
    getMyClassTeacherClasses()
    if (selectedClass) {
      loadClassStudents()
    }
  }

  if (isLoading || staffLoading || classesLoading) {
    return <LoadingSpinner />
  }

  if (teacherClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              You are not assigned as a class teacher for any class.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 rounded-xl p-2.5">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">My Class</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage students in your class</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-1.5 sm:p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Class Selection & Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Academic Year</label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                {currentAcademicYear?.name || 'Loading...'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Class</label>
              <select
                value={selectedClass?._id || ''}
                onChange={(e) => {
                  const cls = teacherClasses.find(c => c._id === e.target.value)
                  setSelectedClass(cls)
                  setSearchTerm('')
                  setCurrentPage(1)
                  setIsEditing(false)
                  setEditingStudent(null)
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm bg-white"
              >
                {teacherClasses.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.displayName || `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        {selectedClass && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 sm:mb-6">
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedClass.displayName || `${selectedClass.name}${selectedClass.section ? ` - ${selectedClass.section}` : ''}`} Students
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Total Students Enrolled: <span className="font-medium text-gray-700">{classStudents.length || 0}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto mt-3 lg:mt-0">
                <Link
                  to={`/staff/attendance?classId=${selectedClass._id}`}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm flex items-center justify-center gap-2 border border-blue-100 font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Mark Attendance</span>
                </Link>
                <Link
                  to="/staff/marks-entry"
                  className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm flex items-center justify-center gap-2 border border-purple-100 font-medium"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Enter Marks</span>
                </Link>
                <Link
                  to={`/staff/class-marks/${selectedClass._id}`}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2 font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>View Marks</span>
                </Link>
                <button
                  onClick={() => setIsBulkUpdateModalOpen(true)}
                  className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-2 border border-gray-200 font-medium"
                >
                  <Users className="w-4 h-4" />
                  <span>Update Roll No.</span>
                </button>
              </div>
            </div>
            
            {classStudents.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, roll no, or admission no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {studentsLoading && (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Students Table */}
        {selectedClass && !studentsLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Name</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Roll No</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admission No</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent Contact</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {currentStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center">
                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                          {searchTerm ? 'No students found matching your search.' : 'No students enrolled in this class.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentStudents.map((student, index) => (
                      <tr key={student._id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{student.studentCode}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                            {student.rollNumber || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.admissionNo || '-'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{student.parentName || '-'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{student.parentPhone || student.parentEmail || '-'}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-700">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-700">{Math.min(indexOfLastItem, filteredStudents.length)}</span> of <span className="font-medium text-gray-700">{filteredStudents.length}</span> students
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-gray-200 rounded-md disabled:opacity-50 hover:bg-white text-gray-600 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-sm text-gray-600 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-gray-200 rounded-md disabled:opacity-50 hover:bg-white text-gray-600 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {isEditing && editingStudent && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Edit Student</h2>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Roll Number</label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={editFormData.rollNumber}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Admission Number</label>
                  <input
                    type="text"
                    name="admissionNo"
                    value={editFormData.admissionNo}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editFormData.dateOfBirth}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Parent Name</label>
                  <input
                    type="text"
                    name="parentName"
                    value={editFormData.parentName}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Parent Phone</label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={editFormData.parentPhone}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Parent Email</label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={editFormData.parentEmail}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Address</label>
                <textarea
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm border border-gray-200 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudent}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      <BulkRollNumberUpdateModal
        isOpen={isBulkUpdateModalOpen}
        onClose={() => setIsBulkUpdateModalOpen(false)}
        students={classStudents}
        classObj={selectedClass}
        onUpdated={loadClassStudents}
      />
    </div>
  )
}

export default MyClassesPage