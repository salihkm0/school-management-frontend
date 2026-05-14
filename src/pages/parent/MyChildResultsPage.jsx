// src/pages/parent/MyChildResultsPage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon,
  ChartBarIcon
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const examsData = await examsResponse.json()
      const publishedExams = examsData.data?.filter(exam => exam.overallStatus === 'published') || []
      
      const resultsList = []
      
      for (const exam of publishedExams) {
        try {
          const marksResponse = await fetch(`http://localhost:5055/api/marks/result/${exam._id}/${childId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          })
          const marksData = await marksResponse.json()
          
          if (marksData && marksData.data && marksData.data.subjects && marksData.data.subjects.length > 0) {
            let totalMarks = 0, totalMaxMarks = 0
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
              totalMarks, totalMaxMarks,
              percentage: totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0,
              grade: calculateGrade(totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0),
              subjectResults: marksData.data.subjects.map(subject => ({
                subjectName: subject.subjectName,
                maxMarks: subject.maxMarks,
                theoryScore: subject.theoryScore || 0,
                practicalScore: subject.practicalScore || 0,
                obtainedMarks: subject.totalScore,
                percentage: subject.percentage || (subject.maxMarks > 0 ? (subject.totalScore / subject.maxMarks) * 100 : 0),
                grade: subject.grade
              }))
            })
          }
        } catch (error) { console.error(`Failed to load marks for exam ${exam._id}:`, error) }
      }
      
      resultsList.sort((a, b) => new Date(b.date) - new Date(a.date))
      setResults(resultsList)
      if (resultsList.length > 0 && !expandedExam) setExpandedExam(resultsList[0].examId)
    } catch (error) { console.error('Failed to load results:', error) }
    finally { setIsLoading(false) }
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
      case 'A+': return 'bg-emerald-100 text-emerald-700'
      case 'A': return 'bg-green-100 text-green-700'
      case 'B+': return 'bg-blue-100 text-blue-700'
      case 'B': return 'bg-cyan-100 text-cyan-700'
      case 'C+': return 'bg-amber-100 text-amber-700'
      case 'C': return 'bg-orange-100 text-orange-700'
      default: return 'bg-rose-100 text-rose-700'
    }
  }

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600'
    if (percentage >= 60) return 'text-blue-600'
    if (percentage >= 40) return 'text-amber-600'
    return 'text-rose-600'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (childrenLoading) return <LoadingSpinner />

  if (myChildren.length === 0) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-800 mb-1">No Children Connected</h2>
          <p className="text-sm text-gray-500">Please connect your children first from the dashboard.</p>
          <button onClick={() => navigate('/my-children')} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            <ArrowLeftIcon className="w-4 h-4" /> Go to My Children
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/my-children')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Exam Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">View your child's academic performance</p>
        </div>
      </div>

      {/* Student Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
        <div className="flex flex-wrap gap-2">
          {myChildren.map((child) => {
            const childId = child._id || child.studentId
            const isSelected = selectedChild?._id === child._id || selectedChild?.studentId === child.studentId
            const isLoadingStudent = loadingChildId === childId
            
            return (
              <button
                key={childId}
                onClick={() => handleChildSelect(child)}
                disabled={isLoadingStudent}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-2 ${
                  isSelected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isLoadingStudent ? 'opacity-50 cursor-wait' : ''}`}
              >
                {isLoadingStudent ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {child.fullName?.charAt(0) || child.studentName?.charAt(0) || 'S'}
                  </div>
                )}
                {child.fullName || child.studentName}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Content */}
      {selectedChild && (
        <div>
          {/* Student Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-700 font-semibold text-base">
                  {selectedChild.fullName?.charAt(0) || selectedChild.studentName?.charAt(0) || 'S'}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{selectedChild.fullName || selectedChild.studentName}</h2>
                <p className="text-xs text-gray-500">Class: {selectedChild.className || 'N/A'} | Roll: {selectedChild.rollNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading results...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800 mb-1">No Results Available</h3>
              <p className="text-sm text-gray-500">No exam results have been published yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((exam, idx) => {
                const isExpanded = expandedExam === exam.examId
                const gradeColor = getGradeColor(exam.grade)
                
                return (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedExam(isExpanded ? null : exam.examId)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-gray-900">{exam.examName}</h3>
                          <p className="text-xs text-gray-500">{exam.term} Term • {formatDate(exam.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{exam.percentage.toFixed(1)}%</div>
                          <span className={`inline-block px-1.5 py-0.5 text-xs rounded-md ${gradeColor}`}>{exam.grade}</span>
                        </div>
                        {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-gray-900">Subject-wise Performance</h4>
                          <button onClick={() => {
                            const ws = XLSX.utils.json_to_sheet(exam.subjectResults.map(s => ({
                              'Subject': s.subjectName, 'Max': s.maxMarks, 'Theory': s.theoryScore, 'Practical': s.practicalScore,
                              'Total': s.obtainedMarks, 'Percentage': `${s.percentage?.toFixed(1)}%`, 'Grade': s.grade
                            })))
                            const wb = XLSX.utils.book_new()
                            XLSX.utils.book_append_sheet(wb, ws, `${exam.examName}_${selectedChild.fullName}`)
                            XLSX.writeFile(wb, `${exam.examName}_${selectedChild.fullName}_results.xlsx`)
                          }} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            <DocumentTextIcon className="w-3 h-3" /> Export
                          </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-100">
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
                              {exam.subjectResults.map((subject, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{subject.subjectName}</td>
                                  <td className="px-3 py-2 text-center text-sm text-gray-600">{subject.theoryScore || 0}</td>
                                  <td className="px-3 py-2 text-center text-sm text-gray-600">{subject.practicalScore || 0}</td>
                                  <td className="px-3 py-2 text-center text-sm font-semibold text-gray-800">{subject.obtainedMarks}</td>
                                  <td className="px-3 py-2 text-center text-sm text-gray-600">{subject.maxMarks}</td>
                                  <td className="px-3 py-2 text-center"><span className={`text-sm font-medium ${getPercentageColor(subject.percentage)}`}>{subject.percentage?.toFixed(1)}%</span></td>
                                  <td className="px-3 py-2 text-center"><span className={`inline-block px-2 py-0.5 text-xs rounded-md ${getGradeColor(subject.grade)}`}>{subject.grade}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
  )
}

export default MyChildResultsPage