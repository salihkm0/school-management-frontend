import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { createSubject, updateSubject, fetchSubjectById, clearCurrentSubject } from '../../store/slices/subjectSlice'
import LoadingSpinner from '../common/LoadingSpinner'

const SubjectForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { currentSubject, isLoading } = useSelector((state) => state.subjects)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    if (isEditing && id) dispatch(fetchSubjectById(id))
    return () => { dispatch(clearCurrentSubject()) }
  }, [dispatch, id, isEditing])

  useEffect(() => {
    if (isEditing && currentSubject) reset({ name: currentSubject.name, code: currentSubject.code, description: currentSubject.description, type: currentSubject.type, creditHours: currentSubject.creditHours, department: currentSubject.department, gradeLevel: currentSubject.gradeLevel })
  }, [isEditing, currentSubject, reset])

  const onSubmit = async (data) => {
    try {
      if (isEditing) await dispatch(updateSubject({ id, data })).unwrap()
      else await dispatch(createSubject(data)).unwrap()
      navigate('/subjects')
    } catch (error) { console.error('Failed to save subject:', error) }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6"><div><h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Subject' : 'Add New Subject'}</h1><p className="text-gray-500 mt-1">{isEditing ? 'Update subject information' : 'Enter subject details'}</p></div>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label><input {...register('name', { required: 'Name required' })} className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label><input {...register('code', { required: 'Code required' })} className={`w-full px-4 py-2 border rounded-lg ${errors.code ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., MAT101" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea {...register('description')} rows={3} className="w-full px-4 py-2 border rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select {...register('type')} className="w-full px-4 py-2 border rounded-lg"><option value="core">Core</option><option value="elective">Elective</option><option value="optional">Optional</option></select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input {...register('department')} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Sciences, Languages, Mathematics" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Credit Hours</label><input type="number" {...register('creditHours')} className="w-full px-4 py-2 border rounded-lg" placeholder="1-6" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label><select {...register('gradeLevel')} className="w-full px-4 py-2 border rounded-lg"><option value="all">All Grades</option><option value="primary">Primary</option><option value="middle">Middle</option><option value="high">High</option></select></div>
        <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={() => navigate('/subjects')} className="px-6 py-2 border rounded-lg">Cancel</button><button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary-500 text-white rounded-lg">{isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}</button></div>
      </form>
    </div>
  )
}

export default SubjectForm