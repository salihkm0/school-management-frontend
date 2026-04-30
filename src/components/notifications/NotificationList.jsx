// src/components/notifications/NotificationList.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../store/slices/notificationSlice'
import { formatRelativeTime } from '../../utils/formatters'
import { 
  TrashIcon, 
  CheckCircleIcon, 
  PaperAirplaneIcon,
  InboxIcon,
  BellIcon 
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmModal from '../common/Modal'

const NotificationList = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { notifications, unreadCount, isLoading, pagination } = useSelector((state) => state.notifications)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  
  const userRole = user?.role || 'parent'
  const canSendNotifications = userRole === 'admin' || userRole === 'staff'
  const canDeleteNotifications = userRole === 'admin' || userRole === 'staff'

  useEffect(() => {
    dispatch(fetchNotifications({ page, limit: 20, unreadOnly: filter === 'unread' }))
  }, [dispatch, page, filter])

  const handleMarkAsRead = async (id) => {
    if (id) {
      await dispatch(markAsRead(id))
    }
  }

  const handleMarkAllRead = async () => {
    await dispatch(markAllAsRead())
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteNotification(deleteTarget))
      setDeleteTarget(null)
    }
  }

  const getNotificationIcon = (type) => {
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: '📌' }
    return icons[type] || '📌'
  }

  const getNotificationColor = (type) => {
    const colors = {
      success: 'border-l-4 border-green-500',
      warning: 'border-l-4 border-yellow-500',
      error: 'border-l-4 border-red-500',
      info: 'border-l-4 border-blue-500',
    }
    return colors[type] || 'border-l-4 border-gray-500'
  }

  if (isLoading && notifications.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Notifications</p>
              <p className="text-2xl font-bold text-blue-700">{pagination.total || 0}</p>
            </div>
            <BellIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Unread</p>
              <p className="text-2xl font-bold text-green-700">{unreadCount || 0}</p>
            </div>
            <InboxIcon className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        {/* Quick Action - Only for admin/staff */}
        {canSendNotifications && (
          <button
            onClick={() => navigate('/notifications/send')}
            className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-600 font-medium">Quick Action</p>
                <p className="text-lg font-semibold text-primary-700">Send Notification</p>
              </div>
              <PaperAirplaneIcon className="w-8 h-8 text-primary-400" />
            </div>
          </button>
        )}
        
        {/* For parents, show a different card */}
        {!canSendNotifications && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Stay Updated</p>
                <p className="text-sm font-semibold text-purple-700 mt-1">Check here for announcements</p>
              </div>
              <BellIcon className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        )}
      </div>

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => { setFilter('all'); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${filter === 'all' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All ({pagination.total})
          </button>
          <button
            onClick={() => { setFilter('unread'); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${filter === 'unread' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications found</p>
            {canSendNotifications && (
              <button
                onClick={() => navigate('/notifications/send')}
                className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Send your first notification →
              </button>
            )}
          </div>
        ) : (
          notifications.map((notification) => {
            const notificationId = notification.id || notification._id
            return (
              <div
                key={notificationId}
                className={`bg-white rounded-xl shadow-sm p-4 transition-all hover:shadow-md ${!notification.isRead ? 'ring-1 ring-primary-200 bg-primary-50/30' : ''} ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.isRead && (
                          <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs text-gray-400">{formatRelativeTime(notification.createdAt)}</span>
                        {notification.data?.from && <span className="text-xs text-gray-400">From: {notification.data.from}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notificationId)}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                    {/* Only show delete button for admin/staff */}
                    {canDeleteNotifications && (
                      <button
                        onClick={() => setDeleteTarget(notificationId)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Only show delete modal for admin/staff */}
      {canDeleteNotifications && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Notification"
          message="Are you sure you want to delete this notification? This action cannot be undone."
          confirmText="Delete"
          confirmVariant="danger"
        />
      )}
    </div>
  )
}

export default NotificationList