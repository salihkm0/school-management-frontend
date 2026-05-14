// src/components/staff/StaffTimetable.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { ChevronDownIcon, ChevronUpIcon, DocumentDuplicateIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { fetchStaffById } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import staffService from '../../services/staffService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const timeSlots = [
  { period: 1, start: '09:00', end: '10:00', label: '1st (9:00-10:00)' },
  { period: 2, start: '10:00', end: '11:00', label: '2nd (10:00-11:00)' },
  { period: 3, start: '11:00', end: '12:00', label: '3rd (11:00-12:00)' },
  { period: 4, start: '12:00', end: '13:00', label: '4th (12:00-13:00)' },
  { period: 5, start: '14:00', end: '15:00', label: '5th (14:00-15:00)' },
  { period: 6, start: '15:00', end: '16:00', label: '6th (15:00-16:00)' },
  { period: 7, start: '16:00', end: '17:00', label: '7th (16:00-17:00)' },
]

const StaffTimetable = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentStaff } = useSelector((state) => state.staff)
  const { academicYears } = useSelector((state) => state.academicYears)
  const [selectedYear, setSelectedYear] = useState('')
  const [timetable, setTimetable] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    dispatch(fetchStaffById(id))
    dispatch(fetchAcademicYears({ limit: 50 }))
  }, [dispatch, id])

  useEffect(() => {
    if (selectedYear && id) loadTimetable()
  }, [selectedYear, id])

  const loadTimetable = async () => {
    setIsLoading(true)
    try {
      const res = await staffService.getStaffTimetable(id, selectedYear)
      if (res && res.length > 0) setTimetable(res)
      else setTimetable(days.map(day => ({ day, periods: timeSlots.map(slot => ({ period: slot.period, startTime: slot.start, endTime: slot.end, classId: '', subjectId: '', room: '' })) })))
    } catch (error) {
      console.error('Failed to load timetable:', error)
      toast.error('Failed to load timetable')
    } finally { setIsLoading(false) }
  }

  const updateCell = (dayIndex, periodIndex, field, value) => {
    const newTimetable = [...timetable]
    newTimetable[dayIndex].periods[periodIndex][field] = value
    setTimetable(newTimetable)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await staffService.updateStaffTimetable(id, selectedYear, timetable)
      toast.success('Timetable saved successfully')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save timetable:', error)
      toast.error(error.response?.data?.message || 'Failed to save timetable')
    } finally { setIsLoading(false) }
  }

  if (!currentStaff) return <LoadingSpinner />

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Staff Timetable - {currentStaff.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage weekly class schedule</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Academic Year</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="">Select Year</option>
            {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
          </select>
        </div>
        {selectedYear && (
          <button onClick={() => setIsEditing(!isEditing)} className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isEditing ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
            {isEditing ? <XMarkIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
            <span>{isEditing ? 'Cancel Edit' : 'Edit Timetable'}</span>
          </button>
        )}
      </div>

      {selectedYear && (
        <>
          {isEditing && (
            <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                {days.map((day, idx) => (
                  <div key={day} className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 text-sm">
                    <span className="font-medium">{day.slice(0,3)}</span>
                    <button onClick={() => {
                      const newTimetable = [...timetable]
                      newTimetable[idx].periods = newTimetable[idx].periods.map(p => ({ ...p, classId: '', subjectId: '', room: '' }))
                      setTimetable(newTimetable)
                      toast.success(`Cleared ${day}`)
                    }} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><TrashIcon className="w-3 h-3" /></button>
                    {idx > 0 && (
                      <button onClick={() => {
                        const newTimetable = [...timetable]
                        newTimetable[idx].periods = JSON.parse(JSON.stringify(newTimetable[0].periods))
                        setTimetable(newTimetable)
                        toast.success(`Copied from Monday to ${day}`)
                      }} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><DocumentDuplicateIcon className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Day / Period</th>
                      {timeSlots.map(slot => (<th key={slot.period} className="px-2 py-2 text-center text-xs font-medium text-gray-500">{slot.label}</th>))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {timetable.map((dayData, dayIndex) => (
                      <tr key={dayData.day} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50/50 sticky left-0">{dayData.day}</td>
                        {dayData.periods.map((period, periodIndex) => (
                          <td key={periodIndex} className="px-2 py-2 border-l border-gray-100 align-top min-w-[180px]">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input type="text" value={period.classId} onChange={(e) => updateCell(dayIndex, periodIndex, 'classId', e.target.value)} placeholder="Class" className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                <input type="text" value={period.subjectId} onChange={(e) => updateCell(dayIndex, periodIndex, 'subjectId', e.target.value)} placeholder="Subject" className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                <input type="text" value={period.room} onChange={(e) => updateCell(dayIndex, periodIndex, 'room', e.target.value)} placeholder="Room" className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                              </div>
                            ) : (
                              <div className="text-center">
                                {period.classId ? (
                                  <>
                                    <div className="text-sm font-medium text-gray-900">{period.classId}</div>
                                    <div className="text-xs text-gray-500 truncate">{period.subjectId}</div>
                                    {period.room && <div className="text-xs text-gray-400">Rm: {period.room}</div>}
                                  </>
                                ) : <span className="text-gray-400 text-sm">-</span>}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isEditing && (
                <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={isLoading} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                    <CheckIcon className="w-4 h-4" />
                    <span>{isLoading ? 'Saving...' : 'Save Timetable'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default StaffTimetable