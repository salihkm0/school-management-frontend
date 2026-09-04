// src/pages/ReportsPage.jsx
import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ReportCard from '../components/reports/ReportCard'
import ClassReportCards from '../components/reports/ClassReportCards'
import AnalyticsDashboard from '../components/reports/AnalyticsDashboard'
import ExportReports from '../components/reports/ExportReports'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const ReportsPage = () => {
  const { user } = useSelector((state) => state.auth)
  const isStaff = user?.role === 'staff'

  const tabs = [
    { path: '/reports', name: 'Analytics', icon: ChartBarIcon, end: true },
    { path: '/reports/report-card', name: 'Report Card', icon: DocumentTextIcon },
    { path: '/reports/class-report-cards', name: 'Class Report Cards', icon: UserGroupIcon },
    { path: '/reports/export', name: 'Export Data', icon: ArrowDownTrayIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? 'Analytics' : 'Reports & Analytics'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isStaff ? 'Analyze academic performance and student progress' : 'Generate reports and analyze academic performance'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation (only for admin) */}
      {!isStaff && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  `group inline-flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {isStaff ? (
          <AnalyticsDashboard />
        ) : (
          <Routes>
            <Route index element={<AnalyticsDashboard />} />
            <Route path="report-card" element={<ReportCard />} />
            <Route path="class-report-cards" element={<ClassReportCards />} />
            <Route path="export" element={<ExportReports />} />
            <Route path="student/:studentId" element={<ReportCard />} />
          </Routes>
        )}
      </div>
    </div>
  )
}

export default ReportsPage