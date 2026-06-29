// src/components/subjects/SubjectTemplate.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeftIcon, PlusIcon, TrashIcon, CheckIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import subjectService from '../../services/subjectService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const SubjectTemplate = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { subjects } = useSelector((state) => state.subjects)
  const { academicYears } = useSelector((state) => state.academicYears)
  const [classNames, setClassNames] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, control, setValue, reset, watch } = useForm({ 
    defaultValues: { subjects: [], sectionSpecific: false, sectionSubjects: {} } 
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'subjects' })
  const sectionSpecific = watch('sectionSpecific')

  useEffect(() => {
    dispatch(fetchSubjects({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 100 }))
    loadClassNames()
  }, [dispatch])

  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const currentYear = academicYears.find(y => y.isCurrent)
      setSelectedYear(currentYear?._id || academicYears[0]?._id || '')
    }
  }, [academicYears, selectedYear])

  const loadClassNames = async () => {
    setIsLoading(true)
    try {
      const res = await subjectService.getClassNames()
      setClassNames(res || [])
    } catch (error) {
      console.error('Failed to load class names:', error)
      toast.error('Failed to load class names')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClass && selectedYear) loadTemplate()
  }, [selectedClass, selectedYear])

  const loadTemplate = async () => {
    setIsLoading(true)
    try {
      const template = await subjectService.getTemplateByClassName(`${selectedClass}?academicYearId=${selectedYear}`)
      if (template) {
        setValue('subjects', template.subjects.map(s => ({ subjectId: s._id || s })))
        setValue('sectionSpecific', template.sectionSpecific || false)
        if (template.sectionSubjects) setValue('sectionSubjects', template.sectionSubjects)
      } else {
        reset({ subjects: [], sectionSpecific: false, sectionSubjects: {} })
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
    if (!selectedClass) { toast.error('Please select a class'); return }
    if (!selectedYear) { toast.error('Please select an academic year'); return }
    setIsLoading(true)
    try {
      await subjectService.upsertTemplateByClassName(selectedClass, {
        academicYearId: selectedYear,
        subjects: data.subjects.map(s => s.subjectId),
        sectionSpecific: data.sectionSpecific,
        sectionSubjects: data.sectionSubjects
      })
      toast.success('Template saved successfully')
      loadClassNames() // Refresh to update "Has Template" indicators
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error(error.response?.data?.message || 'Failed to save template')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !selectedClass) return <LoadingSpinner />

  return (
    <div className="space-y-5 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/subjects')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Subject Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define subject templates for each class</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)} 
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          >
            <option value="">Select Academic Year</option>
            {academicYears.map(year => (
              <option key={year._id} value={year._id}>
                {year.year} {year.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)} 
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            disabled={!selectedYear}
          >
            <option value="">Select Class</option>
            {classNames.map(c => (
              <option key={c.className} value={c.className}>
                {c.className} {c.hasTemplate && '(Has Template)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Subjects for {selectedClass}</h2>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <select {...register(`subjects.${index}.subjectId`)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                  <button type="button" onClick={() => remove(index)} className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => append({})} className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                <PlusIcon className="w-4 h-4" /> Add Subject
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('sectionSpecific')} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-gray-900">Section-specific subjects</span>
              </label>
            </div>
            
            {sectionSpecific && (
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-3">Configure subjects per section (Ctrl/Cmd + Click for multiple)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['A', 'B', 'C', 'D', 'E'].map(section => (
                    <div key={section}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section {section}</label>
                      <select {...register(`sectionSubjects.${section}`)} multiple className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 h-32">
                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">💡 Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              <CheckIcon className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Template'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default SubjectTemplate