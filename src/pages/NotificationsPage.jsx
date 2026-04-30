// src/pages/NotificationsPage.jsx
import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import NotificationList from '../components/notifications/NotificationList'
import SendNotification from '../components/notifications/SendNotification'
import { 
  BellIcon, 
  PaperAirplaneIcon,
  InboxIcon 
} from '@heroicons/react/24/outline'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const userRole = user?.role || 'parent'
  
  // Only admin and staff can send notifications
  const canSendNotifications = userRole === 'admin'
  
  const tabs = [
    { 
      id: 'inbox', 
      name: 'Inbox', 
      icon: InboxIcon, 
      path: '/notifications',
      description: 'View all notifications'
    }
  ]
  
  // Add send tab only for admin and staff
  if (canSendNotifications) {
    tabs.push({
      id: 'send', 
      name: 'Send Notification', 
      icon: PaperAirplaneIcon, 
      path: '/notifications/send',
      description: 'Send announcements to users'
    })
  }

  const currentPath = location.pathname
  const unreadCount = 5 // You can get this from Redux store

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {canSendNotifications 
              ? 'Manage and send notifications to users' 
              : 'View your notifications'}
          </p>
        </div>
        
        {/* Quick action button for sending - only for admin/staff */}
        {canSendNotifications && currentPath !== '/notifications/send' && (
          <button
            onClick={() => navigate('/notifications/send')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            <span>New Notification</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation - Only show if there are multiple tabs */}
      {tabs.length > 1 ? (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path || 
                (tab.path === '/notifications' && location.pathname === '/notifications')
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`
                    group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <span>{tab.name}</span>
                  
                  {/* Unread badge for inbox */}
                  {tab.id === 'inbox' && unreadCount > 0 && (
                    <span className="ml-1 bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      ) : (
        /* Single tab - just show a header without tabs */
        <div className="border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <InboxIcon className="w-5 h-5 text-primary-500" />
            <h2 className="font-medium text-gray-700">Inbox</h2>
            {unreadCount > 0 && (
              <span className="bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        <Routes>
          <Route index element={<NotificationList />} />
          {canSendNotifications && (
            <Route path="send" element={<SendNotification />} />
          )}
        </Routes>
      </div>
    </div>
  )
}

export default NotificationsPage