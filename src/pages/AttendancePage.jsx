// src/pages/AttendancePage.jsx
import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import AttendanceList from '../components/attendance/AttendanceList'
import BulkAttendance from '../components/attendance/BulkAttendance'
import AttendanceSummary from '../components/attendance/AttendanceSummary'
import AttendanceTemplates from '../components/attendance/AttendanceTemplates'

const AttendancePage = () => {
  const tabs = [
    { path: '/attendance', name: 'List View', end: true },
    { path: '/attendance/bulk', name: 'Bulk Entry' },
    { path: '/attendance/templates', name: 'Templates' },
  ]

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Attendance Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track and manage student attendance records</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-4 sm:gap-6 min-w-max">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `py-2 px-0 border-b-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <Routes>
        <Route index element={<AttendanceList />} />
        <Route path="bulk" element={<BulkAttendance />} />
        <Route path="summary" element={<AttendanceSummary />} />
        <Route path="templates" element={<AttendanceTemplates />} />
      </Routes>
    </div>
  )
}

export default AttendancePage