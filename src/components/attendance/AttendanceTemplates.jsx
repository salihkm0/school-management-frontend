// src/components/attendance/AttendanceTemplates.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { useAdminTeacherClasses } from '../../hooks/useAdminTeacherClasses'
import attendanceService from '../../services/attendanceService'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const AttendanceTemplates = () => {
  const dispatch = useDispatch()
  const { academicYears } = useSelector((state) => state.academicYears)
  const { myClasses: classes } = useAdminTeacherClasses('class-teacher')
  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [applyingTemplate, setApplyingTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    academicYearId: '',
    classId: null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalWorkingDays: 25
  })

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
    loadTemplates()
  }, [dispatch])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const res = await attendanceService.getAttendanceTemplates()
      setTemplates(res.data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const submitData = {
        name: formData.name,
        academicYearId: formData.academicYearId,
        classId: formData.classId || null,
        month: formData.month,
        year: formData.year,
        totalWorkingDays: formData.totalWorkingDays
      }
      
      if (editingTemplate) {
        await attendanceService.updateAttendanceTemplate(editingTemplate._id, submitData)
        toast.success('Template updated successfully')
      } else {
        await attendanceService.createAttendanceTemplate(submitData)
        toast.success('Template created successfully')
      }
      setShowModal(false)
      setEditingTemplate(null)
      resetForm()
      loadTemplates()
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error(error.response?.data?.message || 'Failed to save template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return
    setIsLoading(true)
    try {
      await attendanceService.deleteAttendanceTemplate(id)
      toast.success('Template deleted successfully')
      loadTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('Failed to delete template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async (template) => {
    if (!template.classId) {
      toast.error('This template is not linked to a specific class')
      return
    }
    setApplyingTemplate(template)
    setIsLoading(true)
    try {
      await attendanceService.applyTemplateToMonth({
        templateId: template._id,
        classId: template.classId,
        year: template.year,
        month: template.month
      })
      toast.success(`Template applied to class successfully`)
      loadTemplates()
    } catch (error) {
      console.error('Failed to apply template:', error)
      toast.error(error.response?.data?.message || 'Failed to apply template')
    } finally {
      setIsLoading(false)
      setApplyingTemplate(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      academicYearId: '',
      classId: null,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalWorkingDays: 25
    })
  }

  const editTemplate = (template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      academicYearId: template.academicYearId?._id || template.academicYearId,
      classId: template.classId?._id || template.classId || null,
      month: template.month,
      year: template.year,
      totalWorkingDays: template.totalWorkingDays
    })
    setShowModal(true)
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) }))
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Attendance Templates</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage monthly attendance templates</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null)
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">No Templates</h3>
          <p className="text-sm text-gray-500">Create your first attendance template</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {template.academicYearId?.name} • {months.find(m => m.value === template.month)?.name} {template.year}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => editTemplate(template)} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(template._id)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Working Days:</span>
                  <span className="font-medium text-gray-900">{template.totalWorkingDays}</span>
                </div>
                {template.classId && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">Class:</span>
                    <span className="font-medium text-gray-900">{template.classId?.displayName || template.classId?.name || 'Not specified'}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleApply(template)}
                disabled={applyingTemplate?._id === template._id}
                className="mt-3 w-full py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                {applyingTemplate?._id === template._id ? 'Applying...' : 'Apply to Class'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex justify-between items-center z-10">
              <h2 className="text-base font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                  placeholder="e.g., April 2026 - Standard"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <select
                    value={formData.academicYearId}
                    onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value || null })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">All Classes (Global Template)</option>
                    {classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    required
                  >
                    {months.map(m => (<option key={m.value} value={m.value}>{m.name}</option>))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    required
                  >
                    {years.map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Working Days *</label>
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  value={formData.totalWorkingDays}
                  onChange={(e) => setFormData({ ...formData, totalWorkingDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  min="1"
                  max="31"
                  required
                />
              </div>
              
              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceTemplates