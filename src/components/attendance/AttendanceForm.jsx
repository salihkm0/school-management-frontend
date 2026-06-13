import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { createAttendance } from '../../store/slices/attendanceSlice'
import { fetchStudents } from '../../store/slices/studentSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const AttendanceForm = () => {
  const dispatch = useDispatch()
  const { students } = useSelector((state) => state.students)
  const { classes } = useSelector((state) => state.classes)
  const [selectedStudent, setSelectedStudent] = useState('')
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchStudents({ limit: 100 }))
  }, [dispatch])

  const onSubmit = async (data) => {
    try {
      await dispatch(createAttendance(data)).unwrap()
      toast.success('Attendance recorded')
      reset()
      setSelectedStudent('')
    } catch (error) { toast.error('Failed to record attendance') }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Record Attendance</h1><p className="text-gray-500 mt-1">Record monthly attendance for a student</p></div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Student *</label><select {...register('studentId', { required: true })} value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="">Select Student</option>{students.map(s => <option key={s._id} value={s._id}>{s.fullName} ({s.admissionNo})</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Class</label><select {...register('classId', { required: true })} className="w-full px-4 py-2 border rounded-lg"><option value="">Select Class</option>{classes.map(c => <option key={c._id} value={c._id}>{c.displayName || c.name}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Year</label><input type="number" {...register('year', { required: true })} defaultValue={new Date().getFullYear()} className="w-full px-4 py-2 border rounded-lg"  onWheel={(e) => e.target.blur()} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Month</label><select {...register('month', { required: true })} className="w-full px-4 py-2 border rounded-lg"><option value="1">January</option><option value="2">February</option><option value="3">March</option><option value="4">April</option><option value="5">May</option><option value="6">June</option><option value="7">July</option><option value="8">August</option><option value="9">September</option><option value="10">October</option><option value="11">November</option><option value="12">December</option></select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Days</label><input type="number" {...register('totalDays', { required: true })} defaultValue={30} className="w-full px-4 py-2 border rounded-lg"  onWheel={(e) => e.target.blur()} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Absent Days</label><input type="number" {...register('absentDays', { required: true })} defaultValue="" className="w-full px-4 py-2 border rounded-lg"  onWheel={(e) => e.target.blur()} /></div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-primary-500 text-white py-2 rounded-lg">{isSubmitting ? 'Saving...' : 'Record Attendance'}</button>
      </form>
    </div>
  )
}

export default AttendanceForm