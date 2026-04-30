// src/pages/staff/StaffExamsPage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpenIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { fetchExams, fetchExamById } from '../../store/slices/examSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchTeacherClassTeacherClasses, clearTeacherClasses } from '../../store/slices/classSlice'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import { getMarksheetsByClass, bulkUpdateMarks, getTeacherPermissions } from '../../services/markService'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import toast from 'react-hot-toast'

const StaffExamsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { staff, isLoading: staffLoading } = useSelector((state) => state.staff)
  const { exams, isLoading: examsLoading, currentExam } = useSelector((state) => state.exams)
  const { teacherClassTeacherClasses, isLoading: classesLoading } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { subjects } = useSelector((state) => state.subjects)
  
  const [myClasses, setMyClasses] = useState([])
  const [availableExams, setAvailableExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [examMarks, setExamMarks] = useState(null)
  const [permissions, setPermissions] = useState(null)
  const [expandedStudent, setExpandedStudent] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMarks, setEditedMarks] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [examSubjects, setExamSubjects] = useState([])
  const [newSubject, setNewSubject] = useState({ subjectId: '', maxMarks: 100, passingMarks: 40, practicalMarks: 0 })

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
    }
  }, [teacherClassTeacherClasses])

  useEffect(() => {
    if (myClasses.length > 0 && exams.length > 0) {
      filterAvailableExams()
    }
  }, [exams, myClasses])

  useEffect(() => {
    if (selectedExam && selectedExam._id) {
      loadExamSubjects()
    }
  }, [selectedExam])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        dispatch(fetchStaff({ limit: 100 })),
        dispatch(fetchExams({ limit: 100 })),
        dispatch(fetchAcademicYears({ limit: 10 })),
        dispatch(fetchSubjects({ limit: 100 }))
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExamSubjects = async () => {
    if (selectedExam?.subjects && selectedExam.subjects.length > 0) {
      setExamSubjects(selectedExam.subjects)
    } else if (selectedExam?._id) {
      try {
        await dispatch(fetchExamById(selectedExam._id))
      } catch (error) {
        console.error('Failed to load exam subjects:', error)
      }
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

  const filterAvailableExams = () => {
    const classIds = myClasses.map(c => c._id)
    const relevantExams = exams.filter(exam => 
      exam.classIds?.some(cid => classIds.includes(cid._id || cid))
    )
    
    relevantExams.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    setAvailableExams(relevantExams)
  }

  const handleExamSelect = async (exam) => {
    setSelectedExam(exam)
    setSelectedClass(null)
    setExamMarks(null)
    setPermissions(null)
    setIsEditing(false)
    setEditedMarks({})
    
    // Load full exam details including subjects
    if (exam._id) {
      try {
        await dispatch(fetchExamById(exam._id))
      } catch (error) {
        console.error('Failed to load exam details:', error)
      }
    }
  }

  const handleClassSelect = async (classObj) => {
    if (!selectedExam) return
    
    setSelectedClass(classObj)
    setIsEditing(false)
    setEditedMarks({})
    setIsLoading(true)
    
    try {
      const permRes = await getTeacherPermissions(selectedExam._id, classObj._id)
      setPermissions(permRes.data)
      
      const marksRes = await getMarksheetsByClass(selectedExam._id, classObj._id)
      if (marksRes.success && marksRes.data) {
        setExamMarks(marksRes.data)
        
        // Initialize edited marks with current values or default 0
        const initialMarks = {}
        marksRes.data.students?.forEach(student => {
          initialMarks[student.studentId] = {}
          marksRes.data.subjects?.forEach(subject => {
            const studentSubject = student.subjects?.find(
              s => s.subjectId === subject.subjectId
            )
            initialMarks[student.studentId][subject.subjectId] = {
              theoryScore: studentSubject?.theoryScore || 0,
              practicalScore: studentSubject?.practicalScore || 0,
              totalScore: studentSubject?.totalScore || 0
            }
          })
        })
        setEditedMarks(initialMarks)
      }
    } catch (error) {
      console.error('Failed to load exam data:', error)
      toast.error('Failed to load exam data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkChange = (studentId, subjectId, field, value) => {
    let marks = value === "" || value === null ? 0 : parseInt(value) || 0
    
    const subject = examMarks?.subjects?.find(s => s.subjectId === subjectId)
    const maxMarks = field === "theoryScore" 
      ? (subject?.theoryMaxMarks || subject?.maxMarks || 100)
      : (subject?.practicalMaxMarks || 0)
    
    if (marks > maxMarks) marks = maxMarks
    if (marks < 0) marks = 0

    setEditedMarks(prev => {
      const studentMarks = prev[studentId] || {}
      const subjectMarks = studentMarks[subjectId] || { theoryScore: 0, practicalScore: 0 }
      
      const updatedSubjectMarks = {
        ...subjectMarks,
        [field]: marks,
      }
      
      updatedSubjectMarks.totalScore = (updatedSubjectMarks.theoryScore || 0) + (updatedSubjectMarks.practicalScore || 0)
      
      return {
        ...prev,
        [studentId]: {
          ...studentMarks,
          [subjectId]: updatedSubjectMarks,
        },
      }
    })
  }

  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedClass) return
    
    setIsSaving(true)
    try {
      // Prepare students data for bulk update
      const studentsData = examMarks?.students?.map(student => {
        const studentMarks = editedMarks[student.studentId] || {}
        
        return {
          studentId: student.studentId,
          subjects: examMarks.subjects.map(subject => {
            const marks = studentMarks[subject.subjectId] || { theoryScore: 0, practicalScore: 0 }
            return {
              subjectId: subject.subjectId,
              theoryScore: marks.theoryScore || 0,
              practicalScore: marks.practicalScore || 0,
              remarks: ""
            }
          }),
          remarks: student.remarks || ""
        }
      })
      
      await bulkUpdateMarks(selectedExam._id, selectedClass._id, studentsData)
      toast.success('Marks saved successfully')
      
      // Reload data
      await handleClassSelect(selectedClass)
    } catch (error) {
      console.error('Failed to save marks:', error)
      toast.error(error.response?.data?.message || 'Failed to save marks')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetAllMarks = (studentId, subjectId, marks) => {
    let theoryMarks = parseInt(marks) || 0
    const subject = examMarks?.subjects?.find(s => s.subjectId === subjectId)
    const maxMarks = subject?.theoryMaxMarks || subject?.maxMarks || 100
    
    if (theoryMarks > maxMarks) theoryMarks = maxMarks
    if (theoryMarks < 0) theoryMarks = 0
    
    setEditedMarks(prev => {
      const studentMarks = prev[studentId] || {}
      const subjectMarks = studentMarks[subjectId] || { theoryScore: 0, practicalScore: 0 }
      
      const updatedSubjectMarks = {
        ...subjectMarks,
        theoryScore: theoryMarks,
      }
      
      updatedSubjectMarks.totalScore = updatedSubjectMarks.theoryScore + (updatedSubjectMarks.practicalScore || 0)
      
      return {
        ...prev,
        [studentId]: {
          ...studentMarks,
          [subjectId]: updatedSubjectMarks,
        },
      }
    })
  }

  const getExamStatus = (exam) => {
    if (exam.overallStatus === 'published') return { label: 'Published', color: 'bg-green-100 text-green-800' }
    if (exam.overallStatus === 'reviewed') return { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' }
    if (exam.overallStatus === 'submitted') return { label: 'Submitted', color: 'bg-blue-100 text-blue-800' }
    return { label: 'Draft', color: 'bg-gray-100 text-gray-800' }
  }

  const getCurrentMarkValue = (studentId, subjectId, field) => {
    return editedMarks[studentId]?.[subjectId]?.[field] || 0
  }

  if (isLoading || staffLoading || examsLoading || classesLoading) {
    return <LoadingSpinner />
  }

  if (myClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Classes Assigned
            </h3>
            <p className="text-gray-500">
              You are not assigned as a class teacher for any class.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check if selected exam has subjects configured
  const examHasSubjects = selectedExam?.subjects && selectedExam.subjects.length > 0
  const examSubjectsList = selectedExam?.subjects || examSubjects

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-xl p-3">
                <BookOpenIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Exams & Marks</h1>
                <p className="text-primary-100 mt-1">
                  Manage exam marks for your class (Class Teacher)
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                filterAvailableExams()
                if (selectedExam && selectedClass) {
                  handleClassSelect(selectedClass)
                }
              }}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Academic Year Info */}
        {currentAcademicYear && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-blue-700">
            📅 Academic Year: {currentAcademicYear.name} ({currentAcademicYear.year})
          </div>
        )}

        {/* Class Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">My Class</h3>
          <div className="flex flex-wrap gap-3">
            {myClasses.map((cls) => (
              <button
                key={cls._id}
                onClick={() => {
                  setSelectedClass(cls)
                  setIsEditing(false)
                  setExamMarks(null)
                  setSelectedExam(null)
                }}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedClass?._id === cls._id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cls.displayName || `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        {selectedClass && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Exams List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-primary-50 to-white border-b">
                  <h2 className="font-semibold text-gray-800">Available Exams</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Select an exam to manage marks</p>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {availableExams.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 text-sm">No exams available for your class</p>
                    </div>
                  ) : (
                    availableExams.map((exam) => {
                      const status = getExamStatus(exam)
                      const isSelected = selectedExam?._id === exam._id
                      const hasSubjects = exam.subjects && exam.subjects.length > 0
                      
                      return (
                        <button
                          key={exam._id}
                          onClick={() => handleExamSelect(exam)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-medium text-gray-800 text-sm">
                              {exam.displayName || exam.name}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              {exam.subjects?.length || 0} subjects
                            </p>
                            {!hasSubjects && (
                              <span className="text-xs text-orange-500">⚠️ No subjects configured</span>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Marks Entry */}
            <div className="lg:col-span-2">
              {!selectedExam ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Select an Exam
                  </h3>
                  <p className="text-gray-500">
                    Choose an exam from the left panel to enter or manage marks
                  </p>
                </div>
              ) : !examHasSubjects ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="w-10 h-10 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Subjects Configured
                  </h3>
                  <p className="text-gray-500">
                    This exam doesn't have any subjects configured yet.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Please ask an admin to configure subjects for this exam before entering marks.
                  </p>
                </div>
              ) : (
                <>
                  {/* Exam Info Header */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {selectedExam.displayName || selectedExam.name}
                        </h2>
                        <div className="flex gap-3 mt-2">
                          <span className="text-sm text-gray-500">
                            📅 {new Date(selectedExam.startDate).toLocaleDateString()} - {new Date(selectedExam.endDate).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            📚 {selectedExam.subjects?.length} Subjects
                          </span>
                          <span className="text-sm text-gray-500">
                            🎓 {selectedClass?.displayName || `${selectedClass?.name}${selectedClass?.section ? `-${selectedClass.section}` : ''}`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-sm rounded-full ${getExamStatus(selectedExam).color}`}>
                          {getExamStatus(selectedExam).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subjects List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Exam Subjects</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExam.subjects?.map((subject, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
                        >
                          <span className="font-medium">{subject.subjectName}</span>
                          <span className="text-gray-500 ml-2">
                            Max: {subject.maxMarks || subject.termMaxMarks} | 
                            Pass: {subject.passingMarks || subject.termPassingMarks}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marks Entry Section */}
                  {examMarks && permissions && (
                    <>
                      {/* Action Buttons */}
                      <div className="flex gap-2 mb-4 justify-end">
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center gap-2"
                            disabled={permissions?.classStatus === 'submitted' || permissions?.classStatus === 'reviewed'}
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>Edit Marks</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setIsEditing(false)
                                handleClassSelect(selectedClass)
                              }}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm flex items-center gap-2"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={handleSaveMarks}
                              disabled={isSaving}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                              <CheckIcon className="w-4 h-4" />
                              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                          </>
                        )}
                        
                        {permissions?.canSubmit && permissions?.classStatus === 'draft' && (
                          <Link
                            to={`/marks/class/${selectedExam._id}/${selectedClass._id}`}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm flex items-center gap-2"
                          >
                            <ClipboardDocumentCheckIcon className="w-4 h-4" />
                            <span>Full Marks Entry</span>
                          </Link>
                        )}
                      </div>

                      {permissions?.classStatus === 'submitted' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700">
                          ⚠️ Marks have been submitted for review. Editing is disabled.
                        </div>
                      )}

                      {permissions?.classStatus === 'reviewed' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
                          ✅ Marks have been reviewed. Waiting for publication.
                        </div>
                      )}

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 bg-gradient-to-r from-primary-50 to-white border-b">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                Student Marks - {selectedClass?.displayName}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Total Students: {examMarks.students?.length || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Students List */}
                        <div className="divide-y divide-gray-100">
                          {examMarks.students?.length === 0 ? (
                            <div className="p-8 text-center">
                              <p className="text-gray-500">No students found in this class</p>
                            </div>
                          ) : (
                            examMarks.students.map((student) => {
                              const isExpanded = expandedStudent === student.studentId
                              
                              return (
                                <div key={student.studentId} className="hover:bg-gray-50">
                                  {/* Student Header */}
                                  <div
                                    className="px-5 py-3 flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedStudent(isExpanded ? null : student.studentId)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-primary-600 font-bold">
                                        {student.studentName?.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-800">{student.studentName}</h4>
                                        <p className="text-xs text-gray-500">
                                          Roll No: {student.rollNumber || '-'} | Admission: {student.admissionNo || '-'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium text-gray-600">
                                        Total: {student.totalPercentage?.toFixed(1) || 0}%
                                      </span>
                                      {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                                    </div>
                                  </div>

                                  {/* Subject Marks (expanded) */}
                                  {isExpanded && (
                                    <div className="px-5 pb-4">
                                      <div className="bg-gray-50 rounded-xl p-4">
                                        <h5 className="text-sm font-medium text-gray-700 mb-3">Subject-wise Marks</h5>
                                        <div className="grid grid-cols-1 gap-3">
                                          {examMarks.subjects?.map((subject) => {
                                            const theoryMarks = isEditing 
                                              ? getCurrentMarkValue(student.studentId, subject.subjectId, "theoryScore")
                                              : (student.subjects?.find(s => s.subjectId === subject.subjectId)?.theoryScore || 0)
                                            const practicalMarks = isEditing 
                                              ? getCurrentMarkValue(student.studentId, subject.subjectId, "practicalScore")
                                              : (student.subjects?.find(s => s.subjectId === subject.subjectId)?.practicalScore || 0)
                                            const totalMarks = theoryMarks + practicalMarks
                                            const percentage = subject.maxMarks > 0 ? (totalMarks / subject.maxMarks) * 100 : 0
                                            
                                            const gradeColor = percentage >= 75 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : percentage >= 40 ? 'text-orange-600' : 'text-red-600'
                                            const theoryMax = subject.theoryMaxMarks || subject.maxMarks
                                            const practicalMax = subject.practicalMaxMarks || 0
                                            
                                            return (
                                              <div key={subject.subjectId} className="bg-white rounded-lg p-3 border border-gray-100">
                                                <div className="flex justify-between items-start mb-2">
                                                  <span className="font-medium text-gray-800 text-sm">{subject.subjectName}</span>
                                                  <div className="flex items-center gap-2">
                                                    {isEditing && (
                                                      <button
                                                        onClick={() => handleSetAllMarks(student.studentId, subject.subjectId, 0)}
                                                        className="text-xs text-gray-400 hover:text-green-600"
                                                        title="Set to 0"
                                                      >
                                                        Reset
                                                      </button>
                                                    )}
                                                    <span className={`text-xs font-semibold ${gradeColor}`}>
                                                      {percentage.toFixed(1)}%
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                  {isEditing ? (
                                                    <>
                                                      <div>
                                                        <label className="text-gray-400">Theory</label>
                                                        <input
                                                          type="number"
                                                          value={theoryMarks}
                                                          onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "theoryScore", e.target.value)}
                                                          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-primary-500"
                                                          min="0"
                                                          max={theoryMax}
                                                        />
                                                        <span className="text-gray-400 text-xs">/{theoryMax}</span>
                                                      </div>
                                                      {practicalMax > 0 && (
                                                        <div>
                                                          <label className="text-gray-400">Practical</label>
                                                          <input
                                                            type="number"
                                                            value={practicalMarks}
                                                            onChange={(e) => handleMarkChange(student.studentId, subject.subjectId, "practicalScore", e.target.value)}
                                                            className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-primary-500"
                                                            min="0"
                                                            max={practicalMax}
                                                          />
                                                          <span className="text-gray-400 text-xs">/{practicalMax}</span>
                                                        </div>
                                                      )}
                                                      <div>
                                                        <label className="text-gray-400">Total</label>
                                                        <p className="font-medium">{totalMarks} / {subject.maxMarks}</p>
                                                      </div>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <div>
                                                        <p className="text-gray-400">Theory</p>
                                                        <p className="font-medium">{theoryMarks} / {theoryMax}</p>
                                                      </div>
                                                      {practicalMax > 0 && (
                                                        <div>
                                                          <p className="text-gray-400">Practical</p>
                                                          <p className="font-medium">{practicalMarks} / {practicalMax}</p>
                                                        </div>
                                                      )}
                                                      <div>
                                                        <p className="text-gray-400">Total</p>
                                                        <p className="font-medium">{totalMarks} / {subject.maxMarks}</p>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                        
                                        {/* Total Summary */}
                                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                          <span className="text-sm font-medium text-gray-700">Total Percentage</span>
                                          <span className="text-lg font-bold text-primary-600">
                                            {student.totalPercentage?.toFixed(1) || 0}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {!examMarks && !isLoading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ChartBarIcon className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Loading Marks Data...
                      </h3>
                      <p className="text-gray-500">
                        Please wait while we load the marks data.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffExamsPage