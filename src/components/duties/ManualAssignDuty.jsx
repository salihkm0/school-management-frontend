// src/components/duties/ManualAssignDuty.jsx
import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { assignManualDuty } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { PlusIcon, XMarkIcon, UserIcon, CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const dutyTypes = ['exam', 'invigilation', 'supervision', 'hall_monitor', 'security', 'sports', 'arts', 'workshop', 'event', 'meeting']

const ManualAssignDuty = () => {
  const dispatch = useDispatch()
  const [staffList, setStaffList] = useState([])
  const [selectedStaff, setSelectedStaff] = useState('')
  const [dutyType, setDutyType] = useState('exam')
  const [dates, setDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [shift, setShift] = useState('full')
  const [duration, setDuration] = useState(8)
  const [location, setLocation] = useState('')
  const [room, setRoom] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    setIsLoading(true)
    try {
      const res = await dispatch(fetchStaff({ limit: 100 }))
      setStaffList(res.payload?.data || [])
    } catch (error) {
      console.error('Failed to load staff:', error)
      toast.error('Failed to load staff list')
    } finally {
      setIsLoading(false)
    }
  }

  const addDate = () => {
    if (!selectedDate) { toast.error('Please select a date'); return }
    if (dates.includes(selectedDate)) { toast.error('Date already added'); return }
    setDates([...dates, selectedDate])
    setSelectedDate('')
  }

  const removeDate = (dateToRemove) => setDates(dates.filter(d => d !== dateToRemove))

  const handleSubmit = async () => {
    if (!selectedStaff) { toast.error('Please select a staff member'); return }
    if (dates.length === 0) { toast.error('Please add at least one date'); return }

    setIsLoading(true)
    try {
      const dutyData = { staffId: selectedStaff, dutyType, dates, shift, duration, location, room, remarks, className: dutyType }
      const res = await dispatch(assignManualDuty(dutyData)).unwrap()
      toast.success(res.message || 'Duty assigned successfully')
      setSelectedStaff(''); setDutyType('exam'); setDates([]); setShift('full'); setDuration(8); setLocation(''); setRoom(''); setRemarks('')
    } catch (error) {
      toast.error(error.message || 'Failed to assign duty')
    } finally { setIsLoading(false) }
  }

  const getStaffName = (staffId) => staffList.find(s => s._id === staffId)?.name || ''

  if (isLoading && staffList.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Panel */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Assignment Details</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member *</label>
              <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="">Select Staff Member</option>
                {staffList.map(staff => (<option key={staff._id} value={staff._id}>{staff.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duty Type *</label>
              <select value={dutyType} onChange={(e) => setDutyType(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize">
                {dutyTypes.map(type => (<option key={type} value={type} className="capitalize">{type.replace('_', ' ')}</option>))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                <select value={shift} onChange={(e) => setShift(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="full">Full Day</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" min="1" max="12" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room / Specific Location (Optional)</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g., Room 101, Science Lab" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location / School Area (Optional)</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Main Block, Ground Floor" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="Any additional notes..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Right Panel - Dates */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Select Dates</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              <button onClick={addDate} className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Add</button>
            </div>

            {dates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Dates ({dates.length})</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dates.map(date => (
                    <div key={date} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
                      <button onClick={() => removeDate(date)} className="text-rose-500 hover:text-rose-700">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Assignment Summary</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Staff Member</p><p className="text-sm font-medium text-gray-900">{getStaffName(selectedStaff) || 'Not selected'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Duty Type</p><p className="text-sm font-medium text-gray-900 capitalize">{dutyType.replace('_', ' ')}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total Days</p><p className="text-sm font-medium text-gray-900">{dates.length} day{dates.length !== 1 ? 's' : ''}</p></div>
          </div>
          <button onClick={handleSubmit} disabled={isLoading || !selectedStaff || dates.length === 0} className="w-full py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Assigning...' : 'Assign Duty'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManualAssignDuty