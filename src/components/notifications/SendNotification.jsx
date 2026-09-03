// src/components/notifications/SendNotification.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import notificationService from '../../services/notificationService'
import { fetchClasses } from '../../store/slices/classSlice'
import { ArrowLeftIcon, AcademicCapIcon, UserIcon, CheckIcon, ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import UserSearchSelect from '../common/UserSearchSelect'
import toast from 'react-hot-toast'
import LoadingSpinner from '../common/LoadingSpinner'

const SendNotification = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { classes } = useSelector((state) => state.classes)
  const { currentStaff } = useSelector((state) => state.staff)
  
  const [recipientType, setRecipientType] = useState('class') // 'class' or 'user'
  const [sendMode, setSendMode] = useState('all') // 'all' or 'selected'
  const [classParents, setClassParents] = useState([])
  const [selectedParentIds, setSelectedParentIds] = useState([])
  const [isLoadingParents, setIsLoadingParents] = useState(false)
  const [parentSearch, setParentSearch] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
  const userRole = user?.role || 'parent'
  const isStaff = userRole === 'staff'
  
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'staff') {
      toast.error('You do not have permission to send notifications')
      navigate('/notifications')
    }
  }, [userRole, navigate])

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { type: 'info' }
  })

  const selectedClass = watch('classId')

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
  }, [dispatch])

  // When selected class changes, fetch connected parents
  useEffect(() => {
    if (selectedClass) {
      setIsLoadingParents(true)
      notificationService.getClassParents(selectedClass)
        .then((res) => {
          const parents = res.data || res || []
          setClassParents(parents)
          const allIds = parents.map((p) => p._id || p.id).filter(Boolean)
          setSelectedParentIds(allIds)
        })
        .catch(() => toast.error('Failed to load class parents'))
        .finally(() => setIsLoadingParents(false))
    } else {
      setClassParents([])
      setSelectedParentIds([])
    }
  }, [selectedClass])

  const handleToggleSelectAll = () => {
    if (selectedParentIds.length === classParents.length) {
      setSelectedParentIds([])
    } else {
      const allIds = classParents.map((p) => p._id || p.id).filter(Boolean)
      setSelectedParentIds(allIds)
    }
  }

  const handleToggleParent = (id) => {
    if (!id) return
    setSelectedParentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const onSubmit = async (data) => {
    if (recipientType === 'class' && !data.classId) {
      toast.error('Please select a class')
      return
    }
    if (recipientType === 'class' && sendMode === 'selected' && selectedParentIds.length === 0) {
      toast.error('Please select at least one parent')
      return
    }
    if (recipientType === 'user' && !selectedUser) {
      toast.error('Please select a recipient')
      return
    }

    setIsSending(true)
    try {
      if (recipientType === 'class') {
        if (sendMode === 'all') {
          await notificationService.sendToClass(data.classId, data.title, data.message, data.type, { link: data.link })
          toast.success('Notification sent to all class parents')
        } else {
          for (const parentId of selectedParentIds) {
            await notificationService.sendToUser(parentId, data.title, data.message, data.type, { link: data.link })
          }
          toast.success(`Notification sent to ${selectedParentIds.length} selected parents`)
        }
      } else if (recipientType === 'user' && selectedUser) {
        await notificationService.sendToUser(selectedUser._id || selectedUser.id, data.title, data.message, data.type, { link: data.link })
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

  const filteredParents = classParents.filter((p) => {
    if (!parentSearch.trim()) return true
    const q = parentSearch.toLowerCase()
    const pName = (p.name || '').toLowerCase()
    const pEmail = (p.email || '').toLowerCase()
    const sNames = (p.studentNames || []).join(' ').toLowerCase()
    return pName.includes(q) || pEmail.includes(q) || sNames.includes(q)
  })

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/notifications')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Send Notification</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send announcements and alerts to class parents or specific users</p>
        </div>
      </div>

      {isStaff && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-emerald-800 font-medium">
            Staff Mode: You can send notifications directly to parents of students in your assigned classes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
            </div>

            <button type="submit" disabled={isSending} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm mt-4">
              {isSending ? <LoadingSpinner size="sm" /> : <CheckIcon className="w-4 h-4" />}
              <span>{isSending ? 'Sending...' : 'Send Notification'}</span>
            </button>
          </form>
        </div>

        {/* Recipient Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Recipient Target</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setRecipientType('class'); setSelectedUser(null); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${recipientType === 'class' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <AcademicCapIcon className="w-5 h-5 text-emerald-600" />
                <span>Class Parents</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setRecipientType('user'); setSelectedUser(null); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${recipientType === 'user' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <UserIcon className="w-5 h-5 text-emerald-600" />
                <span>Specific User</span>
              </button>
            </div>
          </div>

          {recipientType === 'class' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm space-y-4 p-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class *</label>
                <select {...register('classId')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
                  <option value="">-- Choose Class --</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.displayName || `${cls.name} ${cls.section || ''}`}</option>
                  ))}
                </select>
              </div>

              {selectedClass && (
                <>
                  {/* Send Mode Radio Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSendMode('all')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${sendMode === 'all' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      📢 All Parents of Class
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMode('selected')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${sendMode === 'selected' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      👥 Selected Parents
                    </button>
                  </div>

                  {isLoadingParents ? (
                    <div className="py-6 flex justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : sendMode === 'selected' ? (
                    <div className="space-y-3 pt-2">
                      {/* Search parent */}
                      <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                          placeholder="Search parent or student name..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50"
                        />
                      </div>

                      {/* Header Select All */}
                      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                        <span>Selected: <strong className="text-emerald-600">{selectedParentIds.length}</strong> / {classParents.length}</span>
                        <button type="button" onClick={handleToggleSelectAll} className="text-emerald-600 hover:underline font-medium">
                          {selectedParentIds.length === classParents.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {/* Parent List */}
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-gray-50">
                        {filteredParents.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400">No parents found for this class</div>
                        ) : (
                          filteredParents.map((p) => {
                            const pId = p._id || p.id || p.key
                            const isChecked = selectedParentIds.includes(pId)
                            const studentText = (p.studentNames || []).join(', ')
                            return (
                              <label key={pId} className="flex items-start gap-3 p-2.5 hover:bg-white cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleParent(pId)}
                                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{p.name || 'Parent'}</p>
                                  {studentText && (
                                    <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-100/70 rounded">
                                      Student: {studentText}
                                    </span>
                                  )}
                                </div>
                              </label>
                            )
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 text-xs text-emerald-700">
                      📢 Notification will be sent to all parents of students in this class ({classParents.length} parents).
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {recipientType === 'user' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-visible shadow-sm">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 rounded-t-xl">
                <h3 className="text-sm font-semibold text-gray-900">Select Specific User</h3>
              </div>
              <div className="p-4">
                <UserSearchSelect
                  onSelect={(user) => setSelectedUser(user)}
                  selectedUser={selectedUser}
                  placeholder="Search user by name or email..."
                  label=""
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SendNotification