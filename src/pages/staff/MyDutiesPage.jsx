// src/pages/staff/MyDutiesPage.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  Bell,
  RefreshCw,
  Eye,
  XCircle,
  X,
  Briefcase
} from 'lucide-react'
import { fetchDuties, updateDuty } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import { ConfirmModal } from '../../components/common/Modal.jsx'
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
      await dispatch(fetchStaff({ limit: 1000 }))
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
      assigned: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Assigned' },
      confirmed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Confirmed' },
      completed: { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Completed' },
      cancelled: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled' }
    }
    const { color, label } = config[status] || config.assigned
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${color}`}>{label}</span>
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
    return (
      <div className="py-12">
        <LoadingSpinner />
      </div>
    )
  }

  const filteredDuties = getFilteredDuties()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 rounded-xl p-2.5">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">My Duties</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">View and confirm your assigned duties</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadMyDuties}
                className="p-1.5 sm:p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Duties</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{myDuties.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{upcomingDuties.length}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{pastDuties.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Duty Types</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {new Set(myDuties.map(d => d.dutyType)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-6 inline-flex flex-wrap gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Duties ({upcomingDuties.length + pastDuties.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'upcoming' 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Upcoming ({upcomingDuties.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'past' 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Completed ({pastDuties.length})
          </button>
        </div>

        {/* Duties List */}
        {filteredDuties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Duties Found
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              {filter === 'upcoming' 
                ? "You don't have any upcoming duties. Enjoy your break!" 
                : filter === 'past'
                ? "No completed duties found."
                : "You haven't been assigned any duties yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDuties.map((duty, index) => {
              const shiftDetails = getShiftDetails(duty.shift)
              const dutyDate = new Date(duty.date)
              const isToday = dutyDate.toDateString() === new Date().toDateString()
              const isTomorrow = dutyDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
              const canConfirm = duty.status === 'assigned'
              
              let dateLabel = dutyDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
              if (isToday) dateLabel = `Today, ${dateLabel}`
              if (isTomorrow) dateLabel = `Tomorrow, ${dateLabel}`
              
              return (
                <div
                  key={`${duty.dutyId}-${index}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Duty Icon */}
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-gray-100 shadow-sm">
                          {getDutyTypeIcon(duty.dutyType)}
                        </div>
                        
                        {/* Duty Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-gray-900 text-base">
                              {duty.dutyType?.replace(/_/g, ' ').toUpperCase()}
                            </h3>
                            {getStatusBadge(duty.status)}
                            {isToday && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded-md border border-red-100 animate-pulse">
                                Today
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{dateLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{shiftDetails.time}</span>
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                {shiftDetails.label}
                              </span>
                            </div>
                            {duty.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{duty.location}</span>
                              </div>
                            )}
                            {duty.className && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BookOpen className="w-4 h-4 text-gray-400" />
                                <span>{duty.className}</span>
                              </div>
                            )}
                          </div>
                          
                          {duty.remarks && (
                            <div className="mt-3 text-sm text-gray-600 bg-amber-50/50 border border-amber-100/50 p-2.5 rounded-lg flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>{duty.remarks}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                        {canConfirm && (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleConfirmDuty(duty, 'confirm')}
                              className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                              title="Confirm Duty"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Confirm</span>
                            </button>
                            <button
                              onClick={() => handleConfirmDuty(duty, 'cancel')}
                              className="flex-1 sm:flex-none px-3 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                              title="Cancel Duty"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="sm:hidden lg:inline">Cancel</span>
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedDuty(duty)}
                          className="flex-1 sm:flex-none px-3 py-2 text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Details</span>
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Duty Details</h2>
              <button
                onClick={() => setSelectedDuty(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-50 border border-gray-100 shadow-sm rounded-xl flex items-center justify-center text-3xl">
                  {getDutyTypeIcon(selectedDuty.dutyType)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {selectedDuty.dutyType?.replace(/_/g, ' ').toUpperCase()}
                  </h3>
                  <div className="mt-1">
                    {getStatusBadge(selectedDuty.status)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Date & Time</p>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {new Date(selectedDuty.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {getShiftDetails(selectedDuty.shift).label}: {getShiftDetails(selectedDuty.shift).time}
                    </p>
                  </div>
                </div>
                
                {selectedDuty.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Location</p>
                      <p className="text-gray-600 text-sm mt-0.5">{selectedDuty.location}</p>
                    </div>
                  </div>
                )}
                
                {selectedDuty.className && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Event/Class</p>
                      <p className="text-gray-600 text-sm mt-0.5">{selectedDuty.className}</p>
                    </div>
                  </div>
                )}
                
                {selectedDuty.assignedBy && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Assigned By</p>
                      <p className="text-gray-600 text-sm mt-0.5">{selectedDuty.assignedBy?.name || 'Administrator'}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedDuty.remarks && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                  <Bell className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 text-sm">Additional Notes</p>
                    <p className="text-amber-700 text-sm mt-0.5">{selectedDuty.remarks}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
              {selectedDuty.status === 'assigned' && (
                <>
                  <button
                    onClick={() => {
                      handleConfirmDuty(selectedDuty, 'confirm')
                      setSelectedDuty(null)
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm</span>
                  </button>
                  <button
                    onClick={() => {
                      handleConfirmDuty(selectedDuty, 'cancel')
                      setSelectedDuty(null)
                    }}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedDuty(null)}
                className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
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