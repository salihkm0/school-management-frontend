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
  XMarkIcon,
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
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
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
      case 'success': return 'border-l-2 border-emerald-500'
      case 'warning': return 'border-l-2 border-amber-500'
      case 'error': return 'border-l-2 border-rose-500'
      default: return 'border-l-2 border-emerald-500'
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Implement search logic
      setShowSearch(false)
    }
  }

  // Calculate header width based on sidebar state
  const getHeaderWidth = () => {
    if (isMobile) return 'w-full'
    return isSidebarOpen ? 'w-[calc(100%-256px)]' : 'w-[calc(100%-80px)]'
  }

  return (
    <header className={`bg-white border-b border-gray-200 fixed top-0 right-0 z-20 transition-all duration-300 ${getHeaderWidth()}`}>
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-2.5">
        {/* Left section - Menu button and logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile menu button */}
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 sm:p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          
          {/* Desktop menu button (only when sidebar is collapsed) */}
          {!isMobile && !isSidebarOpen && (
            <button 
              onClick={toggleSidebar} 
              className="p-1.5 sm:p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}
          
          {/* Mobile logo (shown when sidebar is closed on mobile) */}
          {isMobile && !isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className='w-7 h-7'>
            <img src="https://res.cloudinary.com/dmjqgjcut/image/upload/v1777479500/school_logo-Photoroom_xcljv5.png" alt="" />
            </div>
            </div>
          )}
          
          {/* Desktop Search - Hidden on mobile */}
          <div className="hidden md:flex items-center">
            <form onSubmit={handleSearch} className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 lg:w-72 xl:w-80 pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </form>
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {/* Mobile Search Button */}
          <button 
            onClick={() => setShowSearch(true)} 
            className="md:hidden p-1.5 sm:p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] sm:text-[10px] font-medium rounded-full min-w-[14px] sm:min-w-[16px] h-3.5 sm:h-4 flex items-center justify-center px-0.5 sm:px-1 shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </>
              )}
            </button>

            {showNotifications && (
              <div className="fixed right-2 sm:right-4 mt-2 w-[calc(100vw-16px)] sm:w-96 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id || notification._id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-emerald-50/30' : ''} ${getNotificationColor(notification.type)}`}
                        onClick={() => {
                          setShowNotifications(false)
                          if (notification.data?.link) navigate(notification.data.link)
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                          </div>
                          {!notification.isRead && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <Link 
                  to="/notifications" 
                  className="block p-2.5 text-center text-sm font-medium text-emerald-600 hover:bg-gray-50 transition-colors border-t border-gray-200" 
                  onClick={() => setShowNotifications(false)}
                >
                  View all →
                </Link>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 sm:gap-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-md flex items-center justify-center text-emerald-700 font-semibold text-xs sm:text-sm">
                {getInitials(user?.name || 'User')}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-700 truncate max-w-[100px]">{user?.name?.split(' ')[0] || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
              <ChevronDownIcon className="hidden lg:block w-4 h-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-md flex items-center justify-center text-emerald-700 font-semibold text-base">
                      {getInitials(user?.name || 'User')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <Link 
                  to="/settings/profile" 
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" 
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserCircleIcon className="w-4 h-4 text-gray-400" />
                  <span>Profile</span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-gray-200"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
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
            <button onClick={() => setShowSearch(false)} className="p-2 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header