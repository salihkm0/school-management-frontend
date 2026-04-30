export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    GET_ME: '/auth/me',
  },
  STUDENTS: {
    BASE: '/students',
    IMPORT: '/students/import',
    IMPORT_SAMBOORNA: '/students/import/samboorna',
    PROMOTE: '/students/promote',
    BY_CLASS: '/students/class',
    MARKS: '/students/marks',
  },
  STAFF: {
    BASE: '/staff',
    ASSIGNMENTS: '/staff/assignments',
    TIMETABLE: '/staff/timetable',
    BY_CLASS: '/staff/class',
    PROMOTE: '/staff/promote',
  },
  CLASSES: {
    BASE: '/classes',
    SUBJECT_TEACHERS: '/classes/subject-teachers',
    LANGUAGE_SUBJECTS: '/classes/language-subjects',
    SYNC_LANGUAGE: '/classes/sync-language',
  },
  EXAMS: {
    BASE: '/exams',
    TYPES: '/exams/types',
    SESSION_TIMES: '/exams/session-times',
    SCHEDULE: '/exams/schedule',
    MARKS_SUMMARY: '/exams/marks-summary',
    ANALYTICS: '/exams/analytics',
    CLONE: '/exams/clone',
  },
  MARKS: {
    BASE: '/marks',
    PERMISSIONS: '/marks/permissions',
    ENTER: '/marks/enter',
    SUBMIT: '/marks/submit',
    REVIEW: '/marks/review',
    RESULTS: '/marks/results',
  },
  ATTENDANCE: {
    BASE: '/attendance',
    BULK: '/attendance/bulk',
    SUMMARY: '/attendance/summary',
    BY_STUDENT: '/attendance/student',
    BY_CLASS: '/attendance/class',
  },
  DUTIES: {
    BASE: '/staff-duty',
    AUTO_ASSIGN: '/staff-duty/auto-assign',
    MULTI_TYPE: '/staff-duty/multi-type-assign',
    STATS: '/staff-duty/stats',
    SUMMARY: '/staff-duty/summary',
    AVAILABLE_DATES: '/staff-duty/available-dates',
  },
  PARENTS: {
    BASE: '/parents',
    REGISTER: '/parents/register',
    MY_CHILDREN: '/parents/my-children',
    CONNECT_STUDENT: '/parents/connect-student',
  },
  SUBJECTS: {
    BASE: '/subjects',
    BULK_IMPORT: '/subjects/bulk-import',
    BY_CLASS: '/subjects/class',
    BY_TEACHER: '/subjects/teacher',
    STATS: '/subjects/stats',
    LANGUAGES: '/subjects/languages',
    TEMPLATE: '/subjects/template',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: '/notifications/mark-read',
    MARK_ALL_READ: '/notifications/mark-all-read',
    SEND_TO_USER: '/notifications/user',
    SEND_TO_CLASS: '/notifications/class',
    SEND_TO_ROLE: '/notifications/role',
    SEND_BULK: '/notifications/bulk',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PERFORMANCE: '/analytics/performance',
    ATTENDANCE: '/analytics/attendance',
    GRADE_ANALYSIS: '/analytics/grade-analysis',
    FULL_APLUS: '/analytics/full-aplus',
    NEAR_FULL_APLUS: '/analytics/near-full-aplus',
    TOP_CLASSES: '/analytics/top-classes',
    STUDENT_PROGRESS: '/analytics/student-progress',
    REPORT_CARD: '/analytics/report-card',
    CLASS_REPORT_CARDS: '/analytics/class-report-cards',
  },
  ACADEMIC_YEARS: {
    BASE: '/academic-years',
    CURRENT: '/academic-years/current',
    SET_CURRENT: '/academic-years/set-current',
  },
  SUBJECT_TEMPLATES: {
    BASE: '/subject-templates',
    BY_CLASS: '/subject-templates/class',
    APPLY: '/subject-templates/apply',
    CLASS_NAMES: '/subject-templates/class-names',
  },
  RECENT_ACTIVITIES: {
    BASE: '/recent-activities',
    DASHBOARD: '/recent-activities/dashboard',
    STATS: '/recent-activities/stats',
    TYPES: '/recent-activities/types',
    BY_ENTITY: '/recent-activities/entity',
    BY_USER: '/recent-activities/user',
    ARCHIVE: '/recent-activities/archive',
  },
}

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  PARENT: 'parent',
}

export const GENDER = {
  MALE: 'M',
  FEMALE: 'F',
  OTHER: 'Other',
}

export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
  TRANSFERRED: 'transferred',
  COMPLETED: 'completed',
}

export const STAFF_ROLES = {
  TEACHER: 'teacher',
  PRINCIPAL: 'principal',
  VICE_PRINCIPAL: 'vice_principal',
  LIBRARIAN: 'librarian',
  ADMINISTRATOR: 'administrator',
  OFFICE_STAFF: 'office_staff',
  SUPPORT_STAFF: 'support_staff',
}

export const EXAM_TYPES = {
  FIRST: 'first',
  SECOND: 'second',
  FINAL: 'final',
  MID: 'mid',
  QUARTERLY: 'quarterly',
  HALF_YEARLY: 'half_yearly',
  ANNUAL: 'annual',
  UNIT_TEST: 'unit_test',
  CLASS_TEST: 'class_test',
  SUBJECT_EXAM: 'subject_exam',
  CUSTOM: 'custom',
}

export const DUTY_TYPES = {
  EXAM: 'exam',
  INVIGILATION: 'invigilation',
  SUPERVISION: 'supervision',
  HALL_MONITOR: 'hall_monitor',
  SECURITY: 'security',
  SPORTS: 'sports',
  ARTS: 'arts',
  WORKSHOP: 'workshop',
  EVENT: 'event',
  MEETING: 'meeting',
  TRAINING: 'training',
  OTHER: 'other',
}

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LEAVE: 'leave',
  LATE: 'late',
}

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
}

export const GRADE_VALUES = {
  'A+': 10,
  'A': 9,
  'B+': 8,
  'B': 7,
  'C+': 6,
  'C': 5,
  'D': 4,
  'F': 3,
}

export const GRADE_COLORS = {
  'A+': 'text-green-600 bg-green-100',
  'A': 'text-emerald-600 bg-emerald-100',
  'B+': 'text-blue-600 bg-blue-100',
  'B': 'text-cyan-600 bg-cyan-100',
  'C+': 'text-yellow-600 bg-yellow-100',
  'C': 'text-orange-600 bg-orange-100',
  'D': 'text-red-600 bg-red-100',
  'F': 'text-gray-600 bg-gray-100',
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  LIMIT_OPTIONS: [10, 20, 50, 100],
}

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy hh:mm a',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  MONTH_YEAR: 'MMMM yyyy',
  YEAR: 'yyyy',
}

export const SESSION_TIMES = {
  BF: { value: 'BF', label: 'Before Noon', timeRange: '9:00 AM - 12:00 PM', duration: 180 },
  AF: { value: 'AF', label: 'After Noon', timeRange: '2:00 PM - 5:00 PM', duration: 180 },
  FULL: { value: 'FULL', label: 'Full Day', timeRange: '9:00 AM - 5:00 PM', duration: 480 },
}