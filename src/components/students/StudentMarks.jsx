import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { fetchStudentById } from '../../store/slices/studentSlice'
import studentService from '../../services/studentService'
import LoadingSpinner from '../common/LoadingSpinner'
import { 
  ChartBarIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

const getGradeColor = (grade) => {
  const colors = {
    'A+': 'bg-green-100 text-green-800',
    'A': 'bg-emerald-100 text-emerald-800',
    'B+': 'bg-blue-100 text-blue-800',
    'B': 'bg-cyan-100 text-cyan-800',
    'C+': 'bg-yellow-100 text-yellow-800',
    'C': 'bg-orange-100 text-orange-800',
    'D': 'bg-red-100 text-red-800',
    'F': 'bg-gray-100 text-gray-800'
  }
  return colors[grade] || 'bg-gray-100 text-gray-800'
}

const StudentMarks = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const [student, setStudent] = useState(null)
  const [marksData, setMarksData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState(null)
  const [expandedExams, setExpandedExams] = useState({})

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const studentRes = await dispatch(fetchStudentById(id)).unwrap()
      setStudent(studentRes)
      const marksRes = await studentService.getStudentMarks(id)
      console.log('Marks Response:', marksRes)
      setMarksData(marksRes)
      
      // Select first exam by default
      if (marksRes.analytics?.examWise) {
        const examIds = Object.keys(marksRes.analytics.examWise)
        if (examIds.length > 0 && !selectedExam) {
          setSelectedExam(examIds[0])
        }
      }
    } catch (error) { 
      console.error('Failed to load data:', error) 
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
      Object.keys(marksData.analytics.examWise).forEach(id => {
        allExpanded[id] = true
      })
      setExpandedExams(allExpanded)
    }
  }

  const collapseAll = () => {
    setExpandedExams({})
  }

  const analytics = marksData?.analytics || { overall: {}, subjectWise: {}, examWise: {} }
  const examWise = analytics.examWise || {}
  const uniqueExams = Object.keys(examWise)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student?.fullName} - Marks & Performance</h1>
          <p className="text-gray-500">{student?.className} {student?.division} | Admission: {student?.admissionNo}</p>
        </div>
        <Link to={`/students/${id}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Back to Profile</Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-center">
            <ChartBarIcon className="w-10 h-10 opacity-50" />
            <span className="text-3xl font-bold">{marksData?.summary?.overallPercentage || 0}%</span>
          </div>
          <p className="mt-2 text-sm">Overall Average</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-center">
            <AcademicCapIcon className="w-10 h-10 opacity-50" />
            <span className="text-3xl font-bold">{marksData?.summary?.totalExams || 0}</span>
          </div>
          <p className="mt-2 text-sm">Total Exams</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-center">
            <DocumentTextIcon className="w-10 h-10 opacity-50" />
            <span className="text-3xl font-bold">{marksData?.summary?.totalSubjects || 0}</span>
          </div>
          <p className="mt-2 text-sm">Subjects Attempted</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{marksData?.summary?.totalMarksObtained || 0}</span>
            <span className="text-sm">/{marksData?.summary?.totalMaxMarks || 0}</span>
          </div>
          <p className="mt-2 text-sm">Total Marks</p>
        </div>
      </div>

      {/* Exam Selection and Actions */}
      {uniqueExams.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700">Select Exam</label>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Collapse All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueExams.map((examId) => (
              <button
                key={examId}
                onClick={() => setSelectedExam(examId)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedExam === examId
                    ? 'bg-primary-500 text-white'
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
      {uniqueExams.length > 0 && (
        <div className="space-y-4">
          {uniqueExams.map((examId) => {
            const exam = examWise[examId]
            const isExpanded = expandedExams[examId] || selectedExam === examId
            const examPercentage = exam.totalMaxMarks > 0 
              ? ((exam.totalMarks / exam.totalMaxMarks) * 100).toFixed(1)
              : 0
            
            return (
              <div key={examId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Exam Header */}
                <div 
                  className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExamExpand(examId)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{exam.examName}</h3>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-500 capitalize">{exam.examType}</span>
                        <span className="text-xs text-gray-500 capitalize">{exam.term} Term</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">{examPercentage}%</p>
                        <p className="text-xs text-gray-500">{exam.totalMarks}/{exam.totalMaxMarks} marks</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Exam Subjects Table (expanded) */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Theory</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Practical</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Max</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">%</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {exam.subjects.map((subject, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {subject.subjectName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {subject.theoryScore !== undefined && subject.theoryScore !== null ? subject.theoryScore : (subject.score ? Math.round(subject.score * 0.8) : '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {subject.practicalScore !== undefined && subject.practicalScore !== null 
                                ? subject.practicalScore 
                                : (subject.score ? Math.round(subject.score * 0.2) : '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                              {subject.totalScore || subject.score || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {subject.maxMarks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {subject.percentage?.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-2 py-1 text-xs rounded-full ${getGradeColor(subject.grade)}`}>
                                {subject.grade}
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
          })}
        </div>
      )}

      {/* Subject-wise Performance Summary */}
      {analytics.subjectWise && Object.keys(analytics.subjectWise).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance Summary</h2>
          <div className="space-y-4">
            {Object.entries(analytics.subjectWise).map(([subject, data]) => (
              <div key={subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{subject}</span>
                  <span className="text-gray-500">{data.averagePercentage?.toFixed(1)}% Avg ({data.count} exams)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${data.averagePercentage || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {uniqueExams.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Marks Available</h3>
          <p className="text-gray-500">No marks have been entered for this student yet.</p>
        </div>
      )}
    </div>
  )
}

export default StudentMarks