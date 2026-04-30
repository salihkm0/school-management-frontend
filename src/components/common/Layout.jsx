// src/components/common/Layout.jsx
import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Sidebar from './Sidebar'
import Header from './Header'
import { fetchNotifications } from '../../store/slices/notificationSlice'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('Layout: Loading initial notifications')
      dispatch(fetchNotifications({ limit: 20 }))
    }
  }, [isAuthenticated, isLoading, dispatch])

  // Refresh notifications when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && document.hasFocus() && !isLoading) {
        console.log('Window focused, refreshing notifications')
        dispatch(fetchNotifications({ limit: 20 }))
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isAuthenticated, isLoading, dispatch])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Calculate margin based on sidebar state and device
  const getMarginLeft = () => {
    if (isMobile) return 'ml-0'
    return sidebarOpen ? 'ml-64' : 'ml-20'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
      <Header 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        isSidebarOpen={sidebarOpen}
        isMobile={isMobile}
      />
      <main className={`pt-16 transition-all duration-300 ${getMarginLeft()}`}>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout