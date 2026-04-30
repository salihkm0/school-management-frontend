import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { fetchAcademicYears, createAcademicYear, updateAcademicYear, setCurrentAcademicYear, deleteAcademicYear } from '../../store/slices/academicYearSlice'
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'

const AcademicYearSettings = () => {
  const dispatch = useDispatch()
  const { academicYears, currentAcademicYear, isLoading } = useSelector((state) => state.academicYears)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  const onSubmit = async (data) => {
    if (editingYear) {
      await dispatch(updateAcademicYear({ id: editingYear._id, data }))
    } else {
      await dispatch(createAcademicYear(data))
    }
    setIsModalOpen(false)
    setEditingYear(null)
    reset()
  }

  const handleEdit = (year) => {
    setEditingYear(year)
    reset(year)
    setIsModalOpen(true)
  }

  const handleSetCurrent = async (id) => {
    await dispatch(setCurrentAcademicYear(id))
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteAcademicYear(deleteTarget))
      setDeleteTarget(null)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Years</h1>
          <p className="text-gray-500 mt-1">Manage academic years and set current year</p>
        </div>
        <button onClick={() => { setEditingYear(null); reset(); setIsModalOpen(true) }} className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          <PlusIcon className="w-5 h-5" />
          <span>Add Academic Year</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {academicYears.map((year) => (
              <tr key={year._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{year.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{year.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(year.startDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(year.endDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {year.isCurrent ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center w-fit">
                      <StarIcon className="w-3 h-3 mr-1" /> Current
                    </span>
                  ) : (
                    <button onClick={() => handleSetCurrent(year._id)} className="text-xs text-primary-600 hover:text-primary-700">Set as Current</button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button onClick={() => handleEdit(year)} className="text-blue-600 hover:text-blue-800 mr-3"><PencilIcon className="w-5 h-5" /></button>
                  <button onClick={() => setDeleteTarget(year._id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingYear ? 'Edit Academic Year' : 'Add Academic Year'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input {...register('name', { required: 'Name is required' })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Year (YYYY-YYYY)</label><input {...register('year', { required: 'Year is required', pattern: { value: /^\d{4}-\d{4}$/, message: 'Format: YYYY-YYYY' } })} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" {...register('startDate', { required: 'Start date is required' })} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" {...register('endDate', { required: 'End date is required' })} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={() => { setIsModalOpen(false); setEditingYear(null); reset() }} className="px-4 py-2 border rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg">{editingYear ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Academic Year" message="Are you sure you want to delete this academic year? This action cannot be undone." confirmText="Delete" confirmVariant="danger" />
    </div>
  )
}

export default AcademicYearSettings