// src/pages/staff/StaffExamForm.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  Plus,
  Trash2,
  XCircle,
  CheckCircle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Cog
} from 'lucide-react'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { createExam, updateExam, fetchExamById, clearCurrentExam } from '../../store/slices/examSlice'
import { fetchTeacherClassTeacherClasses, clearTeacherClasses } from '../../store/slices/classSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import toast from 'react-hot-toast'

const StaffExamForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const classIdFromUrl = searchParams.get('classId')
  const isEditing = !!id
  
  const { user } = useSelector((state) => state.auth)
  const { staff } = useSelector((state) => state.staff)
  const { subjects: availableSubjects } = useSelector((state) => state.subjects)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { currentExam, isLoading: examLoading } = useSelector((state) => state.exams)
  
  const [myClass, setMyClass] = useState(null)
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scheduleItems, setScheduleItems] = useState([])
  const [examForm, setExamForm] = useState({
    name: '',
    examType: 'custom',
    term: 'first',
    description: '',
    schedulingMode: 'subject_schedule'
  })
  const [expandedCePanels, setExpandedCePanels] = useState({})

  useEffect(() => {
    loadData()
    return () => {
      dispatch(clearTeacherClasses())
      dispatch(clearCurrentExam())
    }
  }, [dispatch])

  useEffect(() => {
    if (academicYears.length > 0) {
      const currentYear = academicYears.find(y => y.isCurrent)
      setCurrentAcademicYear(currentYear)
    }
  }, [academicYears])

  useEffect(() => {
    if (staff.length > 0 && user && currentAcademicYear) {
      getMyClassTeacherClass()
    }
  }, [staff, user, currentAcademicYear])

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchExamById(id))
    }
  }, [dispatch, id, isEditing])

  useEffect(() => {
    if (isEditing && currentExam) {
      setExamForm({
        name: currentExam.displayName || currentExam.name,
        examType: currentExam.examType,
        term: currentExam.term,
        description: currentExam.description || '',
        schedulingMode: currentExam.schedulingMode || 'subject_schedule'
      })
      
      const schedule = (currentExam.schedule || []).map((s, idx) => ({
        id: Date.now() + idx,
        subjectId: s.subjectId?._id || s.subjectId,
        subjectName: s.subjectName,
        examDate: s.examDate ? new Date(s.examDate).toISOString().split('T')[0] : '',
        session: s.session || 'BF',
        maxMarks: s.maxMarks || s.termMaxMarks || 100,
        passingMarks: s.passingMarks || s.termPassingMarks || 40,
        practicalMarks: s.practicalMarks || 0,
        roomNumber: s.roomNumber || '',
        building: s.building || '',
        ceEnabled: s.ceEnabled || false,
        ceMaxMarks: s.ceMaxMarks || 20,
        cePassingMarks: s.cePassingMarks || 8,
        ceComponents: s.ceComponents || [
          { name: 'Assignment', maxMarks: 5, weightage: 25 },
          { name: 'Attendance', maxMarks: 5, weightage: 25 },
          { name: 'Class Test', maxMarks: 5, weightage: 25 },
          { name: 'Project', maxMarks: 5, weightage: 25 }
        ]
      }))
      setScheduleItems(schedule)
    }
  }, [isEditing, currentExam])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        dispatch(fetchStaff({ limit: 100 })),
        dispatch(fetchSubjects({ limit: 100 })),
        dispatch(fetchAcademicYears({ limit: 10 }))
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMyClassTeacherClass = async () => {
    const currentStaff = staff.find(s => {
      const staffUserId = s.userId?._id || s.userId
      return staffUserId === user?.id
    })
    
    if (!currentStaff) return
    
    const staffId = currentStaff._id
    
    try {
      const result = await dispatch(fetchTeacherClassTeacherClasses({ 
        teacherId: staffId, 
        academicYearId: currentAcademicYear?._id 
      })).unwrap()
      
      if (result && result.length > 0) {
        if (classIdFromUrl) {
          const selectedClass = result.find(c => c._id === classIdFromUrl)
          if (selectedClass) {
            setMyClass(selectedClass)
          } else {
            setMyClass(result[0])
          }
        } else {
          setMyClass(result[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch teacher classes:', error)
    }
  }

  const addScheduleItem = () => {
    setScheduleItems([
      ...scheduleItems,
      {
        id: Date.now(),
        subjectId: '',
        examDate: '',
        session: 'BF',
        maxMarks: 100,
        passingMarks: 40,
        practicalMarks: 0,
        roomNumber: '',
        building: '',
        ceEnabled: false,
        ceMaxMarks: 20,
        cePassingMarks: 8,
        ceComponents: [
          { name: 'Assignment', maxMarks: 5, weightage: 25 },
          { name: 'Attendance', maxMarks: 5, weightage: 25 },
          { name: 'Class Test', maxMarks: 5, weightage: 25 },
          { name: 'Project', maxMarks: 5, weightage: 25 }
        ]
      }
    ])
  }

  const removeScheduleItem = (id) => {
    setScheduleItems(scheduleItems.filter(item => item.id !== id))
  }

  const updateScheduleItem = (id, field, value) => {
    setScheduleItems(scheduleItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const updateCeComponent = (scheduleId, componentIndex, field, value) => {
    setScheduleItems(scheduleItems.map(item => {
      if (item.id === scheduleId) {
        const updatedComponents = [...(item.ceComponents || [])]
        updatedComponents[componentIndex] = { 
          ...updatedComponents[componentIndex], 
          [field]: field === 'maxMarks' || field === 'weightage' ? parseInt(value) || 0 : value
        }
        return { ...item, ceComponents: updatedComponents }
      }
      return item
    }))
  }

  const addCeComponent = (scheduleId) => {
    setScheduleItems(scheduleItems.map(item => {
      if (item.id === scheduleId) {
        return {
          ...item,
          ceComponents: [...(item.ceComponents || []), { name: '', maxMarks: 0, weightage: 0 }]
        }
      }
      return item
    }))
  }

  const removeCeComponent = (scheduleId, componentIndex) => {
    setScheduleItems(scheduleItems.map(item => {
      if (item.id === scheduleId) {
        const updatedComponents = (item.ceComponents || []).filter((_, i) => i !== componentIndex)
        return { ...item, ceComponents: updatedComponents }
      }
      return item
    }))
  }

  const toggleCePanel = (scheduleId) => {
    setExpandedCePanels(prev => ({
      ...prev,
      [scheduleId]: !prev[scheduleId]
    }))
  }

  const handleSubmit = async () => {
    if (!examForm.name) {
      toast.error('Please enter exam name')
      return
    }
    if (scheduleItems.length === 0) {
      toast.error('Please add at least one subject')
      return
    }
    
    for (const item of scheduleItems) {
      if (!item.subjectId) {
        toast.error('Please select a subject for all entries')
        return
      }
      if (!item.examDate) {
        toast.error('Please select exam date for all subjects')
        return
      }
    }
    
    setIsSubmitting(true)
    try {
      const examData = {
        name: examForm.name,
        examType: examForm.examType,
        description: examForm.description || '',
        academicYearId: currentAcademicYear._id,
        term: examForm.term,
        classIds: [myClass._id],
        schedulingMode: 'subject_schedule',
        schedule: scheduleItems.map(item => ({
          subjectId: item.subjectId,
          examDate: item.examDate,
          session: item.session,
          maxMarks: item.maxMarks,
          passingMarks: item.passingMarks,
          practicalMarks: item.practicalMarks,
          roomNumber: item.roomNumber,
          building: item.building,
          ceEnabled: item.ceEnabled,
          ceMaxMarks: item.ceMaxMarks,
          cePassingMarks: item.cePassingMarks,
          ceComponents: item.ceComponents || []
        }))
      }
      
      if (isEditing) {
        await dispatch(updateExam({ id, data: examData })).unwrap()
        toast.success('Exam updated successfully')
      } else {
        await dispatch(createExam(examData)).unwrap()
        toast.success('Exam created successfully')
      }
      
      navigate('/staff-exams')
    } catch (error) {
      console.error('Failed to save exam:', error)
      toast.error(error.response?.data?.message || 'Failed to save exam')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || examLoading) {
    return <LoadingSpinner />
  }

  if (!myClass && !isEditing) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No Class Selected</h3>
          <p className="text-sm text-gray-500">Please select a class to create an exam for.</p>
          <button
            onClick={() => navigate('/staff-exams')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/staff-exams')}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 rounded-xl p-2.5">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Exam' : 'Create New Exam'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  For {myClass?.displayName || myClass?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Basic Info */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                <input
                  type="text"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  placeholder="e.g., First Term Examination"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select
                    value={examForm.examType}
                    onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="first">First Term</option>
                    <option value="second">Second Term</option>
                    <option value="final">Final Exam</option>
                    <option value="mid">Mid Term</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="annual">Annual</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select
                    value={examForm.term}
                    onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="first">First Term</option>
                    <option value="second">Second Term</option>
                    <option value="third">Third Term</option>
                    <option value="fourth">Fourth Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  rows={2}
                  placeholder="Enter exam description..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Subjects Schedule */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Subjects Schedule</h2>
                <p className="text-xs text-gray-500 mt-0.5">Add subjects with their exam dates and marks</p>
              </div>
              <button
                type="button"
                onClick={addScheduleItem}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subject
              </button>
            </div>

            {scheduleItems.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No subjects added yet</p>
                <button
                  onClick={addScheduleItem}
                  className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Click to add subjects →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleItems.map((item, index) => {
                  const isCeExpanded = expandedCePanels[item.id]
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-800">Subject {index + 1}</h4>
                        <button
                          onClick={() => removeScheduleItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
                          <select
                            value={item.subjectId}
                            onChange={(e) => updateScheduleItem(item.id, 'subjectId', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                          >
                            <option value="">Select Subject</option>
                            {availableSubjects.map(sub => (
                              <option key={sub._id} value={sub._id}>{sub.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Exam Date *</label>
                          <input
                            type="date"
                            value={item.examDate}
                            onChange={(e) => updateScheduleItem(item.id, 'examDate', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                          <select
                            value={item.session}
                            onChange={(e) => updateScheduleItem(item.id, 'session', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                          >
                            <option value="BF">Morning (9:00 AM - 12:00 PM)</option>
                            <option value="AF">Afternoon (2:00 PM - 5:00 PM)</option>
                            <option value="FULL">Full Day (9:00 AM - 5:00 PM)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Max Marks</label>
                          <input
                            type="number"
                            value={item.maxMarks}
                            onChange={(e) => updateScheduleItem(item.id, 'maxMarks', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Passing Marks</label>
                          <input
                            type="number"
                            value={item.passingMarks}
                            onChange={(e) => updateScheduleItem(item.id, 'passingMarks', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Practical Marks</label>
                          <input
                            type="number"
                            value={item.practicalMarks}
                            onChange={(e) => updateScheduleItem(item.id, 'practicalMarks', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Room Number</label>
                          <input
                            type="text"
                            value={item.roomNumber}
                            onChange={(e) => updateScheduleItem(item.id, 'roomNumber', e.target.value)}
                            placeholder="e.g., Room 101"
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Building</label>
                          <input
                            type="text"
                            value={item.building}
                            onChange={(e) => updateScheduleItem(item.id, 'building', e.target.value)}
                            placeholder="e.g., Main Block"
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* CE Configuration */}
                      <div className="border-t border-gray-100 pt-3 mt-2">
                        <button
                          type="button"
                          onClick={() => toggleCePanel(item.id)}
                          className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-emerald-600"
                        >
                          <div className="flex items-center gap-2">
                            <Cog className="w-4 h-4" />
                            <span>Continuous Evaluation (CE) Configuration</span>
                            {item.ceEnabled && (
                              <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">Enabled</span>
                            )}
                          </div>
                          {isCeExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {isCeExpanded && (
                          <div className="mt-3 space-y-3 pl-4 border-l-2 border-emerald-200">
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.ceEnabled}
                                  onChange={(e) => updateScheduleItem(item.id, 'ceEnabled', e.target.checked)}
                                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-700">Enable CE for this subject</span>
                              </label>
                            </div>

                            {item.ceEnabled && (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">CE Max Marks</label>
                                    <input
                                      type="number"
                                      value={item.ceMaxMarks}
                                      onChange={(e) => updateScheduleItem(item.id, 'ceMaxMarks', parseInt(e.target.value) || 0)}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">CE Passing Marks</label>
                                    <input
                                      type="number"
                                      value={item.cePassingMarks}
                                      onChange={(e) => updateScheduleItem(item.id, 'cePassingMarks', parseInt(e.target.value) || 0)}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-medium text-gray-700">CE Components</label>
                                    <button
                                      type="button"
                                      onClick={() => addCeComponent(item.id)}
                                      className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add Component
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(item.ceComponents || []).map((comp, compIndex) => (
                                      <div key={compIndex} className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          value={comp.name}
                                          onChange={(e) => updateCeComponent(item.id, compIndex, 'name', e.target.value)}
                                          placeholder="Component Name"
                                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                        />
                                        <input
                                          type="number"
                                          value={comp.maxMarks}
                                          onChange={(e) => updateCeComponent(item.id, compIndex, 'maxMarks', e.target.value)}
                                          placeholder="Max Marks"
                                          className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                        />
                                        <input
                                          type="number"
                                          value={comp.weightage}
                                          onChange={(e) => updateCeComponent(item.id, compIndex, 'weightage', e.target.value)}
                                          placeholder="Wtg %"
                                          className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeCeComponent(item.id, compIndex)}
                                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => navigate('/staff-exams')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || scheduleItems.length === 0 || !examForm.name}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isEditing ? 'Update Exam' : 'Create Exam'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaffExamForm