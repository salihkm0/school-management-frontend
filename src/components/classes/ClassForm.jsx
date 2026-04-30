// src/components/classes/ClassForm.jsx
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeftIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
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
      reset({ 
        name: currentClass.name, 
        section: currentClass.section, 
        capacity: currentClass.capacity, 
        academicYearId: currentClass.academicYearId?._id || currentClass.academicYearId 
      })
    }
  }, [isEditing, currentClass, reset])

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await dispatch(updateClass({ id, data })).unwrap()
        toast.success('Class updated successfully')
      } else {
        await dispatch(createClass(data)).unwrap()
        toast.success('Class created successfully')
      }
      navigate('/classes')
    } catch (error) { 
      toast.error(error.message || 'Failed to save class')
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/classes')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Class' : 'Add New Class'}</h1>
          <p className="text-gray-500 mt-1">{isEditing ? 'Update class information' : 'Enter class details'}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-800">Class Information</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Class name is required' })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 10"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input
                {...register('section')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="e.g., A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                {...register('capacity')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="Maximum students"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                {...register('academicYearId', { required: 'Academic year is required' })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                  errors.academicYearId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map(y => (
                  <option key={y._id} value={y._id}>{y.name}</option>
                ))}
              </select>
              {errors.academicYearId && (
                <p className="mt-1 text-xs text-red-500">{errors.academicYearId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/classes')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Update Class' : 'Create Class'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ClassForm