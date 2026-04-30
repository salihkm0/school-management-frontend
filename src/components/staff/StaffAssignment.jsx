import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { fetchStaffById } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import staffService from '../../services/staffService'  // Changed to default import
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
      toast.error('Select a class'); 
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

  const handleAssignSubjects = async () => {
    if (selectedSubjects.length === 0) { 
      toast.error('Select at least one subject'); 
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
    if (!selectedSubjects.length || !selectedSubjects[selectedSubjects.length - 1]?.subjectId) {
      setSelectedSubjects([...selectedSubjects, { subjectId: '', classId: '', periodsPerWeek: 1 }])
    }
  }

  const updateSubjectField = (index, field, value) => {
    const updated = [...selectedSubjects]
    updated[index][field] = value
    setSelectedSubjects(updated)
  }

  const removeSubject = (index) => {
    setSelectedSubjects(selectedSubjects.filter((_, i) => i !== index))
  }

  if (!currentStaff) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Assignments - {currentStaff.name}</h1>
        <p className="text-gray-500 mt-1">Manage class and subject assignments per academic year</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Academic Year</label>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)} 
          className="px-4 py-2 border rounded-lg w-64"
        >
          <option value="">Select Year</option>
          {academicYears.map(y => (
            <option key={y._id} value={y._id}>{y.name}</option>
          ))}
        </select>
      </div>

      {selectedYear && (
        <>
          {/* Class Teacher Assignment */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Class Teacher Assignment</h2>
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)} 
                  className="w-full px-4 py-2 border rounded-lg"
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
                disabled={isLoading} 
                className="px-4 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50"
              >
                Assign as Class Teacher
              </button>
            </div>
            {assignment?.classTeacherOf && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  Currently class teacher of: {assignment.classTeacherOfName}
                </p>
              </div>
            )}
          </div>

          {/* Subject Assignments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Subject Assignments</h2>
            
            {/* Add Subject Form */}
            <div className="space-y-4">
              {selectedSubjects.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select 
                      value={item.subjectId} 
                      onChange={(e) => updateSubjectField(index, 'subjectId', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select 
                      value={item.classId} 
                      onChange={(e) => updateSubjectField(index, 'classId', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Periods/Week</label>
                      <input 
                        type="number" 
                        value={item.periodsPerWeek} 
                        onChange={(e) => updateSubjectField(index, 'periodsPerWeek', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border rounded-lg"
                        min="1"
                        max="12"
                      />
                    </div>
                    <button 
                      onClick={() => removeSubject(index)} 
                      className="mt-6 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addToSubjects} 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Subject
              </button>
              
              {selectedSubjects.length > 0 && (
                <button 
                  onClick={handleAssignSubjects} 
                  disabled={isLoading} 
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
                >
                  Save All Subjects
                </button>
              )}
            </div>

            {/* Currently Assigned Subjects */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Currently Assigned Subjects</h3>
              {assignment?.subjectsTaught?.length === 0 ? (
                <p className="text-gray-500 text-sm">No subjects assigned</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Subject</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Class</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Periods/Week</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {assignment?.subjectsTaught?.map((s, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm text-gray-900">{s.subjectName}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {s.className}{s.section ? `-${s.section}` : ''}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{s.periodsPerWeek}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default StaffAssignment