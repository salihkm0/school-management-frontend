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
  MagnifyingGlassIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'

const AnalyticsDashboard = () => {
  const dispatch = useDispatch()
  const { exams } = useSelector((state) => state.exams)
  const { classes } = useSelector((state) => state.classes)
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [gradeAnalysis, setGradeAnalysis] = useState(null)
  const [fullAPlus, setFullAPlus] = useState([])
  const [nearFullAPlus, setNearFullAPlus] = useState([])
  const [topClasses, setTopClasses] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchExams({ limit: 50 }))
    dispatch(fetchClasses({ limit: 50 }))
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
        fetchGradeAnalysis(selectedExam, selectedClass),
        fetchFullAPlusStudents(selectedExam, selectedClass),
        fetchNearFullAPlusStudents(selectedExam, selectedClass),
        fetchTopPerformingClasses(selectedExam, 5)
      ])
      setGradeAnalysis(analysis)
      setFullAPlus(fullA?.data || [])
      setNearFullAPlus(nearFullA?.data || [])
      setTopClasses(topC || [])
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedClass('')
    if (selectedExam) loadAnalytics()
  }

  if (isLoading) return <LoadingSpinner />

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
                <span className="text-3xl font-bold">{gradeAnalysis.summary?.fullAPlus || 0}</span>
              </div>
              <p className="text-sm opacity-90">Full A+ Students</p>
              <p className="text-xs opacity-75 mt-1">
                {gradeAnalysis.summary?.fullAPlusPercentage?.toFixed(1) || 0}% of total
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <AcademicCapIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{gradeAnalysis.totalStudents || 0}</span>
              </div>
              <p className="text-sm opacity-90">Total Students</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <ChartBarIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{gradeAnalysis.summary?.passPercentage?.toFixed(1) || 0}%</span>
              </div>
              <p className="text-sm opacity-90">Pass Percentage</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <UserGroupIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{gradeAnalysis.summary?.nearFullAPlus || 0}</span>
              </div>
              <p className="text-sm opacity-90">Near Full A+</p>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Grade Distribution</h2>
              <p className="text-sm text-gray-500 mt-0.5">Student performance breakdown by grade</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(gradeAnalysis.gradeDistribution || {}).map(([grade, count]) => {
                  const percentage = (count / gradeAnalysis.totalStudents) * 100
                  let barColor = 'bg-primary-500'
                  if (grade === 'A+') barColor = 'bg-emerald-500'
                  else if (grade === 'A') barColor = 'bg-green-500'
                  else if (grade === 'B+') barColor = 'bg-blue-500'
                  else if (grade === 'B') barColor = 'bg-cyan-500'
                  else if (grade === 'C+') barColor = 'bg-yellow-500'
                  else if (grade === 'C') barColor = 'bg-orange-500'
                  else if (grade === 'D') barColor = 'bg-red-500'
                  else barColor = 'bg-gray-500'
                  
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

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Full A+ Students */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Full A+ Students</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Students who scored A+ in all subjects</p>
                  </div>
                  <TrophyIcon className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <div className="p-6">
                {fullAPlus.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrophyIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500">No full A+ students found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fullAPlus.slice(0, 10).map((student, i) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="text-gray-700">{student.studentName}</span>
                        </div>
                        <span className="text-emerald-600 font-medium">{student.percentage?.toFixed(1)}%</span>
                      </div>
                    ))}
                    {fullAPlus.length > 10 && (
                      <p className="text-center text-sm text-gray-400 pt-2">
                        + {fullAPlus.length - 10} more students
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Top Performing Classes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Top Performing Classes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Classes with highest average scores</p>
                  </div>
                  <AcademicCapIcon className="w-6 h-6 text-blue-500" />
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
                      <div key={i} className="flex justify-between items-center py-2">
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
                              style={{ width: `${cls.averagePercentage || 0}%` }}
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
          </div>

          {/* Near Full A+ Students Section */}
          {nearFullAPlus.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Near Full A+ Students</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Students who missed A+ in one or more subjects</p>
                  </div>
                  <ChartBarIcon className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Percentage</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Missing Subjects</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {nearFullAPlus.slice(0, 20).map((student, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.studentName}</td>
                          <td className="px-4 py-3 text-center text-sm text-amber-600 font-medium">
                            {student.percentage?.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {student.missingSubjects?.slice(0, 3).map((subject, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                                  {subject}
                                </span>
                              ))}
                              {student.missingSubjects?.length > 3 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{student.missingSubjects.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {nearFullAPlus.length > 20 && (
                  <p className="text-center text-sm text-gray-400 mt-4 pt-2 border-t">
                    + {nearFullAPlus.length - 20} more students
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export default AnalyticsDashboard