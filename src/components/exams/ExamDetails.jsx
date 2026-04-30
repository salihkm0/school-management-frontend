import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchExamById, clearCurrentExam, publishExam } from '../../store/slices/examSlice'
import examService from '../../services/examService'
import { 
  PencilIcon, 
  ArrowLeftIcon, 
  CalendarIcon, 
  BookOpenIcon, 
  ChartBarIcon, 
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
  TrophyIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ExamDetails = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentExam, isLoading } = useSelector((state) => state.exams)
  
  // State for tab data
  const [analytics, setAnalytics] = useState(null)
  const [examClasses, setExamClasses] = useState(null)
  const [examSubjects, setExamSubjects] = useState(null)
  const [examScheduleDetails, setExamScheduleDetails] = useState(null)
  const [classMarksData, setClassMarksData] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(null)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [loadingTab, setLoadingTab] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await dispatch(fetchExamById(id))
      await loadAnalytics()
      await loadExamClasses() // Load classes data for the classes tab
    }
    loadData()
    
    return () => { 
      dispatch(clearCurrentExam())
      setExamClasses(null)
      setExamSubjects(null)
      setExamScheduleDetails(null)
      setAnalytics(null)
      setClassMarksData(null)
    }
  }, [dispatch, id])

  // Load class marks when a class is selected
  useEffect(() => {
    if (selectedClassId) {
      loadClassMarksData(selectedClassId)
    }
  }, [selectedClassId])

  const loadAnalytics = async () => {
    try {
      const res = await examService.getExamAnalytics(id)
      if (res && res.data) {
        setAnalytics(res.data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const loadExamClasses = async () => {
    setLoadingTab(true)
    try {
      const res = await examService.getExamClasses(id)
      if (res && res.data) {
        setExamClasses(res.data)
        // Select the first class with students
        const firstClassWithStudents = res.data.classes?.find(c => c.totalStudents > 0)
        if (firstClassWithStudents) {
          setSelectedClassId(firstClassWithStudents.classId)
        } else if (res.data.classes?.length > 0) {
          setSelectedClassId(res.data.classes[0].classId)
        }
      }
    } catch (error) {
      console.error('Failed to load exam classes:', error)
      toast.error('Failed to load class data')
    } finally {
      setLoadingTab(false)
    }
  }

  const loadClassMarksData = async (classId) => {
    try {
      const res = await examService.getClassMarks(id, classId)
      if (res && res.data) {
        setClassMarksData(res.data)
      }
    } catch (error) {
      console.error('Failed to load class marks:', error)
    }
  }

  const loadExamSubjects = async () => {
    if (examSubjects) return
    setLoadingTab(true)
    try {
      const res = await examService.getExamSubjects(id)
      if (res && res.data) {
        setExamSubjects(res.data)
      } else if (currentExam?.subjects) {
        // Fallback to currentExam subjects
        setExamSubjects({ subjects: currentExam.subjects, totalSubjects: currentExam.subjects.length })
      }
    } catch (error) {
      console.error('Failed to load exam subjects:', error)
    } finally {
      setLoadingTab(false)
    }
  }

  const loadExamScheduleDetails = async () => {
    if (examScheduleDetails) return
    setLoadingTab(true)
    try {
      const res = await examService.getExamScheduleDetails(id)
      if (res && res.data) {
        setExamScheduleDetails(res.data)
      }
    } catch (error) {
      console.error('Failed to load schedule details:', error)
    } finally {
      setLoadingTab(false)
    }
  }

  const handlePublish = async () => {
    try {
      await dispatch(publishExam(id)).unwrap()
      toast.success('Exam published successfully')
      await dispatch(fetchExamById(id))
      await loadAnalytics()
      await loadExamClasses()
    } catch (error) {
      toast.error('Failed to publish exam')
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'classes') {
      // Already loaded via useEffect
    }
    if (tab === 'subjects') loadExamSubjects()
    if (tab === 'schedule') loadExamScheduleDetails()
  }

  if (isLoading || !currentExam) return <LoadingSpinner />

  const InfoRow = ({ label, value, className = '' }) => (
    <div className={`flex justify-between py-2 border-b border-gray-100 last:border-0 ${className}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  )

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.draft}`}>
        {status?.toUpperCase()}
      </span>
    )
  }

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 60) return 'text-yellow-600'
    if (percentage >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getSessionLabel = (session) => {
    const labels = {
      BF: 'Morning',
      AF: 'Afternoon',
      FULL: 'Full Day'
    }
    return labels[session] || session
  }

  const totalClasses = examClasses?.totalClasses || currentExam?.classIds?.length || 0
  const classesSubmitted = examClasses?.classesSubmitted || 0
  const classesReviewed = examClasses?.classesReviewed || 0
  const classesPublished = examClasses?.classesPublished || 0
  const readyForPublish = examClasses?.readyForPublish || false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/exams')} 
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentExam.displayName || currentExam.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-gray-500">{currentExam.academicYear}</p>
              <span className="text-gray-300">•</span>
              <p className="text-gray-500 capitalize">{currentExam.term} Term</p>
              {getStatusBadge(currentExam.overallStatus)}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {currentExam.overallStatus !== 'published' && (
            <button 
              onClick={handlePublish} 
              disabled={!readyForPublish}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                readyForPublish 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!readyForPublish ? 'All classes must be reviewed before publishing' : ''}
            >
              <CheckBadgeIcon className="w-5 h-5" />
              <span>Publish Results</span>
            </button>
          )}
          <Link 
            to={`/exams/${id}/edit`} 
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PencilIcon className="w-5 h-5" />
            <span>Edit Exam</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'schedule', 'subjects', 'classes', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading indicator for tabs */}
      {loadingTab && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && !loadingTab && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-primary-500" />
              Exam Information
            </h2>
            <InfoRow label="Exam Type" value={currentExam.examType?.toUpperCase()} />
            <InfoRow label="Term" value={currentExam.term?.toUpperCase()} />
            <InfoRow label="Start Date" value={new Date(currentExam.startDate).toLocaleDateString()} />
            <InfoRow label="End Date" value={new Date(currentExam.endDate).toLocaleDateString()} />
            <InfoRow label="Duration" value={`${Math.ceil((new Date(currentExam.endDate) - new Date(currentExam.startDate)) / (1000 * 60 * 60 * 24))} days`} />
            {currentExam.resultDeclarationDate && (
              <InfoRow label="Result Date" value={new Date(currentExam.resultDeclarationDate).toLocaleDateString()} />
            )}
            {currentExam.description && (
              <div className="mt-4 pt-2">
                <span className="text-sm text-gray-500">Description</span>
                <p className="text-sm text-gray-700 mt-1">{currentExam.description}</p>
              </div>
            )}
          </div>

          {/* Classes & Subjects Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <BookOpenIcon className="w-5 h-5 mr-2 text-primary-500" />
              Academic Summary
            </h2>
            <InfoRow label="Total Classes" value={totalClasses} />
            <InfoRow label="Total Students" value={analytics?.overallStats?.totalStudents || classMarksData?.summary?.totalStudents || '-'} />
            <InfoRow label="Total Subjects" value={currentExam.subjects?.length} />
            <InfoRow label="Total Max Marks" value={currentExam.totalMaxMarks} />
            <InfoRow label="Has CE" value={currentExam.ceConfig?.enabled || currentExam.subjects?.some(s => s.ceEnabled) ? 'Yes' : 'No'} />
            <InfoRow label="Has Practical" value={currentExam.schedule?.some(s => s.practicalMarks > 0) ? 'Yes' : 'No'} />
          </div>

          {/* Progress Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-primary-500" />
              Progress & Status
            </h2>
            <InfoRow label="Classes Submitted" value={`${classesSubmitted}/${totalClasses}`} />
            <InfoRow label="Classes Reviewed" value={`${classesReviewed}/${totalClasses}`} />
            <InfoRow label="Classes Published" value={`${classesPublished}/${totalClasses}`} />
            <InfoRow label="Ready to Publish" value={readyForPublish ? 'Yes' : 'No'} />
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Overall Progress</span>
                <span>{totalClasses > 0 ? ((classesSubmitted / totalClasses) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalClasses > 0 ? (classesSubmitted / totalClasses) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Exam Settings */}
          {currentExam.settings && (
            <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-3">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-primary-500" />
                Exam Settings
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoRow label="Allow Calculator" value={currentExam.settings.allowCalculator ? 'Yes' : 'No'} />
                <InfoRow label="Open Book" value={currentExam.settings.isOpenBook ? 'Yes' : 'No'} />
                <InfoRow label="Allow Absent" value={currentExam.settings.allowAbsent !== false ? 'Yes' : 'No'} />
                <InfoRow label="Show Rank" value={currentExam.settings.showRank !== false ? 'Yes' : 'No'} />
                <InfoRow label="Grading System" value={currentExam.settings.gradingSystem} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && !loadingTab && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b">
            <h2 className="text-lg font-semibold">Exam Schedule</h2>
          </div>
          {currentExam.schedule?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Theory</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Practical</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Passing</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentExam.schedule.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.subjectName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(s.examDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          s.session === 'BF' ? 'bg-blue-100 text-blue-800' : 
                          s.session === 'AF' ? 'bg-orange-100 text-orange-800' : 
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {getSessionLabel(s.session)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.startTime} - {s.endTime}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.theoryMarks || s.maxMarks || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.practicalMarks > 0 ? s.practicalMarks : '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{(s.maxMarks || s.termMaxMarks) + (s.practicalMarks || 0)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.passingMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No schedule available.</p>
            </div>
          )}
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && !loadingTab && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b">
            <h2 className="text-lg font-semibold">Subjects Configuration</h2>
          </div>
          {currentExam.subjects?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Theory</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Practical</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Passing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Features</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentExam.subjects.map((s, i) => {
                    const totalMax = (s.termMaxMarks || s.maxMarks || 0) + (s.practicalMaxMarks || 0)
                    const hasCE = s.ceEnabled || currentExam.ceConfig?.enabled
                    
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.subjectName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.subjectCode || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.termMaxMarks || s.maxMarks || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.practicalMaxMarks || s.practicalMarks || '-'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{totalMax}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.totalPassingMarks || s.termPassingMarks || s.passingMarks || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {hasCE && <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">CE</span>}
                            {(s.practicalMaxMarks > 0 || s.practicalMarks > 0) && <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Practical</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No subjects configured.</p>
            </div>
          )}
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && !loadingTab && examClasses && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Total Classes</p>
              <p className="text-2xl font-bold text-blue-900">{totalClasses}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
              <p className="text-sm text-yellow-600 font-medium">Submitted</p>
              <p className="text-2xl font-bold text-yellow-900">{classesSubmitted}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Reviewed</p>
              <p className="text-2xl font-bold text-green-900">{classesReviewed}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-600 font-medium">Published</p>
              <p className="text-2xl font-bold text-purple-900">{classesPublished}</p>
            </div>
          </div>

          {/* Classes Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b">
              <h2 className="text-lg font-semibold">Class-wise Progress</h2>
            </div>
            {examClasses.classes?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Completion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examClasses.classes.map((cls, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{cls.className}</div>
                          <div className="text-xs text-gray-500">{cls.section}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cls.totalStudents}</td>
                        <td className="px-6 py-4">{getStatusBadge(cls.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${cls.marksEntryStats?.completionPercentage || 0}%` }} />
                            </div>
                            <span className="text-sm text-gray-600">{cls.marksEntryStats?.completionPercentage?.toFixed(1) || 0}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedClassId(cls.classId)}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
                          >
                            View Marks <ChevronRightIcon className="w-4 h-4 ml-1" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No classes data available.</p>
              </div>
            )}
          </div>

          {/* Student Marks Table */}
          {classMarksData?.students && classMarksData.students.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b">
                <h2 className="text-lg font-semibold">Student Marks - {classMarksData.className || 'Selected Class'}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Theory</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Practical</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Percentage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classMarksData.students.map((student, i) => (
                      student.subjects?.map((subject, j) => (
                        <tr key={`${student.studentId}-${j}`} className="hover:bg-gray-50">
                          {j === 0 && (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900" rowSpan={student.subjects.length}>
                                {student.studentName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600" rowSpan={student.subjects.length}>
                                {student.rollNumber || '-'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-sm text-gray-900">{subject.subjectName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{subject.theoryScore || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{subject.practicalScore || 0}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{subject.totalScore || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{subject.percentage?.toFixed(1) || 0}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              subject.grade === 'A+' ? 'bg-green-100 text-green-800' :
                              subject.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              subject.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                              subject.grade === 'B' ? 'bg-cyan-100 text-cyan-800' :
                              subject.grade === 'C+' ? 'bg-yellow-100 text-yellow-800' :
                              subject.grade === 'C' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {subject.grade}
                            </span>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && !loadingTab && analytics && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <p className="text-sm text-blue-600 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.overallStats?.totalStudents || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <p className="text-sm text-green-600 font-medium">Average Percentage</p>
              <p className="text-2xl font-bold text-green-900">{analytics.overallStats?.averagePercentage?.toFixed(1) || 0}%</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <p className="text-sm text-purple-600 font-medium">Pass Percentage</p>
              <p className="text-2xl font-bold text-purple-900">{analytics.overallStats?.passPercentage?.toFixed(1) || 0}%</p>
            </div>
          </div>

          {/* Class-wise Performance */}
          {analytics.classWise && analytics.classWise.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold">Class-wise Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Average %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Pass %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.classWise.map((cls, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{cls.className} {cls.section && `(${cls.section})`}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cls.totalStudents}</td>
                        <td className="px-6 py-4 text-sm" className={getGradeColor(cls.averagePercentage)}>
                          {cls.averagePercentage?.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cls.passPercentage?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExamDetails