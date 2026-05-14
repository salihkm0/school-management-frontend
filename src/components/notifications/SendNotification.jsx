// src/components/notifications/SendNotification.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import notificationService from '../../services/notificationService'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchStaff } from '../../store/slices/staffSlice'
import { fetchStudents } from '../../store/slices/studentSlice'
import { ArrowLeftIcon, UserGroupIcon, AcademicCapIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline'
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
  const [selectedUser, setSelectedUser] = useState(null)
  
  const userRole = user?.role || 'parent'
  
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'staff') {
      toast.error('You do not have permission to send notifications')
      navigate('/notifications')
    }
  }, [userRole, navigate])

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
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
        toast.success(`Notification sent to ${response?.count || 0} recipients`)
      } else if (recipientType === 'class') {
        response = await notificationService.sendToClass(data.classId, data.title, data.message, data.type, { link: data.link })
        toast.success(`Notification sent to class`)
      } else if (recipientType === 'user' && selectedUser) {
        response = await notificationService.sendToUser(selectedUser._id, data.title, data.message, data.type, { link: data.link })
        toast.success(`Notification sent to ${selectedUser.name}`)
      }
      reset()
      setSelectedUser(null)
      setTimeout(() => navigate('/notifications'), 1500)
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setIsSending(false)
    }
  }

  if (userRole !== 'admin' && userRole !== 'staff') return null

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/notifications')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Send Notification</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send announcements and alerts to users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Notification Details</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select {...register('type')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                <option value="info">📌 Information</option>
                <option value="success">✅ Success</option>
                <option value="warning">⚠️ Warning</option>
                <option value="error">❌ Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input {...register('title', { required: 'Title is required' })} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.title ? 'border-rose-500' : 'border-gray-200'}`} placeholder="e.g., Important Announcement" />
              {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea {...register('message', { required: 'Message is required' })} rows={4} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none ${errors.message ? 'border-rose-500' : 'border-gray-200'}`} placeholder="Type your message here..." />
              {errors.message && <p className="mt-1 text-xs text-rose-500">{errors.message.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
              <input {...register('link')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white" placeholder="https://example.com" />
              <p className="text-xs text-gray-400 mt-1">Add a link for more information</p>
            </div>

            <button type="submit" disabled={isSending} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {isSending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckIcon className="w-4 h-4" />}
              <span>{isSending ? 'Sending...' : 'Send Notification'}</span>
            </button>
          </form>
        </div>

        {/* Recipient Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Recipient Type</h3>
            </div>
            <div className="p-4 space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${recipientType === 'role' ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                <input type="radio" value="role" checked={recipientType === 'role'} onChange={() => { setRecipientType('role'); setSelectedUser(null) }} className="w-4 h-4 text-emerald-600" />
                <UserGroupIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">All users by role</span>
              </label>
              
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${recipientType === 'class' ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                <input type="radio" value="class" checked={recipientType === 'class'} onChange={() => { setRecipientType('class'); setSelectedUser(null) }} className="w-4 h-4 text-emerald-600" />
                <AcademicCapIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Specific class</span>
              </label>
              
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${recipientType === 'user' ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                <input type="radio" value="user" checked={recipientType === 'user'} onChange={() => { setRecipientType('user'); setSelectedUser(null) }} className="w-4 h-4 text-emerald-600" />
                <UserIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Specific user</span>
              </label>
            </div>
          </div>

          {recipientType === 'role' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Select Role</h3>
              </div>
              <div className="p-4">
                <select {...register('role')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </div>
          )}

          {recipientType === 'class' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Select Class</h3>
              </div>
              <div className="p-4">
                <select {...register('classId')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.displayName || cls.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {recipientType === 'user' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Select User</h3>
              </div>
              <div className="p-4">
                <UserSearchSelect
                  onSelect={(user) => setSelectedUser(user)}
                  selectedUser={selectedUser}
                  placeholder="Search users by name or email..."
                  label=""
                />
                {selectedUser && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Will send to:</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedUser.name} ({selectedUser.role})</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SendNotification