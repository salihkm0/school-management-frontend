// src/components/settings/ProfileSettings.jsx
import React from 'react'
import { useSelector } from 'react-redux'
import ChangePassword from '../auth/ChangePassword'
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const ProfileSettings = () => {
  const { user } = useSelector((state) => state.auth)
  const userRole = user?.role || 'parent'
  
  // Get role badge color
  const getRoleBadgeColor = () => {
    switch(userRole) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'staff': return 'bg-blue-100 text-blue-800'
      case 'parent': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-6 h-6 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${getRoleBadgeColor()}`}>
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-gray-900 font-medium">{user?.email || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-gray-900 font-medium">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-gray-900 font-medium capitalize">{user?.role || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-gray-900 font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <ChangePassword />
      </div>
      
      {/* Additional info for staff/parent */}
      {userRole !== 'admin' && (
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium">📌 Note:</p>
          <p className="text-xs mt-1">For any changes to your role or permissions, please contact the school administrator.</p>
        </div>
      )}
    </div>
  )
}

export default ProfileSettings