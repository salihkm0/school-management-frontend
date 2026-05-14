// src/pages/SettingsPage.jsx
import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AcademicYearSettings from '../components/settings/AcademicYearSettings'
import ProfileSettings from '../components/settings/ProfileSettings'
import SystemSettings from '../components/settings/SystemSettings'
import { 
  UserCircleIcon, 
  CalendarIcon, 
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

const SettingsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const userRole = user?.role || 'parent'
  
  const allTabs = [
    { id: 'profile', name: 'Profile', description: 'Manage your personal information', icon: UserCircleIcon, path: '/settings/profile', roles: ['admin', 'staff', 'parent'] },
    { id: 'academic-years', name: 'Academic Years', description: 'Configure academic calendar', icon: CalendarIcon, path: '/settings/academic-years', roles: ['admin'] },
    { id: 'system', name: 'System', description: 'System-wide configurations', icon: Cog6ToothIcon, path: '/settings/system', roles: ['admin'] }
  ]
  
  const tabs = allTabs.filter(tab => tab.roles.includes(userRole))
  const currentPath = location.pathname

  const isAdminOnlyRoute = (path) => {
    const tab = allTabs.find(t => t.path === path)
    return tab && !tab.roles.includes(userRole)
  }

  if (isAdminOnlyRoute(currentPath) && userRole !== 'admin') {
    navigate('/settings/profile')
    return null
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences and system configurations</p>
      </div>

      {/* Tab Cards */}
      {tabs.length > 1 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === '/settings/profile' && location.pathname === '/settings')
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                  isActive 
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`p-2 rounded-md ${isActive ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                  <tab.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {tab.name}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <UserCircleIcon className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-gray-700">Profile Settings</span>
        </div>
      )}

      {/* Stats Cards for Admin */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Session</p>
                <p className="text-xs text-gray-600 mt-0.5">Last login: Today</p>
              </div>
              <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Academic Year</p>
                <p className="text-xs text-gray-600 mt-0.5">2025-2026 (Active)</p>
              </div>
              <CalendarIcon className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-xs font-semibold text-emerald-600 mt-0.5 capitalize">{userRole}</p>
              </div>
              <LockClosedIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Info Card for non-admin */}
      {userRole !== 'admin' && (
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-emerald-600 font-medium">Account Type</p>
              <p className="text-sm font-semibold text-emerald-700 mt-0.5 capitalize">{userRole} Account</p>
              <p className="text-xs text-emerald-600 mt-1">You can manage your profile settings here</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        <Routes>
          <Route index element={<ProfileSettings />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="academic-years" element={userRole === 'admin' ? <AcademicYearSettings /> : <ProfileSettings />} />
          <Route path="system" element={userRole === 'admin' ? <SystemSettings /> : <ProfileSettings />} />
        </Routes>
      </div>
    </div>
  )
}

export default SettingsPage