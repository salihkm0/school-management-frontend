// src/components/reports/ReportCard.jsx
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { generateReportCardPDF } from '../../services/analyticsService'
import { fetchStudents } from '../../store/slices/studentSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { useDispatch, useSelector } from 'react-redux'
import { 
  DocumentArrowDownIcon, 
  UserIcon, 
  CalendarIcon,
  AcademicCapIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ReportCard = () => {
  const dispatch = useDispatch()
  const { students, isLoading: studentsLoading } = useSelector((state) => state.students)
  const { academicYears } = useSelector((state) => state.academicYears)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewStudent, setPreviewStudent] = useState(null)

  const { register, handleSubmit, watch, setValue } = useForm()
  const selectedStudentId = watch('studentId')
  const selectedYearId = watch('academicYearId')

  useEffect(() => {
    dispatch(fetchStudents({ limit: 1000 }))
    dispatch(fetchAcademicYears({ limit: 10 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => s._id === selectedStudentId)
      setPreviewStudent(student)
    } else {
      setPreviewStudent(null)
    }
  }, [selectedStudentId, students])

  const onSubmit = async (data) => {
    if (!data.studentId) {
      toast.error('Please select a student')
      return
    }
    setIsGenerating(true)
    try {
      const pdfBlob = await generateReportCardPDF(data.studentId, data.academicYearId)
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, '_blank')
      toast.success('Report card generated')
    } catch (error) {
      toast.error('Failed to generate report card')
    } finally {
      setIsGenerating(false)
    }
  }

  if (studentsLoading) return <LoadingSpinner />

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
                Select Student <span className="text-red-500">*</span>
              </label>
              <select
                {...register('studentId', { required: 'Student is required' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
              >
                <option value="">Choose a student...</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.admissionNo || s.studentCode})
                  </option>
                ))}
              </select>
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
                
                {previewStudent.parentName && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Parent/Guardian</p>
                    <p className="text-sm font-medium text-gray-800">{previewStudent.parentName}</p>
                    {previewStudent.parentPhone && (
                      <p className="text-xs text-gray-500 mt-1">{previewStudent.parentPhone}</p>
                    )}
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