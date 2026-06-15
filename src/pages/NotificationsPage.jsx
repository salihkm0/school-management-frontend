// src/pages/NotificationsPage.jsx
import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import NotificationList from '../components/notifications/NotificationList'
import SentNotificationsList from '../components/notifications/SentNotificationsList'
import SendNotification from '../components/notifications/SendNotification'
import { 
  BellIcon, 
  PaperAirplaneIcon,
  InboxIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const userRole = user?.role || 'parent'
  const unreadCount = useSelector((state) => state.notifications?.unreadCount || 0)
  
  const canSendNotifications = userRole === 'admin' || userRole === 'staff'
  
  const tabs = [
    { id: 'inbox', name: 'Received', icon: InboxIcon, path: '/notifications' }
  ]
  
  if (canSendNotifications) {
    tabs.push({ id: 'sent', name: 'Sent', icon: DocumentTextIcon, path: '/notifications/sent' })
  }

  const currentPath = location.pathname

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {canSendNotifications ? 'Manage and send notifications to users' : 'View your notifications'}
          </p>
        </div>
        
        {canSendNotifications && currentPath !== '/notifications/send' && (
          <button
            onClick={() => navigate('/notifications/send')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            <span>New Notification</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      {tabs.length > 1 ? (
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-4 sm:gap-6 min-w-max">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path || 
                (tab.path === '/notifications' && location.pathname === '/notifications')
              
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-2 py-2 px-0 border-b-2 text-sm font-medium transition-all ${
                    isActive 
                      ? 'border-emerald-500 text-emerald-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.id === 'inbox' && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      ) : (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <InboxIcon className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-gray-700">Received</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="mt-5">
        <Routes>
          <Route index element={<NotificationList />} />
          {canSendNotifications && (
            <>
              <Route path="sent" element={<SentNotificationsList />} />
              <Route path="send" element={<SendNotification />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  )
}

export default NotificationsPage