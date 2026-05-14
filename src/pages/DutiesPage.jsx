// src/pages/DutiesPage.jsx
import React from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { 
  ClipboardDocumentListIcon, 
  PlusCircleIcon, 
  ChartBarIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline'
import DutyList from '../components/duties/DutyList'
import AutoAssignDuty from '../components/duties/AutoAssignDuty'
import DutyStats from '../components/duties/DutyStats'
import ManualAssignDuty from '../components/duties/ManualAssignDuty'

const DutiesPage = () => {
  const location = useLocation()
  
  const tabs = [
    { path: '/duties', label: 'Duty List', icon: ClipboardDocumentListIcon, end: true },
    { path: '/duties/auto-assign', label: 'Auto Assign', icon: CalendarIcon },
    { path: '/duties/manual-assign', label: 'Manual Assign', icon: PlusCircleIcon },
    { path: '/duties/stats', label: 'Statistics', icon: ChartBarIcon },
  ]

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Staff Duty Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage and assign duties to staff members</p>
      </div>

      {/* Tab Navigation - Responsive */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-4 sm:gap-6 min-w-max">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || 
              (tab.end && tab.path === '/duties' && location.pathname === '/duties')
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.end}
                className={({ isActive: isNavActive }) =>
                  `flex items-center gap-2 py-2 px-0 border-b-2 text-sm font-medium transition-all ${
                    isActive || isNavActive
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <Routes>
        <Route index element={<DutyList />} />
        <Route path="auto-assign" element={<AutoAssignDuty />} />
        <Route path="manual-assign" element={<ManualAssignDuty />} />
        <Route path="stats" element={<DutyStats />} />
      </Routes>
    </div>
  )
}

export default DutiesPage