import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDuties, deleteDuty, updateDuty } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { 
  TrashIcon, 
  CalendarIcon, 
  UserIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmModal from '../common/Modal'
import toast from 'react-hot-toast'

const DutyList = () => {
  const dispatch = useDispatch()
  const { duties, isLoading } = useSelector((state) => state.duties)
  const { staff } = useSelector((state) => state.staff)
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedDuty, setSelectedDuty] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [filterStaff, setFilterStaff] = useState('')
  const [filterType, setFilterType] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDutyDetails, setSelectedDutyDetails] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    dispatch(fetchStaff({ limit: 100 }))
    loadDuties()
  }, [dispatch])

  const loadDuties = () => {
    const params = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (filterStaff) params.staffId = filterStaff
    if (filterType) params.dutyType = filterType
    dispatch(fetchDuties(params))
  }

  useEffect(() => {
    loadDuties()
  }, [startDate, endDate, filterStaff, filterType])

  const handleDelete = async () => {
    if (selectedDuty) {
      await dispatch(deleteDuty(selectedDuty._id))
      setShowDeleteModal(false)
      setSelectedDuty(null)
      loadDuties()
      toast.success('Duty deleted successfully')
    }
  }

  const handleUpdateStatus = async (dutyId, newStatus) => {
    try {
      await dispatch(updateDuty({ id: dutyId, data: { status: newStatus } })).unwrap()
      toast.success(`Duty marked as ${newStatus}`)
      loadDuties()
    } catch (error) {
      toast.error('Failed to update duty status')
    }
  }

  const getStaffName = (staffId) => {
    const s = staff.find(s => s._id === staffId)
    return s?.name || 'Unknown'
  }

  const getStatusBadge = (status) => {
    const config = {
      assigned: { color: 'bg-blue-100 text-blue-800', icon: '📋', label: 'Assigned' },
      confirmed: { color: 'bg-green-100 text-green-800', icon: '✓', label: 'Confirmed' },
      completed: { color: 'bg-purple-100 text-purple-800', icon: '✅', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Cancelled' }
    }
    const { color, icon, label } = config[status] || config.assigned
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <span className="mr-1">{icon}</span>
        {label}
      </span>
    )
  }

  const getDutyTypeName = (type) => {
    const names = {
      exam: 'Exam Duty',
      invigilation: 'Invigilation',
      supervision: 'Supervision',
      hall_monitor: 'Hall Monitor',
      security: 'Security',
      sports: 'Sports',
      arts: 'Arts',
      workshop: 'Workshop'
    }
    return names[type] || type
  }

  const filteredDuties = duties.filter(duty => {
    if (!searchTerm) return true
    const staffName = getStaffName(duty.staffId).toLowerCase()
    const dutyType = duty.dutyType.toLowerCase()
    return staffName.includes(searchTerm.toLowerCase()) || dutyType.includes(searchTerm.toLowerCase())
  })

  const dutyTypes = ['exam', 'invigilation', 'supervision', 'hall_monitor', 'security', 'sports', 'arts', 'workshop']

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duty Assignments</h1>
          <p className="text-gray-500 mt-1">View and manage all staff duty assignments</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {filteredDuties.length} duties
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Staff Member</label>
            <select 
              value={filterStaff} 
              onChange={(e) => setFilterStaff(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Staff</option>
              {staff.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Duty Type</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              {dutyTypes.map(type => (
                <option key={type} value={type}>{getDutyTypeName(type)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by staff name or duty type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Clear Filters */}
        {(startDate || endDate || filterStaff || filterType) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
                setFilterStaff('')
                setFilterType('')
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Duties List */}
      {filteredDuties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardDocumentListIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No duties found</h3>
          <p className="text-gray-500">Try adjusting your filters or create new duty assignments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDuties.map((duty) => (
            <div key={duty._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{getStaffName(duty.staffId)}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {getDutyTypeName(duty.dutyType)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span>
                          {duty.duties?.map(d => new Date(d.date).toLocaleDateString()).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span>{duty.totalDuties} duties | {duty.totalHours} hours</span>
                      </div>
                      <div>
                        {getStatusBadge(duty.status)}
                      </div>
                    </div>

                    {duty.location && (
                      <p className="text-sm text-gray-500 mt-2">📍 {duty.location}</p>
                    )}
                    {duty.remarks && (
                      <p className="text-sm text-gray-400 mt-1 italic">📝 {duty.remarks}</p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedDutyDetails(duty)
                        setShowDetailsModal(true)
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    {duty.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(duty._id, 'confirmed')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Confirm Duty"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(duty._id, 'cancelled')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Duty"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { 
                        setSelectedDuty(duty)
                        setShowDeleteModal(true)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Duty"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => { setShowDeleteModal(false); setSelectedDuty(null) }} 
        onConfirm={handleDelete} 
        title="Delete Duty Assignment" 
        message={`Are you sure you want to delete the ${getDutyTypeName(selectedDuty?.dutyType)} duty for ${getStaffName(selectedDuty?.staffId)}?`}
        confirmText="Delete" 
        confirmVariant="danger" 
      />

      {/* Details Modal */}
      {showDetailsModal && selectedDutyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b bg-gradient-to-r from-primary-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900">Duty Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Staff Member</label>
                <p className="font-medium text-gray-900">{getStaffName(selectedDutyDetails.staffId)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Duty Type</label>
                <p className="font-medium text-gray-900 capitalize">{selectedDutyDetails.dutyType}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Dates</label>
                <div className="space-y-1 mt-1">
                  {selectedDutyDetails.duties?.map((d, idx) => (
                    <p key={idx} className="text-sm text-gray-600">
                      {new Date(d.date).toLocaleDateString()} - {d.shift} shift ({d.duration} hours)
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <div className="mt-1">{getStatusBadge(selectedDutyDetails.status)}</div>
              </div>
              {selectedDutyDetails.location && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Location</label>
                  <p className="text-sm text-gray-600">{selectedDutyDetails.location}</p>
                </div>
              )}
              {selectedDutyDetails.remarks && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Remarks</label>
                  <p className="text-sm text-gray-600">{selectedDutyDetails.remarks}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Total Duties</label>
                  <p className="text-lg font-bold text-primary-600">{selectedDutyDetails.totalDuties}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Total Hours</label>
                  <p className="text-lg font-bold text-primary-600">{selectedDutyDetails.totalHours}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DutyList