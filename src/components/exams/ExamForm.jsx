// src/components/exams/ExamForm.jsx
import React, { useEffect, useState, useMemo } from 'react'
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
  BuildingOfficeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { createExam, createStaffExam, updateExam, fetchExamById, clearCurrentExam } from '../../store/slices/examSlice'
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
  const { user } = useSelector((state) => state.auth)
  const { staff } = useSelector((state) => state.staff)
  const { currentExam, isLoading } = useSelector((state) => state.exams)
  const [examTypes, setExamTypes] = useState([])
  const [sessionTimes, setSessionTimes] = useState([])
  const [schedulingMode, setSchedulingMode] = useState('subject_schedule')
  const [activeSection, setActiveSection] = useState('basic')
  const [expandedCePanels, setExpandedCePanels] = useState({})

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { 
      subjects: [], 
      schedule: [], 
      classIds: [], 
      schedulingMode: 'subject_schedule',
      settings: {
        allowCalculator: false,
        isOpenBook: false,
        allowAbsent: true,
        showRank: true,
        gradingSystem: 'GRADE'
      }
    }
  })
  
  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule, update: updateSchedule } = useFieldArray({ control, name: 'schedule' })
  
  const watchedSchedule = watch('schedule')
  const watchedClassIds = watch('classIds')

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
        schedule: (currentExam.schedule || []).map(s => ({
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
          notes: s.notes || '',
          // Subject-level CE
          ceEnabled: s.ceEnabled || false,
          ceMaxMarks: s.ceMaxMarks || 20,
          cePassingMarks: s.cePassingMarks || 8,
          ceComponents: s.ceComponents || [
            { name: 'Assignment', maxMarks: 5, weightage: 25 },
            { name: 'Attendance', maxMarks: 5, weightage: 25 },
            { name: 'Class Test', maxMarks: 5, weightage: 25 },
            { name: 'Project', maxMarks: 5, weightage: 25 }
          ]
        })),
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
    dispatch(fetchStaff({ limit: 100 }))
    
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

  const toggleCePanel = (index) => {
    setExpandedCePanels(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  // Calculate available classes based on user role
  let availableClasses = classes
  let filteredSubjects = availableSubjects
  if (user?.role === 'staff') {
    const currentStaff = staff?.find((s) => {
      const su = s.userId?._id || s.userId
      return su === user?.id || s._id === user?.id
    })

    if (currentStaff) {
      const staffId = currentStaff._id
      availableClasses = classes.filter((cls) => {
        const isCT = cls.classTeacher?._id === staffId || cls.classTeacher === staffId
        const isST = (cls.subjectTeachers || []).some(
          (st) => st.teacherId?._id === staffId || st.teacherId === staffId
        )
        return isCT || isST
      })
      
      const allowedSubjectIds = new Set();
      availableClasses.forEach(cls => {
        const isCT = cls.classTeacher?._id === staffId || cls.classTeacher === staffId;
        
        // If class teacher, they can manage all subjects for this class
        if (isCT) {
          (cls.subjects || []).forEach(s => {
             const subjId = s._id || s;
             if (subjId) allowedSubjectIds.add(String(subjId));
          });
          (cls.subjectTeachers || []).forEach(st => {
             const subjId = st.subjectId?._id || st.subjectId;
             if (subjId) allowedSubjectIds.add(String(subjId));
          });
        }
        
        // Add subjects they specifically teach
        const staffSubjects = (cls.subjectTeachers || []).filter(
          st => st.teacherId?._id === staffId || st.teacherId === staffId
        );
        staffSubjects.forEach(st => {
          const subjId = st.subjectId?._id || st.subjectId;
          if (subjId) allowedSubjectIds.add(String(subjId));
        });
      });
      
      filteredSubjects = availableSubjects.filter(s => allowedSubjectIds.has(String(s._id)));
    } else {
      availableClasses = []
      filteredSubjects = []
    }
  }

  const uniqueStandards = useMemo(() => {
    const standards = new Set(availableClasses.map(c => c.name));
    return Array.from(standards).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [availableClasses]);

  const handleSelectAllClasses = () => {
    setValue('classIds', availableClasses.map(c => String(c._id)), { shouldDirty: true, shouldValidate: true });
  };
  
  const handleDeselectAllClasses = () => {
    setValue('classIds', [], { shouldDirty: true, shouldValidate: true });
  };

  const addCeComponent = (scheduleIndex) => {
    const currentComponents = watchedSchedule[scheduleIndex]?.ceComponents || []
    const updatedComponents = [...currentComponents, { name: '', maxMarks: 0, weightage: 0 }]
    updateSchedule(scheduleIndex, { ...watchedSchedule[scheduleIndex], ceComponents: updatedComponents })
  }

  const removeCeComponent = (scheduleIndex, componentIndex) => {
    const currentComponents = watchedSchedule[scheduleIndex]?.ceComponents || []
    const updatedComponents = currentComponents.filter((_, i) => i !== componentIndex)
    updateSchedule(scheduleIndex, { ...watchedSchedule[scheduleIndex], ceComponents: updatedComponents })
  }

  const updateCeComponent = (scheduleIndex, componentIndex, field, value) => {
    const currentComponents = watchedSchedule[scheduleIndex]?.ceComponents || []
    const updatedComponents = currentComponents.map((comp, i) => 
      i === componentIndex ? { ...comp, [field]: value } : comp
    )
    updateSchedule(scheduleIndex, { ...watchedSchedule[scheduleIndex], ceComponents: updatedComponents })
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
          
          // Subject-level CE configuration
          const ceMaxMarks = parseInt(item.ceMaxMarks) || 0
          const ceEnabled = ceMaxMarks > 0
          const cePassingMarks = 0
          
          // CE Components
          const ceComponents = []
          
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
            // Subject-level CE
            ceEnabled: ceEnabled,
            ceMaxMarks: ceMaxMarks,
            cePassingMarks: cePassingMarks,
            ceComponents: ceComponents,
            ceWeightage: 20,
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
        
        // Build subjects array from schedule
        const subjectsMap = new Map()
        processedSchedule.forEach(item => {
          if (!subjectsMap.has(item.subjectId)) {
            subjectsMap.set(item.subjectId, {
              subjectId: item.subjectId,
              subjectName: item.subjectName,
              subjectCode: item.subjectCode,
              termMaxMarks: item.maxMarks,
              termPassingMarks: item.passingMarks,
              theoryMaxMarks: item.theoryMarks,
              practicalMaxMarks: item.practicalMarks,
              ceEnabled: item.ceEnabled,
              ceMaxMarks: item.ceMaxMarks,
              cePassingMarks: item.cePassingMarks,
              ceComponents: item.ceComponents,
              totalMaxMarks: item.maxMarks + (item.ceMaxMarks || 0),
              totalPassingMarks: item.passingMarks + (item.cePassingMarks || 0),
              hasPractical: item.practicalMarks > 0,
              weightage: 100
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
        globalCeConfig: { enabled: false }, // Now CE is subject-specific
        termEntryDeadline: data.termEntryDeadline ? new Date(data.termEntryDeadline) : null,
        resultDeclarationDate: data.resultDeclarationDate ? new Date(data.resultDeclarationDate) : null
      }
      
      if (isEditing) {
        await dispatch(updateExam({ id, data: examData })).unwrap()
      } else {
        if (user?.role === 'staff') {
          await dispatch(createStaffExam(examData)).unwrap()
        } else {
          await dispatch(createExam(examData)).unwrap()
        }
      }
      toast.success(`Exam ${isEditing ? 'updated' : 'created'} successfully`)
      if (user?.role === 'staff') {
        navigate('/staff/exams')
      } else {
        navigate('/exams')
      }
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
      building: '',
      ceEnabled: false,
      ceMaxMarks: 0,
      cePassingMarks: 0,
      ceComponents: []
    })
  }

  const sections = [
    { id: 'basic', name: 'Basic Info', icon: BookOpenIcon },
    { id: 'classes', name: 'Target Classes', icon: AcademicCapIcon },
    { id: 'schedule', name: 'Schedule & CE', icon: CalendarIcon },
    { id: 'settings', name: 'Settings', icon: BuildingOfficeIcon },
  ]

  const handleCancel = () => {
    reset()
    navigate(-1)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (user?.role === 'staff') {
                navigate('/staff/exams');
              } else {
                navigate('/exams');
              }
            }}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Back to Exams</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {isEditing ? 'Edit Examination' : 'Create New Examination'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isEditing ? 'Update exam details and configuration' : 'Set up a new examination for students'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-x-auto">
          <div className="flex px-2 min-w-max">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600'
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
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exam Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      {...register('name', { required: 'Exam name required' })} 
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">Select Year</option>
                      {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      {...register('description')} 
                      rows={3} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white resize-none"
                      placeholder="Enter a brief description of the examination..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Target Classes Section */}
          {activeSection === 'classes' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Target Classes</h2>
              </div>
              
              <div className="p-5">
                <div>
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-3 gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Classes <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={handleSelectAllClasses} className="text-xs px-2.5 py-1.5 font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">Select All</button>
                      <button type="button" onClick={handleDeselectAllClasses} className="text-xs px-2.5 py-1.5 font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 transition-colors">Deselect All</button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-md border border-gray-200 p-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {availableClasses.map(cls => (
                        <label key={cls._id} className="flex items-center gap-2 p-2 rounded-md hover:bg-white transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            value={cls._id}
                            {...register('classIds')}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-700">{cls.displayName || cls.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select one or more classes for this examination</p>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Section with Subject-level CE */}
          {activeSection === 'schedule' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Exam Schedule & CE Configuration</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Configure subject-wise schedule and Continuous Evaluation</p>
                </div>
                <button 
                  type="button" 
                  onClick={addScheduleItem} 
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Subject
                </button>
              </div>
              
              <div className="p-5">
                {/* Scheduling Mode Toggle */}
                <div className="flex gap-4 p-3 bg-gray-50 rounded-md mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      value="subject_schedule" 
                      checked={schedulingMode === 'subject_schedule'} 
                      onChange={() => setSchedulingMode('subject_schedule')} 
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">Subject-wise Schedule</span>
                  </label>
                </div>

                {schedulingMode === 'subject_schedule' ? (
                  <div className="space-y-4">
                    {scheduleFields.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-md border-2 border-dashed border-gray-200">
                        <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500">No subjects added</p>
                        <button 
                          type="button" 
                          onClick={addScheduleItem} 
                          className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          Click here to add subjects →
                        </button>
                      </div>
                    )}
                    
                    {scheduleFields.map((field, index) => {
                      const isCeEnabled = watchedSchedule[index]?.ceEnabled || false
                      const isCeExpanded = expandedCePanels[index]
                      
                      return (
                        <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="font-medium text-gray-800">Subject {index + 1}</h4>
                            <button 
                              type="button" 
                              onClick={() => removeSchedule(index)} 
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                                <select
                                  {...register(`schedule.${index}.subjectId`, { required: true })}
                                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white ${
                                    errors.schedule?.[index]?.subjectId ? 'border-red-500' : 'border-gray-200'
                                  }`}
                                  onChange={(e) => {
                                    // Set default marks based on subject if needed
                                  }}
                                >
                                  <option value="">Select Subject</option>
                                  {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Exam Date *</label>
                                <input 
                                  type="date" 
                                  {...register(`schedule.${index}.examDate`, { required: 'Date is required' })} 
                                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                                <select 
                                  {...register(`schedule.${index}.session`)} 
                                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                                  {...register(`schedule.${index}.maxMarks`, { required: 'Max marks required', min: 1 })}
                                  placeholder="e.g., 100" 
                                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white" 
                                 onWheel={(e) => e.target.blur()} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Passing Marks *</label>
                                <input 
                                  type="number" 
                                  {...register(`schedule.${index}.passingMarks`, { required: 'Passing marks required', min: 0 })}
                                  placeholder="e.g., 40" 
                                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white" 
                                 onWheel={(e) => e.target.blur()} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Practical Marks</label>
                                <input 
                                  type="number" 
                                  {...register(`schedule.${index}.practicalMarks`)} 
                                  placeholder="0" 
                                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white" 
                                 onWheel={(e) => e.target.blur()} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">CE Marks</label>
                                <input 
                                  type="number" 
                                  {...register(`schedule.${index}.ceMaxMarks`)} 
                                  placeholder="0" 
                                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white" 
                                 onWheel={(e) => e.target.blur()} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Exam Settings</h2>
              </div>
              
              <div className="p-5">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('settings.allowCalculator')} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700">Allow Calculator</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('settings.isOpenBook')} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700">Open Book Exam</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('settings.allowAbsent')} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700">Allow Absent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('settings.showRank')} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-700">Show Rank</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label>
                    <select {...register('settings.gradingSystem')} className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                      <option value="GRADE">Grade System</option>
                      <option value="PERCENTAGE">Percentage Only</option>
                      <option value="CGPA">CGPA System</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea 
                      {...register('settings.instructions')} 
                      rows={3} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white resize-none"
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
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>{isEditing ? 'Update Exam' : 'Create Exam'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExamForm