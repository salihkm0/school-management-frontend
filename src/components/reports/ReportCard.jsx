// src/components/reports/ReportCard.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { generateReportCardPDF, fetchExamsForDropdown } from '../../services/analyticsService'
import { fetchStudents } from '../../store/slices/studentSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { useDispatch, useSelector } from 'react-redux'
import { 
  DocumentArrowDownIcon, 
  UserIcon, 
  EyeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ReportCard = () => {
  const dispatch = useDispatch()
  const { students, isLoading: studentsLoading } = useSelector((state) => state.students)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { classes } = useSelector((state) => state.classes)
  const [exams, setExams] = useState([])
  const [isLoadingExams, setIsLoadingExams] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewStudent, setPreviewStudent] = useState(null)

  const { register, handleSubmit, watch, setValue } = useForm()
  const selectedStudentId = watch('studentId')
  const selectedExamId = watch('examId')
  const selectedYearId = watch('academicYearId')
  const selectedClassId = watch('classId')

  // Load exams when class is selected or on mount
  useEffect(() => {
    loadExams()
  }, [selectedClassId])

  // Load initial static data (Classes & Academic Years)
  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 10 }))
    dispatch(fetchClasses({ limit: 100 }))
  }, [dispatch])

  // Fetch students filtered by class whenever selectedClassId changes
  useEffect(() => {
    if (selectedClassId) {
      dispatch(fetchStudents({ classId: selectedClassId, limit: 1000, status: 'active' }))
    } else {
      dispatch(fetchStudents({ limit: 1000, status: 'active' }))
    }
  }, [dispatch, selectedClassId])

  // Memoize and sort class students by roll number & name
  const availableStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return []
    const filtered = selectedClassId 
      ? students.filter(s => s.classId === selectedClassId || s.classId?._id === selectedClassId)
      : students

    return [...filtered].sort((a, b) => {
      const rA = Number(a.rollNumber) || 9999
      const rB = Number(b.rollNumber) || 9999
      if (rA !== rB) return rA - rB
      return (a.fullName || '').localeCompare(b.fullName || '')
    })
  }, [students, selectedClassId])

  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => s._id === selectedStudentId)
      setPreviewStudent(student)
      if (student) {
        setValue('classId', student.classId?._id || student.classId)
      }
    } else {
      setPreviewStudent(null)
    }
  }, [selectedStudentId, students, setValue])

  const loadExams = async () => {
    setIsLoadingExams(true)
    try {
      const response = await fetchExamsForDropdown()
      const examsData = response.data || []
      setExams(examsData)
    } catch (error) {
      console.error('Failed to load exams:', error)
      setExams([])
    } finally {
      setIsLoadingExams(false)
    }
  }

  const onSubmit = async (data) => {
    if (!data.studentId) {
      toast.error('Please select a student')
      return
    }
    if (!data.examId) {
      toast.error('Please select an exam')
      return
    }
    setIsGenerating(true)
    try {
      const pdfBlob = await generateReportCardPDF(
        data.studentId, 
        data.examId, 
        data.academicYearId,
        data.attendanceStartDate,
        data.attendanceEndDate
      )
      const url = URL.createObjectURL(pdfBlob)
      
      // Trigger direct download to ensure file is saved even if popup blocker is active
      const link = document.createElement('a')
      link.href = url
      link.download = `Report_Card_${previewStudent?.rollNumber || data.studentId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Attempt to open in a new window/tab
      try {
        window.open(url, '_blank')
      } catch (e) {
        console.warn('Tab open blocked by browser popup blocker, downloaded directly instead.')
      }

      setTimeout(() => URL.revokeObjectURL(url), 30000)
      toast.success('Report card generated and downloaded')
    } catch (error) {
      console.error('Error generating report card:', error)
      let errorMsg = 'Failed to generate report card'
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const json = JSON.parse(text)
          errorMsg = json.message || errorMsg
        } catch (e) {
          errorMsg = error.message || errorMsg
        }
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      } else if (error.message) {
        errorMsg = error.message
      }
      toast.error(errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  if (studentsLoading && (!students || students.length === 0)) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DocumentArrowDownIcon className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Generate Report Card</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Generate individual student report cards</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class <span className="text-red-500">*</span>
              </label>
              <select
                {...register('classId', { required: 'Class is required' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                onChange={(e) => {
                  setValue('classId', e.target.value)
                  setValue('studentId', '')
                }}
              >
                <option value="">Choose a class...</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.displayName || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Student <span className="text-red-500">*</span>
              </label>
              <select
                {...register('studentId', { required: 'Student is required' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                disabled={!selectedClassId || studentsLoading}
              >
                <option value="">
                  {studentsLoading ? 'Loading students...' : 'Choose a student...'}
                </option>
                {availableStudents.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.rollNumber ? `${s.rollNumber}. ` : ''}{s.fullName} ({s.admissionNo || s.studentCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Exam <span className="text-red-500">*</span>
              </label>
              <select
                {...register('examId', { required: 'Exam is required' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                disabled={isLoadingExams}
              >
                <option value="">Choose an exam...</option>
                {exams.map(e => (
                  <option key={e._id} value={e._id}>
                    {e.displayName || e.name} ({e.examType})
                  </option>
                ))}
              </select>
              {isLoadingExams && <p className="text-xs text-gray-400 mt-1">Loading exams...</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <select
                {...register('academicYearId')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
              >
                <option value="">Current Academic Year</option>
                {academicYears.map(y => (
                  <option key={y._id} value={y._id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Attendance Period <span className="text-gray-400 font-normal lowercase">(Optional Date Range)</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    {...register('attendanceStartDate')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    {...register('attendanceEndDate')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-colors"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Leave empty to automatically calculate attendance from the exam schedule dates.
              </p>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !selectedStudentId}
              className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 font-medium"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>Generate Report Card</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Student Preview</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Selected student information</p>
          </div>
          
          <div className="p-6">
            {!selectedStudentId ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500">Select a student to preview</p>
              </div>
            ) : previewStudent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {previewStudent.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{previewStudent.fullName}</h3>
                    <p className="text-sm text-gray-500">{previewStudent.admissionNo || previewStudent.studentCode}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Class</p>
                    <p className="text-sm font-medium text-gray-800">{previewStudent.className || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Roll Number</p>
                    <p className="text-sm font-medium text-gray-800">{previewStudent.rollNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">{previewStudent.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-800">
                      {previewStudent.dateOfBirth ? new Date(previewStudent.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {previewStudent.fatherFullName && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Father's Name</p>
                    <p className="text-sm font-medium text-gray-800">{previewStudent.fatherFullName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportCard