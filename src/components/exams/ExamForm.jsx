// src/components/exams/ExamForm.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { 
  ChevronLeftIcon, 
  PlusIcon, 
  TrashIcon,
  CalendarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  ClockIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { createExam, updateExam, fetchExamById, clearCurrentExam } from '../../store/slices/examSlice'
import examService from '../../services/examService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ExamForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { classes } = useSelector((state) => state.classes)
  const { subjects: availableSubjects } = useSelector((state) => state.subjects)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { currentExam, isLoading } = useSelector((state) => state.exams)
  const [examTypes, setExamTypes] = useState([])
  const [sessionTimes, setSessionTimes] = useState([])
  const [schedulingMode, setSchedulingMode] = useState('subject_schedule')
  const [activeSection, setActiveSection] = useState('basic')

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { 
      subjects: [], 
      schedule: [], 
      classIds: [], 
      schedulingMode: 'subject_schedule',
      ceConfig: {
        enabled: false,
        maxMarks: 20,
        passingMarks: 8,
        subjectWise: true,
        components: [
          { name: 'Assignment', maxMarks: 5, weightage: 25 },
          { name: 'Attendance', maxMarks: 5, weightage: 25 },
          { name: 'Class Test', maxMarks: 5, weightage: 25 },
          { name: 'Project', maxMarks: 5, weightage: 25 }
        ]
      },
      settings: {
        allowCalculator: false,
        isOpenBook: false,
        allowAbsent: true,
        showRank: true,
        gradingSystem: 'GRADE'
      }
    }
  })
  
  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({ control, name: 'schedule' })
  const { fields: ceComponents, append: appendCeComponent, remove: removeCeComponent } = useFieldArray({ control, name: 'ceConfig.components' })
  
  const watchedCeEnabled = watch('ceConfig.enabled')
  const watchedSchedule = watch('schedule')

  useEffect(() => {
    loadData()
    if (isEditing && id) dispatch(fetchExamById(id))
    return () => { dispatch(clearCurrentExam()) }
  }, [dispatch, id, isEditing])

  useEffect(() => {
    if (isEditing && currentExam) {
      const transformedExam = {
        ...currentExam,
        classIds: currentExam.classIds?.map(c => c._id || c),
        subjects: currentExam.subjects || [],
        schedule: currentExam.schedule?.map(s => ({
          subjectId: s.subjectId?._id || s.subjectId,
          subjectName: s.subjectName,
          subjectCode: s.subjectCode,
          examDate: s.examDate ? new Date(s.examDate).toISOString().split('T')[0] : '',
          session: s.session || 'BF',
          maxMarks: s.maxMarks || s.termMaxMarks || 100,
          passingMarks: s.passingMarks || s.termPassingMarks || 40,
          practicalMarks: s.practicalMarks || 0,
          theoryMarks: s.theoryMarks || s.termMaxMarks || 100,
          roomNumber: s.roomNumber || '',
          building: s.building || '',
          notes: s.notes || ''
        })),
        ceConfig: currentExam.ceConfig || {
          enabled: false,
          maxMarks: 20,
          passingMarks: 8,
          subjectWise: true,
          components: [
            { name: 'Assignment', maxMarks: 5, weightage: 25 },
            { name: 'Attendance', maxMarks: 5, weightage: 25 },
            { name: 'Class Test', maxMarks: 5, weightage: 25 },
            { name: 'Project', maxMarks: 5, weightage: 25 }
          ]
        },
        settings: currentExam.settings || {
          allowCalculator: false,
          isOpenBook: false,
          allowAbsent: true,
          showRank: true,
          gradingSystem: 'GRADE'
        }
      }
      reset(transformedExam)
      setSchedulingMode(currentExam.schedulingMode || 'subject_schedule')
    }
  }, [isEditing, currentExam, reset])

  const loadData = async () => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchSubjects({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 100 }))
    
    try {
      const typesRes = await examService.getExamTypes()
      setExamTypes(typesRes.data?.predefined || [])
      
      const sessionsRes = await examService.getSessionTimes()
      setSessionTimes(Object.values(sessionsRes.data || {}))
    } catch (error) {
      console.error('Failed to load exam data:', error)
    }
  }

  const getSubjectDetails = (subjectId) => {
    return availableSubjects.find(s => s._id === subjectId)
  }

  const onSubmit = async (data) => {
    try {
      let processedSchedule = []
      let processedSubjects = []
      
      if (schedulingMode === 'subject_schedule') {
        if (!data.schedule || data.schedule.length === 0) {
          toast.error('Please add at least one subject to the schedule')
          return
        }
        
        for (let i = 0; i < data.schedule.length; i++) {
          const item = data.schedule[i]
          const subject = getSubjectDetails(item.subjectId)
          if (!subject) {
            toast.error(`Subject not found for ID: ${item.subjectId}`)
            return
          }
          
          const maxMarks = parseInt(item.maxMarks) || 100
          const passingMarks = parseInt(item.passingMarks) || Math.floor(maxMarks * 0.4)
          const practicalMarks = parseInt(item.practicalMarks) || 0
          const theoryMarks = maxMarks - practicalMarks
          
          let examDate = new Date(item.examDate)
          if (isNaN(examDate.getTime())) {
            toast.error(`Invalid exam date for subject ${subject.name}`)
            return
          }
          
          const scheduleItem = {
            subjectId: item.subjectId,
            subjectName: subject.name,
            subjectCode: subject.code || '',
            examDate: examDate,
            session: item.session || 'BF',
            maxMarks: maxMarks,
            passingMarks: passingMarks,
            startTime: item.session === 'BF' ? '09:00 AM' : item.session === 'AF' ? '02:00 PM' : '09:00 AM',
            endTime: item.session === 'BF' ? '12:00 PM' : item.session === 'AF' ? '05:00 PM' : '05:00 PM',
            duration: item.session === 'FULL' ? 480 : 180,
            theoryMarks: theoryMarks,
            practicalMarks: practicalMarks,
            hasPractical: practicalMarks > 0,
            ceEnabled: data.ceConfig?.enabled || false,
            ceMaxMarks: data.ceConfig?.enabled ? (parseInt(data.ceConfig.maxMarks) || 20) : 0,
            cePassingMarks: data.ceConfig?.enabled ? (parseInt(data.ceConfig.passingMarks) || 8) : 0,
            ceWeightage: data.ceConfig?.enabled ? 20 : 0,
            termWeightage: 80,
            termMaxMarks: maxMarks,
            termPassingMarks: passingMarks,
            roomNumber: item.roomNumber || '',
            building: item.building || '',
            notes: item.notes || '',
            isAbsentAllowed: true,
            graceTime: 0,
            invigilators: [],
            invigilatorNames: []
          }
          
          processedSchedule.push(scheduleItem)
        }
        
        const subjectsMap = new Map()
        processedSchedule.forEach(item => {
          if (!subjectsMap.has(item.subjectId)) {
            subjectsMap.set(item.subjectId, {
              subjectId: item.subjectId,
              subjectName: item.subjectName,
              subjectCode: item.subjectCode,
              maxMarks: item.maxMarks,
              passingMarks: item.passingMarks,
              theoryMaxMarks: item.theoryMarks,
              practicalMaxMarks: item.practicalMarks,
              termMaxMarks: item.maxMarks,
              termPassingMarks: item.passingMarks,
              totalMaxMarks: item.maxMarks + (item.ceMaxMarks || 0),
              totalPassingMarks: item.passingMarks + (item.cePassingMarks || 0),
              ceEnabled: item.ceEnabled,
              ceMaxMarks: item.ceMaxMarks,
              cePassingMarks: item.cePassingMarks,
              hasPractical: item.practicalMarks > 0,
              weightage: 100,
              isLanguageSubject: ['MAL', 'ENG', 'HIN', 'ARB', 'URD'].includes(item.subjectCode)
            })
          }
        })
        processedSubjects = Array.from(subjectsMap.values())
      }
      
      let startDate, endDate
      if (processedSchedule.length > 0) {
        const dates = processedSchedule.map(s => new Date(s.examDate))
        startDate = new Date(Math.min(...dates))
        endDate = new Date(Math.max(...dates))
      } else if (data.startDate && data.endDate) {
        startDate = new Date(data.startDate)
        endDate = new Date(data.endDate)
      } else {
        startDate = new Date()
        endDate = new Date()
        endDate.setDate(endDate.getDate() + 7)
      }
      
      const examData = {
        name: data.name,
        examType: data.examType,
        description: data.description || '',
        academicYearId: data.academicYearId,
        term: data.term,
        classIds: data.classIds || [],
        schedulingMode: schedulingMode,
        subjects: processedSubjects,
        schedule: processedSchedule,
        startDate: startDate,
        endDate: endDate,
        settings: {
          allowCalculator: data.settings?.allowCalculator || false,
          isOpenBook: data.settings?.isOpenBook || false,
          allowAbsent: data.settings?.allowAbsent !== false,
          showRank: data.settings?.showRank !== false,
          gradingSystem: data.settings?.gradingSystem || 'GRADE',
          instructions: data.settings?.instructions || '',
          graceTime: 0
        },
        ceConfig: data.ceConfig?.enabled ? {
          enabled: true,
          maxMarks: parseInt(data.ceConfig.maxMarks) || 20,
          passingMarks: parseInt(data.ceConfig.passingMarks) || 8,
          subjectWise: data.ceConfig.subjectWise !== false,
          components: (data.ceConfig.components || [])
            .filter(c => c.name)
            .map(comp => ({
              name: comp.name,
              maxMarks: parseInt(comp.maxMarks) || 0,
              weightage: parseInt(comp.weightage) || 0
            }))
        } : { enabled: false },
        ceEntryDeadline: data.ceEntryDeadline ? new Date(data.ceEntryDeadline) : null,
        termEntryDeadline: data.termEntryDeadline ? new Date(data.termEntryDeadline) : null,
        resultDeclarationDate: data.resultDeclarationDate ? new Date(data.resultDeclarationDate) : null
      }
      
      if (isEditing) {
        await dispatch(updateExam({ id, data: examData })).unwrap()
      } else {
        await dispatch(createExam(examData)).unwrap()
      }
      toast.success(`Exam ${isEditing ? 'updated' : 'created'} successfully`)
      navigate('/exams')
    } catch (error) { 
      console.error('Failed to save exam:', error)
      toast.error(error.response?.data?.message || 'Failed to save exam')
    }
  }

  const addScheduleItem = () => {
    appendSchedule({
      subjectId: '',
      examDate: '',
      session: 'BF',
      maxMarks: '',
      passingMarks: '',
      practicalMarks: '0',
      roomNumber: '',
      building: ''
    })
  }

  const sections = [
    { id: 'basic', name: 'Basic Info', icon: BookOpenIcon },
    { id: 'classes', name: 'Target Classes', icon: AcademicCapIcon },
    { id: 'ce', name: 'CE Configuration', icon: Cog6ToothIcon },
    { id: 'schedule', name: 'Schedule', icon: CalendarIcon },
    { id: 'settings', name: 'Settings', icon: BuildingOfficeIcon },
  ]

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/exams')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Back to Exams</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Examination' : 'Create New Examination'}
              </h1>
              <p className="text-gray-500 mt-1">
                {isEditing ? 'Update exam details and configuration' : 'Set up a new examination for students'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-primary-50 rounded-lg">
                <span className="text-xs font-medium text-primary-600">
                  {isEditing ? 'Editing Mode' : 'Creation Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
          <div className="flex px-2 min-w-max">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Enter the fundamental details of the examination</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exam Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      {...register('name', { required: 'Exam name required' })} 
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-white'
                      }`}
                      placeholder="e.g., First Term Examination" 
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exam Type <span className="text-red-500">*</span>
                    </label>
                    <select 
                      {...register('examType', { required: true })} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select Type</option>
                      {examTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                    <select 
                      {...register('term')} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="first">First Term</option>
                      <option value="second">Second Term</option>
                      <option value="third">Third Term</option>
                      <option value="fourth">Fourth Term</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select 
                      {...register('academicYearId', { required: true })} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select Year</option>
                      {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      {...register('description')} 
                      rows={4} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors resize-none"
                      placeholder="Enter a brief description of the examination..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Target Classes Section */}
          {activeSection === 'classes' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Target Classes</h2>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Select the classes that will take this examination</p>
              </div>
              
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Classes <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {classes.map(cls => (
                        <label key={cls._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            value={cls._id}
                            {...register('classIds')}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{cls.displayName || cls.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {errors.classIds && <p className="mt-1 text-xs text-red-500">{errors.classIds.message}</p>}
                  <p className="text-xs text-gray-500 mt-2">Select one or more classes for this examination</p>
                </div>
              </div>
            </div>
          )}

          {/* CE Configuration Section */}
          {activeSection === 'ce' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Cog6ToothIcon className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Continuous Evaluation (CE)</h2>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Configure Continuous Evaluation parameters</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      {...register('ceConfig.enabled')}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Continuous Evaluation</span>
                  </label>

                  {watchedCeEnabled && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CE Max Marks</label>
                          <input 
                            type="number" 
                            {...register('ceConfig.maxMarks')} 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CE Passing Marks</label>
                          <input 
                            type="number" 
                            {...register('ceConfig.passingMarks')} 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            {...register('ceConfig.subjectWise')}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Subject-wise CE</span>
                        </label>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-md font-medium text-gray-800">CE Components</h3>
                          <button 
                            type="button" 
                            onClick={() => appendCeComponent({ name: '', maxMarks: 0, weightage: 0 })} 
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Component
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {ceComponents.map((field, index) => (
                            <div key={field.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input 
                                  {...register(`ceConfig.components.${index}.name`)} 
                                  placeholder="Component Name" 
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                />
                                <input 
                                  type="number" 
                                  {...register(`ceConfig.components.${index}.maxMarks`)} 
                                  placeholder="Max Marks" 
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                />
                                <div className="flex gap-2">
                                  <input 
                                    type="number" 
                                    {...register(`ceConfig.components.${index}.weightage`)} 
                                    placeholder="Weightage %" 
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => removeCeComponent(index)} 
                                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deadlines */}
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-md font-medium text-gray-800 mb-3">Important Dates</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CE Entry Deadline</label>
                            <input 
                              type="datetime-local" 
                              {...register('ceEntryDeadline')} 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Term Entry Deadline</label>
                            <input 
                              type="datetime-local" 
                              {...register('termEntryDeadline')} 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Result Declaration Date</label>
                            <input 
                              type="datetime-local" 
                              {...register('resultDeclarationDate')} 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Section */}
          {activeSection === 'schedule' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Exam Schedule</h2>
                  </div>
                  <button 
                    type="button" 
                    onClick={addScheduleItem} 
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Subject
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Configure subject-wise exam schedule</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {/* Scheduling Mode Toggle */}
                  <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        value="subject_schedule" 
                        checked={schedulingMode === 'subject_schedule'} 
                        onChange={() => setSchedulingMode('subject_schedule')} 
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700">Subject-wise Schedule</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        value="date_range" 
                        checked={schedulingMode === 'date_range'} 
                        onChange={() => setSchedulingMode('date_range')} 
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700">Date Range</span>
                    </label>
                  </div>

                  {schedulingMode === 'subject_schedule' ? (
                    <div className="space-y-4">
                      {scheduleFields.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500">No subjects added</p>
                          <button 
                            type="button" 
                            onClick={addScheduleItem} 
                            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Click here to add subjects →
                          </button>
                        </div>
                      )}
                      
                      {scheduleFields.map((field, index) => (
                        <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-800">Subject {index + 1}</h4>
                            <button 
                              type="button" 
                              onClick={() => removeSchedule(index)} 
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                              <select 
                                {...register(`schedule.${index}.subjectId`, { required: 'Subject is required' })} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white"
                              >
                                <option value="">Select Subject</option>
                                {availableSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Exam Date *</label>
                              <input 
                                type="date" 
                                {...register(`schedule.${index}.examDate`, { required: 'Date is required' })} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                              <select 
                                {...register(`schedule.${index}.session`)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white"
                              >
                                {Object.values(sessionTimes).map(s => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Max Marks *</label>
                              <input 
                                type="number" 
                                {...register(`schedule.${index}.maxMarks`, { 
                                  required: 'Max marks required', 
                                  min: 1,
                                  valueAsNumber: true
                                })} 
                                placeholder="e.g., 100" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Passing Marks *</label>
                              <input 
                                type="number" 
                                {...register(`schedule.${index}.passingMarks`, { 
                                  required: 'Passing marks required', 
                                  min: 0,
                                  valueAsNumber: true
                                })} 
                                placeholder="e.g., 40" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Practical Marks</label>
                              <input 
                                type="number" 
                                {...register(`schedule.${index}.practicalMarks`)} 
                                placeholder="0" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Room Number</label>
                              <input 
                                type="text" 
                                {...register(`schedule.${index}.roomNumber`)} 
                                placeholder="e.g., Room 101" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white" 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input 
                          type="date" 
                          {...register('startDate', { required: schedulingMode === 'date_range' ? 'Start date required' : false })} 
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input 
                          type="date" 
                          {...register('endDate', { required: schedulingMode === 'date_range' ? 'End date required' : false })} 
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Exam Settings</h2>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Configure additional exam parameters</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('settings.allowCalculator')} className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">Allow Calculator</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('settings.isOpenBook')} className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">Open Book Exam</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('settings.allowAbsent')} className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">Allow Absent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('settings.showRank')} className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">Show Rank</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label>
                    <select {...register('settings.gradingSystem')} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors">
                      <option value="GRADE">Grade System</option>
                      <option value="PERCENTAGE">Percentage Only</option>
                      <option value="CGPA">CGPA System</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea 
                      {...register('settings.instructions')} 
                      rows={4} 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors resize-none"
                      placeholder="Enter any special instructions for students..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => navigate('/exams')} 
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>{isEditing ? 'Update Exam' : 'Create Exam'}</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExamForm