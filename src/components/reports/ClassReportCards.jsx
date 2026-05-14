// src/components/reports/ClassReportCards.jsx
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { generateClassReportCardsPDF, fetchExamsForDropdown } from '../../services/analyticsService'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { useDispatch, useSelector } from 'react-redux'
import { 
  DocumentArrowDownIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  InformationCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ClassReportCards = () => {
  const dispatch = useDispatch()
  const { classes } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  const [exams, setExams] = useState([])
  const [isLoadingExams, setIsLoadingExams] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedClassInfo, setSelectedClassInfo] = useState(null)

  const { register, handleSubmit, watch } = useForm()
  const selectedClassId = watch('classId')
  const selectedExamId = watch('examId')

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 10 }))
    loadExams()
  }, [dispatch])

  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find(c => c._id === selectedClassId)
      setSelectedClassInfo(cls)
    } else {
      setSelectedClassInfo(null)
    }
  }, [selectedClassId, classes])

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
    if (!data.classId) {
      toast.error('Please select a class')
      return
    }
    setIsGenerating(true)
    try {
      const pdfBlob = await generateClassReportCardsPDF(data.classId, data.examId, data.academicYearId)
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, '_blank')
      toast.success('Class report cards generated')
    } catch (error) {
      console.error('Error generating class report cards:', error)
      toast.error(error.message || 'Failed to generate report cards')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DocumentArrowDownIcon className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Generate Class Report Cards</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Generate report cards for all students in a class</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class <span className="text-red-500">*</span>
              </label>
              <select
                {...register('classId', { required: 'Class is required' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
              >
                <option value="">Choose a class...</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.displayName || c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                This will generate separate report cards for each student in the selected class
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Exam <span className="text-gray-400 text-xs">(Optional - Latest if not selected)</span>
              </label>
              <select
                {...register('examId')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                disabled={isLoadingExams}
              >
                <option value="">Latest Exam</option>
                {exams.map(e => (
                  <option key={e._id} value={e._id}>
                    {e.displayName || e.name} ({e.examType})
                  </option>
                ))}
              </select>
              {isLoadingExams && <p className="text-xs text-gray-400 mt-1">Loading exams...</p>}
              <p className="text-xs text-gray-400 mt-1">
                Choose a specific exam to generate report cards based on that exam's marks
              </p>
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
              disabled={isGenerating || !selectedClassId}
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
                  <span>Generate Class Report Cards</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Class Preview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Class Preview</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Selected class information</p>
          </div>
          
          <div className="p-6">
            {!selectedClassId ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500">Select a class to preview</p>
              </div>
            ) : selectedClassInfo ? (
              <div className="space-y-4">
                <div className="bg-primary-50 rounded-lg p-4 text-center">
                  <AcademicCapIcon className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {selectedClassInfo.displayName || selectedClassInfo.name}
                  </h3>
                  {selectedClassInfo.section && (
                    <p className="text-sm text-gray-500">Section: {selectedClassInfo.section}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {selectedClassInfo.studentCount || 0}
                    </p>
                    <p className="text-xs text-gray-500">Total Students</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {selectedClassInfo.capacity || '-'}
                    </p>
                    <p className="text-xs text-gray-500">Class Capacity</p>
                  </div>
                </div>
                
                {selectedClassInfo.classTeacherName && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Class Teacher</p>
                    <p className="text-sm font-medium text-gray-800">{selectedClassInfo.classTeacherName}</p>
                  </div>
                )}
                
                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-700">
                      This will generate individual report cards for all students in this class. 
                      The PDF will contain separate pages for each student, one per page.
                    </p>
                    {selectedExamId && (
                      <p className="text-xs text-blue-700 mt-2">
                        Using exam: {exams.find(e => e._id === selectedExamId)?.displayName || 'Selected Exam'}
                      </p>
                    )}
                  </div>
                </div>
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

export default ClassReportCards