import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, useFieldArray } from 'react-hook-form'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchStudents, promoteStudents } from '../../store/slices/studentSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import { ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const StudentPromote = () => {
  const dispatch = useDispatch()
  const { classes } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { students, isLoading } = useSelector((state) => state.students)
  const [filteredStudents, setFilteredStudents] = useState([])
  const [isPromoting, setIsPromoting] = useState(false)

  const { register, handleSubmit, watch, setValue, control } = useForm({
    defaultValues: {
      fromClassId: '',
      toClassId: '',
      newAcademicYearId: '',
      studentStatuses: {},
    }
  })

  const fromClassId = watch('fromClassId')
  const toClassId = watch('toClassId')

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (fromClassId) {
      dispatch(fetchStudents({ classId: fromClassId, limit: 100 }))
    }
  }, [dispatch, fromClassId])

  useEffect(() => {
    if (students.length > 0) {
      const initialStatuses = {}
      students.forEach(student => {
        initialStatuses[student._id] = 'active'
      })
      setValue('studentStatuses', initialStatuses)
      setFilteredStudents(students)
    }
  }, [students, setValue])

  const handleStatusChange = (studentId, status) => {
    setFilteredStudents(prev => 
      prev.map(s => s._id === studentId ? { ...s, promotionStatus: status } : s)
    )
    setValue(`studentStatuses.${studentId}`, status)
  }

  const onSubmit = async (data) => {
    if (!data.fromClassId || !data.toClassId) {
      toast.error('Please select both source and target classes')
      return
    }

    setIsPromoting(true)
    try {
      await dispatch(promoteStudents({
        fromClassId: data.fromClassId,
        toClassId: data.toClassId,
        studentStatuses: data.studentStatuses,
        newAcademicYearId: data.newAcademicYearId,
      })).unwrap()
    } catch (error) {
      console.error('Promotion failed:', error)
    } finally {
      setIsPromoting(false)
    }
  }

  const fromClass = classes.find(c => c._id === fromClassId)
  const toClass = classes.find(c => c._id === toClassId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Promote Students</h1>
        <p className="text-gray-500 mt-1">Promote students to the next academic year or class</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Class Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Class (Current) *
              </label>
              <select
                {...register('fromClassId', { required: 'Source class is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Select Source Class</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.displayName || `${cls.name}${cls.section ? `-${cls.section}` : ''}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <ChevronRightIcon className="w-8 h-8 text-gray-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Class (Target) *
              </label>
              <select
                {...register('toClassId', { required: 'Target class is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Select Target Class</option>
                {classes.filter(c => c._id !== fromClassId).map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.displayName || `${cls.name}${cls.section ? `-${cls.section}` : ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Academic Year (Optional)
            </label>
            <select
              {...register('newAcademicYearId')}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Same Academic Year</option>
              {academicYears.map(year => (
                <option key={year._id} value={year._id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student List */}
        {fromClassId && toClassId && filteredStudents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Students from {fromClass?.displayName || fromClass?.name} → {toClass?.displayName || toClass?.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select promotion status for each student
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promotion Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
                            {student.fullName?.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                            <div className="text-xs text-gray-500">Roll: {student.rollNumber || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.admissionNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={watch(`studentStatuses.${student._id}`) || 'active'}
                          onChange={(e) => handleStatusChange(student._id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                          <option value="active">Promote (Active)</option>
                          <option value="passed">Passed - Promote</option>
                          <option value="failed">Failed - Repeat</option>
                          <option value="completed">Completed - Graduate</option>
                          <option value="discontinued">Discontinue</option>
                          <option value="transferred">Transfer Out</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Total Students: {filteredStudents.length}
              </div>
              <button
                type="submit"
                disabled={isPromoting}
                className="flex items-center space-x-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPromoting ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>Promoting...</span>
                  </>
                ) : (
                  <>
                    <span>Promote Students</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {fromClassId && filteredStudents.length === 0 && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">No students found in this class</p>
          </div>
        )}

        {isLoading && <LoadingSpinner />}
      </form>
    </div>
  )
}

export default StudentPromote