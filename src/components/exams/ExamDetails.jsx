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
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { reviewMarks, revertMarksToDraft } from '../../services/markService'
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
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

  const handleReviewClass = async (classId, className) => {
    setIsReviewing(true)
    try {
      await reviewMarks(id, classId)
      toast.success(`Marks for ${className || 'class'} marked as Reviewed!`)
      await dispatch(fetchExamById(id))
    } catch (err) {
      console.error('Failed to review marks:', err)
      toast.error(err.response?.data?.message || 'Failed to mark as reviewed')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleRevertToDraft = async (classId, className, subjectId = null, subjectName = null) => {
    const targetText = subjectName ? `subject "${subjectName}" in ${className || 'this class'}` : `all subjects in ${className || 'this class'}`
    if (!window.confirm(`Are you sure you want to set marks status for ${targetText} back to Draft? Teachers will be able to edit marks again.`)) {
      return
    }
    setIsReviewing(true)
    try {
      await revertMarksToDraft(id, classId, subjectId)
      toast.success(`Marks status for ${targetText} reverted to Draft. Editing unlocked!`)
      await dispatch(fetchExamById(id))
    } catch (err) {
      console.error('Failed to revert status to draft:', err)
      toast.error(err.response?.data?.message || 'Failed to set status to draft')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleReviewAllSubmitted = async () => {
    const submittedClasses = (currentExam?.classSubmissionStatus || []).filter(cs => cs.status === 'submitted')
    if (submittedClasses.length === 0) {
      toast.error('No submitted classes to review')
      return
    }

    setIsReviewing(true)
    try {
      for (const cs of submittedClasses) {
        await reviewMarks(id, cs.classId?._id || cs.classId)
      }
      toast.success(`All ${submittedClasses.length} submitted classes marked as Reviewed!`)
      await dispatch(fetchExamById(id))
      setShowReviewModal(false)
    } catch (err) {
      console.error('Failed to review all classes:', err)
      toast.error(err.response?.data?.message || 'Failed to review classes')
    } finally {
      setIsReviewing(false)
    }
  }

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
    if (activeTab === 'analytics') {
      setLoadingTab(true)
      loadAnalytics().finally(() => setLoadingTab(false))
    }
  }, [activeTab, id])

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
              {(() => {
                const uniqueStandards = [...new Set((currentExam.classDetails || []).map(c => c.className).filter(Boolean))];
                return uniqueStandards.length > 0 ? (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Std {uniqueStandards.join(', ')}
                    </span>
                  </>
                ) : null;
              })()}
              {getStatusBadge(currentExam.overallStatus)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {totalClasses > 0 && (
            <button 
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors border border-purple-200 shadow-sm"
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-purple-600" />
              <span>Review Marks ({classesSubmitted})</span>
            </button>
          )}
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam Information */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Exam Information</h2>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Exam Type</span>
                <span className="font-medium text-gray-900 capitalize">{currentExam.examType?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Term</span>
                <span className="font-medium text-gray-900 capitalize">{currentExam.term}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Start Date</span>
                <span className="font-medium text-gray-900">{currentExam.startDate ? new Date(currentExam.startDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">End Date</span>
                <span className="font-medium text-gray-900">{currentExam.endDate ? new Date(currentExam.endDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-900">
                  {currentExam.startDate && currentExam.endDate
                    ? `${Math.ceil((new Date(currentExam.endDate) - new Date(currentExam.startDate)) / (1000 * 60 * 60 * 24))} days`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Academic Summary</h2>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Classes</span>
                <span className="font-medium text-gray-900">{totalClasses}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Students</span>
                <span className="font-medium text-gray-900">{currentExam.summary?.totalStudents || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Subjects</span>
                <span className="font-medium text-gray-900">{currentExam.subjects?.length || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Max Marks</span>
                <span className="font-medium text-gray-900">{currentExam.summary?.totalMaxMarks || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">CE Enabled</span>
                <span className="font-medium text-gray-900">{currentExam.ceConfig?.enabled ? 'Yes' : 'No'}</span>
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
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Submitted</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{classesSubmitted}/{totalClasses}</span>
                  {totalClasses > 0 && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors"
                    >
                      Review Marks
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Reviewed</span>
                <span className="font-medium text-gray-900">{classesReviewed}/{totalClasses}</span>
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
                <div className="mt-2 text-center text-xs text-emerald-600 bg-emerald-50 rounded-md py-1.5 font-medium">
                  ✓ Ready to publish results
                </div>
              )}
            </div>
          </div>

          {/* Class Submissions & Edit Permissions Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-3">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-semibold text-gray-900">Class Submission Status & Edit Permissions</h2>
              </div>
              <span className="text-xs text-gray-500">
                Set status to <span className="font-semibold text-amber-700">Draft</span> to unlock mark editing for teachers
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Class</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Submitted By</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Submitted Date</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {((currentExam.classSubmissionStatus && currentExam.classSubmissionStatus.length > 0)
                    ? currentExam.classSubmissionStatus
                    : (currentExam.classDetails || []).map(c => ({ classId: c._id || c.classId, status: 'draft' }))
                  ).map((cs) => {
                    const classIdStr = (cs.classId?._id || cs.classId || '').toString()
                    const classObj = (currentExam.classDetails || []).find(c => (c._id || c.classId || c.id)?.toString() === classIdStr)
                    const className = cs.classDisplayName || classObj?.displayName || `${classObj?.className || ''} ${classObj?.section || ''}`.trim() || cs.className || 'Class'
                    const isSubmitted = cs.status === 'submitted'
                    const isReviewed = cs.status === 'reviewed'
                    const isPublished = cs.status === 'published'
                    const isDraft = cs.status === 'draft' || !cs.status
                    const subjectSubs = (cs.subjectSubmissions && cs.subjectSubmissions.length > 0)
                      ? cs.subjectSubmissions
                      : (classObj?.subjectSubmissions && classObj.subjectSubmissions.length > 0)
                      ? classObj.subjectSubmissions
                      : (currentExam.subjects || []).map((s) => ({
                          subjectId: (s.subjectId?._id || s.subjectId || s._id)?.toString(),
                          subjectName: s.subjectName,
                          status: cs.status || 'draft',
                          submittedByName: cs.submittedByName || cs.submittedBy?.name || null,
                        }));
                    const hasSubmittedSubject = subjectSubs.some(s => s.status !== 'draft');

                    return (
                      <React.Fragment key={cs._id || classIdStr}>
                        <tr className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{className}</td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(cs.status || 'draft')}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {cs.submittedByName || cs.submittedBy?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {cs.submittedAt ? new Date(cs.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {isSubmitted && (
                              <button
                                onClick={() => handleReviewClass(classIdStr, className)}
                                disabled={isReviewing}
                                className="px-2.5 py-1 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm text-xs inline-flex items-center gap-1"
                              >
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Mark Reviewed
                              </button>
                            )}
                            {(isSubmitted || isReviewed || hasSubmittedSubject) && (
                              <button
                                onClick={() => handleRevertToDraft(classIdStr, className)}
                                disabled={isReviewing}
                                className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-300 font-medium rounded hover:bg-amber-100 disabled:opacity-50 transition-colors text-xs inline-flex items-center gap-1"
                                title="Set all subjects in class to Draft"
                              >
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                                Set All to Draft
                              </button>
                            )}
                            {isDraft && !hasSubmittedSubject && (
                              <span className="text-gray-400 text-xs italic">Draft (Teachers Can Edit)</span>
                            )}
                            {isPublished && (
                              <span className="text-emerald-600 text-xs font-medium">Published</span>
                            )}
                          </td>
                        </tr>

                        {subjectSubs.length > 0 && (
                          <tr className="bg-slate-50/80 border-b border-gray-200/80">
                            <td colSpan={5} className="px-4 py-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-gray-700 mr-1 flex items-center gap-1">
                                  <BookOpenIcon className="w-3.5 h-3.5 text-purple-600" />
                                  Subject Submissions:
                                </span>
                                {subjectSubs.map((sub) => {
                                  const subSubmitted = sub.status === 'submitted' || sub.status === 'reviewed' || sub.status === 'published';
                                  return (
                                    <div
                                      key={sub.subjectId || sub.subjectName}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border shadow-2xs transition-all ${
                                        subSubmitted
                                          ? 'bg-purple-50/90 text-purple-900 border-purple-200'
                                          : 'bg-white text-gray-600 border-gray-200'
                                      }`}
                                    >
                                      <span className="font-bold text-gray-800">{sub.subjectName}:</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                        sub.status === 'submitted'
                                          ? 'bg-amber-100 text-amber-800'
                                          : sub.status === 'reviewed'
                                          ? 'bg-purple-100 text-purple-800'
                                          : sub.status === 'published'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {sub.status === 'submitted' ? 'Submitted' : sub.status === 'reviewed' ? 'Reviewed' : sub.status === 'published' ? 'Published' : 'Draft'}
                                      </span>
                                      {subSubmitted && sub.submittedByName && (
                                        <span className="text-[11px] font-medium text-purple-700">({sub.submittedByName})</span>
                                      )}
                                      {subSubmitted && (
                                        <button
                                          onClick={() => handleRevertToDraft(classIdStr, className, sub.subjectId, sub.subjectName)}
                                          disabled={isReviewing}
                                          className="ml-1 text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-300 transition-colors font-bold flex items-center gap-1 shadow-2xs"
                                          title={`Revert ${sub.subjectName} to Draft`}
                                        >
                                          <ArrowPathIcon className="w-3 h-3 text-amber-700" />
                                          Set to Draft
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settings & Instructions */}
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
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Max Marks</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Passing Marks</th>
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
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{s.maxMarks || s.termMaxMarks}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.passingMarks || s.termPassingMarks || '-'}</td>
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
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Term Marks</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">CE</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Passing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentExam.subjects.map((s, i) => {
                    const totalMax = (s.termMaxMarks || 0) + (s.ceMaxMarks || 0)
                    const hasCE = s.ceEnabled
                    
                    return (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.subjectName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.subjectCode || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.termMaxMarks || s.maxMarks || '-'}</td>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Total Students</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{analytics.overallStats?.totalStudents || 0}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Mark Entry Percentage</p>
              <div className="flex flex-col gap-1 mt-1">
                <span className={`text-xl font-bold ${
                  (analytics.overallStats?.markEntryPercentage || 0) === 100 
                    ? 'text-emerald-600' 
                    : (analytics.overallStats?.markEntryPercentage || 0) > 0 
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                }`}>
                  {analytics.overallStats?.markEntryPercentage != null 
                    ? `${Number(analytics.overallStats.markEntryPercentage).toFixed(1)}%` 
                    : '0.0%'}
                </span>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-0.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      (analytics.overallStats?.markEntryPercentage || 0) === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} 
                    style={{ width: `${Math.min(100, analytics.overallStats?.markEntryPercentage || 0)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Remaining Classes (&lt;100%)</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-bold ${
                  (analytics.overallStats?.remainingClassesCount || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {analytics.overallStats?.remainingClassesCount ?? 0}
                </span>
                <span className="text-xs text-gray-400">
                  / {analytics.overallStats?.totalClasses || analytics.classWise?.length || 0} pending
                </span>
              </div>
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
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-600' : pct > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                                  {pct}%
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {subjData.currentMarks}/{subjData.expectedMarks}
                                </span>
                                {subjData.teacherShortName ? (
                                  <div 
                                    className="flex flex-wrap items-center justify-center gap-1 mt-0.5" 
                                    title={subjData.teacherName ? `Teachers: ${subjData.teacherName}` : ''}
                                  >
                                    {subjData.teacherShortName.split(',').map((shortName, idx) => (
                                      <span 
                                        key={idx}
                                        className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                                          pct === 100 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                            : pct > 0 
                                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                              : 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold'
                                        }`}
                                      >
                                        {shortName.trim()}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
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

      {/* Review Submitted Classes Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">Review & Approve Class Marks</h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-lg p-3 text-xs text-purple-900">
                <div>
                  <span className="font-bold">{classesSubmitted - classesReviewed} class(es)</span> pending review out of <span className="font-bold">{classesSubmitted} submitted</span>.
                </div>
                {classesSubmitted > classesReviewed && (
                  <button
                    onClick={handleReviewAllSubmitted}
                    disabled={isReviewing}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm text-xs whitespace-nowrap"
                  >
                    {isReviewing ? "Processing..." : "Mark All Submitted as Reviewed"}
                  </button>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Class</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(currentExam.classSubmissionStatus || []).map((cs) => {
                      const classIdStr = (cs.classId?._id || cs.classId || '').toString()
                      const classObj = (currentExam.classDetails || []).find(c => (c._id || c.classId || c.id)?.toString() === classIdStr)
                      const className = cs.classDisplayName || classObj?.displayName || `${classObj?.className || ''} ${classObj?.section || ''}`.trim() || cs.className || 'Class'
                      const isSubmitted = cs.status === 'submitted'
                      const isReviewed = cs.status === 'reviewed'
                      const isPublished = cs.status === 'published'

                      return (
                        <tr key={cs._id || classIdStr} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div>{className}</div>
                            {(cs.submittedByName || cs.submittedBy?.name) && (
                              <div className="text-[10px] text-gray-400 font-normal">Sub: {cs.submittedByName || cs.submittedBy?.name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(cs.status || 'draft')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isSubmitted && (
                                <button
                                  onClick={() => handleReviewClass(classIdStr, className)}
                                  disabled={isReviewing}
                                  className="px-2.5 py-1 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm text-[11px]"
                                >
                                  {isReviewing ? "Saving..." : "Mark as Reviewed"}
                                </button>
                              )}
                              {(isSubmitted || isReviewed) && (
                                <button
                                  onClick={() => handleRevertToDraft(classIdStr, className)}
                                  disabled={isReviewing}
                                  className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-300 font-medium rounded hover:bg-amber-100 disabled:opacity-50 transition-colors text-[11px] inline-flex items-center gap-1"
                                  title="Set status back to Draft so teacher can edit marks"
                                >
                                  <ArrowPathIcon className="w-3 h-3 text-amber-600" />
                                  Set to Draft (Allow Edit)
                                </button>
                              )}
                              {cs.status === 'draft' && (
                                <span className="text-gray-400 italic text-[11px]">Draft (Editable)</span>
                              )}
                              {isPublished && (
                                <span className="text-emerald-600 font-semibold text-[11px]">Published</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamDetails