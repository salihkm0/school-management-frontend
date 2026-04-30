import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import attendanceService from '../../services/attendanceService'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const AttendanceTemplates = () => {
  const dispatch = useDispatch()
  const { academicYears } = useSelector((state) => state.academicYears)
  const { classes } = useSelector((state) => state.classes)
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
    totalWorkingDays: 25,
    holidays: []
  })
  const [holidayInput, setHolidayInput] = useState({ name: '', date: '', type: 'public' })

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }))
    dispatch(fetchClasses({ limit: 100 }))
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
      // Prepare data - convert empty classId to null and filter invalid holidays
      const submitData = {
        name: formData.name,
        academicYearId: formData.academicYearId,
        classId: formData.classId || null,
        month: formData.month,
        year: formData.year,
        totalWorkingDays: formData.totalWorkingDays,
        holidays: formData.holidays.filter(h => h.name && h.date)
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
      totalWorkingDays: 25,
      holidays: []
    })
    setHolidayInput({ name: '', date: '', type: 'public' })
  }

  const editTemplate = (template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      academicYearId: template.academicYearId?._id || template.academicYearId,
      classId: template.classId?._id || template.classId || null,
      month: template.month,
      year: template.year,
      totalWorkingDays: template.totalWorkingDays,
      holidays: template.holidays || []
    })
    setShowModal(true)
  }

  const addHoliday = () => {
    if (holidayInput.name && holidayInput.date) {
      setFormData({
        ...formData,
        holidays: [...formData.holidays, { ...holidayInput }]
      })
      setHolidayInput({ name: '', date: '', type: 'public' })
    } else {
      toast.error('Please enter holiday name and date')
    }
  }

  const removeHoliday = (index) => {
    setFormData({
      ...formData,
      holidays: formData.holidays.filter((_, i) => i !== index)
    })
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }) }))
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Templates</h1>
          <p className="text-gray-500 mt-1">Create and manage monthly attendance templates with working days and holidays</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No templates created yet. Click "Create Template" to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template._id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500">
                    {template.academicYearId?.name} • {months.find(m => m.value === template.month)?.name} {template.year}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => editTemplate(template)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(template._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Working Days:</span>
                  <span className="font-medium">{template.totalWorkingDays}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Holidays:</span>
                  <span className="font-medium">{template.holidays?.length || 0}</span>
                </div>
                {template.classId && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Class:</span>
                    <span className="font-medium">{template.classId?.displayName || template.classId?.name || 'Not specified'}</span>
                  </div>
                )}
                {template.holidays?.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    {template.holidays.slice(0, 2).map(h => h.name).join(', ')}
                    {template.holidays.length > 2 && ` +${template.holidays.length - 2} more`}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleApply(template)}
                disabled={applyingTemplate?._id === template._id}
                className="mt-3 w-full py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {applyingTemplate?._id === template._id ? 'Applying...' : 'Apply to Class'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(y => (
                      <option key={y._id} value={y._id}>{y.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value || null })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Classes (Global Template)</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Working Days *</label>
                <input
                  type="number"
                  value={formData.totalWorkingDays}
                  onChange={(e) => setFormData({ ...formData, totalWorkingDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="1"
                  max="31"
                  required
                />
              </div>
              
              {/* Holidays */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Holidays</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Holiday Name"
                    value={holidayInput.name}
                    onChange={(e) => setHolidayInput({ ...holidayInput, name: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="date"
                    value={holidayInput.date}
                    onChange={(e) => setHolidayInput({ ...holidayInput, date: e.target.value })}
                    className="w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <select
                    value={holidayInput.type}
                    onChange={(e) => setHolidayInput({ ...holidayInput, type: e.target.value })}
                    className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="public">Public</option>
                    <option value="religious">Religious</option>
                    <option value="school">School</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  <button
                    type="button"
                    onClick={addHoliday}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Add
                  </button>
                </div>
                
                {formData.holidays.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {formData.holidays.map((holiday, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">{holiday.name}</td>
                            <td className="px-3 py-2">{new Date(holiday.date).toLocaleDateString()}</td>
                            <td className="px-3 py-2 capitalize">{holiday.type}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeHoliday(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
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