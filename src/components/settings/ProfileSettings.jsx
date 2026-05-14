// src/components/settings/ProfileSettings.jsx
import React from 'react'
import { useSelector } from 'react-redux'
import ChangePassword from '../auth/ChangePassword'
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const ProfileSettings = () => {
  const { user } = useSelector((state) => state.auth)
  const userRole = user?.role || 'parent'
  
  const getRoleBadgeColor = () => {
    switch(userRole) {
      case 'admin': return 'bg-purple-100 text-purple-700 ring-1 ring-purple-600/20'
      case 'staff': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20'
      case 'parent': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20'
      default: return 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20'
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Profile Information</h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-gray-900">Profile Information</h3>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-700">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${getRoleBadgeColor()}`}>
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <PhoneIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{user?.role || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(user?.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <ChangePassword />
      </div>
      
      {/* Info Note for non-admin */}
      {userRole !== 'admin' && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
          <div className="flex items-start gap-2">
            <CheckCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Note</p>
              <p className="text-xs text-blue-700 mt-1">
                For any changes to your role or permissions, please contact the school administrator.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSettings