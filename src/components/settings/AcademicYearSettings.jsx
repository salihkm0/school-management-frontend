// src/components/settings/AcademicYearSettings.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { fetchAcademicYears, createAcademicYear, updateAcademicYear, setCurrentAcademicYear, deleteAcademicYear } from '../../store/slices/academicYearSlice'
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const AcademicYearSettings = () => {
  const dispatch = useDispatch()
  const { academicYears, currentAcademicYear, isLoading } = useSelector((state) => state.academicYears)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
  }, [dispatch])

  const onSubmit = async (data) => {
    try {
      if (editingYear) {
        await dispatch(updateAcademicYear({ id: editingYear._id, data })).unwrap()
        toast.success('Academic year updated')
      } else {
        await dispatch(createAcademicYear(data)).unwrap()
        toast.success('Academic year created')
      }
      setIsModalOpen(false)
      setEditingYear(null)
      reset()
    } catch (error) {
      toast.error(error.message || 'Failed to save')
    }
  }

  const handleEdit = (year) => {
    setEditingYear(year)
    reset({
      name: year.name,
      year: year.year,
      startDate: year.startDate?.split('T')[0],
      endDate: year.endDate?.split('T')[0]
    })
    setIsModalOpen(true)
  }

  const handleSetCurrent = async (id) => {
    await dispatch(setCurrentAcademicYear(id))
    toast.success('Current academic year updated')
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteAcademicYear(deleteTarget))
      setDeleteTarget(null)
      toast.success('Academic year deleted')
    }
  }

  // Pagination
  const paginatedYears = academicYears.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(academicYears.length / itemsPerPage)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Academic Years</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage academic years and set current year</p>
        </div>
        <button onClick={() => { setEditingYear(null); reset({}); setIsModalOpen(true) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
          <PlusIcon className="w-4 h-4" />
          <span>Add Year</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Years</p>
          <p className="text-lg font-bold text-gray-900">{academicYears.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Current Year</p>
          <p className="text-sm font-medium text-emerald-600 truncate">{currentAcademicYear?.year || 'None'}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-lg font-bold text-emerald-600">{academicYears.filter(y => y.isActive).length}</p>
        </div>
      </div>

      {/* Academic Years Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Year</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Start Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">End Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedYears.map((year) => (
                <tr key={year._id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{year.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 hidden sm:table-cell">{year.year}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 hidden md:table-cell">{new Date(year.startDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 hidden md:table-cell">{new Date(year.endDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    {year.isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                        <StarIcon className="w-3 h-3" /> Current
                      </span>
                    ) : (
                      <button onClick={() => handleSetCurrent(year._id)} className="text-xs text-emerald-600 hover:text-emerald-700">
                        Set Current
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(year)} className="p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(year._id)} className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500 hidden sm:block">
              {academicYears.length} total years
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">{editingYear ? 'Edit Academic Year' : 'Add Academic Year'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input {...register('name', { required: 'Name is required' })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="e.g., Academic Year 2025-2026" />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year (YYYY-YYYY) *</label>
                <input {...register('year', { required: 'Year is required', pattern: { value: /^\d{4}-\d{4}$/, message: 'Format: YYYY-YYYY' } })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="2025-2026" />
                {errors.year && <p className="mt-1 text-xs text-rose-500">{errors.year.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input type="date" {...register('startDate', { required: 'Start date required' })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input type="date" {...register('endDate', { required: 'End date required' })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">{editingYear ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center"><TrashIcon className="w-5 h-5 text-rose-600" /></div>
                <div><h3 className="text-base font-semibold text-gray-900">Delete Academic Year</h3><p className="text-xs text-gray-500">This action cannot be undone</p></div>
              </div>
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this academic year?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AcademicYearSettings