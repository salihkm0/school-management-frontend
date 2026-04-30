// src/components/layout/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { formatRelativeTime } from '../../utils/formatters'
import useNotification from '../../hooks/useNotification'

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isSocketConnected } = useNotification()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation()
    await markAsRead(id)
    // NO TOAST
  }

  const handleMarkAllRead = async (event) => {
    event.stopPropagation()
    await markAllAsRead()
    // NO TOAST
  }

  if (!notifications) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <BellIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No notifications</p>
                {!isSocketConnected && (
                  <p className="text-xs text-yellow-600 mt-2">⚠️ Real-time connection lost</p>
                )}
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const notificationId = notification.id || notification._id
                return (
                  <div
                    key={notificationId}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary-50' : ''}`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notificationId)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">
                        {notification.type === 'success' ? '✅' : notification.type === 'warning' ? '⚠️' : notification.type === 'error' ? '❌' : '📌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">{formatRelativeTime(notification.createdAt)}</p>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notificationId, e)}
                              className="text-xs text-primary-500 hover:text-primary-700"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          
          <Link
            to="/notifications"
            className="block p-3 text-center text-sm text-primary-600 hover:bg-gray-50 rounded-b-lg border-t border-gray-200"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

export default NotificationBell