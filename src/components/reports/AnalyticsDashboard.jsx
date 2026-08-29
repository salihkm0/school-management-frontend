// src/components/reports/AnalyticsDashboard.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchGradeAnalysis, fetchFullAPlusStudents, fetchNearFullAPlusStudents, fetchTopPerformingClasses } from '../../services/analyticsService'
import { fetchExams } from '../../store/slices/examSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { 
  ChartBarIcon, 
  AcademicCapIcon, 
  UserGroupIcon, 
  TrophyIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const AnalyticsDashboard = () => {
  const dispatch = useDispatch()
  const { exams } = useSelector((state) => state.exams)
  const { classes } = useSelector((state) => state.classes)
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [gradeAnalysis, setGradeAnalysis] = useState(null)
  const [fullAPlus, setFullAPlus] = useState([])
  const [nearFullAPlus, setNearFullAPlus] = useState([])
  const [nearFullAPlusDetail, setNearFullAPlusDetail] = useState(null)
  const [topClasses, setTopClasses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    fullAPlus: true,
    nearAPlus: true,
    withoutMaths: true,
    withoutEnglish: true,
    withoutMalayalam: true,
    withoutHindi: true,
    withoutArabic: true,
    withoutSocial: true,
    withoutIT: true
  })

  useEffect(() => {
    dispatch(fetchExams({ limit: 100 }))
    dispatch(fetchClasses({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedExam) {
      loadAnalytics()
    }
  }, [selectedExam, selectedClass])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const [analysis, fullA, nearFullA, topC] = await Promise.all([
        fetchGradeAnalysis(selectedExam, selectedClass || undefined),
        fetchFullAPlusStudents(selectedExam, selectedClass || undefined),
        fetchNearFullAPlusStudents(selectedExam, selectedClass || undefined),
        fetchTopPerformingClasses(selectedExam, 5)
      ])
      
      // Extract data from response
      const analysisData = analysis?.data || analysis
      setGradeAnalysis(analysisData)
      setFullAPlus(fullA?.data || [])
      setNearFullAPlus(nearFullA?.data || [])
      setNearFullAPlusDetail(analysisData?.analysis || {})
      setTopClasses(topC || [])
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedClass('')
    if (selectedExam) loadAnalytics()
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(','))
    ]
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} records`)
  }

  if (isLoading) return <LoadingSpinner />

  const gradeDistribution = gradeAnalysis?.gradeDistribution || {}
  const analysis = gradeAnalysis?.analysis || nearFullAPlusDetail
  const summary = gradeAnalysis?.summary || {
    fullAPlus: 0,
    nineAPlus: 0,
    eightAPlus: 0,
    sevenAPlus: 0,
    fullAPlusPercentage: 0,
    passPercentage: 0
  }
  const totalStudents = gradeAnalysis?.totalStudents || 0

  // Extract data from analysis
  const fullAPlusList = analysis?.fullAPlus || fullAPlus || []
  const nineAPlusList = analysis?.nineAPlus || nearFullAPlus || []
  const nearFullAPlusList = nineAPlusList
  const eightAPlusList = analysis?.eightAPlus || []
  const sevenAPlusList = analysis?.sevenAPlus || []
  
  // Dynamic subject-wise near A+ map
  const missingAPlusBySubjectMap = analysis?.missingAPlusBySubject || {}
  const dynamicSubjectNames = Object.keys(missingAPlusBySubjectMap)
  const hasDynamicSubjectData = dynamicSubjectNames.length > 0

  // Subject-wise near A+ lists (legacy fallback)
  const withoutMathsList = analysis?.fullAPlusWithoutMaths || []
  const withoutEnglishList = analysis?.fullAPlusWithoutEnglish || []
  const withoutMalayalamList = analysis?.fullAPlusWithoutMalayalam || []
  const withoutMalayalamIIList = analysis?.fullAPlusWithoutMalayalamII || []
  const withoutHindiList = analysis?.fullAPlusWithoutHindi || []
  const withoutArabicList = analysis?.fullAPlusWithoutArabic || []
  const withoutSocialList = analysis?.fullAPlusWithoutSocialScience || []
  const withoutITList = analysis?.fullAPlusWithoutIT || []
  const withoutPhysicsList = analysis?.fullAPlusWithoutPhysics || []
  const withoutChemistryList = analysis?.fullAPlusWithoutChemistry || []
  const withoutBiologyList = analysis?.fullAPlusWithoutBiology || []
  const withoutFirstLanguageList = analysis?.fullAPlusWithoutFirstLanguage || []
  const withoutOtherList = analysis?.fullAPlusWithoutOther || []

  const hasNearFullData = withoutMathsList.length > 0 || 
    withoutEnglishList.length > 0 || 
    withoutMalayalamList.length > 0 || 
    withoutMalayalamIIList.length > 0 || 
    withoutHindiList.length > 0 || 
    withoutArabicList.length > 0 || 
    withoutSocialList.length > 0 || 
    withoutITList.length > 0 ||
    withoutPhysicsList.length > 0 ||
    withoutChemistryList.length > 0 ||
    withoutBiologyList.length > 0 ||
    withoutFirstLanguageList.length > 0 ||
    withoutOtherList.length > 0

  const renderStudentTable = (students, title, showMissingSubject = true) => {
    if (!students || students.length === 0) return null
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{students.length} students</p>
            </div>
            <button
              onClick={() => exportToCSV(students, title.replace(/\s/g, '_'))}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                {showMissingSubject && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Missing Subject</th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, i) => (
                <tr key={student.studentId || i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.studentName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-emerald-600">
                    {student.percentage?.toFixed(1)}%
                  </td>
                  {showMissingSubject && (
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                        {student.missingSubject || student.missingSubjectGrade || '-'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      {student.grade || 'A+'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderSubjectWiseSection = (title, students, subjectName, iconColor = 'bg-amber-500') => {
    if (!students || students.length === 0) return null
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => toggleSection(subjectName)}
          className="w-full px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${iconColor.replace('bg', 'bg-opacity-10')} rounded-lg flex items-center justify-center`}>
              <ChartBarIcon className={`w-4 h-4 ${iconColor.replace('bg', 'text')}`} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{students.length} students</p>
            </div>
          </div>
          {expandedSections[subjectName] ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections[subjectName] && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Missing Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, i) => (
                  <tr key={student.studentId || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-amber-600">
                      {student.percentage?.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        {student.missingSubjectGrade || 'Not A+'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Exam <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="">Choose an exam...</option>
              {exams.map(exam => (
                <option key={exam._id} value={exam._id}>
                  {exam.displayName || exam.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Class (Optional)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.displayName || cls.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            {(selectedExam || selectedClass) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={loadAnalytics}
              disabled={!selectedExam}
              className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {!selectedExam ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Select an Exam</h3>
          <p className="text-gray-500">Choose an exam to view analytics and performance data</p>
        </div>
      ) : gradeAnalysis ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <TrophyIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{summary.fullAPlus || 0}</span>
              </div>
              <p className="text-sm opacity-90">Full A+ Students</p>
              <p className="text-xs opacity-75 mt-1">
                {summary.fullAPlusPercentage?.toFixed(1) || 0}% of total
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <AcademicCapIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{totalStudents || 0}</span>
              </div>
              <p className="text-sm opacity-90">Total Students</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <ChartBarIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{summary.passPercentage?.toFixed(1) || 0}%</span>
              </div>
              <p className="text-sm opacity-90">Pass Percentage</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <UserGroupIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{summary.nineAPlus || 0}</span>
              </div>
              <p className="text-sm opacity-90">Near Full A+</p>
            </div>
          </div>

          {/* Grade Distribution */}
          {Object.keys(gradeDistribution).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Grade Distribution</h2>
                <p className="text-sm text-gray-500 mt-0.5">Student performance breakdown by grade</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(gradeDistribution).map(([grade, count]) => {
                    const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0
                    let barColor = 'bg-emerald-500'
                    if (grade === 'A+') barColor = 'bg-emerald-500'
                    else if (grade === 'A') barColor = 'bg-green-500'
                    else if (grade === 'B+') barColor = 'bg-blue-500'
                    else if (grade === 'B') barColor = 'bg-cyan-500'
                    else if (grade === 'C+') barColor = 'bg-amber-500'
                    else if (grade === 'C') barColor = 'bg-orange-500'
                    else if (grade === 'D+') barColor = 'bg-amber-600'
                    else if (grade === 'D') barColor = 'bg-rose-500'
                    else if (grade === 'E') barColor = 'bg-gray-400'
                    
                    return (
                      <div key={grade}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">Grade {grade}</span>
                          <div className="flex gap-4">
                            <span className="text-gray-600">{count} students</span>
                            <span className="text-gray-400">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`${barColor} rounded-full h-2 transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Two Column Layout for Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Classes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Top Performing Classes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Classes with highest average scores</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {topClasses.length > 0 && (
                      <button
                        onClick={() => exportToCSV(topClasses, 'Top_Performing_Classes')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200"
                      >
                        <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                        Export
                      </button>
                    )}
                    <AcademicCapIcon className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                {topClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AcademicCapIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500">No data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topClasses.map((cls, i) => (
                      <div key={cls.classId || i} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="text-gray-700 font-medium">{cls.className}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-100 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 rounded-full h-1.5 transition-all duration-500"
                              style={{ width: `${Math.min(cls.averagePercentage || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-blue-600 font-medium text-sm">
                            {cls.averagePercentage?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
                <p className="text-sm text-gray-500 mt-0.5">Key metrics at a glance</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-2xl font-bold text-emerald-600">{summary.fullAPlus || fullAPlusList.length || 0}</p>
                    <p className="text-xs text-gray-600 font-medium">Full A+</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-2xl font-bold text-amber-600">{summary.nineAPlus || nineAPlusList.length || 0}</p>
                    <p className="text-xs text-gray-600 font-medium">Near A+ (Missed 1 A+)</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">{summary.eightAPlus || eightAPlusList.length || 0}</p>
                    <p className="text-xs text-gray-600 font-medium">8 A+ Subjects</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-2xl font-bold text-purple-600">{summary.sevenAPlus || sevenAPlusList.length || 0}</p>
                    <p className="text-xs text-gray-600 font-medium">7 A+ Subjects</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full A+ Students Section */}
          {fullAPlusList && fullAPlusList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('fullAPlus')}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <TrophyIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Full A+ Students</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Students who scored A+ in all subjects • {fullAPlusList.length} students
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(fullAPlusList, 'Full_APlus_Students')}
                    className="text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => toggleSection('fullAPlus')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.fullAPlus ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedSections.fullAPlus && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admission No</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fullAPlusList.map((student, i) => (
                        <tr key={student.studentId || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.admissionNumber || student.studentCode || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-emerald-600 font-semibold">{student.percentage?.toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              {student.grade || 'A+'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 9 A+ (Near Full A+) Students Section */}
          {nineAPlusList && nineAPlusList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('nineAPlus')}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Near A+ Students (Missed 1 A+)</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Students who scored A+ in all subjects except 1 • {nineAPlusList.length} students
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(nineAPlusList, 'Near_APlus_9_Subjects')}
                    className="text-xs text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => toggleSection('nineAPlus')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.nineAPlus ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedSections.nineAPlus && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admission No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Missing Subject</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {nineAPlusList.map((student, i) => (
                        <tr key={student.studentId || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.admissionNumber || student.studentCode || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                              {student.missingSubject || student.missingSubjectGrade || '1 Subject'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-amber-600 font-semibold">{student.percentage?.toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 8 A+ Students Section */}
          {eightAPlusList && eightAPlusList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('eightAPlus')}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">8 A+ Students</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Students who scored 8 A+ subjects • {eightAPlusList.length} students
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(eightAPlusList, '8_APlus_Students')}
                    className="text-xs text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => toggleSection('eightAPlus')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.eightAPlus ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedSections.eightAPlus && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admission No</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {eightAPlusList.map((student, i) => (
                        <tr key={student.studentId || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.admissionNumber || student.studentCode || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-blue-600 font-semibold">{student.percentage?.toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 7 A+ Students Section */}
          {sevenAPlusList && sevenAPlusList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('sevenAPlus')}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">7 A+ Students</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Students who scored 7 A+ subjects • {sevenAPlusList.length} students
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(sevenAPlusList, '7_APlus_Students')}
                    className="text-xs text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => toggleSection('sevenAPlus')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.sevenAPlus ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedSections.sevenAPlus && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admission No</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sevenAPlusList.map((student, i) => (
                        <tr key={student.studentId || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.admissionNumber || student.studentCode || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-purple-600 font-semibold">{student.percentage?.toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Near A+ Students Section with Subject-wise Breakdown */}
          {(hasNearFullData || hasDynamicSubjectData) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Near A+ Students Analysis</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Students who missed A+ in one or more subjects
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const allNearData = hasDynamicSubjectData
                        ? dynamicSubjectNames.flatMap(name => (missingAPlusBySubjectMap[name] || []).map(s => ({ ...s, missingSubject: name })))
                        : [
                            ...withoutMathsList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Mathematics' })),
                            ...withoutEnglishList.map(s => ({ ...s, missingSubject: s.missingSubject || 'English' })),
                            ...withoutPhysicsList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Physics' })),
                            ...withoutChemistryList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Chemistry' })),
                            ...withoutBiologyList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Biology' })),
                            ...withoutMalayalamList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Malayalam' })),
                            ...withoutMalayalamIIList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Malayalam II' })),
                            ...withoutHindiList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Hindi' })),
                            ...withoutArabicList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Arabic' })),
                            ...withoutSocialList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Social Science' })),
                            ...withoutITList.map(s => ({ ...s, missingSubject: s.missingSubject || 'IT/Computer' })),
                            ...withoutFirstLanguageList.map(s => ({ ...s, missingSubject: s.missingSubject || 'First Language' })),
                            ...withoutOtherList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Other' }))
                          ]
                      exportToCSV(allNearData, 'Near_A+_Students_All')
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg text-emerald-700"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export All
                  </button>
                </div>
              </div>

              {/* Subject-wise breakdown grid */}
              <div className="grid grid-cols-1 gap-4">
                {hasDynamicSubjectData ? (
                  dynamicSubjectNames.map((subjName, idx) => {
                    const colorClasses = [
                      'bg-sky-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500',
                      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-rose-500',
                      'bg-orange-500', 'bg-cyan-500'
                    ]
                    const themeColor = colorClasses[idx % colorClasses.length]
                    return renderSubjectWiseSection(
                      `📋 Missing A+ in ${subjName}`,
                      missingAPlusBySubjectMap[subjName],
                      `without_${subjName.replace(/\s+/g, '_')}`,
                      themeColor
                    )
                  })
                ) : (
                  <>
                    {renderSubjectWiseSection(
                      '⚡ Missing A+ in Physics',
                      withoutPhysicsList,
                      'withoutPhysics',
                      'bg-sky-500'
                    )}

                    {renderSubjectWiseSection(
                      '🧪 Missing A+ in Chemistry',
                      withoutChemistryList,
                      'withoutChemistry',
                      'bg-teal-500'
                    )}

                    {renderSubjectWiseSection(
                      '🧬 Missing A+ in Biology',
                      withoutBiologyList,
                      'withoutBiology',
                      'bg-emerald-500'
                    )}

                    {renderSubjectWiseSection(
                      '📐 Missing A+ in Mathematics',
                      withoutMathsList,
                      'withoutMaths',
                      'bg-amber-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '📖 Missing A+ in English',
                      withoutEnglishList,
                      'withoutEnglish',
                      'bg-blue-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '📚 Missing A+ in Malayalam',
                      withoutMalayalamList,
                      'withoutMalayalam',
                      'bg-green-500'
                    )}

                    {renderSubjectWiseSection(
                      '📜 Missing A+ in Malayalam II',
                      withoutMalayalamIIList,
                      'withoutMalayalamII',
                      'bg-lime-500'
                    )}

                    {renderSubjectWiseSection(
                      '🔖 Missing A+ in First Language',
                      withoutFirstLanguageList,
                      'withoutFirstLanguage',
                      'bg-cyan-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '🔤 Missing A+ in Hindi',
                      withoutHindiList,
                      'withoutHindi',
                      'bg-orange-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '🕌 Missing A+ in Arabic',
                      withoutArabicList,
                      'withoutArabic',
                      'bg-purple-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '🌍 Missing A+ in Social Science',
                      withoutSocialList,
                      'withoutSocial',
                      'bg-red-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '💻 Missing A+ in IT/Computer Science',
                      withoutITList,
                      'withoutIT',
                      'bg-indigo-500'
                    )}

                    {renderSubjectWiseSection(
                      '📋 Missing A+ in Other Subjects',
                      withoutOtherList,
                      'withoutOther',
                      'bg-slate-500'
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Simple Near A+ List (if no subject-wise data) */}
          {!hasNearFullData && nearFullAPlusList && nearFullAPlusList.length > 0 && (
            renderStudentTable(nearFullAPlusList, 'Near A+ Students (9 A+ out of 10 subjects)', true)
          )}
        </>
      ) : null}
    </div>
  )
}

export default AnalyticsDashboard