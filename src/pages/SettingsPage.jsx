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
  
  // Define all available tabs with role restrictions
  const allTabs = [
    { 
      id: 'profile', 
      name: 'Profile', 
      description: 'Manage your personal information',
      icon: UserCircleIcon, 
      path: '/settings/profile',
      color: 'blue',
      roles: ['admin', 'staff', 'parent']  // All roles can access profile
    },
    { 
      id: 'academic-years', 
      name: 'Academic Years', 
      description: 'Configure academic calendar and sessions',
      icon: CalendarIcon, 
      path: '/settings/academic-years',
      color: 'green',
      roles: ['admin']  // Only admin can access
    },
    { 
      id: 'system', 
      name: 'System', 
      description: 'System-wide configurations and preferences',
      icon: Cog6ToothIcon, 
      path: '/settings/system',
      color: 'purple',
      roles: ['admin']  // Only admin can access
    }
  ]
  
  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => tab.roles.includes(userRole))

  // Get current tab based on path
  const currentPath = location.pathname
  
  // If user is not admin and tries to access admin-only routes, redirect to profile
  const isAdminOnlyRoute = (path) => {
    const tab = allTabs.find(t => t.path === path)
    return tab && !tab.roles.includes(userRole)
  }

  if (isAdminOnlyRoute(currentPath) && userRole !== 'admin') {
    navigate('/settings/profile')
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences and system configurations</p>
      </div>

      {/* Modern Tab Cards - Only show if there are multiple tabs */}
      {tabs.length > 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || 
              (tab.path === '/settings/profile' && location.pathname === '/settings')
            
            const colorClasses = {
              blue: isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
              green: isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
              purple: isActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
            }
            
            const iconColorClasses = {
              blue: isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500',
              green: isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-500',
              purple: isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500'
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                  relative group flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${colorClasses[tab.color]}
                  ${isActive ? 'shadow-md scale-105' : 'hover:shadow-sm hover:scale-102 bg-white'}
                `}
              >
                <div className={`
                  p-2 rounded-lg transition-all
                  ${isActive ? 'bg-white shadow-sm' : 'bg-gray-50 group-hover:bg-white'}
                `}>
                  <tab.icon className={`w-6 h-6 ${iconColorClasses[tab.color]}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {tab.name}
                    </h3>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                    {tab.description}
                  </p>
                </div>
                
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <div className="w-2 h-2 rotate-45 bg-current border-t-2 border-l-2 border-current border-transparent"></div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        /* Single tab - show a simple header for staff/parent */
        <div className="border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <UserCircleIcon className="w-5 h-5 text-primary-500" />
            <span className="font-medium text-gray-700">Profile Settings</span>
          </div>
        </div>
      )}

      {/* Settings Quick Stats - Only for admin */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Active Session</p>
                <p className="text-sm text-gray-600 mt-1">Last login: Today</p>
              </div>
              <ShieldCheckIcon className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Academic Year</p>
                <p className="text-sm text-gray-600 mt-1">2024-2025 (Active)</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Role</p>
                <p className="text-sm font-semibold text-purple-700 mt-1 capitalize">{userRole}</p>
              </div>
              <LockClosedIcon className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* For staff/parent, show a simple info card */}
      {userRole !== 'admin' && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Account Type</p>
              <p className="text-lg font-semibold text-blue-700 mt-1 capitalize">{userRole} Account</p>
              <p className="text-xs text-gray-500 mt-1">You can manage your profile settings here</p>
            </div>
            <UserCircleIcon className="w-10 h-10 text-blue-400" />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm">
        <Routes>
          <Route index element={<ProfileSettings />} />
          <Route path="profile" element={<ProfileSettings />} />
          
          {/* Admin-only routes - will redirect if accessed by non-admin */}
          <Route path="academic-years" element={
            userRole === 'admin' ? <AcademicYearSettings /> : <ProfileSettings />
          } />
          <Route path="system" element={
            userRole === 'admin' ? <SystemSettings /> : <ProfileSettings />
          } />
        </Routes>
      </div>
    </div>
  )
}

export default SettingsPage