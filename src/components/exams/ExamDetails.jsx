// src/components/exams/ExamDetails.jsx
import React, { useEffect, useState, useMemo } from 'react'
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
  ChevronRightIcon,
  ClockIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ExamDetails = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentExam, isLoading } = useSelector((state) => state.exams)
  
  const [analytics, setAnalytics] = useState(null)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [loadingTab, setLoadingTab] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [expandedStudent, setExpandedStudent] = useState(null)

  const uniqueSubjects = useMemo(() => {
    if (!analytics?.classWise) return [];
    const subjSet = new Set();
    analytics.classWise.forEach(cls => {
      cls.subjectProgress?.forEach(sp => {
        subjSet.add(sp.subjectName);
      });
    });
    return Array.from(subjSet);
  }, [analytics]);

  useEffect(() => {
    const loadData = async () => {
      setIsInitializing(true)
      await dispatch(fetchExamById(id))
      setIsInitializing(false)
    }
    loadData()
    
    return () => { 
      dispatch(clearCurrentExam())
      setAnalytics(null)
    }
  }, [dispatch, id])

  useEffect(() => {
    if (activeTab === 'analytics' && !analytics) {
      setLoadingTab(true)
      loadAnalytics().finally(() => setLoadingTab(false))
    }
  }, [activeTab, id, analytics])

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

  const handlePublish = async () => {
    try {
      await dispatch(publishExam(id)).unwrap()
      toast.success('Exam published successfully')
      await dispatch(fetchExamById(id))
      if (activeTab === 'analytics') {
        await loadAnalytics()
      }
    } catch (error) {
      toast.error('Failed to publish exam')
    }
  }

  if (isInitializing || !currentExam) return <LoadingSpinner />

  const getStatusBadge = (status) => {
    const config = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-600/20', label: 'Draft' },
      submitted: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20', label: 'Submitted' },
      reviewed: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/20', label: 'Reviewed' },
      published: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20', label: 'Published' }
    }
    const { bg, text, ring, label } = config[status] || config.draft
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text} ring-1 ${ring}`}>
        {label}
      </span>
    )
  }

  const getSessionLabel = (session) => {
    const labels = { BF: 'Morning', AF: 'Afternoon', FULL: 'Full Day' }
    return labels[session] || session
  }

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-emerald-600'
    if (percentage >= 75) return 'text-blue-600'
    if (percentage >= 60) return 'text-amber-600'
    if (percentage >= 40) return 'text-orange-600'
    return 'text-rose-600'
  }

  const totalClasses = currentExam?.summary?.totalClasses || currentExam?.classIds?.length || 0
  const classesSubmitted = currentExam?.summary?.classesSubmitted || 0
  const classesReviewed = currentExam?.summary?.classesReviewed || 0
  const classesPublished = currentExam?.classSubmissionStatus?.filter(cs => cs.status === 'published').length || 0
  const readyForPublish = totalClasses > 0 && classesReviewed === totalClasses
  const overallProgress = totalClasses > 0 ? (classesSubmitted / totalClasses) * 100 : 0

  const tabs = [
    { id: 'overview', name: 'Overview', icon: EyeIcon },
    { id: 'schedule', name: 'Schedule', icon: CalendarIcon },
    { id: 'subjects', name: 'Subjects', icon: BookOpenIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/exams')} 
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">{currentExam.displayName || currentExam.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{currentExam.academicYear}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500 capitalize">{currentExam.term} Term</span>
              {getStatusBadge(currentExam.overallStatus)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {currentExam.overallStatus !== 'published' && (
            <button 
              onClick={handlePublish} 
              disabled={!readyForPublish}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                readyForPublish 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={!readyForPublish ? 'All classes must be reviewed before publishing' : ''}
            >
              <CheckBadgeIcon className="w-4 h-4" />
              <span>Publish Results</span>
            </button>
          )}
          <Link 
            to={`/exams/${id}/edit`} 
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-0 border-b-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Loading Indicator */}
      {loadingTab && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && !loadingTab && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Exam Information */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Exam Information</h2>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-gray-500">Exam Type</span>
                <span className="text-xs font-medium text-gray-900 capitalize">{currentExam.examType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">Term</span>
                <span className="text-xs font-medium text-gray-900 capitalize">{currentExam.term}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">Start Date</span>
                <span className="text-xs font-medium text-gray-900">{new Date(currentExam.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">End Date</span>
                <span className="text-xs font-medium text-gray-900">{new Date(currentExam.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">Duration</span>
                <span className="text-xs font-medium text-gray-900">{Math.ceil((new Date(currentExam.endDate) - new Date(currentExam.startDate)) / (1000 * 60 * 60 * 24))} days</span>
              </div>
              {currentExam.resultDeclarationDate && (
                <div className="flex justify-between py-1.5 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Result Date</span>
                  <span className="text-xs font-medium text-gray-900">{new Date(currentExam.resultDeclarationDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Summary */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Academic Summary</h2>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-gray-500">Total Classes</span>
                <span className="text-xs font-medium text-gray-900">{totalClasses}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">Total Students</span>
                <span className="text-xs font-medium text-gray-900">{currentExam?.summary?.totalStudents || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">Total Subjects</span>
                <span className="text-xs font-medium text-gray-900">{currentExam.subjects?.length || 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">Total Max Marks</span>
                <span className="text-xs font-medium text-gray-900">{currentExam.totalMaxMarks || 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">CE Enabled</span>
                <span className="text-xs font-medium text-gray-900">{currentExam.schedule?.some(s => s.ceEnabled) ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-gray-100">
                <span className="text-xs text-gray-500">Practical Exams</span>
                <span className="text-xs font-medium text-gray-900">{currentExam.schedule?.some(s => s.practicalMarks > 0) ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Progress Status</h2>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Submitted</span>
                <span className="font-medium text-gray-900">{classesSubmitted}/{totalClasses}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Reviewed</span>
                <span className="font-medium text-gray-900">{classesReviewed}/{totalClasses}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Published</span>
                <span className="font-medium text-gray-900">{classesPublished}/{totalClasses}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Overall Progress</span>
                  <span>{overallProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
              {readyForPublish && (
                <div className="mt-2 text-center text-xs text-emerald-600 bg-emerald-50 rounded-md py-1.5">
                  Ready to publish results
                </div>
              )}
            </div>
          </div>

          {/* Settings & Instructions - Fixed: Changed SettingsIcon to Cog6ToothIcon */}
          {currentExam.settings && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-3">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Cog6ToothIcon className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Exam Settings & Instructions</h2>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {currentExam.settings.allowCalculator ? (
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-600">Calculator Allowed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentExam.settings.isOpenBook ? (
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-600">Open Book</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentExam.settings.allowAbsent !== false ? (
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-600">Absent Allowed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentExam.settings.showRank !== false ? (
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-600">Show Rank</span>
                  </div>
                </div>
                {currentExam.settings.instructions && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Instructions:</p>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{currentExam.settings.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && !loadingTab && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Exam Schedule</h2>
          </div>
          {currentExam.schedule?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Subject</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Session</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Theory</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Practical</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Passing</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">CE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentExam.schedule.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.subjectName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.examDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          s.session === 'BF' ? 'bg-blue-50 text-blue-700' : 
                          s.session === 'AF' ? 'bg-amber-50 text-amber-700' : 
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {getSessionLabel(s.session)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.theoryMarks || s.maxMarks || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.practicalMarks > 0 ? s.practicalMarks : '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{(s.maxMarks || s.termMaxMarks) + (s.practicalMarks || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.passingMarks}</td>
                      <td className="px-4 py-3">
                        {s.ceEnabled ? (
                          <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700">Enabled</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No schedule available.</p>
            </div>
          )}
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && !loadingTab && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Subjects Configuration</h2>
          </div>
          {currentExam.subjects?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Subject</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Code</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Theory</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Practical</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">CE</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Passing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentExam.subjects.map((s, i) => {
                    const totalMax = (s.termMaxMarks || 0) + (s.practicalMaxMarks || 0) + (s.ceMaxMarks || 0)
                    const hasCE = s.ceEnabled
                    
                    return (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.subjectName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.subjectCode || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.termMaxMarks || s.maxMarks || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.practicalMaxMarks || '-'}</td>
                        <td className="px-4 py-3">
                          {hasCE ? (
                            <span className="text-xs text-purple-600">{s.ceMaxMarks} marks</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{totalMax}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.totalPassingMarks || s.termPassingMarks || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No subjects configured.</p>
            </div>
          )}
        </div>
      )}


      {/* Analytics Tab */}
      {activeTab === 'analytics' && !loadingTab && analytics && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total Students</p>
              <p className="text-xl font-semibold text-gray-900">{analytics.overallStats?.totalStudents || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Average Percentage</p>
              <p className="text-xl font-semibold text-blue-600">{analytics.overallStats?.averagePercentage?.toFixed(1) || 0}%</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Pass Percentage</p>
              <p className="text-xl font-semibold text-emerald-600">{analytics.overallStats?.passPercentage?.toFixed(1) || 0}%</p>
            </div>
          </div>

          {/* Class-wise Subject Progress */}
          {analytics.classWise && analytics.classWise.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Marks Entry Progress</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 whitespace-nowrap sticky left-0 bg-gray-50/50 z-10 border-r border-gray-200">Class</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 whitespace-nowrap bg-gray-50/50 border-r border-gray-200">Overall Progress</th>
                      {uniqueSubjects.map(subj => (
                        <th key={subj} className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{subj}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analytics.classWise.map((cls, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white border-r border-gray-100 z-10">
                          {cls.className} {cls.section && `(${cls.section})`}
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-100 bg-gray-50/30">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${cls.completionPercentage === 100 ? 'text-emerald-600' : cls.completionPercentage > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                              {cls.completionPercentage || 0}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                              <div className={`h-1 rounded-full ${cls.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${cls.completionPercentage || 0}%` }} />
                            </div>
                          </div>
                        </td>
                        {uniqueSubjects.map(subjName => {
                          const subjData = cls.subjectProgress?.find(sp => sp.subjectName === subjName);
                          if (!subjData) return <td key={subjName} className="px-4 py-3 text-center text-sm text-gray-400">-</td>;
                          
                          const pct = subjData.percentage || 0;
                          return (
                            <td key={subjName} className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-600' : pct > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                                  {pct}%
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {subjData.currentMarks}/{subjData.expectedMarks}
                                </span>
                              </div>
                            </td>
                          );
                        })}
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