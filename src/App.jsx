// src/App.jsx
import React, { useEffect, useState } from 'react'
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
import MarksEntryRouter from './pages/staff/MarksEntry/MarksEntryRouter'
import ExamForm from './components/exams/ExamForm'
import ExamReview from './components/exams/ExamReview'
import HistoricalRecordsFlow from './pages/admin/HistoricalRecords/HistoricalRecordsFlow'

//parent pages
import MyChildrenPage from './pages/parent/MyChildrenPage'
import MyChildAttendancePage from './pages/parent/MyChildAttendancePage'
import MyChildResultsPage from './pages/parent/MyChildResultsPage'

// Historical records (standalone — does not affect main system)
import HistoricalImport from './pages/admin/HistoricalImport'

// Open Dashboard
import OpenDashboardRouter from './pages/open/OpenDashboardRouter'
import OpenLogin from './pages/open/OpenLogin'

// Administration
import AdministrationLogin from './pages/administration/AdministrationLogin'
import AdministrationLayout from './pages/administration/AdministrationLayout'
import AdministrationDashboard from './pages/administration/AdministrationDashboard'
import SystemLogs from './pages/administration/SystemLogs'
import AuditLog from './pages/administration/AuditLog'
import BroadcastCenter from './pages/administration/BroadcastCenter'
import UserManagement from './pages/administration/UserManagement'

function App() {
  const dispatch = useDispatch()
  const { isLoading, isAuthenticated } = useSelector((state) => state.auth)
  const { isConnected, socket } = useSocketInit()
  
  // Initialize Firebase Cloud Messaging
  useFCMToken(isAuthenticated)
  
  const { user } = useSelector((state) => state.auth)
  const [isMaintenance, setIsMaintenance] = useState(false)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  useEffect(() => {
    if (socket) {
      const handleMaintenance = (data) => {
        // Administration users bypass maintenance mode entirely
        if (user?.role !== 'administration') {
          setIsMaintenance(data.enabled);
        }
      };
      
      socket.on('maintenance_mode_changed', handleMaintenance);
      
      return () => {
        socket.off('maintenance_mode_changed', handleMaintenance);
      };
    }
  }, [socket, user]);

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
      {isMaintenance && user?.role !== 'administration' ? (
        <div className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 max-w-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-orange-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Under Maintenance</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              We are currently performing system upgrades or maintenance to improve your experience. 
              Please check back later.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium border border-gray-700 w-full"
            >
              Refresh Status
            </button>
          </div>
        </div>
      ) : null}

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
          <ProtectedRoute allowedRoles={['admin', 'staff', 'parent', 'administration']}>
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
          <Route path="staff/marks-entry/*" element={<MarksEntryRouter />} />



          {/* Parent routes */}
          <Route path="my-children" element={<MyChildrenPage />} />
          <Route path="my-child-attendance" element={<MyChildAttendancePage />} />
          <Route path="my-child-results" element={<MyChildResultsPage />} />  

          {/* Historical import — admin only */}
          <Route path="historical-records/*" element={<HistoricalRecordsFlow />} />
          <Route path="admin/marks-entry/*" element={<MarksEntryRouter />} />
        </Route>        

        <Route path="/open/login" element={
          <PublicRoute>
            <OpenLogin />
          </PublicRoute>
        } />

        {/* Administration Routes */}
        <Route path="/administration/login" element={
          <PublicRoute>
            <AdministrationLogin />
          </PublicRoute>
        } />
        <Route path="/administration" element={
          <ProtectedRoute allowedRoles={['administration']}>
            <AdministrationLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdministrationDashboard />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="broadcast" element={<BroadcastCenter />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        <Route path="/open/*" element={
          <ProtectedRoute allowedRoles={['open']}>
            <OpenDashboardRouter />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App