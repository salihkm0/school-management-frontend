// src/components/reports/ExportReports.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { useDispatch, useSelector } from 'react-redux'
import { 
  DocumentArrowDownIcon, 
  UsersIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  DocumentTextIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import studentService from '../../services/studentService'

const ExportReports = () => {
  const dispatch = useDispatch()
  const { staff } = useSelector((state) => state.staff)
  const { classes } = useSelector((state) => state.classes)
  const { currentAcademicYear } = useSelector((state) => state.academicYears || {})
  
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [studentExportList, setStudentExportList] = useState([])

  // Student Filter Options
  const [studentFilterMode, setStudentFilterMode] = useState('all') // 'all' | 'standard' | 'class'
  const [selectedStandard, setSelectedStandard] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { format: 'excel', exportType: 'students' }
  })
  
  const selectedExportType = watch('exportType')

  // Fetch classes and staff on mount if empty
  useEffect(() => {
    if (!classes || classes.length === 0) {
      dispatch(fetchClasses({ limit: 1000, status: 'active' }))
    }
    if (!staff || staff.length === 0) {
      dispatch(fetchStaff({ limit: 1000 }))
    }
  }, [dispatch, classes, staff])

  // Extract unique standards from classes list (e.g. 10, 9, 8, 7...)
  const standardsList = useMemo(() => {
    if (!classes || classes.length === 0) return []
    const stds = new Set()
    classes.forEach(c => {
      if (c.name) stds.add(c.name.toString().trim())
    })
    return Array.from(stds).sort((a, b) => {
      const numA = parseInt(a, 10)
      const numB = parseInt(b, 10)
      if (!isNaN(numA) && !isNaN(numB)) return numB - numA // Descending: 10, 9, 8...
      return a.localeCompare(b)
    })
  }, [classes])

  // Fetch students based on selected filter (limit='all' to fetch full academic year list)
  useEffect(() => {
    if (selectedExportType !== 'students') return

    const loadExportStudents = async () => {
      setIsLoadingStudents(true)
      try {
        const params = { limit: 10000, status: 'active' }
        if (currentAcademicYear?._id) {
          params.academicYearId = currentAcademicYear._id
        }

        if (studentFilterMode === 'standard' && selectedStandard) {
          params.standard = selectedStandard
        } else if (studentFilterMode === 'class' && selectedClassId) {
          params.classId = selectedClassId
        }

        const res = await studentService.getStudents(params)
        if (res?.data) {
          setStudentExportList(res.data)
        } else if (Array.isArray(res)) {
          setStudentExportList(res)
        } else {
          setStudentExportList([])
        }
      } catch (err) {
        console.error('Error fetching students for export:', err)
        toast.error('Failed to fetch student data')
        setStudentExportList([])
      } finally {
        setIsLoadingStudents(false)
      }
    }

    loadExportStudents()
  }, [selectedExportType, studentFilterMode, selectedStandard, selectedClassId, currentAcademicYear])

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ExportData')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  const exportToCSV = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getExportData = () => {
    switch(selectedExportType) {
      case 'students': {
        let suffix = 'all_current_year'
        if (studentFilterMode === 'standard' && selectedStandard) {
          suffix = `standard_${selectedStandard}`
        } else if (studentFilterMode === 'class' && selectedClassId) {
          const matchedClass = classes.find(c => c._id === selectedClassId)
          suffix = `class_${matchedClass?.displayName || matchedClass?.name || selectedClassId}`
        }

        return {
          data: studentExportList.map(s => ({
            'Name': s.fullName || '',
            'Admission No': s.admissionNo || '',
            'Student Code': s.studentCode || '',
            'Class': s.classId?.displayName || `${s.className || ''}${s.division ? `-${s.division}` : ''}`.trim() || '-',
            'Division': s.division || s.classId?.section || '-',
            'Roll Number': s.rollNumber || '-',
            'Gender': s.gender || '-',
            'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-GB') : '-',
            'Status': s.status || 'active',
            'Parent Name': s.parentIds?.[0]?.fullName || s.fatherFullName || s.motherFullName || s.parentName || '-',
            'Parent Phone': s.parentIds?.[0]?.phone || s.phoneNumber || s.parentPhone || '-'
          })),
          filename: `students_export_${suffix}`,
          icon: UsersIcon,
          color: 'from-blue-500 to-blue-600',
          count: studentExportList.length
        }
      }
      case 'staff':
        return {
          data: (staff || []).map(s => ({
            'Name': s.name,
            'Short Name': s.shortName || s.staffCode || '-',
            'Role': s.role,
            'Qualification': s.qualification || '-',
            'Contact': s.contact,
            'Email': s.email || '-',
            'Date of Joining': s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString('en-GB') : '-',
            'Status': s.isActive ? 'Active' : 'Inactive'
          })),
          filename: 'staff_export',
          icon: UserGroupIcon,
          color: 'from-green-500 to-green-600',
          count: (staff || []).length
        }
      case 'classes':
        return {
          data: (classes || []).map(c => ({
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
          count: (classes || []).length
        }
      default:
        return null
    }
  }

  const onSubmit = async (formData) => {
    const exportInfo = getExportData()
    if (!exportInfo || exportInfo.data.length === 0) {
      toast.error('No data available to export')
      return
    }

    setIsExporting(true)
    try {
      if (formData.format === 'excel') {
        exportToExcel(exportInfo.data, exportInfo.filename)
      } else {
        exportToCSV(exportInfo.data, exportInfo.filename)
      }
      toast.success(`${selectedExportType} exported successfully (${exportInfo.count} records)`)
    } catch (error) {
      console.error('Export error:', error)
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
            {/* Export Type Selector */}
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

            {/* Student Filter Scope (Only shown when Export Type === 'students') */}
            {selectedExportType === 'students' && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <FunnelIcon className="w-4 h-4 text-blue-500" />
                  <span>Student Selection Filter (Current Academic Year)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentFilterMode('all')
                      setSelectedStandard('')
                      setSelectedClassId('')
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                      studentFilterMode === 'all'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    All Students
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentFilterMode('standard')
                      setSelectedClassId('')
                      if (standardsList.length > 0 && !selectedStandard) {
                        setSelectedStandard(standardsList[0])
                      }
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                      studentFilterMode === 'standard'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Standard Wise (10, 9, 8...)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentFilterMode('class')
                      setSelectedStandard('')
                      if (classes.length > 0 && !selectedClassId) {
                        setSelectedClassId(classes[0]._id)
                      }
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                      studentFilterMode === 'class'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Class Wise (10A, 8D...)
                  </button>
                </div>

                {/* Standard Selection Dropdown */}
                {studentFilterMode === 'standard' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Select Standard <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedStandard}
                      onChange={(e) => setSelectedStandard(e.target.value)}
                      className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-white"
                    >
                      <option value="">-- All Standards --</option>
                      {standardsList.map((std) => (
                        <option key={std} value={std}>
                          Std {std}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Class & Division Selection Dropdown */}
                {studentFilterMode === 'class' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Select Class & Division <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-white"
                    >
                      <option value="">-- All Classes --</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.displayName || `${cls.name}${cls.section ? `-${cls.section}` : ''}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Format Selector */}
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
              disabled={isExporting || isLoadingStudents}
              className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 font-medium"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Exporting Data...</span>
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
                      {isLoadingStudents ? (
                        <div className="flex items-center gap-2 my-1">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span className="text-sm">Fetching student records...</span>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold">{exportInfo.count}</p>
                      )}
                      <p className="text-sm opacity-90 mt-1">Records to export</p>
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