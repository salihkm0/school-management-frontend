import api from './api'

const dutyService = {
  getDuties: async (params = {}) => {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/staff-duty?${queryParams}`)
    return response.data
  },

  getDutyById: async (id) => {
    const response = await api.get(`/staff-duty/${id}`)
    return response.data
  },

  autoAssignDuties: async (dates, dutyType, excludedStaffIds = [], algorithm = 'priority', className = 'School') => {
    const response = await api.post('/staff-duty/auto-assign', {
      dates,
      dutyType,
      excludedStaffIds,
      algorithm,
      className
    })
    return response.data
  },

  multiTypeAssign: async (dutyRequirements, excludedStaffIds = []) => {
    const response = await api.post('/staff-duty/multi-type-assign', {
      dutyRequirements,
      excludedStaffIds
    })
    return response.data
  },

  assignManualDuty: async (dutyData) => {
    const response = await api.post('/staff-duty/manual', dutyData)
    return response.data
  },

  updateDuty: async (id, dutyData) => {
    const response = await api.put(`/staff-duty/${id}`, dutyData)
    return response.data
  },

  deleteDuty: async (id) => {
    const response = await api.delete(`/staff-duty/${id}`)
    return response.data
  },

  bulkDeleteDuties: async (dutyIds) => {
    const response = await api.delete('/staff-duty/bulk', { data: { dutyIds } })
    return response.data
  },

  getStaffDutyStats: async (staffId, dutyType, year, month) => {
    const params = new URLSearchParams()
    if (staffId) params.append('staffId', staffId)
    if (dutyType) params.append('dutyType', dutyType)
    if (year) params.append('year', year)
    if (month) params.append('month', month)
    const response = await api.get(`/staff-duty/stats?${params}`)
    return response.data
  },

  getStaffDutyCount: async (staffId, startDate, endDate, dutyType) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (dutyType) params.append('dutyType', dutyType)
    const response = await api.get(`/staff-duty/count/${staffId}?${params}`)
    return response.data
  },

  getStaffDutySummary: async (startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const response = await api.get(`/staff-duty/summary?${params}`)
    return response.data
  },

  getAvailableDates: async (startDate, endDate, excludeWeekends = true, excludeHolidays = true) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    params.append('excludeWeekends', excludeWeekends)
    params.append('excludeHolidays', excludeHolidays)
    const response = await api.get(`/staff-duty/available-dates?${params}`)
    return response.data
  },
}

export default dutyService