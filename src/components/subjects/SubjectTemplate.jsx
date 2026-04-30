import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, useFieldArray } from 'react-hook-form'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import subjectService from '../../services/subjectService'  // Changed to default import
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const SubjectTemplate = () => {
  const dispatch = useDispatch()
  const { subjects } = useSelector((state) => state.subjects)
  const [classNames, setClassNames] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, control, setValue, reset, watch } = useForm({ 
    defaultValues: { subjects: [], sectionSpecific: false, sectionSubjects: {} } 
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'subjects' })
  const sectionSpecific = watch('sectionSpecific')

  useEffect(() => {
    dispatch(fetchSubjects({ limit: 100 }))
    loadClassNames()
  }, [dispatch])

  const loadClassNames = async () => {
    setIsLoading(true)
    try {
      const res = await subjectService.getClassNames()  // Changed to subjectService
      setClassNames(res || [])
    } catch (error) {
      console.error('Failed to load class names:', error)
      toast.error('Failed to load class names')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClass) {
      loadTemplate()
    }
  }, [selectedClass])

  const loadTemplate = async () => {
    setIsLoading(true)
    try {
      const template = await subjectService.getTemplateByClassName(selectedClass)  // Changed to subjectService
      if (template) {
        setValue('subjects', template.subjects.map(s => ({ subjectId: s._id || s })))
        setValue('sectionSpecific', template.sectionSpecific || false)
        if (template.sectionSubjects) {
          setValue('sectionSubjects', template.sectionSubjects)
        }
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
    if (!selectedClass) {
      toast.error('Please select a class')
      return
    }
    setIsLoading(true)
    try {
      const templateData = {
        subjects: data.subjects.map(s => s.subjectId),
        sectionSpecific: data.sectionSpecific,
        sectionSubjects: data.sectionSubjects
      }
      await subjectService.upsertTemplateByClassName(selectedClass, templateData)  // Changed to subjectService
      toast.success('Template saved successfully')
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error(error.response?.data?.message || 'Failed to save template')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subject Templates</h1>
        <p className="text-gray-500 mt-1">Define subject templates for each class</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
        <select 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)} 
          className="px-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">Select Class</option>
          {classNames.map(c => (
            <option key={c.className} value={c.className}>
              {c.className} {c.hasTemplate ? '(Has Template)' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Subjects for {selectedClass}</h2>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3">
                  <select 
                    {...register(`subjects.${index}.subjectId`)} 
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => remove(index)} 
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => append({})} 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Subject
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                {...register('sectionSpecific')} 
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="font-medium text-gray-700">Section-specific subjects</span>
            </label>
            
            {sectionSpecific && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Configure subjects per section</p>
                {['A', 'B', 'C', 'D', 'E'].map(section => (
                  <div key={section} className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section {section}</label>
                    <select 
                      {...register(`sectionSubjects.${section}`)} 
                      multiple 
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none h-24"
                    >
                      <option value="">Select Subjects (Ctrl+Click for multiple)</option>
                      {subjects.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default SubjectTemplate