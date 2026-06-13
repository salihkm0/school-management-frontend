// src/components/duties/AutoAssignDuty.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { autoAssignDuties } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { 
  CalendarIcon, 
  UserIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const dutyTypes = ['exam', 'invigilation', 'supervision', 'hall_monitor', 'security', 'sports', 'arts', 'workshop']

const shiftOptions = [
  { value: 'both', label: 'Both Shifts', icon: '🔄', duration: 6 },
  { value: 'morning', label: 'Morning (9:00 AM - 12:00 PM)', icon: '🌅', duration: 3 },
  { value: 'afternoon', label: 'Afternoon (2:00 PM - 5:00 PM)', icon: '🌤️', duration: 3 },
  { value: 'full', label: 'Full Day (9:00 AM - 5:00 PM)', icon: '📅', duration: 8 }
]

const shiftColors = {
  morning: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  afternoon: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  full: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  both: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
}

const AutoAssignDuty = () => {
  const dispatch = useDispatch()
  const [selectedDates, setSelectedDates] = useState([])
  const [dutyType, setDutyType] = useState('exam')
  const [selectedShift, setSelectedShift] = useState('both')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState('')
  const [className, setClassName] = useState('')
  
  // Room states
  const [totalRooms, setTotalRooms] = useState('')
  const [rooms, setRooms] = useState([])

  // Excluded staff state: [{ staffId, name, dates: [] }]
  const [excludedStaff, setExcludedStaff] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => { loadStaff() }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStaffDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadStaff = async () => {
    try {
      const res = await dispatch(fetchStaff({ limit: 100, isActive: true }))
      setStaffList(res.payload?.data || [])
    } catch (error) { console.error('Failed to load staff:', error) }
  }

  // Handle room count change
  const handleTotalRoomsChange = (val) => {
    if (val === '') {
      setTotalRooms('');
      setRooms([]);
      return;
    }
    const num = Math.max(1, parseInt(val) || 1);
    setTotalRooms(num);
    const updatedRooms = [...rooms];
    if (num > updatedRooms.length) {
      for (let i = updatedRooms.length; i < num; i++) {
        updatedRooms.push('');
      }
    } else if (num < updatedRooms.length) {
      updatedRooms.splice(num);
    }
    setRooms(updatedRooms);
  }

  const handleRoomNameChange = (index, name) => {
    const updated = [...rooms];
    updated[index] = name;
    setRooms(updated);
  }

  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => 
      !excludedStaff.some(e => e.staffId === staff._id) &&
      (staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       staff.staffCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       staff.role?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [staffList, excludedStaff, searchTerm])

  const handleDateSelect = () => {
    if (!selectedDate) { toast.error('Please select a date'); return }
    if (selectedDates.some(d => d.date === selectedDate)) { toast.error('Date already selected'); return }
    setSelectedDates([...selectedDates, { date: selectedDate, shift: selectedShift }])
    setSelectedDate('')
  }

  const removeDate = (dateToRemove) => {
    const nextDates = selectedDates.filter(d => d.date !== dateToRemove);
    setSelectedDates(nextDates);
    // Also remove this date from any staff exclusions
    setExcludedStaff(excludedStaff.map(e => ({
      ...e,
      dates: e.dates.filter(d => d !== dateToRemove)
    })));
  }

  const updateDateShift = (dateObj, newShift) => setSelectedDates(selectedDates.map(d => d.date === dateObj.date ? { ...d, shift: newShift } : d))

  const addExcludedStaff = (staffId, staffName) => {
    // Default to excluding them from all currently selected dates
    const initialDates = selectedDates.map(d => d.date);
    setExcludedStaff([...excludedStaff, { staffId, name: staffName, dates: initialDates }]);
    setSearchTerm('')
    setShowStaffDropdown(false)
    toast.success(`${staffName} added to excluded list`)
  }

  const removeExcludedStaff = (staffId) => setExcludedStaff(excludedStaff.filter(e => e.staffId !== staffId))

  const toggleExcludedStaffDate = (staffId, dateStr) => {
    setExcludedStaff(excludedStaff.map(e => {
      if (e.staffId === staffId) {
        const hasDate = e.dates.includes(dateStr);
        const updatedDates = hasDate 
          ? e.dates.filter(d => d !== dateStr)
          : [...e.dates, dateStr];
        return { ...e, dates: updatedDates };
      }
      return e;
    }));
  }

  const toggleExcludeAllDates = (staffId) => {
    setExcludedStaff(excludedStaff.map(e => {
      if (e.staffId === staffId) {
        const allDates = selectedDates.map(d => d.date);
        const isExcludingAll = e.dates.length === allDates.length;
        return { ...e, dates: isExcludingAll ? [] : allDates };
      }
      return e;
    }));
  }

  const getStaffName = (staffId) => staffList.find(s => s._id === staffId)?.name || 'Unknown'

  const handleSubmit = async () => {
    if (selectedDates.length === 0) { toast.error('Please select at least one date'); return }
    const formattedDates = selectedDates.map(d => ({ date: d.date, shift: d.shift }))
    
    // Clean rooms array - if a room name is empty, replace it with default name
    const cleanedRooms = rooms.map((r, i) => r.trim() || `Room ${i + 1}`);
    const finalTotalRooms = parseInt(totalRooms) || 1;
    
    setIsLoading(true)
    try {
      const res = await dispatch(autoAssignDuties({
        dates: formattedDates,
        dutyType,
        excludedStaff: excludedStaff.map(e => ({ staffId: e.staffId, dates: e.dates })),
        totalRooms: finalTotalRooms,
        rooms: cleanedRooms.length > 0 ? cleanedRooms : [`Room 1`],
        className: className || dutyType
      })).unwrap()
      setResult(res)
      toast.success(`${res.statistics?.totalDuties || 0} duties assigned for ${selectedDates.length} date(s)`)
    } catch (error) { 
      toast.error(error.message || 'Failed to assign duties')
    } finally { setIsLoading(false) }
  }

  const clearAllDates = () => { setSelectedDates([]); setResult(null) }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0)
    const days = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = new Date(year, month, i).toISOString().split('T')[0]
      const isSelected = selectedDates.some(d => d.date === dateStr)
      const selectedShiftData = selectedDates.find(d => d.date === dateStr)?.shift
      days.push({ date: dateStr, day: i, isSelected, selectedShift: selectedShiftData })
    }
    return days
  }

  const changeMonth = (increment) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1))
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const days = getDaysInMonth(currentMonth)
  const totalSlots = selectedDates.reduce((total, date) => total + (date.shift === 'both' ? 2 : 1), 0) * totalRooms

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Panel - Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Configuration</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Duty Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duty Type</label>
              <select value={dutyType} onChange={(e) => setDutyType(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                {dutyTypes.map(t => (<option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>))}
              </select>
            </div>

            {/* Class/Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class/Event Name (Optional)</label>
              <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g., Annual Sports Day" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              <p className="text-xs text-gray-400 mt-1">Used for notifications and reporting</p>
            </div>

            {/* Shift Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Shift for New Dates</label>
              <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                {shiftOptions.map(option => (<option key={option.value} value={option.value}>{option.icon} {option.label}</option>))}
              </select>
            </div>

            {/* Rooms Configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Rooms</label>
                <input
                  type="number" onWheel={(e) => e.target.blur()}
                  value={totalRooms}
                  onChange={(e) => handleTotalRoomsChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Slots / Shift</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                  {parseInt(totalRooms) || 1} slots
                </div>
              </div>
            </div>

            {parseInt(totalRooms) >= 1 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Room Names / Codes</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-gray-50 rounded-lg border border-gray-200">
                  {rooms.map((roomName, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={roomName}
                      onChange={(e) => handleRoomNameChange(idx, e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      placeholder={`Room ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Excluded Staff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exclude Staff Members</label>
              <div className="relative" ref={dropdownRef}>
                <div className="flex gap-2">
                  <input type="text" placeholder="Search staff..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowStaffDropdown(true); }} onFocus={() => setShowStaffDropdown(true)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  <button type="button" onClick={() => setShowStaffDropdown(!showStaffDropdown)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">▼</button>
                </div>
                {showStaffDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStaff.length === 0 ? <div className="px-4 py-3 text-gray-500 text-sm">No staff found</div> :
                      filteredStaff.map(staff => (
                        <button key={staff._id} onClick={() => addExcludedStaff(staff._id, staff.name)} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center">
                          <div><span className="font-medium text-gray-900">{staff.name}</span><span className="text-xs text-gray-500 ml-2">({staff.staffCode || staff.role})</span></div>
                          <PlusIcon className="w-4 h-4 text-emerald-600" />
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
              {excludedStaff.length > 0 && (
                <div className="mt-3 space-y-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Excluded Staff & Dates</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {excludedStaff.map(e => (
                      <div key={e.staffId} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-800">{e.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExcludeAllDates(e.staffId)}
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold"
                            >
                              {e.dates.length === selectedDates.length ? 'Clear Dates' : 'Exclude All'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExcludedStaff(e.staffId)}
                              className="text-rose-500 hover:text-rose-700 font-semibold text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {selectedDates.length === 0 ? (
                          <p className="text-[10px] text-gray-400 italic">Select assignment dates first to set specific exclusions</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {selectedDates.map(d => {
                              const isExcluded = e.dates.includes(d.date);
                              return (
                                <button
                                  key={d.date}
                                  type="button"
                                  onClick={() => toggleExcludedStaffDate(e.staffId, d.date)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                                    isExcluded
                                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                                  }`}
                                  title={isExcluded ? 'Excluded on this date (click to enable)' : 'Not excluded (click to exclude)'}
                                >
                                  {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-900">Select Dates</h2>
              <div className="text-xs text-gray-500">Total Slots: {totalSlots}</div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Date Selection */}
            <div className="flex gap-2">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              <button onClick={handleDateSelect} className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Add</button>
            </div>

            {/* Calendar */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth(-1)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">◀</button>
                <span className="text-sm font-semibold text-gray-800">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                <button onClick={() => changeMonth(1)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">▶</button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (<div key={day} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>))}
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day ? (
                      <button onClick={() => day.isSelected ? removeDate(day.date) : setSelectedDates([...selectedDates, { date: day.date, shift: selectedShift }])} 
                        className={`w-full h-full rounded-lg text-sm font-medium transition-all relative ${day.isSelected ? 'bg-emerald-50 border-2 border-emerald-500' : 'hover:bg-gray-100 border-2 border-transparent'}`}>
                        <span className={day.isSelected ? 'text-emerald-700' : 'text-gray-700'}>{day.day}</span>
                        {day.isSelected && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500"></span>}
                      </button>
                    ) : <div className="w-full h-full"></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Dates List */}
            {selectedDates.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Selected Dates ({selectedDates.length})</label>
                  <button onClick={clearAllDates} className="text-xs text-rose-600 hover:text-rose-700">Clear All</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDates.map((dateObj) => (
                    <div key={dateObj.date} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{new Date(dateObj.date).toLocaleDateString()}</span>
                      <select value={dateObj.shift} onChange={(e) => updateDateShift(dateObj, e.target.value)} className={`px-2 py-0.5 text-xs rounded-lg border-0 focus:ring-1 focus:ring-emerald-500 ${shiftColors[dateObj.shift] || 'bg-gray-100'}`}>
                        {shiftOptions.map(option => (<option key={option.value} value={option.value}>{option.icon} {option.label.split(' ')[0]}</option>))}
                      </select>
                      <button onClick={() => removeDate(dateObj.date)} className="text-rose-500 hover:text-rose-700">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={isLoading || selectedDates.length === 0} className="w-full py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {isLoading ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Assigning...</span> : `Assign ${totalSlots} Slot${totalSlots !== 1 ? 's' : ''} on ${selectedDates.length} Date${selectedDates.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Assignment Result</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-emerald-600">{result.statistics?.totalDuties || 0}</p><p className="text-xs text-gray-600">Duties</p></div>
              <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-blue-600">{result.statistics?.totalSlots || 0}</p><p className="text-xs text-gray-600">Slots</p></div>
              <div className="bg-purple-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-purple-600">{result.statistics?.dutiesPerStaff?.fairness || 0}</p><p className="text-xs text-gray-600">Fairness</p></div>
            </div>

            {/* Staff Distribution */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Staff Distribution</h3>
                <span className="text-xs text-gray-500">Min: {result.statistics?.dutiesPerStaff?.min} | Max: {result.statistics?.dutiesPerStaff?.max} | Avg: {result.statistics?.dutiesPerStaff?.avg}</span>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(result.statistics?.staffDistribution || {}).sort((a, b) => b[1] - a[1]).map(([staffId, totalCount]) => {
                  const staff = staffList.find(s => s._id === staffId)
                  const existingLoad = result.statistics?.existingLoad?.[staffId] || 0
                  const newAssignments = result.statistics?.newAssignments?.[staffId] || 0
                  const percentage = (totalCount / result.statistics?.totalDuties) * 100
                  const isExcluded = excludedStaff.some(e => e.staffId === staffId && e.dates.length === selectedDates.length)
                  return (
                    <div key={staffId} className={isExcluded ? 'opacity-50' : ''}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{staff?.name || staffId}{isExcluded && <span className="ml-2 text-xs text-rose-500">(Excluded)</span>}</span>
                        <div className="flex gap-2 text-xs"><span className="text-gray-500">Existing: {existingLoad}</span><span className="text-emerald-600">New: +{newAssignments}</span><span className="text-gray-900 font-semibold">Total: {totalCount}</span></div>
                      </div>
                      <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="absolute left-0 top-0 h-full bg-gray-300" style={{ width: `${(existingLoad / (existingLoad + newAssignments || 1)) * percentage}%` }} />
                        <div className="absolute left-0 top-0 h-full bg-emerald-500" style={{ width: `${(newAssignments / (existingLoad + newAssignments || 1)) * percentage}%`, left: `${(existingLoad / (existingLoad + newAssignments || 1)) * percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={clearAllDates} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Clear & Start Over</button>
              <button onClick={() => setResult(null)} className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoAssignDuty