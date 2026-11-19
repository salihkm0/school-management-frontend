import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { fetchStudentById } from '../../store/slices/studentSlice'
import studentService from '../../services/studentService'
import pdfService, { downloadPDF } from '../../services/pdfService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import { 
  ChartBarIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowLeftIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'

const getGradeColor = (grade) => {
  const colors = {
    'A+': 'bg-green-100 text-green-800 border-green-200',
    'A': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'B+': 'bg-blue-100 text-blue-800 border-blue-200',
    'B': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'C+': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'C': 'bg-orange-100 text-orange-800 border-orange-200',
    'D+': 'bg-amber-100 text-amber-800 border-amber-200',
    'D': 'bg-red-100 text-red-800 border-red-200',
    'E': 'bg-gray-100 text-gray-800 border-gray-200'
  }
  return colors[grade] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const StudentMarks = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const [student, setStudent] = useState(null)
  const [marksData, setMarksData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState('all')
  const [expandedExams, setExpandedExams] = useState({})
  const [downloadingExamId, setDownloadingExamId] = useState(null)
  const [viewingExamId, setViewingExamId] = useState(null)
  const [downloadingReportCardId, setDownloadingReportCardId] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const studentRes = await dispatch(fetchStudentById(id)).unwrap()
      setStudent(studentRes)
      const marksRes = await studentService.getStudentMarks(id)
      setMarksData(marksRes)
      
      // Auto-expand all exams by default
      if (marksRes?.analytics?.examWise) {
        const allExpanded = {}
        Object.keys(marksRes.analytics.examWise).forEach(examKey => {
          allExpanded[examKey] = true
        })
        setExpandedExams(allExpanded)
      }
    } catch (error) { 
      console.error('Failed to load data:', error) 
      toast.error('Failed to load student marks')
    } finally { 
      setIsLoading(false) 
    }
  }

  const toggleExamExpand = (examId) => {
    setExpandedExams(prev => ({
      ...prev,
      [examId]: !prev[examId]
    }))
  }

  const expandAll = () => {
    if (marksData?.analytics?.examWise) {
      const allExpanded = {}
      Object.keys(marksData.analytics.examWise).forEach(examKey => {
        allExpanded[examKey] = true
      })
      setExpandedExams(allExpanded)
    }
  }

  const collapseAll = () => {
    setExpandedExams({})
  }

  const handleDownloadExamMarklist = async (examId, examName) => {
    try {
      setDownloadingExamId(examId)
      const blob = await pdfService.downloadMarklistPDF(id, examId)
      downloadPDF(
        blob,
        `Marklist_${(student?.fullName || 'Student').replace(/\s+/g, '_')}_${(examName || 'Exam').replace(/\s+/g, '_')}.pdf`
      )
      toast.success(`${examName || 'Exam'} marklist downloaded`)
    } catch (error) {
      console.error('Failed to download marklist:', error)
      toast.error('Failed to download marklist PDF')
    } finally {
      setDownloadingExamId(null)
    }
  }

  const handleViewExamMarklist = async (examId) => {
    try {
      setViewingExamId(examId)
      const blob = await pdfService.getMarklistPDF(id, examId)
      const fileURL = URL.createObjectURL(blob)
      window.open(fileURL, '_blank')
    } catch (error) {
      console.error('Failed to view marklist:', error)
      toast.error('Failed to open marklist PDF')
    } finally {
      setViewingExamId(null)
    }
  }

  const handleDownloadReportCard = async (examId, examName) => {
    try {
      setDownloadingReportCardId(examId)
      const academicYearId = student?.academicYearId?._id || student?.academicYearId
      const blob = await pdfService.downloadStudentReportCardPDF(id, examId, academicYearId)
      downloadPDF(
        blob,
        `ReportCard_${(student?.fullName || 'Student').replace(/\s+/g, '_')}_${(examName || 'Exam').replace(/\s+/g, '_')}.pdf`
      )
      toast.success('Report card downloaded')
    } catch (error) {
      console.error('Failed to download report card:', error)
      toast.error('Failed to download report card PDF')
    } finally {
      setDownloadingReportCardId(null)
    }
  }

  const analytics = marksData?.analytics || { overall: {}, subjectWise: {}, examWise: {} }
  const examWise = analytics.examWise || {}
  const uniqueExams = Object.keys(examWise)
  const displayedExams = selectedExam === 'all' 
    ? uniqueExams 
    : uniqueExams.filter(eId => eId === selectedExam)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Link to={`/students/${id}`} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{student?.fullName}</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              Exam Marks
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-9">
            Class {student?.className} {student?.division || ''} • Admission No: {student?.admissionNo || '-'} • Code: {student?.studentCode || '-'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Link
            to={`/students/${id}`}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            Back to Profile
          </Link>
          {uniqueExams.length > 0 && (
            <button
              onClick={() => handleDownloadExamMarklist(undefined, 'All_Exams')}
              disabled={downloadingExamId !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Download All</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-sm">
          <div className="flex justify-between items-center">
            <ChartBarIcon className="w-9 h-9 opacity-50" />
            <span className="text-2xl sm:text-3xl font-bold">{marksData?.summary?.overallPercentage || 0}%</span>
          </div>
          <p className="mt-2 text-xs sm:text-sm font-medium text-emerald-50">Overall Average</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-sm">
          <div className="flex justify-between items-center">
            <AcademicCapIcon className="w-9 h-9 opacity-50" />
            <span className="text-2xl sm:text-3xl font-bold">{marksData?.summary?.totalExams || 0}</span>
          </div>
          <p className="mt-2 text-xs sm:text-sm font-medium text-blue-50">Total Exams</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white shadow-sm">
          <div className="flex justify-between items-center">
            <DocumentTextIcon className="w-9 h-9 opacity-50" />
            <span className="text-2xl sm:text-3xl font-bold">{marksData?.summary?.totalSubjects || 0}</span>
          </div>
          <p className="mt-2 text-xs sm:text-sm font-medium text-purple-50">Subjects Attempted</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-bold">{marksData?.summary?.totalMarksObtained || 0}</span>
              <span className="text-xs text-amber-100">Max: {marksData?.summary?.totalMaxMarks || 0}</span>
            </div>
            <CheckBadgeIcon className="w-9 h-9 opacity-50" />
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-amber-50">Total Marks Scored</p>
        </div>
      </div>

      {/* Exam Filter Tabs and Actions */}
      {uniqueExams.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Filter Exams:</span>
              <span className="text-xs text-gray-500">({uniqueExams.length} {uniqueExams.length === 1 ? 'Exam' : 'Exams'} Recorded)</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedExam('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                selectedExam === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Exams ({uniqueExams.length})
            </button>
            {uniqueExams.map((examId) => (
              <button
                key={examId}
                onClick={() => setSelectedExam(examId)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  selectedExam === examId
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {examWise[examId].examName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exam-wise Performance Cards */}
      {displayedExams.length > 0 && (
        <div className="space-y-5">
          {displayedExams.map((examId) => {
            const exam = examWise[examId]
            const isExpanded = expandedExams[examId] !== false // Default open
            const examPercentage = exam.totalMaxMarks > 0 
              ? ((exam.totalMarks / exam.totalMaxMarks) * 100).toFixed(1)
              : 0
            const hasPractical = exam.subjects?.some(s => s.practicalScore !== undefined && s.practicalScore !== null)
            const hasCE = exam.subjects?.some(s => s.ceScore !== undefined && s.ceScore !== null)

            // Totals
            const totalTheory = exam.subjects?.reduce((sum, s) => sum + (s.theoryScore || (s.ceScore === undefined && s.practicalScore === undefined ? s.score : 0) || 0), 0) || 0
            const totalCE = exam.subjects?.reduce((sum, s) => sum + (s.ceScore || 0), 0) || 0
            const totalPractical = exam.subjects?.reduce((sum, s) => sum + (s.practicalScore || 0), 0) || 0
            const passedCount = exam.subjects?.filter(s => !s.isAbsent && (s.status === 'Passed' || s.isPassed || s.score >= (s.passingMarks || 0))).length || 0
            
            return (
              <div key={examId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:border-gray-300">
                {/* Exam Header */}
                <div 
                  className="px-5 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => toggleExamExpand(examId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200 flex-shrink-0">
                      {exam.examName?.substring(0, 2).toUpperCase() || 'EX'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{exam.examName}</h3>
                        {exam.term && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize border border-gray-200">
                            {exam.term} Term
                          </span>
                        )}
                        {exam.examType && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 capitalize border border-blue-200">
                            {exam.examType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {exam.subjects?.length || 0} Subjects Recorded • {passedCount}/{exam.subjects?.length || 0} Passed
                      </p>
                    </div>
                  </div>

                  {/* Right Header: Stats & Action Buttons */}
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg px-3 py-1.5 mr-1">
                      <div className="text-right">
                        <span className="text-xs text-emerald-800 font-semibold block leading-tight">
                          {exam.totalMarks}/{exam.totalMaxMarks}
                        </span>
                        <span className="text-[11px] text-emerald-600 block leading-tight">Total Marks</span>
                      </div>
                      <div className="h-6 w-px bg-emerald-200 mx-1"></div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-700 block leading-tight">{examPercentage}%</span>
                        <span className="text-[11px] text-emerald-600 block leading-tight">Percentage</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <button
                      onClick={() => handleViewExamMarklist(examId)}
                      disabled={viewingExamId === examId}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                      title="View Marklist PDF in new tab"
                    >
                      <EyeIcon className="w-3.5 h-3.5 text-gray-500" />
                      <span>{viewingExamId === examId ? 'Opening...' : 'View PDF'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadExamMarklist(examId, exam.examName)}
                      disabled={downloadingExamId === examId}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
                      title="Download Exam Marklist PDF"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{downloadingExamId === examId ? 'Downloading...' : 'Marklist'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadReportCard(examId, exam.examName)}
                      disabled={downloadingReportCardId === examId}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50"
                      title="Download Student Report Card PDF"
                    >
                      <DocumentTextIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>{downloadingReportCardId === examId ? 'Downloading...' : 'Report Card'}</span>
                    </button>

                    <button
                      onClick={() => toggleExamExpand(examId)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Exam Subjects Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-50/80">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider w-10">#</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Theory (TE)</th>
                          {hasCE && (
                            <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">CE</th>
                          )}
                          {hasPractical && (
                            <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Practical</th>
                          )}
                          <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Max</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">%</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {exam.subjects?.map((subject, idx) => {
                          const isPassed = !subject.isAbsent && (
                            subject.status === 'Passed' || 
                            subject.isPassed === true || 
                            (subject.score !== undefined && subject.passingMarks !== undefined && subject.score >= subject.passingMarks)
                          )
                          const isAbsent = subject.isAbsent === true

                          return (
                            <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                              <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                <div>{subject.subjectName}</div>
                                {subject.subjectCode && (
                                  <span className="text-[11px] text-gray-400 font-mono">{subject.subjectCode}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">
                                {isAbsent ? (
                                  <span className="text-rose-500 font-medium">Ab</span>
                                ) : subject.theoryScore !== undefined && subject.theoryScore !== null ? (
                                  subject.theoryScore
                                ) : (
                                  subject.score ?? '-'
                                )}
                              </td>
                              {hasCE && (
                                <td className="px-4 py-3 text-center text-gray-700">
                                  {isAbsent ? '-' : (subject.ceScore !== undefined && subject.ceScore !== null ? subject.ceScore : '-')}
                                </td>
                              )}
                              {hasPractical && (
                                <td className="px-4 py-3 text-center text-gray-700">
                                  {isAbsent ? '-' : (subject.practicalScore !== undefined && subject.practicalScore !== null ? subject.practicalScore : '-')}
                                </td>
                              )}
                              <td className="px-4 py-3 text-center font-bold text-gray-900">
                                {isAbsent ? '-' : (subject.totalScore || subject.score || 0)}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-500">{subject.maxMarks}</td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {isAbsent ? '-' : `${(subject.percentage || (subject.maxMarks ? ((subject.score || subject.totalScore) / subject.maxMarks) * 100 : 0)).toFixed(1)}%`}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isAbsent ? (
                                  <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    -
                                  </span>
                                ) : (
                                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${getGradeColor(subject.grade)}`}>
                                    {subject.grade || '-'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isAbsent ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                                    Absent
                                  </span>
                                ) : isPassed ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Passed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                    Needs Impr.
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {/* Summary Row */}
                      <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-center" colSpan={2}>
                            Total / Overall
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {totalTheory}
                          </td>
                          {hasCE && (
                            <td className="px-4 py-3 text-center text-gray-700">
                              {totalCE}
                            </td>
                          )}
                          {hasPractical && (
                            <td className="px-4 py-3 text-center text-gray-700">
                              {totalPractical}
                            </td>
                          )}
                          <td className="px-4 py-3 text-center text-emerald-700 font-bold">
                            {exam.totalMarks}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {exam.totalMaxMarks}
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-700 font-bold">
                            {examPercentage}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${getGradeColor(exam.overallGrade || (examPercentage >= 90 ? 'A+' : examPercentage >= 80 ? 'A' : examPercentage >= 70 ? 'B+' : examPercentage >= 60 ? 'B' : examPercentage >= 50 ? 'C+' : examPercentage >= 40 ? 'C' : examPercentage >= 30 ? 'D+' : 'D'))}`}>
                              {exam.overallGrade || (examPercentage >= 90 ? 'A+' : examPercentage >= 80 ? 'A' : examPercentage >= 70 ? 'B+' : examPercentage >= 60 ? 'B' : examPercentage >= 50 ? 'C+' : examPercentage >= 40 ? 'C' : examPercentage >= 30 ? 'D+' : 'D')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs text-gray-600 font-medium">
                              {passedCount}/{exam.subjects?.length || 0} Passed
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Subject-wise Performance Summary */}
      {analytics.subjectWise && Object.keys(analytics.subjectWise).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Subject-wise Average Across All Exams</h2>
          <div className="space-y-4">
            {Object.entries(analytics.subjectWise).map(([subject, data]) => (
              <div key={subject}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-800">{subject}</span>
                  <span className="text-gray-500 font-mono text-xs">{data.averagePercentage?.toFixed(1)}% Avg ({data.count} exams)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 rounded-full h-2.5 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, data.averagePercentage || 0))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {uniqueExams.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <DocumentTextIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Exam Marks Recorded</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            No exam marks have been entered for {student?.fullName || 'this student'} yet. Marks entered by teachers for exams will appear here automatically.
          </p>
        </div>
      )}
    </div>
  )
}

export default StudentMarks