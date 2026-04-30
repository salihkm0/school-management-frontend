// src/components/reports/ExportReports.jsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { fetchStudents } from '../../store/slices/studentSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { useDispatch, useSelector } from 'react-redux'
import { 
  DocumentArrowDownIcon, 
  UsersIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const ExportReports = () => {
  const dispatch = useDispatch()
  const { students } = useSelector((state) => state.students)
  const { staff } = useSelector((state) => state.staff)
  const { classes } = useSelector((state) => state.classes)
  const [isExporting, setIsExporting] = useState(false)

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { format: 'excel', exportType: 'students' }
  })
  
  const selectedExportType = watch('exportType')

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  const exportToCSV = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getExportData = () => {
    switch(selectedExportType) {
      case 'students':
        return {
          data: students.map(s => ({
            'Name': s.fullName,
            'Admission No': s.admissionNo,
            'Student Code': s.studentCode,
            'Class': s.className,
            'Roll Number': s.rollNumber || '-',
            'Gender': s.gender || '-',
            'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '-',
            'Status': s.status || 'active',
            'Parent Name': s.parentName || '-',
            'Parent Phone': s.parentPhone || '-'
          })),
          filename: 'students_export',
          icon: UsersIcon,
          color: 'from-blue-500 to-blue-600',
          count: students.length
        }
      case 'staff':
        return {
          data: staff.map(s => ({
            'Name': s.name,
            'Staff Code': s.staffCode,
            'Role': s.role,
            'Qualification': s.qualification || '-',
            'Contact': s.contact,
            'Email': s.email || '-',
            'Date of Joining': s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString() : '-',
            'Status': s.isActive ? 'Active' : 'Inactive'
          })),
          filename: 'staff_export',
          icon: UserGroupIcon,
          color: 'from-green-500 to-green-600',
          count: staff.length
        }
      case 'classes':
        return {
          data: classes.map(c => ({
            'Class': c.name,
            'Section': c.section || '-',
            'Display Name': c.displayName || `${c.name}${c.section ? `-${c.section}` : ''}`,
            'Class Teacher': c.classTeacherName || '-',
            'Student Count': c.studentCount || 0,
            'Capacity': c.capacity || '-',
            'Status': c.isActive ? 'Active' : 'Inactive'
          })),
          filename: 'classes_export',
          icon: AcademicCapIcon,
          color: 'from-purple-500 to-purple-600',
          count: classes.length
        }
      default:
        return null
    }
  }

  const onSubmit = async (data) => {
    const exportInfo = getExportData()
    if (!exportInfo || exportInfo.data.length === 0) {
      toast.error('No data available to export')
      return
    }

    setIsExporting(true)
    try {
      if (data.format === 'excel') {
        exportToExcel(exportInfo.data, exportInfo.filename)
      } else {
        exportToCSV(exportInfo.data, exportInfo.filename)
      }
      toast.success(`${selectedExportType} exported successfully`)
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const exportInfo = getExportData()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DocumentArrowDownIcon className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Export data to Excel or CSV format</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedExportType === 'students' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    value="students"
                    {...register('exportType')}
                    className="hidden"
                  />
                  <UsersIcon className={`w-6 h-6 ${selectedExportType === 'students' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Students</span>
                </label>
                
                <label className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedExportType === 'staff' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    value="staff"
                    {...register('exportType')}
                    className="hidden"
                  />
                  <UserGroupIcon className={`w-6 h-6 ${selectedExportType === 'staff' ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Staff</span>
                </label>
                
                <label className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedExportType === 'classes' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}>
                  <input
                    type="radio"
                    value="classes"
                    {...register('exportType')}
                    className="hidden"
                  />
                  <AcademicCapIcon className={`w-6 h-6 ${selectedExportType === 'classes' ? 'text-purple-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Classes</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  watch('format') === 'excel' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    value="excel"
                    {...register('format')}
                    className="hidden"
                  />
                  <DocumentTextIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Excel (.xlsx)</span>
                </label>
                
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  watch('format') === 'csv' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    value="csv"
                    {...register('format')}
                    className="hidden"
                  />
                  <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">CSV (.csv)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 font-medium"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>Export Data</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Export Preview</h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Data summary before export</p>
          </div>
          
          <div className="p-6">
            {exportInfo ? (
              <div className="space-y-4">
                <div className={`bg-gradient-to-r ${exportInfo.color} rounded-lg p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <exportInfo.icon className="w-8 h-8 opacity-80 mb-2" />
                      <p className="text-2xl font-bold">{exportInfo.count}</p>
                      <p className="text-sm opacity-90">Records to export</p>
                    </div>
                    <DocumentArrowDownIcon className="w-10 h-10 opacity-50" />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Sample data fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(exportInfo.data[0] || {}).slice(0, 6).map((field, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200">
                        {field}
                      </span>
                    ))}
                    {Object.keys(exportInfo.data[0] || {}).length > 6 && (
                      <span className="px-2 py-0.5 bg-white rounded text-xs text-gray-400 border border-gray-200">
                        +{Object.keys(exportInfo.data[0] || {}).length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500">Select an export type to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportReports