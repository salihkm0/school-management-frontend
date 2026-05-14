// src/components/duties/DutyList.jsx
import React, { useEffect, useState, useRef } from 'react'
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
  ClipboardDocumentListIcon,
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const DutyList = () => {
  const dispatch = useDispatch()
  const { duties, isLoading, pagination } = useSelector((state) => state.duties)
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
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    dispatch(fetchStaff({ limit: 100 }))
    loadDuties()
  }, [dispatch])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadDuties = () => {
    const params = { page: currentPage, limit: itemsPerPage }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (filterStaff) params.staffId = filterStaff
    if (filterType) params.dutyType = filterType
    dispatch(fetchDuties(params))
  }

  useEffect(() => {
    loadDuties()
  }, [startDate, endDate, filterStaff, filterType, currentPage])

  const handleDelete = async () => {
    if (selectedDuty) {
      await dispatch(deleteDuty(selectedDuty._id))
      setShowDeleteModal(false)
      setSelectedDuty(null)
      setOpenMenuId(null)
      loadDuties()
      toast.success('Duty deleted successfully')
    }
  }

  const handleUpdateStatus = async (dutyId, newStatus) => {
    try {
      await dispatch(updateDuty({ id: dutyId, data: { status: newStatus } })).unwrap()
      toast.success(`Duty marked as ${newStatus}`)
      loadDuties()
      setOpenMenuId(null)
    } catch (error) {
      toast.error('Failed to update duty status')
    }
  }

  const getStaffName = (staffId) => {
    const s = staff.find(s => s._id === staffId)
    return s?.name || 'Unknown'
  }

  const getStaffShortName = (staffId) => {
    const s = staff.find(s => s._id === staffId)
    return s?.name?.split(' ')[0] || 'U'
  }

  const getStatusBadge = (status) => {
    const config = {
      assigned: { color: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20', label: 'Assigned' },
      confirmed: { color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20', label: 'Confirmed' },
      completed: { color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20', label: 'Completed' },
      cancelled: { color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20', label: 'Cancelled' }
    }
    const { color, label } = config[status] || config.assigned
    return <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${color}`}>{label}</span>
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

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDuties = filteredDuties.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDuties.length / itemsPerPage)

  const dutyTypes = ['exam', 'invigilation', 'supervision', 'hall_monitor', 'security', 'sports', 'arts', 'workshop']
  const hasActiveFilters = startDate || endDate || filterStaff || filterType

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setFilterStaff('')
    setFilterType('')
    setCurrentPage(1)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
            {[startDate, endDate, filterStaff, filterType].filter(Boolean).length}
          </span>}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
            <XMarkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Clear filters</span>
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Staff Member</label>
              <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">All Staff</option>
                {staff.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duty Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">All Types</option>
                {dutyTypes.map(type => (<option key={type} value={type}>{getDutyTypeName(type)}</option>))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by staff name or duty type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">Total: {filteredDuties.length} duties</p>
      </div>

      {/* Duties List */}
      {filteredDuties.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">No duties found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentDuties.map((duty) => (
            <div key={duty._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all">
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{getStaffName(duty.staffId)}</h3>
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                          {getDutyTypeName(duty.dutyType)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="truncate">
                          {duty.duties?.map(d => new Date(d.date).toLocaleDateString()).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span>{duty.totalDuties} duties | {duty.totalHours} hours</span>
                      </div>
                    </div>

                    {duty.location && (
                      <p className="text-sm text-gray-500 mt-2">📍 {duty.location}</p>
                    )}
                  </div>

                  {/* Right Section - Status & Actions */}
                  <div className="flex items-center gap-3">
                    {getStatusBadge(duty.status)}
                    
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-1">
                      <button onClick={() => { setSelectedDutyDetails(duty); setShowDetailsModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="View Details">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {duty.status === 'assigned' && (
                        <>
                          <button onClick={() => handleUpdateStatus(duty._id, 'confirmed')} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors" title="Confirm">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleUpdateStatus(duty._id, 'cancelled')} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="Cancel">
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button onClick={() => { setSelectedDuty(duty); setShowDeleteModal(true); }} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="Delete">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mobile Actions Menu */}
                    <div className="relative sm:hidden" ref={menuRef}>
                      <button onClick={() => setOpenMenuId(openMenuId === duty._id ? null : duty._id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                      {openMenuId === duty._id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button onClick={() => { setSelectedDutyDetails(duty); setShowDetailsModal(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <EyeIcon className="w-4 h-4" /> View
                          </button>
                          {duty.status === 'assigned' && (
                            <>
                              <button onClick={() => { handleUpdateStatus(duty._id, 'confirmed'); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <CheckCircleIcon className="w-4 h-4" /> Confirm
                              </button>
                              <button onClick={() => { handleUpdateStatus(duty._id, 'cancelled'); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                                <XCircleIcon className="w-4 h-4" /> Cancel
                              </button>
                            </>
                          )}
                          <button onClick={() => { setSelectedDuty(duty); setShowDeleteModal(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                            <TrashIcon className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDutyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Duty Details</h3>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="text-xs text-gray-500">Staff Member</label><p className="text-sm font-medium text-gray-900">{getStaffName(selectedDutyDetails.staffId)}</p></div>
              <div><label className="text-xs text-gray-500">Duty Type</label><p className="text-sm font-medium text-gray-900 capitalize">{selectedDutyDetails.dutyType}</p></div>
              <div><label className="text-xs text-gray-500">Dates</label>{selectedDutyDetails.duties?.map((d, idx) => (<p key={idx} className="text-sm text-gray-600">{new Date(d.date).toLocaleDateString()} - {d.shift} shift ({d.duration} hours)</p>))}</div>
              <div><label className="text-xs text-gray-500">Status</label><div className="mt-1">{getStatusBadge(selectedDutyDetails.status)}</div></div>
              {selectedDutyDetails.location && <div><label className="text-xs text-gray-500">Location</label><p className="text-sm text-gray-600">{selectedDutyDetails.location}</p></div>}
              {selectedDutyDetails.remarks && <div><label className="text-xs text-gray-500">Remarks</label><p className="text-sm text-gray-600">{selectedDutyDetails.remarks}</p></div>}
              <div className="grid grid-cols-2 gap-3 pt-2"><div><label className="text-xs text-gray-500">Total Duties</label><p className="text-lg font-bold text-emerald-600">{selectedDutyDetails.totalDuties}</p></div>
              <div><label className="text-xs text-gray-500">Total Hours</label><p className="text-lg font-bold text-emerald-600">{selectedDutyDetails.totalHours}</p></div></div>
            </div>
            <div className="flex justify-end px-5 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center"><TrashIcon className="w-5 h-5 text-rose-600" /></div>
                <div><h3 className="text-base font-semibold text-gray-900">Delete Duty</h3><p className="text-xs text-gray-500">This action cannot be undone</p></div>
              </div>
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete the duty for <span className="font-medium">{getStaffName(selectedDuty?.staffId)}</span>?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DutyList