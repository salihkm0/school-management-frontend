import { format, parseISO } from 'date-fns'

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatNumber = (number, decimals = 0) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
}

export const formatPercentage = (value, decimals = 1) => {
  return `${formatNumber(value, decimals)}%`
}

export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2')
  }
  return phone
}

export const formatStudentCode = (code) => {
  if (!code) return ''
  return code.toUpperCase()
}

export const formatRollNumber = (rollNumber) => {
  if (!rollNumber) return ''
  return rollNumber.toString().padStart(3, '0')
}

export const formatExamName = (exam) => {
  if (!exam) return ''
  if (exam.examType === 'custom') return exam.name
  const typeNames = {
    first: 'First Term',
    second: 'Second Term',
    final: 'Final',
    mid: 'Mid Term',
    quarterly: 'Quarterly',
    half_yearly: 'Half Yearly',
    annual: 'Annual',
    unit_test: 'Unit Test',
    class_test: 'Class Test',
    subject_exam: 'Subject Exam',
  }
  return `${typeNames[exam.examType]} Exam - ${exam.academicYear}`
}

export const formatClassName = (classItem) => {
  if (!classItem) return ''
  const baseName = classItem.section ? `${classItem.name}-${classItem.section}` : classItem.name
  if (classItem.academicYearId?.year) {
    return `${baseName} (${classItem.academicYearId.year})`
  }
  return baseName
}

export const formatStaffName = (staff) => {
  if (!staff) return ''
  const rolePrefix = {
    teacher: '',
    principal: 'Principal ',
    vice_principal: 'Vice Principal ',
    librarian: 'Librarian ',
    administrator: 'Admin ',
    office_staff: '',
    support_staff: '',
  }
  return `${rolePrefix[staff.role] || ''}${staff.name}`
}

export const formatAddress = (address) => {
  const parts = []
  if (address.houseName) parts.push(address.houseName)
  if (address.streetName) parts.push(address.streetName)
  if (address.postOffice) parts.push(address.postOffice)
  if (address.city) parts.push(address.city)
  if (address.pincode) parts.push(address.pincode)
  return parts.join(', ')
}

export const formatDuration = (minutes) => {
  if (!minutes) return '0 min'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} hr`
  return `${hours} hr ${mins} min`
}

export const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return ''
  return `${startTime} - ${endTime}`
}

export const formatSessionTime = (session) => {
  const sessions = {
    BF: '9:00 AM - 12:00 PM',
    AF: '2:00 PM - 5:00 PM',
    FULL: '9:00 AM - 5:00 PM',
  }
  return sessions[session] || session
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatRelativeTime = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${years} year${years > 1 ? 's' : ''} ago`
}

export const formatList = (items, conjunction = 'and') => {
  if (!items || items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`
}

export const formatGradeDistribution = (distribution) => {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)
  if (total === 0) return {}
  const result = {}
  for (const [grade, count] of Object.entries(distribution)) {
    result[grade] = (count / total) * 100
  }
  return result
}