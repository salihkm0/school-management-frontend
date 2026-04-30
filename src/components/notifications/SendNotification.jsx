// src/components/notifications/SendNotification.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import notificationService from '../../services/notificationService'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchStudents } from '../../store/slices/studentSlice'
import { ArrowLeftIcon, UserGroupIcon, AcademicCapIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline'
import UserSearchSelect from '../common/UserSearchSelect'
import toast from 'react-hot-toast'
import LoadingSpinner from '../common/LoadingSpinner'

const SendNotification = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { classes } = useSelector((state) => state.classes)
  const [recipientType, setRecipientType] = useState('role')
  const [isSending, setIsSending] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  
  const userRole = user?.role || 'parent'
  
  // Redirect if not admin or staff
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'staff') {
      toast.error('You do not have permission to send notifications')
      navigate('/notifications')
    }
  }, [userRole, navigate])

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { type: 'info' }
  })

  const selectedRole = watch('role')
  const selectedClass = watch('classId')

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchStaff({ limit: 100 }))
    dispatch(fetchStudents({ limit: 100 }))
  }, [dispatch])

  const onSubmit = async (data) => {
    setIsSending(true)
    try {
      let response
      if (recipientType === 'role') {
        response = await notificationService.sendToRole(data.role, data.title, data.message, data.type, { link: data.link })
      } else if (recipientType === 'class') {
        response = await notificationService.sendToClass(data.classId, data.title, data.message, data.type, { link: data.link })
      } else if (recipientType === 'user' && selectedUser) {
        response = await notificationService.sendToUser(selectedUser._id, data.title, data.message, data.type, { link: data.link })
      }
      toast.success(`Notification sent to ${response?.count || 1} recipient(s)`)
      reset()
      setSelectedUser(null)
      setTimeout(() => navigate('/notifications'), 2000)
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setIsSending(false)
    }
  }

  // Don't render if not admin/staff
  if (userRole !== 'admin' && userRole !== 'staff') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Send Notification</h1>
          <p className="text-gray-500 mt-1">Send announcements and alerts to users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
              <select {...register('type')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
                <option value="info">📌 Information</option>
                <option value="success">✅ Success</option>
                <option value="warning">⚠️ Warning</option>
                <option value="error">❌ Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input 
                {...register('title', { required: 'Title is required' })} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Important Announcement"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea 
                {...register('message', { required: 'Message is required' })} 
                rows={5} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Type your message here..."
              />
              {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
              <input 
                {...register('link')} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" 
                placeholder="https://example.com"
              />
              <p className="text-xs text-gray-400 mt-1">Add a link for more information</p>
            </div>

            <button 
              type="submit" 
              disabled={isSending} 
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <UserGroupIcon className="w-5 h-5" />
                  <span>Send Notification</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recipient Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Recipient Type</h3>
            <div className="space-y-3">
              <label className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${recipientType === 'role' ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}>
                <input 
                  type="radio" 
                  value="role" 
                  checked={recipientType === 'role'} 
                  onChange={() => {
                    setRecipientType('role')
                    setSelectedUser(null)
                  }} 
                  className="w-4 h-4 text-primary-600"
                />
                <UsersIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">All users by role</span>
              </label>
              
              <label className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${recipientType === 'class' ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}>
                <input 
                  type="radio" 
                  value="class" 
                  checked={recipientType === 'class'} 
                  onChange={() => {
                    setRecipientType('class')
                    setSelectedUser(null)
                  }} 
                  className="w-4 h-4 text-primary-600"
                />
                <AcademicCapIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Specific class</span>
              </label>
              
              <label className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${recipientType === 'user' ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}>
                <input 
                  type="radio" 
                  value="user" 
                  checked={recipientType === 'user'} 
                  onChange={() => {
                    setRecipientType('user')
                    setSelectedUser(null)
                  }} 
                  className="w-4 h-4 text-primary-600"
                />
                <UserIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Specific user</span>
              </label>
            </div>
          </div>

          {recipientType === 'role' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Select Role</h3>
              <select {...register('role')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="parent">Parent</option>
              </select>
            </div>
          )}

          {recipientType === 'class' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Select Class</h3>
              <select {...register('classId')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.displayName || `${cls.name}${cls.section ? `-${cls.section}` : ''}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {recipientType === 'user' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <UserSearchSelect
                onSelect={(user) => setSelectedUser(user)}
                selectedUser={selectedUser}
                placeholder="Search users by name or email..."
                label="Select User"
              />
              {selectedUser && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Will send to:</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedUser.name} ({selectedUser.role})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SendNotification