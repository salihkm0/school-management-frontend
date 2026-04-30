// src/components/common/Header.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { logout } from '../../store/slices/authSlice'
import { markAllAsRead, fetchNotifications } from '../../store/slices/notificationSlice'
import { disconnectSocket } from '../../services/socketService'
import useNotification from '../../hooks/useNotification'
import { formatRelativeTime } from '../../utils/formatters'

const Header = ({ toggleSidebar, isSidebarOpen, isMobile }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { unreadCount, notifications } = useNotification()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        dispatch(fetchNotifications({ limit: 20 }))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    disconnectSocket()
    await dispatch(logout())
    navigate('/login')
  }

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead())
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '📌'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'border-l-4 border-green-500'
      case 'warning': return 'border-l-4 border-yellow-500'
      case 'error': return 'border-l-4 border-red-500'
      default: return 'border-l-4 border-blue-500'
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm)
      setShowSearch(false)
    }
  }

  // Calculate header margin based on sidebar state
  const getHeaderMargin = () => {
    if (isMobile) return 'left-0'
    return isSidebarOpen ? 'left-64' : 'left-20'
  }

  return (
    <header className={`bg-white shadow-sm border-b border-gray-100 fixed top-0 right-0 z-20 transition-all duration-300 ${getHeaderMargin()}`}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}
          
          {/* Desktop Search */}
          <div className="hidden md:flex items-center">
            <form onSubmit={handleSearch} className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </form>
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setShowSearch(true)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BellIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id || notification._id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary-50/30' : ''} ${getNotificationColor(notification.type)}`}
                        onClick={() => {
                          setShowNotifications(false)
                          if (notification.data?.link) {
                            navigate(notification.data.link)
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <Link
                  to="/notifications"
                  className="block p-3 text-center text-sm font-medium text-primary-600 hover:bg-gray-50 transition-colors border-t border-gray-200"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications →
                </Link>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {getInitials(user?.name || 'User')}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0] || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
              <ChevronDownIcon className="hidden md:block w-4 h-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {getInitials(user?.name || 'User')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/settings/profile"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserCircleIcon className="w-5 h-5 text-gray-400" />
                  <span>Profile Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <form onSubmit={handleSearch} className="flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 text-base focus:outline-none"
                autoFocus
              />
            </form>
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header