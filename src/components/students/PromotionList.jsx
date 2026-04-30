import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  AcademicCapIcon,
  UserGroupIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchStudents } from '../../store/slices/studentSlice'
import { fetchExams } from '../../store/slices/examSlice'
import pdfService, { openPDF, downloadPDF } from '../../services/pdfService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const PromotionList = () => {
  const dispatch = useDispatch()
  const { classes } = useSelector((state) => state.classes)
  const { students, isLoading } = useSelector((state) => state.students)
  const { exams } = useSelector((state) => state.exams)
  
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [promotionData, setPromotionData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchExams({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedClass) {
      loadPromotionData()
    }
  }, [selectedClass, selectedExam])

  const loadPromotionData = async () => {
    if (!selectedClass) return
    setIsGenerating(true)
    try {
      const studentsRes = await dispatch(fetchStudents({ 
        classId: selectedClass, 
        limit: 500 
      })).unwrap()
      
      const studentsList = studentsRes.data || []
      
      const promotedStudents = []
      const failedStudents = []
      const transferredStudents = []
      const discontinuedStudents = []
      
      for (const student of studentsList) {
        if (student.status === 'transferred') {
          transferredStudents.push(student)
        } else if (student.status === 'discontinued') {
          discontinuedStudents.push(student)
        } else if (student.status === 'active') {
          if (selectedExam) {
            try {
              const marksRes = await fetch(`/api/students/${student._id}/marks`)
              const marksData = await marksRes.json()
              const examMarks = marksData.marks?.filter(m => m.examId?._id === selectedExam)
              
              if (examMarks && examMarks.length > 0) {
                const totalObtained = examMarks.reduce((sum, m) => sum + (m.totalScore || 0), 0)
                const totalMax = examMarks.reduce((sum, m) => sum + (m.maxMarks || 0), 0)
                const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
                
                if (percentage >= 40) {
                  promotedStudents.push({ ...student, examPercentage: percentage })
                } else {
                  failedStudents.push({ ...student, examPercentage: percentage })
                }
              } else {
                promotedStudents.push(student)
              }
            } catch (error) {
              promotedStudents.push(student)
            }
          } else {
            promotedStudents.push(student)
          }
        }
      }
      
      const classDetails = classes.find(c => c._id === selectedClass)
      const nextClass = classes.find(c => 
        c.name === String(parseInt(classDetails?.name) + 1)
      )
      
      setPromotionData({
        className: classDetails?.displayName || classDetails?.name || 'Selected Class',
        nextClassName: nextClass?.displayName || nextClass?.name || 'Next Class',
        examName: exams.find(e => e._id === selectedExam)?.name || 'All Exams',
        totalStudents: studentsList.length,
        promotedCount: promotedStudents.length,
        failedCount: failedStudents.length,
        transferredCount: transferredStudents.length,
        discontinuedCount: discontinuedStudents.length,
        promotedStudents,
        failedStudents,
        transferredStudents,
        discontinuedStudents,
        generatedDate: new Date().toLocaleDateString('en-IN'),
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
      })
    } catch (error) {
      console.error('Failed to load promotion data:', error)
      toast.error('Failed to load promotion data')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewPDF = async () => {
    if (!selectedClass) {
      toast.error('Please select a class')
      return
    }
    
    setIsGenerating(true)
    try {
      const pdfBlob = await pdfService.getPromotionListPDF(selectedClass, selectedExam)
      openPDF(pdfBlob, `Promotion_List_${promotionData?.className}.pdf`)
      toast.success('PDF generated successfully')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedClass) {
      toast.error('Please select a class')
      return
    }
    
    setIsGenerating(true)
    try {
      const pdfBlob = await pdfService.downloadPromotionListPDF(selectedClass, selectedExam)
      downloadPDF(pdfBlob, `Promotion_List_${promotionData?.className}.pdf`)
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Failed to download PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      discontinued: 'bg-red-100 text-red-800',
      transferred: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.active}`}>
        {status?.toUpperCase()}
      </span>
    )
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Promotion List</h1>
        <p className="text-gray-500 mt-1">Generate promotion list for students to next class</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class *
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.displayName || `${cls.name}${cls.section ? `-${cls.section}` : ''}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam (Optional - for marks based promotion)
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">All Students (Based on Status)</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.displayName || exam.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={loadPromotionData}
            disabled={!selectedClass || isGenerating}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Loading...' : 'Load Data'}
          </button>
          <button
            onClick={handleViewPDF}
            disabled={!selectedClass || isGenerating || !promotionData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            View PDF
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!selectedClass || isGenerating || !promotionData}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Promotion Results */}
      {promotionData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900">{promotionData.totalStudents}</p>
                </div>
                <UserGroupIcon className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Promoted</p>
                  <p className="text-2xl font-bold text-green-900">{promotionData.promotedCount}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-900">{promotionData.failedCount}</p>
                </div>
                <XCircleIcon className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Transferred</p>
                  <p className="text-2xl font-bold text-yellow-900">{promotionData.transferredCount}</p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Discontinued</p>
                  <p className="text-2xl font-bold text-gray-900">{promotionData.discontinuedCount}</p>
                </div>
                <DocumentTextIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Promoted Students Table */}
          {promotionData.promotedStudents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-white border-b">
                <h2 className="text-lg font-semibold text-green-800">Promoted Students</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Students eligible for promotion to {promotionData.nextClassName}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      {selectedExam && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotionData.promotedStudents.map((student, idx) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-xs text-gray-500">{student.studentCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.admissionNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(student.status)}</td>
                        {selectedExam && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              {student.examPercentage?.toFixed(1)}%
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed Students Table */}
          {promotionData.failedStudents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b">
                <h2 className="text-lg font-semibold text-red-800">Failed / Need to Repeat</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Students who need to repeat the current class
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      {selectedExam && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotionData.failedStudents.map((student, idx) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-xs text-gray-500">{student.studentCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.admissionNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(student.status)}</td>
                        {selectedExam && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-red-600">
                              {student.examPercentage?.toFixed(1)}%
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transferred Students Table */}
          {promotionData.transferredStudents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-white border-b">
                <h2 className="text-lg font-semibold text-yellow-800">Transferred Students</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Students who have been transferred to other schools
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotionData.transferredStudents.map((student, idx) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-xs text-gray-500">{student.studentCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.admissionNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Discontinued Students Table */}
          {promotionData.discontinuedStudents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b">
                <h2 className="text-lg font-semibold text-gray-800">Discontinued Students</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Students who have discontinued their studies
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotionData.discontinuedStudents.map((student, idx) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-xs text-gray-500">{student.studentCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.admissionNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Footer */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  <strong>Class:</strong> {promotionData.className} → {promotionData.nextClassName}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Academic Year:</strong> {promotionData.academicYear}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Generated on:</strong> {promotionData.generatedDate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  <strong>Promotion Rate:</strong> 
                  <span className="text-green-600 font-semibold ml-1">
                    {promotionData.totalStudents > 0 
                      ? ((promotionData.promotedCount / promotionData.totalStudents) * 100).toFixed(1)
                      : 0}%
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Total Students Processed:</strong> {promotionData.totalStudents}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {selectedClass && !promotionData && !isGenerating && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">Click "Load Data" to generate promotion list for this class</p>
        </div>
      )}
    </div>
  )
}

export default PromotionList