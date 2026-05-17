import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import studentReducer from './slices/studentSlice'
import staffReducer from './slices/staffSlice'
import classReducer from './slices/classSlice'
import examReducer from './slices/examSlice'
import attendanceReducer from './slices/attendanceSlice'
import dutyReducer from './slices/dutySlice'
import notificationReducer from './slices/notificationSlice'
import parentReducer from './slices/parentSlice'
import subjectReducer from './slices/subjectSlice'
import academicYearReducer from './slices/academicYearSlice'
import dashboardReducer from './slices/dashboardSlice'  // Add this import
import uiReducer from './slices/uiSlice'
import socketReducer from './slices/socketSlice' 
import studentFilterReducer from './slices/studentSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentReducer,
    staff: staffReducer,
    classes: classReducer,
    exams: examReducer,
    attendance: attendanceReducer,
    duties: dutyReducer,
    notifications: notificationReducer,
    parents: parentReducer,
    subjects: subjectReducer,
    academicYears: academicYearReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
    socket: socketReducer, 
    studentFilter: studentFilterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})