// src/components/common/Sidebar.jsx
import React, { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline'
import { logout } from '../../store/slices/authSlice'
import { disconnectSocket } from '../../services/socketService'
import toast from 'react-hot-toast'

// Menu Items grouped by role
const menuItems = [

  // Common routes for all roles
  { path: '/dashboard', name: 'Dashboard', icon: HomeIcon, roles: ['admin', 'staff', 'parent'] },

  // Admin-specific routes
  { path: '/students', name: 'Students', icon: UsersIcon, roles: ['admin'] },
  { path: '/staff', name: 'Staff', icon: UserGroupIcon, roles: ['admin'] },
  { path: '/parents', name: 'Parents', icon: UserIcon, roles: ['admin'] },
  { path: '/classes', name: 'Classes', icon: AcademicCapIcon, roles: ['admin'] },
  { path: '/subjects', name: 'Subjects', icon: BookOpenIcon, roles: ['admin'] },
  { path: '/exams', name: 'Exams', icon: ClipboardDocumentListIcon, roles: ['admin'] },
  { path: '/attendance', name: 'Attendance', icon: CalendarIcon, roles: ['admin'] },
  { path: '/duties', name: 'Duties', icon: CalendarIcon, roles: ['admin'] },
  { path: '/reports', name: 'Reports', icon: ChartBarIcon, roles: ['admin'] },
  { path: '/pdf-reports', name: 'PDF Reports', icon: DocumentTextIcon, roles: ['admin'] },
  { path: '/historical-records', name: 'Historical Records', icon: ArchiveBoxIcon, roles: ['admin'] },
  { path: '/admin/marks-entry', name: 'Mark Entry', icon: ClipboardDocumentListIcon, roles: ['admin'] },

  // Staff-specific routes
  { path: '/staff/exams', name: 'Exams', icon: ClipboardDocumentListIcon, roles: ['staff'] },
  { path: '/staff/attendance', name: 'Attendance', icon: CalendarIcon, roles: ['staff'] },
  { path: '/staff/marks-entry', name: 'Mark Entry', icon: ClipboardDocumentListIcon, roles: ['staff'] },

  // Parent-specific routes
  { path: '/my-children', name: 'My Children', icon: UserGroupIcon, roles: ['parent'] },
  { path: '/my-child-attendance', name: 'Attendance', icon: CalendarIcon, roles: ['parent'] },
  { path: 'my-child-results', name: 'Results', icon: ChartBarIcon, roles: ['parent'] },

  // common routes
  { path: '/notifications', name: 'Notifications', icon: BellIcon, roles: ['admin', 'staff', 'parent'] },
  { path: '/settings', name: 'Settings', icon: Cog6ToothIcon, roles: ['admin', 'staff', 'parent'] },
]

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const userRole = user?.role || 'parent'

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole))

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isOpen && !event.target.closest('.sidebar-container')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isOpen, setIsOpen])

  const handleLogout = async () => {
    try {
      disconnectSocket()
      await dispatch(logout()).unwrap()
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      sessionStorage.clear()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  const handleLinkClick = () => {
    if (isMobile) setIsOpen(false)
  }

  if (isMobile && !isOpen) return null

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
      
      <div
        className={`sidebar-container fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 flex flex-col ${
          isOpen ? 'w-64' : 'w-20'
        } ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'} ${!isMobile ? 'lg:translate-x-0' : ''}`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className={`flex items-center gap-2.5 ${!isOpen ? 'justify-center w-full' : ''}`}>
            {/* <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              PPM
            </div> */}
            <div className='w-10 h-10'>
            <img src="https://res.cloudinary.com/dmjqgjcut/image/upload/v1777479500/school_logo-Photoroom_xcljv5.png" alt="" />
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800 text-sm">PPM HSS</span>
                <span className="text-[10px] text-gray-400">KOTTUKKARA</span>
              </div>
            )}
          </div>
          {!isMobile && isOpen && (
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
          {!isMobile && !isOpen && (
            <button onClick={() => setIsOpen(true)} className="absolute -right-3 top-20 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors">
              <ChevronRightIcon className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* User Profile (Collapsed) */}
        {/* {!isOpen && !isMobile && (
          <div className="flex justify-center py-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        )} */}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } ${!isOpen ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              {isOpen && <span className="text-sm font-medium">{item.name}</span>}
              {!isOpen && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-gray-600 hover:text-rose-600 hover:bg-rose-50 w-full ${
              !isOpen ? 'justify-center' : ''
            }`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            {isOpen && <span className="text-sm font-medium">Logout</span>}
            {!isOpen && !isMobile && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>

        {/* Version Info */}
        {isOpen && (
          <div className="px-4 py-3 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 text-center">v2.0.0</p>
          </div>
        )}
      </div>
    </>
  )
}

export default Sidebar