// src/pages/staff/MyDutiesPage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BellIcon,
  ArrowPathIcon,
  EyeIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { fetchDuties, updateDuty } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import {ConfirmModal} from '../../components/common/Modal.jsx'
import toast from 'react-hot-toast'

const MyDutiesPage = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { staff } = useSelector((state) => state.staff)
  const { duties, isLoading } = useSelector((state) => state.duties)
  
  const [myDuties, setMyDuties] = useState([])
  const [upcomingDuties, setUpcomingDuties] = useState([])
  const [pastDuties, setPastDuties] = useState([])
  const [selectedDuty, setSelectedDuty] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isLoadingDuties, setIsLoadingDuties] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [dutyToConfirm, setDutyToConfirm] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // 'confirm' or 'cancel'

  useEffect(() => {
    loadStaffData()
  }, [dispatch])

  useEffect(() => {
    if (staff.length > 0 && user) {
      loadMyDuties()
    }
  }, [staff, user])

  useEffect(() => {
    if (duties.length > 0) {
      processDuties()
    }
  }, [duties])

  const loadStaffData = async () => {
    try {
      await dispatch(fetchStaff({ limit: 100 }))
    } catch (error) {
      console.error('Failed to load staff:', error)
    }
  }

  const loadMyDuties = async () => {
    // Find current staff member
    const currentStaff = staff.find(s => s.userId?._id === user?.id || s.userId === user?.id)
    
    if (!currentStaff) {
      console.log('No staff record found for user:', user?.id)
      return
    }
    
    setIsLoadingDuties(true)
    try {
      // Fetch duties for this staff member using fetchDuties with staffId filter
      await dispatch(fetchDuties({ staffId: currentStaff._id, limit: 100 }))
    } catch (error) {
      console.error('Failed to load duties:', error)
      toast.error('Failed to load duties')
    } finally {
      setIsLoadingDuties(false)
    }
  }

  const processDuties = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const upcoming = []
    const past = []
    
    duties.forEach(duty => {
      if (duty.duties && duty.duties.length > 0) {
        duty.duties.forEach(singleDuty => {
          const dutyDate = new Date(singleDuty.date)
          const dutyItem = {
            ...duty,
            singleDuty: singleDuty,
            date: dutyDate,
            shift: singleDuty.shift,
            location: duty.location,
            status: duty.status,
            dutyType: duty.dutyType,
            className: duty.className || duty.location,
            dutyId: duty._id
          }
          
          if (dutyDate >= today) {
            upcoming.push(dutyItem)
          } else {
            past.push(dutyItem)
          }
        })
      }
    })
    
    // Sort upcoming by date (nearest first)
    upcoming.sort((a, b) => a.date - b.date)
    // Sort past by date (most recent first)
    past.sort((a, b) => b.date - a.date)
    
    setMyDuties(duties)
    setUpcomingDuties(upcoming)
    setPastDuties(past)
  }

  const handleConfirmDuty = async (dutyItem, action) => {
    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled'
    setDutyToConfirm(dutyItem)
    setConfirmAction(action)
    setShowConfirmModal(true)
  }

  const handleConfirmAction = async () => {
    if (!dutyToConfirm) return
    
    const newStatus = confirmAction === 'confirm' ? 'confirmed' : 'cancelled'
    
    try {
      await dispatch(updateDuty({ 
        id: dutyToConfirm.dutyId, 
        data: { status: newStatus } 
      })).unwrap()
      
      toast.success(`Duty ${newStatus === 'confirmed' ? 'confirmed' : 'cancelled'} successfully`)
      setShowConfirmModal(false)
      setDutyToConfirm(null)
      setConfirmAction(null)
      loadMyDuties() // Reload duties
    } catch (error) {
      console.error('Failed to update duty:', error)
      toast.error('Failed to update duty status')
    }
  }

  const getShiftDetails = (shift) => {
    const shifts = {
      morning: { label: 'Morning Shift', time: '9:00 AM - 12:00 PM', icon: '🌅' },
      afternoon: { label: 'Afternoon Shift', time: '2:00 PM - 5:00 PM', icon: '🌙' },
      full: { label: 'Full Day', time: '9:00 AM - 5:00 PM', icon: '📅' }
    }
    return shifts[shift] || { label: shift, time: 'TBD', icon: '📌' }
  }

  const getDutyTypeIcon = (type) => {
    const icons = {
      exam: '📝',
      invigilation: '👁️',
      supervision: '👨‍🏫',
      hall_monitor: '🏛️',
      security: '🛡️',
      sports: '⚽',
      arts: '🎨',
      workshop: '🔧'
    }
    return icons[type] || '📌'
  }

  const getStatusBadge = (status) => {
    const config = {
      assigned: { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    }
    const { color, label } = config[status] || config.assigned
    return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{label}</span>
  }

  const getFilteredDuties = () => {
    switch(filter) {
      case 'upcoming':
        return upcomingDuties
      case 'past':
        return pastDuties
      default:
        return [...upcomingDuties, ...pastDuties]
    }
  }

  if (isLoading || isLoadingDuties) {
    return <LoadingSpinner />
  }

  const filteredDuties = getFilteredDuties()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-xl p-3">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Duties</h1>
                <p className="text-primary-100 mt-1">
                  View and confirm your assigned duties
                </p>
              </div>
            </div>
            <button
              onClick={loadMyDuties}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Duties</p>
                <p className="text-2xl font-bold text-gray-900">{myDuties.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-green-600">{upcomingDuties.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-600">{pastDuties.length}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Duty Types</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(myDuties.map(d => d.dutyType)).size}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BellIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Duties ({upcomingDuties.length + pastDuties.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'upcoming' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming ({upcomingDuties.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'past' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed ({pastDuties.length})
          </button>
        </div>

        {/* Duties List */}
        {filteredDuties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Duties Found
            </h3>
            <p className="text-gray-500">
              {filter === 'upcoming' 
                ? "You don't have any upcoming duties. Enjoy your break!" 
                : filter === 'past'
                ? "No completed duties found"
                : "You haven't been assigned any duties yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDuties.map((duty, index) => {
              const shiftDetails = getShiftDetails(duty.shift)
              const dutyDate = new Date(duty.date)
              const isToday = dutyDate.toDateString() === new Date().toDateString()
              const isTomorrow = dutyDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
              const canConfirm = duty.status === 'assigned'
              
              let dateLabel = dutyDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              if (isToday) dateLabel = `Today, ${dateLabel}`
              if (isTomorrow) dateLabel = `Tomorrow, ${dateLabel}`
              
              return (
                <div
                  key={`${duty.dutyId}-${index}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Duty Icon */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          {getDutyTypeIcon(duty.dutyType)}
                        </div>
                        
                        {/* Duty Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {duty.dutyType?.replace(/_/g, ' ').toUpperCase()}
                            </h3>
                            {getStatusBadge(duty.status)}
                            {isToday && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse">
                                Today
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span>{dateLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <ClockIcon className="w-4 h-4 text-gray-400" />
                              <span>{shiftDetails.time}</span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                {shiftDetails.label}
                              </span>
                            </div>
                            {duty.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPinIcon className="w-4 h-4 text-gray-400" />
                                <span>{duty.location}</span>
                              </div>
                            )}
                            {duty.className && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                                <span>{duty.className}</span>
                              </div>
                            )}
                          </div>
                          
                          {duty.remarks && (
                            <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                              📝 Note: {duty.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {canConfirm && (
                          <>
                            <button
                              onClick={() => handleConfirmDuty(duty, 'confirm')}
                              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
                              title="Confirm Duty"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Confirm</span>
                            </button>
                            <button
                              onClick={() => handleConfirmDuty(duty, 'cancel')}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
                              title="Cancel Duty"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedDuty(duty)}
                          className="px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span className="text-sm">Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Duty Details Modal */}
      {selectedDuty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Duty Details</h2>
              <button
                onClick={() => setSelectedDuty(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-3xl">
                  {getDutyTypeIcon(selectedDuty.dutyType)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {selectedDuty.dutyType?.replace(/_/g, ' ').toUpperCase()}
                  </h3>
                  {getStatusBadge(selectedDuty.status)}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Date & Time</p>
                    <p className="text-gray-600">
                      {new Date(selectedDuty.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {getShiftDetails(selectedDuty.shift).label}: {getShiftDetails(selectedDuty.shift).time}
                    </p>
                  </div>
                </div>
                
                {selectedDuty.location && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Location</p>
                      <p className="text-gray-600">{selectedDuty.location}</p>
                    </div>
                  </div>
                )}
                
                {selectedDuty.className && (
                  <div className="flex items-start gap-3">
                    <AcademicCapIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Event/Class</p>
                      <p className="text-gray-600">{selectedDuty.className}</p>
                    </div>
                  </div>
                )}
                
                {selectedDuty.assignedBy && (
                  <div className="flex items-start gap-3">
                    <UserGroupIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Assigned By</p>
                      <p className="text-gray-600">{selectedDuty.assignedBy?.name || 'Administrator'}</p>
                    </div>
                  </div>
                )}
                
                {selectedDuty.remarks && (
                  <div className="flex items-start gap-3">
                    <BellIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Additional Notes</p>
                      <p className="text-gray-600">{selectedDuty.remarks}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              {selectedDuty.status === 'assigned' && (
                <>
                  <button
                    onClick={() => {
                      handleConfirmDuty(selectedDuty, 'confirm')
                      setSelectedDuty(null)
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Confirm Duty</span>
                  </button>
                  <button
                    onClick={() => {
                      handleConfirmDuty(selectedDuty, 'cancel')
                      setSelectedDuty(null)
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    <span>Cancel Duty</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedDuty(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm/Cancel Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setDutyToConfirm(null)
          setConfirmAction(null)
        }}
        onConfirm={handleConfirmAction}
        title={confirmAction === 'confirm' ? 'Confirm Duty' : 'Cancel Duty'}
        message={
          confirmAction === 'confirm'
            ? `Are you sure you want to confirm this duty? Once confirmed, you are committed to performing this duty.`
            : `Are you sure you want to cancel this duty? This action cannot be undone.`
        }
        confirmText={confirmAction === 'confirm' ? 'Confirm' : 'Cancel Duty'}
        confirmVariant={confirmAction === 'confirm' ? 'primary' : 'danger'}
      />
    </div>
  )
}

export default MyDutiesPage