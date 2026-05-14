// src/components/classes/ClassForm.jsx
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeftIcon, AcademicCapIcon, CheckIcon } from '@heroicons/react/24/outline'
import { createClass, updateClass, fetchClassById, clearCurrentClass } from '../../store/slices/classSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ClassForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { currentClass, isLoading } = useSelector((state) => state.classes)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
    if (isEditing && id) dispatch(fetchClassById(id))
    return () => { dispatch(clearCurrentClass()) }
  }, [dispatch, id, isEditing])

  useEffect(() => {
    if (isEditing && currentClass) {
      reset({ name: currentClass.name, section: currentClass.section, capacity: currentClass.capacity, academicYearId: currentClass.academicYearId?._id || currentClass.academicYearId })
    }
  }, [isEditing, currentClass, reset])

  const onSubmit = async (data) => {
    try {
      if (isEditing) await dispatch(updateClass({ id, data })).unwrap()
      else await dispatch(createClass(data)).unwrap()
      toast.success(isEditing ? 'Class updated' : 'Class created')
      navigate('/classes')
    } catch (error) { toast.error(error.message || 'Failed to save class') }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/classes')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{isEditing ? 'Edit Class' : 'Add New Class'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEditing ? 'Update class information' : 'Enter class details'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Class Information</h2>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name <span className="text-rose-500">*</span></label>
              <input {...register('name', { required: 'Class name is required' })} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.name ? 'border-rose-500' : 'border-gray-200'}`} placeholder="e.g., 10" />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input {...register('section')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g., A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" {...register('capacity')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Max students" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year <span className="text-rose-500">*</span></label>
              <select {...register('academicYearId', { required: 'Academic year required' })} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.academicYearId ? 'border-rose-500' : 'border-gray-200'}`}>
                <option value="">Select Year</option>
                {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
              </select>
              {errors.academicYearId && <p className="mt-1 text-xs text-rose-500">{errors.academicYearId.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/classes')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            <CheckIcon className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ClassForm