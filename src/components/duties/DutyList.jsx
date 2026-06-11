// src/components/duties/DutyList.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDuties, deleteDuty, updateDuty } from '../../store/slices/dutySlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import pdfService, { downloadPDF } from '../../services/pdfService'
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
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
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
  const [showFilters, setShowFilters] = useState(false)
  const [expandedGroupKey, setExpandedGroupKey] = useState(null)
  const [groupPage, setGroupPage] = useState(1)
  const groupsPerPage = 10

  useEffect(() => {
    dispatch(fetchStaff({ limit: 100 }))
    loadDuties()
  }, [dispatch])

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' });
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (filterStaff) params.staffId = filterStaff;
      if (filterType) params.dutyType = filterType;
      
      const blob = await pdfService.downloadStaffDutyPDF(params);
      downloadPDF(blob, `Staff_Duty_List_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully', { id: 'pdf-gen' });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF report', { id: 'pdf-gen' });
    }
  };

  const handleDownloadGroupPDF = async (group) => {
    try {
      toast.loading('Generating PDF for this batch...', { id: 'pdf-gen' });
      const params = {
        startDate: group.startDate.toISOString().split('T')[0],
        endDate: group.endDate.toISOString().split('T')[0],
        dutyType: group.dutyType
      };
      if (group.location && group.location !== 'Standard') {
        params.location = group.location;
      }
      
      const blob = await pdfService.downloadStaffDutyPDF(params);
      downloadPDF(blob, `Staff_Duty_Group_${group.location}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Group PDF downloaded successfully', { id: 'pdf-gen' });
    } catch (error) {
      console.error('Failed to generate group PDF:', error);
      toast.error('Failed to generate group PDF report', { id: 'pdf-gen' });
    }
  };

  const loadDuties = () => {
    const params = { page: 1, limit: 1000 }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (filterStaff) params.staffId = filterStaff
    if (filterType) params.dutyType = filterType
    dispatch(fetchDuties(params))
  }

  useEffect(() => {
    loadDuties()
  }, [startDate, endDate, filterStaff, filterType])

  useEffect(() => {
    setGroupPage(1)
  }, [startDate, endDate, filterStaff, filterType, searchTerm])

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
    if (!staffId) return 'Unknown'
    if (typeof staffId === 'object') {
      if (staffId.name) return staffId.name
      if (staffId._id) staffId = staffId._id
    }
    const s = staff.find(s => s._id === staffId)
    return s?.name || 'Unknown'
  }

  const getStaffShortName = (staffId) => {
    if (!staffId) return 'U'
    if (typeof staffId === 'object') {
      if (staffId.name) return staffId.name.split(' ')[0]
      if (staffId._id) staffId = staffId._id
    }
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
    return <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${color}`}>{label}</span>
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

  const filteredDuties = useMemo(() => {
    return duties.filter(duty => {
      if (!searchTerm) return true
      const staffName = (duty.staffName || getStaffName(duty.staffId)).toLowerCase()
      const dutyType = getDutyTypeName(duty.dutyType).toLowerCase()
      const locationName = (duty.location || '').toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      return staffName.includes(searchLower) || dutyType.includes(searchLower) || locationName.includes(searchLower)
    })
  }, [duties, searchTerm, staff])

  const groups = useMemo(() => {
    const map = {}
    filteredDuties.forEach(duty => {
      if (!duty.duties || duty.duties.length === 0) return
      
      const dates = duty.duties.map(d => new Date(d.date).getTime())
      const docMinDate = new Date(Math.min(...dates))
      const docMaxDate = new Date(Math.max(...dates))
      
      const createdTime = new Date(duty.createdAt || duty.assignedAt || Date.now())
      // Round to nearest minute to group batch assignments together
      const roundedTimeStr = new Date(Math.round(createdTime.getTime() / (60 * 1000)) * (60 * 1000)).toISOString()
      
      const groupLocation = duty.location || 'Standard'
      const type = duty.dutyType
      
      const key = `${groupLocation}_${type}_${roundedTimeStr}`
      
      if (!map[key]) {
        map[key] = {
          key,
          location: groupLocation,
          dutyType: type,
          startDate: docMinDate,
          endDate: docMaxDate,
          staffList: [],
          rooms: new Set(),
          statusList: new Set()
        }
      } else {
        if (docMinDate < map[key].startDate) map[key].startDate = docMinDate
        if (docMaxDate > map[key].endDate) map[key].endDate = docMaxDate
      }
      
      map[key].staffList.push(duty)
      
      duty.duties.forEach(d => {
        if (d.room) map[key].rooms.add(d.room)
      })
      
      map[key].statusList.add(duty.status)
    })
    
    return Object.values(map).sort((a, b) => b.startDate - a.startDate)
  }, [filteredDuties])

  const indexOfLastGroup = groupPage * groupsPerPage
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage
  const currentGroups = groups.slice(indexOfFirstGroup, indexOfLastGroup)
  const totalGroupPages = Math.ceil(groups.length / groupsPerPage)

  const dutyTypes = ['exam', 'invigilation', 'supervision', 'hall_monitor', 'security', 'sports', 'arts', 'workshop']
  const hasActiveFilters = startDate || endDate || filterStaff || filterType

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setFilterStaff('')
    setFilterType('')
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
        >
          <ClipboardDocumentListIcon className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
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
          placeholder="Search by staff name, location, or duty type..."
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
        <p className="text-xs text-gray-500">Total: {groups.length} duty batches ({filteredDuties.length} assignments)</p>
      </div>

      {/* Grouped Duties Table */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">No duties found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Duty Type</th>
                  <th className="px-6 py-3">Date Range</th>
                  <th className="px-6 py-3 text-center">Staff Count</th>
                  <th className="px-6 py-3 text-center">Rooms</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentGroups.map((group) => {
                  const isExpanded = expandedGroupKey === group.key
                  
                  let statusLabel = 'Mixed'
                  let statusColor = 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'
                  if (group.statusList.size === 1) {
                    const status = Array.from(group.statusList)[0]
                    const statusConfigs = {
                      assigned: { color: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20', label: 'Assigned' },
                      confirmed: { color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20', label: 'Confirmed' },
                      completed: { color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20', label: 'Completed' },
                      cancelled: { color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20', label: 'Cancelled' }
                    }
                    const config = statusConfigs[status] || statusConfigs.assigned
                    statusLabel = config.label
                    statusColor = config.color
                  }
                  
                  return (
                    <React.Fragment key={group.key}>
                      <tr 
                        onClick={() => setExpandedGroupKey(isExpanded ? null : group.key)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{group.location}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                          {getDutyTypeName(group.dutyType)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-gray-800">
                          {group.staffList.length}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-600">
                          {group.rooms.size > 0 ? (
                            <span className="font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-xs">
                              {group.rooms.size}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button 
                            className="text-emerald-600 hover:text-emerald-700 font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedGroupKey(isExpanded ? null : group.key);
                            }}
                          >
                            {isExpanded ? 'Collapse' : 'View Staff'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-4">
                              {/* Group Info header */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-gray-150">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    Staff Assignment Details
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {group.staffList.length} staff members assigned across {group.rooms.size} rooms
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDownloadGroupPDF(group)}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm self-start sm:self-auto"
                                >
                                  <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                                  <span>Download PDF for this Batch</span>
                                </button>
                              </div>

                              {/* Staff Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.staffList.map((duty) => {
                                  const sName = duty.staffName || getStaffName(duty.staffId);
                                  return (
                                    <div key={duty._id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 relative hover:shadow-sm transition-all">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                                            {getStaffShortName(duty.staffId)}
                                          </div>
                                          <div>
                                            <h5 className="text-sm font-semibold text-gray-900">{sName}</h5>
                                            <p className="text-[10px] text-gray-400 capitalize">{duty.dutyType.replace('_', ' ')}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          {getStatusBadge(duty.status)}
                                          <button 
                                            onClick={() => { setSelectedDutyDetails(duty); setShowDetailsModal(true); }}
                                            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                                            title="View Details"
                                          >
                                            <EyeIcon className="w-4 h-4" />
                                          </button>
                                          {duty.status === 'assigned' && (
                                            <>
                                              <button 
                                                onClick={() => handleUpdateStatus(duty._id, 'confirmed')}
                                                className="p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-gray-100"
                                                title="Confirm"
                                              >
                                                <CheckCircleIcon className="w-4 h-4" />
                                              </button>
                                              <button 
                                                onClick={() => handleUpdateStatus(duty._id, 'cancelled')}
                                                className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-gray-100"
                                                title="Cancel"
                                              >
                                                <XCircleIcon className="w-4 h-4" />
                                              </button>
                                            </>
                                          )}
                                          <button 
                                            onClick={() => { setSelectedDuty(duty); setShowDeleteModal(true); }}
                                            className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-gray-100"
                                            title="Delete"
                                          >
                                            <TrashIcon className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 text-xs border border-gray-100">
                                        {duty.duties?.map((d, idx) => (
                                          <div key={idx} className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-600">
                                            <span className="font-medium">
                                              📅 {new Date(d.date).toLocaleDateString()}
                                            </span>
                                            <div className="flex gap-1">
                                              <span className="capitalize bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                                ⏱️ {d.shift}
                                              </span>
                                              {d.room && (
                                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                                  🚪 {d.room}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalGroupPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setGroupPage(p => Math.max(1, p - 1))} disabled={groupPage === 1} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {groupPage} of {totalGroupPages}</span>
          <button onClick={() => setGroupPage(p => Math.min(totalGroupPages, p + 1))} disabled={groupPage === totalGroupPages} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50">
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
              <div><label className="text-xs text-gray-500">Staff Member</label><p className="text-sm font-medium text-gray-900">{selectedDutyDetails.staffName || getStaffName(selectedDutyDetails.staffId)}</p></div>
              <div><label className="text-xs text-gray-500">Duty Type</label><p className="text-sm font-medium text-gray-900 capitalize">{selectedDutyDetails.dutyType}</p></div>
              <div>
                <label className="text-xs text-gray-500">Dates & Shifts</label>
                <div className="mt-1 space-y-1.5">
                  {selectedDutyDetails.duties?.map((d, idx) => (
                    <p key={idx} className="text-sm text-gray-600 flex flex-wrap items-center gap-1.5">
                      <span>• {new Date(d.date).toLocaleDateString()}</span>
                      <span className="capitalize">({d.shift})</span>
                      {d.room && <span className="font-semibold text-emerald-600">({d.room})</span>}
                      <span className="text-xs text-gray-400">({d.duration} hrs)</span>
                    </p>
                  ))}
                </div>
              </div>
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
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete the duty for <span className="font-medium">{selectedDuty?.staffName || getStaffName(selectedDuty?.staffId)}</span>?</p>
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