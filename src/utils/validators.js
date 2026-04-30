export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/
  return re.test(phone)
}

export const validatePassword = (password) => {
  return password && password.length >= 6
}

export const validateName = (name) => {
  return name && name.trim().length >= 2
}

export const validateStudentCode = (code) => {
  return code && code.trim().length >= 3
}

export const validateAdmissionNo = (admissionNo) => {
  return admissionNo && admissionNo.trim().length >= 1
}

export const validateDateOfBirth = (dob) => {
  if (!dob) return true
  const date = new Date(dob)
  const today = new Date()
  const age = today.getFullYear() - date.getFullYear()
  return date instanceof Date && !isNaN(date) && age >= 3 && age <= 20
}

export const validateMarks = (marks, maxMarks) => {
  const num = Number(marks)
  return !isNaN(num) && num >= 0 && num <= maxMarks
}

export const validatePercentage = (percentage) => {
  const num = Number(percentage)
  return !isNaN(num) && num >= 0 && num <= 100
}

export const validateGrade = (grade) => {
  const validGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  return validGrades.includes(grade)
}

export const validateClassId = (id) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/
  return mongoIdRegex.test(id)
}

export const validateAcademicYearId = (id) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/
  return mongoIdRegex.test(id)
}

export const validateSubjectId = (id) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/
  return mongoIdRegex.test(id)
}

export const validateStaffId = (id) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/
  return mongoIdRegex.test(id)
}

export const validateExamId = (id) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/
  return mongoIdRegex.test(id)
}

export const validateDate = (date) => {
  if (!date) return true
  const d = new Date(date)
  return d instanceof Date && !isNaN(d)
}

export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true
  return new Date(startDate) <= new Date(endDate)
}

export const validateYear = (year) => {
  const num = Number(year)
  return !isNaN(num) && num >= 2000 && num <= 2100
}

export const validateMonth = (month) => {
  const num = Number(month)
  return !isNaN(num) && num >= 1 && num <= 12
}

export const validateDutyType = (dutyType) => {
  const validTypes = ['exam', 'invigilation', 'supervision', 'hall_monitor', 'security', 'sports', 'arts', 'workshop', 'event', 'meeting', 'training', 'other']
  return validTypes.includes(dutyType)
}

export const validateRole = (role) => {
  const validRoles = ['admin', 'staff', 'parent']
  return validRoles.includes(role)
}

export const validateStaffRole = (role) => {
  const validRoles = ['teacher', 'principal', 'vice_principal', 'librarian', 'administrator', 'office_staff', 'support_staff']
  return validRoles.includes(role)
}

export const validateGender = (gender) => {
  const validGenders = ['M', 'F', 'Other']
  return validGenders.includes(gender)
}

export const validateCategory = (category) => {
  const validCategories = ['General', 'OBC', 'SC', 'ST']
  return validCategories.includes(category)
}

export const validateBloodGroup = (bloodGroup) => {
  const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  return validGroups.includes(bloodGroup)
}

export const validateIfscCode = (ifsc) => {
  const re = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return re.test(ifsc)
}

export const validatePincode = (pincode) => {
  const re = /^[1-9][0-9]{5}$/
  return re.test(pincode)
}