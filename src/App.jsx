// src/App.jsx
import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Layout from './components/common/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicRoute from './components/common/PublicRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import StaffPage from './pages/StaffPage'
import ClassesPage from './pages/ClassesPage'
import ExamsPage from './pages/ExamsPage'
import AttendancePage from './pages/AttendancePage'
import DutiesPage from './pages/DutiesPage'
import ParentsPage from './pages/ParentsPage'
import SubjectsPage from './pages/SubjectsPage'
import ReportsPage from './pages/ReportsPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import PdfReports from './components/pdf/PdfReports'
import { checkAuth } from './store/slices/authSlice'
import useSocketInit from './hooks/useSocketInit'
import useFCMToken from './hooks/useFCMToken.jsx'
import { Toaster } from 'react-hot-toast'

//staff pages
import MyClassesPage from './pages/staff/MyClassesPage'
import MyDutiesPage from './pages/staff/MyDutiesPage'
import StaffAttendancePage from './pages/staff/StaffAttendancePage'
import StaffExamsPage from './pages/staff/StaffExamsPage'
import StaffMarksEntry from './pages/staff/StaffMarksEntry'
import ExamForm from './components/exams/ExamForm'
import ExamReview from './components/exams/ExamReview'

//parent pages
import MyChildrenPage from './pages/parent/MyChildrenPage'
import MyChildAttendancePage from './pages/parent/MyChildAttendancePage'
import MyChildResultsPage from './pages/parent/MyChildResultsPage'

// Historical records (standalone — does not affect main system)
import HistoricalImport from './pages/admin/HistoricalImport'

function App() {
  const dispatch = useDispatch()
  const { isLoading, isAuthenticated } = useSelector((state) => state.auth)
  const { isConnected } = useSocketInit()
  
  // Initialize Firebase Cloud Messaging
  useFCMToken(isAuthenticated)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="students/*" element={<StudentsPage />} />
          <Route path="staff/*" element={<StaffPage />} />
          <Route path="classes/*" element={<ClassesPage />} />
          <Route path="exams/*" element={<ExamsPage />} />
          <Route path="attendance/*" element={<AttendancePage />} />
          <Route path="duties/*" element={<DutiesPage />} />
          <Route path="parents/*" element={<ParentsPage />} />
          <Route path="subjects/*" element={<SubjectsPage />} />
          <Route path="reports/*" element={<ReportsPage />} />
          <Route path="notifications/*" element={<NotificationsPage />} />
          <Route path="settings/*" element={<SettingsPage />} />
          <Route path="pdf-reports" element={<PdfReports />} />

          {/* Staff routes */}
          <Route path="staff/my-classes" element={<MyClassesPage />} />
          <Route path="staff/my-duties" element={<MyDutiesPage />} />
          <Route path="staff/attendance" element={<StaffAttendancePage />} />
          <Route path="staff/exams" element={<StaffExamsPage />} />
          <Route path="staff/exams/create" element={<ExamForm />} />
          <Route path="staff/exams/edit/:id" element={<ExamForm />} />
          <Route path="staff/exams/results/:examId" element={<ExamReview />} />
          <Route path="staff/marks-entry" element={<StaffMarksEntry />} />

          {/* Parent routes */}
          <Route path="my-children" element={<MyChildrenPage />} />
          <Route path="my-child-attendance" element={<MyChildAttendancePage />} />
          <Route path="my-child-results" element={<MyChildResultsPage />} />  

          {/* Historical import — admin only */}
          <Route path="historical-import" element={<HistoricalImport />} />
        </Route>        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App