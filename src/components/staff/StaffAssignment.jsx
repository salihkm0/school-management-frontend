// src/components/staff/StaffAssignment.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { fetchStaffById } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import staffService from '../../services/staffService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const StaffAssignment = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentStaff } = useSelector((state) => state.staff)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { classes } = useSelector((state) => state.classes)
  const { subjects } = useSelector((state) => state.subjects)
  const [selectedYear, setSelectedYear] = useState('')
  const [assignment, setAssignment] = useState(null)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [expandedSection, setExpandedSection] = useState('classTeacher')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchStaffById(id))
    dispatch(fetchAcademicYears({ limit: 50 }))
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchSubjects({ limit: 100 }))
  }, [dispatch, id])

  useEffect(() => {
    if (selectedYear && id) loadAssignment()
  }, [selectedYear, id])

  const loadAssignment = async () => {
    setIsLoading(true)
    try {
      const res = await staffService.getOrCreateStaffAssignment(id, selectedYear)
      setAssignment(res)
    } catch (error) {
      console.error('Failed to load assignment:', error)
      toast.error('Failed to load assignment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignClassTeacher = async () => {
    if (!selectedClass) { 
      toast.error('Please select a class')
      return 
    }
    setIsLoading(true)
    try {
      await staffService.assignClassTeacher(id, selectedYear, selectedClass)
      toast.success('Class teacher assigned successfully')
      loadAssignment()
      setSelectedClass('')
    } catch (error) {
      console.error('Failed to assign class teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to assign class teacher')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveClassTeacher = async () => {
    setIsLoading(true)
    try {
      await staffService.assignClassTeacher(id, selectedYear, null)
      toast.success('Class teacher removed successfully')
      loadAssignment()
    } catch (error) {
      console.error('Failed to remove class teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to remove class teacher')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignSubjects = async () => {
    if (selectedSubjects.length === 0) { 
      toast.error('Add at least one subject')
      return 
    }
    const subjectsData = selectedSubjects.map(s => ({ 
      subjectId: s.subjectId, 
      classId: s.classId, 
      periodsPerWeek: s.periodsPerWeek || 1 
    }))
    setIsLoading(true)
    try {
      await staffService.assignSubjects(id, selectedYear, subjectsData)
      toast.success('Subjects assigned successfully')
      loadAssignment()
      setSelectedSubjects([])
    } catch (error) {
      console.error('Failed to assign subjects:', error)
      toast.error(error.response?.data?.message || 'Failed to assign subjects')
    } finally {
      setIsLoading(false)
    }
  }

  const addToSubjects = () => {
    setSelectedSubjects([...selectedSubjects, { subjectId: '', classId: '', periodsPerWeek: 1 }])
  }

  const updateSubjectField = (index, field, value) => {
    const updated = [...selectedSubjects]
    updated[index][field] = value
    setSelectedSubjects(updated)
  }

  const removeSubject = (index) => {
    setSelectedSubjects(selectedSubjects.filter((_, i) => i !== index))
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? '' : section)
  }

  if (!currentStaff) return <LoadingSpinner />

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Staff Assignments - {currentStaff.name}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage class and subject assignments per academic year</p>
      </div>

      {/* Academic Year Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Academic Year</label>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)} 
          className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        >
          <option value="">Select Year</option>
          {academicYears.map(y => (
            <option key={y._id} value={y._id}>{y.name}</option>
          ))}
        </select>
      </div>

      {selectedYear && (
        <>
          {/* Class Teacher Assignment Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('classTeacher')}
              className="w-full px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-semibold text-gray-900">Class Teacher Assignment</h2>
              </div>
              {expandedSection === 'classTeacher' ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'classTeacher' && (
              <div className="p-5">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    <select 
                      value={selectedClass} 
                      onChange={(e) => setSelectedClass(e.target.value)} 
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.displayName || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={handleAssignClassTeacher} 
                    disabled={isLoading || !selectedClass} 
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Assign as Class Teacher
                  </button>
                </div>
                
                {assignment?.classTeacherOf && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm text-emerald-800">
                        Currently class teacher of: <span className="font-semibold">{assignment.classTeacherOfName}</span>
                      </p>
                    </div>
                    <button 
                      onClick={handleRemoveClassTeacher} 
                      disabled={isLoading} 
                      className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject Assignments Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('subjects')}
              className="w-full px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-semibold text-gray-900">Subject Assignments</h2>
              </div>
              {expandedSection === 'subjects' ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === 'subjects' && (
              <div className="p-5 space-y-5">
                {/* Add Subject Form */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Subject Assignment</h3>
                  <div className="space-y-3">
                    {selectedSubjects.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700">Subject {index + 1}</span>
                          <button 
                            onClick={() => removeSubject(index)} 
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                            <select 
                              value={item.subjectId} 
                              onChange={(e) => updateSubjectField(index, 'subjectId', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                            <select 
                              value={item.classId} 
                              onChange={(e) => updateSubjectField(index, 'classId', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                            >
                              <option value="">Select Class</option>
                              {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Periods/Week</label>
                              <input 
                                type="number" 
                                value={item.periodsPerWeek} 
                                onChange={(e) => updateSubjectField(index, 'periodsPerWeek', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                min="1"
                                max="12"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={addToSubjects} 
                      className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Subject
                    </button>
                    
                    {selectedSubjects.length > 0 && (
                      <div className="pt-2">
                        <button 
                          onClick={handleAssignSubjects} 
                          disabled={isLoading} 
                          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Save All Subjects</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Currently Assigned Subjects */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Currently Assigned Subjects</h3>
                  {assignment?.subjectsTaught?.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No subjects assigned</p>
                      <p className="text-xs text-gray-400">Use the form above to add subject assignments</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Periods/Week</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {assignment?.subjectsTaught?.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2 text-sm text-gray-900">{s.subjectName}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {s.className}{s.section ? `-${s.section}` : ''}
                              </td>
                              <td className="px-4 py-2 text-sm text-center">
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                                  {s.periodsPerWeek} periods
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Info Note */}
                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                  <InformationCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Subjects assigned here will be used for marks entry and timetable generation. 
                    The staff member will have access to enter marks only for their assigned subjects.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default StaffAssignment