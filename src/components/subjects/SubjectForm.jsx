// src/components/subjects/SubjectForm.jsx
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeftIcon, BookOpenIcon, CheckIcon } from '@heroicons/react/24/outline'
import { createSubject, updateSubject, fetchSubjectById, clearCurrentSubject } from '../../store/slices/subjectSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

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
    if (isEditing && currentSubject) {
      reset({ 
        name: currentSubject.name, 
        code: currentSubject.code, 
        description: currentSubject.description, 
        type: currentSubject.type, 
        creditHours: currentSubject.creditHours, 
        department: currentSubject.department, 
        gradeLevel: currentSubject.gradeLevel,
        isActive: currentSubject.isActive
      })
    }
  }, [isEditing, currentSubject, reset])

  const onSubmit = async (data) => {
    try {
      if (isEditing) await dispatch(updateSubject({ id, data })).unwrap()
      else await dispatch(createSubject(data)).unwrap()
      toast.success(isEditing ? 'Subject updated' : 'Subject created')
      navigate('/subjects')
    } catch (error) { 
      toast.error(error.message || 'Failed to save subject')
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/subjects')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{isEditing ? 'Edit Subject' : 'Add New Subject'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEditing ? 'Update subject information' : 'Enter subject details'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Subject Information</h2>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name <span className="text-rose-500">*</span></label>
              <input {...register('name', { required: 'Name required' })} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.name ? 'border-rose-500' : 'border-gray-200'}`} placeholder="e.g., Mathematics" />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code <span className="text-rose-500">*</span></label>
              <input {...register('code', { required: 'Code required' })} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.code ? 'border-rose-500' : 'border-gray-200'}`} placeholder="e.g., MAT101" />
              {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select {...register('type')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="core">Core</option>
                <option value="elective">Elective</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Hours</label>
              <input type="number" {...register('creditHours')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="1-6"  onWheel={(e) => e.target.blur()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input {...register('department')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g., Sciences, Languages" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <select {...register('gradeLevel')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="all">All Grades</option>
                <option value="primary">Primary</option>
                <option value="middle">Middle</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none" placeholder="Subject description" />
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Subject</label>
              <p className="text-xs text-gray-500 ml-2">Uncheck to soft delete/deactivate this subject.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/subjects')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            <CheckIcon className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default SubjectForm