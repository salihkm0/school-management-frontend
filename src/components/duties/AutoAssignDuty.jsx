import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { autoAssignDuties } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const dutyTypes = ['exam', 'invigilation', 'supervision', 'hall_monitor', 'security', 'sports', 'arts', 'workshop']

const shiftOptions = [
  { value: 'both', label: 'Both Shifts (Morning + Afternoon)', icon: '' },
  { value: 'morning', label: 'Morning Only (9:00 AM - 12:00 PM)', icon: '' },
  { value: 'afternoon', label: 'Afternoon Only (2:00 PM - 5:00 PM)', icon: '' },
  { value: 'full', label: 'Full Day (9:00 AM - 5:00 PM)', icon: '' }
]

const shiftColors = {
  morning: 'bg-blue-100 text-blue-800',
  afternoon: 'bg-orange-100 text-orange-800',
  full: 'bg-purple-100 text-purple-800',
  both: 'bg-green-100 text-green-800'
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
  
  // Excluded staff state
  const [excludedStaffIds, setExcludedStaffIds] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      const res = await dispatch(fetchStaff({ limit: 100, isActive: true }))
      setStaffList(res.payload?.data || [])
    } catch (error) {
      console.error('Failed to load staff:', error)
    }
  }

  // Filter staff list based on search term and already excluded
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => 
      !excludedStaffIds.includes(staff._id) &&
      (staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       staff.staffCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       staff.role?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [staffList, excludedStaffIds, searchTerm])

  const handleDateSelect = () => {
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    
    // Check if date already selected
    if (selectedDates.some(d => d.date === selectedDate)) {
      toast.error('Date already selected')
      return
    }
    
    setSelectedDates([...selectedDates, { date: selectedDate, shift: selectedShift }])
    setSelectedDate('')
  }

  const removeDate = (dateToRemove) => {
    setSelectedDates(selectedDates.filter(d => d.date !== dateToRemove))
  }

  const updateDateShift = (dateObj, newShift) => {
    setSelectedDates(selectedDates.map(d => 
      d.date === dateObj.date ? { ...d, shift: newShift } : d
    ))
  }

  // Excluded staff handlers
  const addExcludedStaff = (staffId, staffName) => {
    setExcludedStaffIds([...excludedStaffIds, staffId])
    setSearchTerm('')
    setShowStaffDropdown(false)
    toast.success(`${staffName} added to excluded list`)
  }

  const removeExcludedStaff = (staffId) => {
    setExcludedStaffIds(excludedStaffIds.filter(id => id !== staffId))
  }

  const getStaffName = (staffId) => {
    const staff = staffList.find(s => s._id === staffId)
    return staff?.name || 'Unknown'
  }

  const handleSubmit = async () => {
    if (selectedDates.length === 0) { 
      toast.error('Please select at least one date')
      return 
    }
    
    // Format dates for API
    const formattedDates = selectedDates.map(d => ({
      date: d.date,
      shift: d.shift
    }))
    
    setIsLoading(true)
    try {
      const res = await dispatch(autoAssignDuties({ 
        dates: formattedDates, 
        dutyType,
        excludedStaffIds,
        className: className || dutyType
      })).unwrap()
      
      setResult(res)
      toast.success(`${res.statistics?.totalDuties || 0} duties assigned for ${selectedDates.length} date(s)`)
    } catch (error) { 
      console.error('Assignment error:', error)
      toast.error(error.message || 'Failed to assign duties')
    }
    finally { setIsLoading(false) }
  }

  const clearAllDates = () => {
    setSelectedDates([])
    setResult(null)
  }

  // Helper to get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    const startDayOfWeek = firstDay.getDay()
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = new Date(year, month, i).toISOString().split('T')[0]
      const isSelected = selectedDates.some(d => d.date === dateStr)
      const selectedShift = selectedDates.find(d => d.date === dateStr)?.shift
      
      days.push({
        date: dateStr,
        day: i,
        isSelected,
        selectedShift
      })
    }
    
    return days
  }

  const changeMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1))
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const days = getDaysInMonth(currentMonth)

  // Calculate total slots (each full day with 'both' shift counts as 2 slots)
  const totalSlots = selectedDates.reduce((total, date) => {
    if (date.shift === 'both') return total + 2
    return total + 1
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auto Assign Duties</h1>
        <p className="text-gray-500 mt-1">Select dates and shifts to automatically assign duties using fair distribution algorithm</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Configuration */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="space-y-4">
            {/* Duty Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duty Type</label>
              <select 
                value={dutyType} 
                onChange={(e) => setDutyType(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {dutyTypes.map(t => (
                  <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Class/Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class/Event Name (Optional)
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., Annual Sports Day, Final Exams"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Used for notifications and reporting</p>
            </div>

            {/* Shift Selection for New Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Shift for New Dates</label>
              <select 
                value={selectedShift} 
                onChange={(e) => setSelectedShift(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {shiftOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Excluded Staff Selection with Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exclude Staff Members</label>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search staff by name, code or role..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowStaffDropdown(true)
                    }}
                    onFocus={() => setShowStaffDropdown(true)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                    className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    {showStaffDropdown ? '▲' : '▼'}
                  </button>
                </div>
                
                {/* Dropdown List */}
                {showStaffDropdown && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStaff.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500 text-sm">No staff found</div>
                    ) : (
                      filteredStaff.map(staff => (
                        <button
                          key={staff._id}
                          onClick={() => addExcludedStaff(staff._id, staff.name)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium text-gray-900">{staff.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({staff.staffCode || staff.role})</span>
                          </div>
                          <span className="text-xs text-green-600">Add</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected Excluded Staff List */}
              {excludedStaffIds.length > 0 && (
                <div className="mt-3">
                  <label className="text-xs text-gray-500 mb-1 block">Excluded Staff ({excludedStaffIds.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {excludedStaffIds.map(staffId => (
                      <span
                        key={staffId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-sm"
                      >
                        {getStaffName(staffId)}
                        <button
                          onClick={() => removeExcludedStaff(staffId)}
                          className="hover:text-red-800 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                These staff members will be excluded from duty assignment
              </p>
            </div>

            {/* Calendar for Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Dates & Shifts</label>
              
              {/* Info Banner */}
              <div className="mb-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                💡 Tip: Click on a date to add with default shift. Click the shift badge to change it.
              </div>
              
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ◀
                </button>
                <span className="font-semibold text-gray-800">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ▶
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day ? (
                      <button
                        onClick={() => {
                          if (day.isSelected) {
                            removeDate(day.date)
                          } else {
                            setSelectedDates([...selectedDates, { date: day.date, shift: selectedShift }])
                          }
                        }}
                        className={`w-full h-full rounded-lg text-sm font-medium transition-all relative ${
                          day.isSelected
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <span className={day.isSelected ? 'text-primary-700' : 'text-gray-700'}>
                          {day.day}
                        </span>
                        {day.isSelected && day.selectedShift && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-500"></span>
                        )}
                      </button>
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Dates List with Shift Controls */}
              {selectedDates.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Selected Dates ({selectedDates.length}) - Total Slots: {totalSlots}
                    </label>
                    <button
                      onClick={clearAllDates}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedDates.map((dateObj) => (
                      <div
                        key={dateObj.date}
                        className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(dateObj.date).toLocaleDateString()}
                        </span>
                        <select
                          value={dateObj.shift}
                          onChange={(e) => updateDateShift(dateObj, e.target.value)}
                          className={`px-2 py-1 text-xs rounded-lg border focus:outline-none ${shiftColors[dateObj.shift] || 'bg-gray-100'}`}
                        >
                          {shiftOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label.split(' ')[0]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeDate(dateObj.date)}
                          className="text-red-500 hover:text-red-700 text-lg font-bold px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSubmit} 
              disabled={isLoading || selectedDates.length === 0} 
              className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mt-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Assigning Duties...</span>
                </div>
              ) : (
                `Assign ${totalSlots} Slot${totalSlots !== 1 ? 's' : ''} on ${selectedDates.length} Date${selectedDates.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Assignment Result</h2>
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{result.statistics?.totalDuties || 0}</p>
                  <p className="text-xs text-gray-600">Duties Assigned</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{result.statistics?.totalSlots || 0}</p>
                  <p className="text-xs text-gray-600">Total Slots</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">{result.statistics?.dutiesPerStaff?.fairness || 0}</p>
                  <p className="text-xs text-gray-600">Fairness Score</p>
                </div>
              </div>

              {/* Summary Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-4 text-center text-sm">
                  <div>
                    <p className="text-gray-500">Staff</p>
                    <p className="font-semibold">{result.statistics?.totalStaff || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dates</p>
                    <p className="font-semibold">{result.statistics?.totalSlots || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Excluded</p>
                    <p className="font-semibold">{excludedStaffIds.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Perfect Balance</p>
                    <p className="font-semibold">{result.statistics?.perfectBalance ? '✓ Yes' : '✗ No'}</p>
                  </div>
                </div>
              </div>

              {/* Staff Distribution with Existing vs New */}
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <span>Staff Distribution</span>
                  <span className="text-xs text-gray-500">
                    (Min: {result.statistics?.dutiesPerStaff?.min} | 
                    Max: {result.statistics?.dutiesPerStaff?.max} | 
                    Avg: {result.statistics?.dutiesPerStaff?.avg})
                  </span>
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {Object.entries(result.statistics?.staffDistribution || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([staffId, totalCount]) => {
                      const staff = staffList.find(s => s._id === staffId)
                      const isExcluded = excludedStaffIds.includes(staffId)
                      const existingLoad = result.statistics?.existingLoad?.[staffId] || 0
                      const newAssignments = result.statistics?.newAssignments?.[staffId] || 0
                      const percentage = (totalCount / result.statistics?.totalDuties) * 100
                      
                      return (
                        <div key={staffId} className={`space-y-1 ${isExcluded ? 'opacity-50' : ''}`}>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-700">
                              {staff?.name || staffId}
                              {isExcluded && <span className="ml-2 text-xs text-red-500">(Excluded)</span>}
                            </span>
                            <div className="flex gap-2 text-xs">
                              <span className="text-gray-500">Existing: {existingLoad}</span>
                              <span className="text-green-600">New: +{newAssignments}</span>
                              <span className="text-primary-600 font-semibold">Total: {totalCount}</span>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-l-full transition-all duration-500 absolute left-0 top-0"
                                style={{ width: `${(existingLoad / (existingLoad + newAssignments || 1)) * percentage}%` }}
                              />
                              <div 
                                className="bg-primary-500 h-2 rounded-r-full transition-all duration-500 absolute"
                                style={{ 
                                  left: `${(existingLoad / (existingLoad + newAssignments || 1)) * percentage}%`,
                                  width: `${(newAssignments / (existingLoad + newAssignments || 1)) * percentage}%`
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end text-xs text-gray-400">
                            <span className="mr-2">📋 Existing</span>
                            <span>✨ New</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Assignments by Date */}
              {result.assignmentsByDate && Object.keys(result.assignmentsByDate).length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Assignments by Date</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(result.assignmentsByDate).map(([date, shifts]) => (
                      <div key={date} className="border rounded-lg p-2">
                        <div className="font-semibold text-sm text-gray-700 mb-1">
                          {new Date(date).toLocaleDateString()}
                        </div>
                        <div className="space-y-1">
                          {Object.entries(shifts).map(([shift, assignment]) => (
                            <div key={shift} className="flex items-center justify-between text-xs">
                              <span className={`px-2 py-0.5 rounded-full ${shiftColors[shift]}`}>
                                {shift}
                              </span>
                              <span className="text-gray-600">{assignment.staffName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t">
                <button
                  onClick={clearAllDates}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear & Start Over
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Dismiss Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State for Results */}
        {!result && (
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Assignment Yet</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Select dates, choose shifts, and click "Assign Duties" to automatically distribute duties among staff members
            </p>
            {excludedStaffIds.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {excludedStaffIds.length} staff member(s) excluded from assignment
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AutoAssignDuty