// src/pages/staff/StaffExamsPage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  Users,
  CheckCircle,
  RefreshCw,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Clock,
  UserCheck,
  Award,
  AlertCircle,
  Menu,
  ChevronRight
} from 'lucide-react'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchTeacherClassTeacherClasses, clearTeacherClasses } from '../../store/slices/classSlice'
import { fetchExamById, deleteExam } from '../../store/slices/examSlice'
import examService from '../../services/examService'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import toast from 'react-hot-toast'

const StaffExamsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { staff, isLoading: staffLoading } = useSelector((state) => state.staff)
  const { teacherClassTeacherClasses, isLoading: classesLoading } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { currentExam, isLoading: examLoading } = useSelector((state) => state.exams)
  
  const [myClasses, setMyClasses] = useState([])
  const [exams, setExams] = useState([])
  const [loadingExams, setLoadingExams] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [examToDelete, setExamToDelete] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    if (teacherClassTeacherClasses.length > 0) {
      setMyClasses(teacherClassTeacherClasses)
      if (teacherClassTeacherClasses.length > 0 && !selectedClass) {
        setSelectedClass(teacherClassTeacherClasses[0])
      }
    }
  }, [teacherClassTeacherClasses])

  useEffect(() => {
    if (selectedClass && currentAcademicYear) {
      loadExamsForClass()
    }
  }, [selectedClass, currentAcademicYear])

  useEffect(() => {
    if (selectedExam && selectedExam._id) {
      dispatch(fetchExamById(selectedExam._id))
    }
  }, [selectedExam, dispatch])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchStaff({ limit: 100 })),
        dispatch(fetchAcademicYears({ limit: 10 }))
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
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
      await dispatch(fetchTeacherClassTeacherClasses({ 
        teacherId: staffId, 
        academicYearId: currentAcademicYear?._id 
      })).unwrap()
    } catch (error) {
      console.error('Failed to fetch teacher classes:', error)
    }
  }

  const loadExamsForClass = async () => {
    if (!selectedClass || !currentAcademicYear) return
    
    setLoadingExams(true)
    try {
      const response = await examService.getStaffExams(currentAcademicYear._id)
      if (response && response.data) {
        const classExams = response.data.filter(exam => 
          exam.classIds?.some(c => (c._id || c) === selectedClass._id)
        )
        setExams(classExams)
        if (classExams.length > 0 && !selectedExam) {
          setSelectedExam(classExams[0])
        } else if (classExams.length === 0) {
          setSelectedExam(null)
          setMobileMenuOpen(true)
        }
      }
    } catch (error) {
      console.error('Failed to load exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoadingExams(false)
    }
  }

  const handleDeleteExam = async () => {
    if (!examToDelete) return
    
    try {
      await dispatch(deleteExam(examToDelete._id)).unwrap()
      toast.success('Exam deleted successfully')
      setShowDeleteModal(false)
      setExamToDelete(null)
      await loadExamsForClass()
      if (exams.length === 1) {
        setSelectedExam(null)
      }
    } catch (error) {
      console.error('Failed to delete exam:', error)
      toast.error(error.response?.data?.message || 'Failed to delete exam')
    }
  }

  const getExamStatus = (status) => {
    const config = { 
      draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft', icon: AlertCircle },
      submitted: { color: 'bg-yellow-100 text-yellow-700', label: 'Submitted', icon: Clock },
      reviewed: { color: 'bg-blue-100 text-blue-700', label: 'Reviewed', icon: UserCheck },
      published: { color: 'bg-green-100 text-green-700', label: 'Published', icon: Award }
    }
    return config[status] || config.draft
  }

  const filteredExams = exams.filter(exam => {
    if (filterStatus !== 'all' && exam.overallStatus !== filterStatus) return false
    if (searchTerm && !exam.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const getSessionLabel = (session) => {
    const labels = { BF: 'Morning', AF: 'Afternoon', FULL: 'Full Day' }
    return labels[session] || session
  }

  if (staffLoading || classesLoading) {
    return <LoadingSpinner />
  }

  if (myClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Classes Assigned
            </h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
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
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">My Exams</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">View and manage exams for your class</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/staff/exams/create?classId=${selectedClass?._id}`}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Create Exam</span>
              </Link>
              <button
                onClick={loadExamsForClass}
                className="p-1.5 sm:p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Class Selection */}
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
                  const cls = myClasses.find(c => c._id === e.target.value)
                  setSelectedClass(cls)
                  setSelectedExam(null)
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm bg-white"
              >
                {myClasses.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.displayName || `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile: Show/Hide Exams List Button */}
        {selectedClass && (
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Menu className="w-5 h-5 text-gray-500" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-gray-500 font-medium">Current Exam</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedExam ? (selectedExam.displayName || selectedExam.name) : 'No Exam Selected'}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${mobileMenuOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {selectedClass && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Panel - Exams List */}
            <div className={`lg:col-span-1 ${!mobileMenuOpen ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">Exams</h2>
                    <span className="text-xs text-gray-500">{filteredExams.length} total</span>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search exams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[400px] lg:max-h-[500px] overflow-y-auto">
                  {loadingExams ? (
                    <div className="p-6 sm:p-8 text-center">
                      <LoadingSpinner />
                    </div>
                  ) : filteredExams.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center">
                      <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No exams found</p>
                      <Link
                        to={`/staff/exams/create?classId=${selectedClass._id}`}
                        className="mt-3 inline-block text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                      >
                        Create your first exam →
                      </Link>
                    </div>
                  ) : (
                    filteredExams.map((exam) => {
                      const status = getExamStatus(exam.overallStatus)
                      const StatusIcon = status.icon
                      const isSelected = selectedExam?._id === exam._id
                      
                      return (
                        <button
                          key={exam._id}
                          onClick={() => {
                            setSelectedExam(exam)
                            setMobileMenuOpen(false)
                          }}
                          className={`w-full p-3 sm:p-4 text-left hover:bg-gray-50 transition-all ${
                            isSelected ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-medium text-gray-800 text-sm">
                              {exam.displayName || exam.name}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(exam.startDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400">
                              📚 {exam.subjects?.length || 0} subjects
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Exam Details */}
            <div className={`lg:col-span-2 ${mobileMenuOpen ? 'hidden lg:block' : 'block'}`}>
              {!selectedExam ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                    Select an Exam
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Choose an exam from the left panel to view details
                  </p>
                </div>
              ) : examLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-12 text-center">
                  <LoadingSpinner />
                </div>
              ) : currentExam ? (
                <>
                  {/* Exam Info Header */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4 sm:mb-6">
                    <div className="p-3 sm:p-5 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            {currentExam.displayName || currentExam.name}
                          </h2>
                          <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                            <span className="text-xs text-gray-500 capitalize">
                              📋 {currentExam.examType?.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              📖 {currentExam.term} Term
                            </span>
                            <span className="text-xs text-gray-500">
                              🎓 {selectedClass?.displayName || selectedClass?.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentExam.overallStatus === 'draft' && (
                            <>
                              <button
                                onClick={() => navigate(`/staff/exams/edit/${currentExam._id}?classId=${selectedClass._id}`)}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs sm:text-sm flex items-center gap-1.5"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setExamToDelete(currentExam)
                                  setShowDeleteModal(true)
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                          {currentExam.overallStatus === 'published' && (
                            <button
                              onClick={() => navigate(`/staff/exams/results/${currentExam._id}?classId=${selectedClass._id}`)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Results</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Date Info */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-5 bg-gray-50/50 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(currentExam.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">End Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(currentExam.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  {currentExam.schedule && currentExam.schedule.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4 sm:mb-6">
                      <div className="px-3 sm:px-5 py-2 sm:py-3 bg-gray-50/50 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Exam Schedule</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[600px] w-full">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/30">
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Subject</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Session</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Theory</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Practical</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Total</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Passing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {currentExam.schedule.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900">
                                  {item.subjectName}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                  {new Date(item.examDate).toLocaleDateString()}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                  {getSessionLabel(item.session)}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                  {item.theoryMarks || item.maxMarks || '-'}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                  {item.practicalMarks > 0 ? item.practicalMarks : '-'}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">
                                  {(item.maxMarks || item.termMaxMarks) + (item.practicalMarks || 0)}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                  {item.passingMarks || item.termPassingMarks}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Subjects Section */}
                  {currentExam.subjects && currentExam.subjects.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-3 sm:px-5 py-2 sm:py-3 bg-gray-50/50 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Subjects Configuration</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[500px] w-full">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/30">
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Subject</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Code</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Theory</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Practical</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">CE</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs font-medium text-gray-500">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {currentExam.subjects.map((subject, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900">
                                  {subject.subjectName}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                  {subject.subjectCode || '-'}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                  {subject.termMaxMarks || subject.maxMarks || '-'}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">
                                  {subject.practicalMaxMarks || '-'}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                  {subject.ceEnabled ? (
                                    <span className="text-xs text-purple-600">{subject.ceMaxMarks} marks</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">
                                  {(subject.termMaxMarks || subject.maxMarks || 0) + (subject.practicalMaxMarks || 0) + (subject.ceMaxMarks || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Loading Exam Details...
                  </h3>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Exam</h3>
              </div>
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to delete "{examToDelete?.displayName || examToDelete?.name}"? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExam}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffExamsPage