import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
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
    { path: '/duties', label: 'Duty List', icon: ClipboardDocumentListIcon },
    { path: '/duties/auto-assign', label: 'Auto Assign', icon: CalendarIcon },
    { path: '/duties/manual-assign', label: 'Manual Assign', icon: PlusCircleIcon },
    { path: '/duties/stats', label: 'Statistics', icon: ChartBarIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold">Staff Duty Management</h1>
          <p className="text-primary-100 mt-1">Manage and assign duties to staff members</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path || 
                (tab.path === '/duties' && location.pathname === '/duties')
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route index element={<DutyList />} />
          <Route path="auto-assign" element={<AutoAssignDuty />} />
          <Route path="manual-assign" element={<ManualAssignDuty />} />
          <Route path="stats" element={<DutyStats />} />
        </Routes>
      </div>
    </div>
  )
}

export default DutiesPage