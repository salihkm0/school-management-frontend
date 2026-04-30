// src/pages/parent/MyChildResultsPage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  AcademicCapIcon,
  TrophyIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { fetchMyChildren } from '../../store/slices/parentSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import * as XLSX from 'xlsx'

const MyChildResultsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { myChildren, isLoading: childrenLoading } = useSelector((state) => state.parents || { myChildren: [] })
  
  const [selectedChild, setSelectedChild] = useState(null)
  const [results, setResults] = useState([])
  const [expandedExam, setExpandedExam] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingChildId, setLoadingChildId] = useState(null)

  useEffect(() => {
    loadChildren()
  }, [dispatch])

  useEffect(() => {
    if (myChildren.length > 0 && !selectedChild) {
      const firstChild = myChildren[0]
      setSelectedChild(firstChild)
      loadResults(firstChild._id || firstChild.studentId)
    }
  }, [myChildren])

  const loadChildren = async () => {
    await dispatch(fetchMyChildren())
  }

  const handleChildSelect = async (child) => {
    // Don't do anything if already loading or same child
    if (loadingChildId) return
    
    const childId = child._id || child.studentId
    const currentChildId = selectedChild?._id || selectedChild?.studentId
    
    if (currentChildId === childId) return
    
    setLoadingChildId(childId)
    setSelectedChild(child)
    setResults([])
    setExpandedExam(null)
    
    await loadResults(childId)
    setLoadingChildId(null)
  }

  const loadResults = async (childId) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const examsResponse = await fetch('http://localhost:5055/api/exams?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const examsData = await examsResponse.json()
      const publishedExams = examsData.data?.filter(exam => exam.overallStatus === 'published') || []
      
      const resultsList = []
      
      for (const exam of publishedExams) {
        try {
          const marksResponse = await fetch(`http://localhost:5055/api/marks/result/${exam._id}/${childId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          const marksData = await marksResponse.json()
          
          if (marksData && marksData.data && marksData.data.subjects && marksData.data.subjects.length > 0) {
            let totalMarks = 0
            let totalMaxMarks = 0
            
            marksData.data.subjects.forEach(subject => {
              totalMarks += subject.totalScore || 0
              totalMaxMarks += subject.maxMarks || 0
            })
            
            resultsList.push({
              examId: exam._id,
              examName: exam.displayName || exam.name,
              examType: exam.examType,
              term: exam.term,
              date: exam.startDate,
              totalMarks: totalMarks,
              totalMaxMarks: totalMaxMarks,
              percentage: totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0,
              grade: calculateGrade(totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0),
              subjectResults: marksData.data.subjects.map(subject => ({
                subjectId: subject.subjectId,
                subjectName: subject.subjectName,
                subjectCode: subject.subjectCode,
                maxMarks: subject.maxMarks,
                obtainedMarks: subject.totalScore,
                theoryScore: subject.theoryScore || 0,
                practicalScore: subject.practicalScore || 0,
                percentage: subject.percentage || (subject.maxMarks > 0 ? (subject.totalScore / subject.maxMarks) * 100 : 0),
                grade: subject.grade,
                status: subject.grade === 'F' ? 'fail' : 'pass'
              }))
            })
          }
        } catch (error) {
          console.error(`Failed to load marks for exam ${exam._id}:`, error)
        }
      }
      
      resultsList.sort((a, b) => new Date(b.date) - new Date(a.date))
      setResults(resultsList)
      
      if (resultsList.length > 0 && !expandedExam) {
        setExpandedExam(resultsList[0].examId)
      }
    } catch (error) {
      console.error('Failed to load results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C+'
    if (percentage >= 40) return 'C'
    if (percentage >= 33) return 'D'
    return 'F'
  }

  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A+': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'A': return 'text-green-600 bg-green-50 border-green-200'
      case 'B+': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'B': return 'text-cyan-600 bg-cyan-50 border-cyan-200'
      case 'C+': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'C': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-rose-600 bg-rose-50 border-rose-200'
    }
  }

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600'
    if (percentage >= 60) return 'text-blue-600'
    if (percentage >= 40) return 'text-amber-600'
    return 'text-rose-600'
  }

  const exportToExcel = (exam) => {
    if (!exam) return
    
    const exportData = exam.subjectResults?.map(subject => ({
      'Subject': subject.subjectName,
      'Max Marks': subject.maxMarks,
      'Theory': subject.theoryScore || 0,
      'Practical': subject.practicalScore || 0,
      'Total': subject.obtainedMarks,
      'Percentage': `${subject.percentage?.toFixed(1)}%`,
      'Grade': subject.grade,
      'Status': subject.status === 'pass' ? 'Pass' : 'Fail'
    })) || []
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${exam.examName}_${selectedChild?.fullName || selectedChild?.studentName}`)
    XLSX.writeFile(wb, `${exam.examName}_${selectedChild?.fullName || selectedChild?.studentName}_results.xlsx`)
  }

  const toggleExpand = (examId) => {
    setExpandedExam(expandedExam === examId ? null : examId)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (childrenLoading) {
    return <LoadingSpinner />
  }

  if (myChildren.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-12 h-12 text-primary-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Children Connected</h2>
            <p className="text-gray-500">Please connect your children first from the dashboard.</p>
            <button
              onClick={() => navigate('/my-children')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Go to My Children
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/my-children')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to My Children
          </button>
          
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">Exam Results</h1>
              <p className="text-primary-100 mt-1 text-sm">
                View your child's academic performance
              </p>
            </div>
          </div>
        </div>

        {/* Student Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
          <div className="flex flex-wrap gap-3">
            {myChildren.map((child) => {
              const childId = child._id || child.studentId
              const isSelected = selectedChild?._id === child._id || selectedChild?.studentId === child.studentId
              const isLoadingStudent = loadingChildId === childId
              
              return (
                <button
                  key={childId}
                  onClick={() => handleChildSelect(child)}
                  disabled={isLoadingStudent}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isLoadingStudent ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isLoadingStudent ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                      {child.fullName?.charAt(0) || child.studentName?.charAt(0) || 'S'}
                    </div>
                  )}
                  {child.fullName || child.studentName}
                </button>
              )
            })}
          </div>
        </div>

        {/* Details Section */}
        {selectedChild && (
          <div>
            {/* Student Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-primary-600 font-bold text-lg">
                      {selectedChild.fullName?.charAt(0) || selectedChild.studentName?.charAt(0) || 'S'}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{selectedChild.fullName || selectedChild.studentName}</h2>
                  <p className="text-sm text-gray-500">
                    Class: {selectedChild.className || selectedChild.class?.displayName || 'N/A'} | 
                    Roll No: {selectedChild.rollNumber || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading exam results...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Available</h3>
                <p className="text-gray-500">No exam results have been published yet for this student.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Examination Results</h2>
                
                {results.map((exam, idx) => {
                  const isExpanded = expandedExam === exam.examId
                  const gradeColor = getGradeColor(exam.grade)
                  
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
                    >
                      <div
                        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleExpand(exam.examId)}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{exam.examName}</h3>
                                <p className="text-xs text-gray-500">
                                  {exam.term?.charAt(0).toUpperCase() + exam.term?.slice(1)} Term • {formatDate(exam.date)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Total:</span>
                                <span className="font-semibold text-gray-800">
                                  {exam.totalMarks}/{exam.totalMaxMarks}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Percentage:</span>
                                <span className={`font-semibold ${getPercentageColor(exam.percentage)}`}>
                                  {exam.percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className={`px-2 py-1 text-xs rounded-full border ${gradeColor}`}>
                                  Grade: {exam.grade}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-gray-400">
                            {isExpanded ? (
                              <ChevronUpIcon className="w-5 h-5" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-gray-800">Subject-wise Performance</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                exportToExcel(exam)
                              }}
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                              Export as Excel
                            </button>
                          </div>
                          
                          <div className="overflow-x-auto mb-5">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Subject</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Theory</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Practical</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Total</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Max</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">%</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {exam.subjectResults.map((subject, sIdx) => (
                                  <tr key={sIdx} className="hover:bg-white">
                                    <td className="px-3 py-2 text-sm font-medium text-gray-800">{subject.subjectName}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-600">{subject.theoryScore || 0}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-600">{subject.practicalScore || 0}</td>
                                    <td className="px-3 py-2 text-center text-sm font-semibold text-gray-800">{subject.obtainedMarks}</td>
                                    <td className="px-3 py-2 text-center text-sm text-gray-600">{subject.maxMarks}</td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={`text-sm font-medium ${getPercentageColor(subject.percentage)}`}>
                                        {subject.percentage?.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={`px-2 py-0.5 text-xs rounded-full ${getGradeColor(subject.grade)}`}>
                                        {subject.grade}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Performance Overview</h5>
                            <div className="space-y-3">
                              {exam.subjectResults.map((subject, sIdx) => {
                                const percentage = subject.percentage || 0
                                return (
                                  <div key={sIdx}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-600">{subject.subjectName}</span>
                                      <span className={`font-medium ${getPercentageColor(percentage)}`}>
                                        {percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          percentage >= 75 ? 'bg-emerald-500' :
                                          percentage >= 60 ? 'bg-blue-500' :
                                          percentage >= 40 ? 'bg-amber-500' :
                                          'bg-rose-500'
                                        }`}
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyChildResultsPage