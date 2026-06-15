// src/components/settings/ProfileSettings.jsx
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import ChangePassword from '../auth/ChangePassword'
import { updateProfile } from '../../store/slices/authSlice'
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, ShieldCheckIcon, CheckCircleIcon, PencilSquareIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

const ProfileSettings = () => {
  const dispatch = useDispatch()
  const { user, isLoading } = useSelector((state) => state.auth)
  const userRole = user?.role || 'parent'
  
  const [isEditing, setIsEditing] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  })

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

  const onSubmit = async (data) => {
    const result = await dispatch(updateProfile(data))
    if (result.payload?.success) {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    })
    setIsEditing(false)
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
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-gray-900">Profile Information</h3>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
              </button>
            )}
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
            
            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" /> Save
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            ) : (
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
            )}
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