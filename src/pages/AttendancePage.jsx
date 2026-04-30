import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import AttendanceList from '../components/attendance/AttendanceList'
import AttendanceForm from '../components/attendance/AttendanceForm'
import BulkAttendance from '../components/attendance/BulkAttendance'
import AttendanceSummary from '../components/attendance/AttendanceSummary'
import AttendanceTemplates from '../components/attendance/AttendanceTemplates'

const AttendancePage = () => {
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <NavLink
            to="/attendance"
            end
            className={({ isActive }) =>
              `py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            List View
          </NavLink>
          <NavLink
            to="/attendance/bulk"
            className={({ isActive }) =>
              `py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            Bulk Entry
          </NavLink>
          {/* <NavLink
            to="/attendance/summary"
            className={({ isActive }) =>
              `py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            Summary & Analytics
          </NavLink> */}
          <NavLink
            to="/attendance/templates"
            className={({ isActive }) =>
              `py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            Templates
          </NavLink>
        </nav>
      </div>

      <Routes>
        <Route index element={<AttendanceList />} />
        <Route path="bulk" element={<BulkAttendance />} />
        <Route path="summary" element={<AttendanceSummary />} />
        <Route path="templates" element={<AttendanceTemplates />} />
        <Route path="class/:classId" element={<AttendanceList />} />
      </Routes>
    </div>
  )
}

export default AttendancePage