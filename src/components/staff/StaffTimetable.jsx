import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { fetchStaffById } from '../../store/slices/staffSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import staffService from '../../services/staffService'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const timeSlots = [
  { period: 1, start: '09:00', end: '10:00', label: '1st Period (9:00-10:00)' },
  { period: 2, start: '10:00', end: '11:00', label: '2nd Period (10:00-11:00)' },
  { period: 3, start: '11:00', end: '12:00', label: '3rd Period (11:00-12:00)' },
  { period: 4, start: '12:00', end: '13:00', label: '4th Period (12:00-1:00)' },
  { period: 5, start: '14:00', end: '15:00', label: '5th Period (2:00-3:00)' },
  { period: 6, start: '15:00', end: '16:00', label: '6th Period (3:00-4:00)' },
  { period: 7, start: '16:00', end: '17:00', label: '7th Period (4:00-5:00)' },
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
    if (selectedYear && id) {
      loadTimetable()
    }
  }, [selectedYear, id])

  const loadTimetable = async () => {
    setIsLoading(true)
    try {
      const res = await staffService.getStaffTimetable(id, selectedYear)
      if (res && res.length > 0) {
        setTimetable(res)
      } else {
        // Initialize empty timetable
        const emptyTimetable = days.map(day => ({
          day,
          periods: timeSlots.map(slot => ({
            period: slot.period,
            startTime: slot.start,
            endTime: slot.end,
            classId: '',
            subjectId: '',
            room: ''
          }))
        }))
        setTimetable(emptyTimetable)
      }
    } catch (error) {
      console.error('Failed to load timetable:', error)
      toast.error('Failed to load timetable')
    } finally {
      setIsLoading(false)
    }
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyDay = (fromDayIndex, toDayIndex) => {
    const newTimetable = [...timetable]
    newTimetable[toDayIndex].periods = JSON.parse(JSON.stringify(newTimetable[fromDayIndex].periods))
    setTimetable(newTimetable)
    toast.success(`Copied schedule from ${days[fromDayIndex]} to ${days[toDayIndex]}`)
  }

  const handleClearDay = (dayIndex) => {
    const newTimetable = [...timetable]
    newTimetable[dayIndex].periods = newTimetable[dayIndex].periods.map(p => ({
      ...p,
      classId: '',
      subjectId: '',
      room: ''
    }))
    setTimetable(newTimetable)
    toast.success(`Cleared schedule for ${days[dayIndex]}`)
  }

  if (!currentStaff) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Timetable - {currentStaff.name}</h1>
        <p className="text-gray-500 mt-1">Manage weekly class schedule</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Academic Year</label>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)} 
          className="px-4 py-2 border rounded-lg w-64"
        >
          <option value="">Select Year</option>
          {academicYears.map(y => (
            <option key={y._id} value={y._id}>{y.name}</option>
          ))}
        </select>
      </div>

      {selectedYear && (
        <>
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Timetable'}
            </button>
          </div>

          {isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                {days.map((day, idx) => (
                  <div key={day} className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{day}:</span>
                    <button 
                      onClick={() => handleClearDay(idx)} 
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear
                    </button>
                    {idx > 0 && (
                      <button 
                        onClick={() => handleCopyDay(0, idx)} 
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Copy Mon
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 border text-left">Day / Period</th>
                    {timeSlots.map(slot => (
                      <th key={slot.period} className="px-4 py-3 border text-center text-sm">{slot.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((dayData, dayIndex) => (
                    <tr key={dayData.day}>
                      <td className="px-4 py-3 border font-medium bg-gray-50">{dayData.day}</td>
                      {dayData.periods.map((period, periodIndex) => (
                        <td key={periodIndex} className="px-4 py-2 border align-top">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={period.classId}
                                onChange={(e) => updateCell(dayIndex, periodIndex, 'classId', e.target.value)}
                                placeholder="Class"
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary-500"
                              />
                              <input
                                type="text"
                                value={period.subjectId}
                                onChange={(e) => updateCell(dayIndex, periodIndex, 'subjectId', e.target.value)}
                                placeholder="Subject"
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary-500"
                              />
                              <input
                                type="text"
                                value={period.room}
                                onChange={(e) => updateCell(dayIndex, periodIndex, 'room', e.target.value)}
                                placeholder="Room No"
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary-500"
                              />
                            </div>
                          ) : (
                            <div className="text-center">
                              {period.classId ? (
                                <>
                                  <div className="font-medium text-sm">{period.classId}</div>
                                  <div className="text-xs text-gray-500">{period.subjectId}</div>
                                  {period.room && <div className="text-xs text-gray-400">Room: {period.room}</div>}
                                </>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
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
              <div className="p-4 border-t flex justify-end space-x-3">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isLoading} 
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Timetable'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default StaffTimetable