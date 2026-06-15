// src/components/notifications/SentNotificationsList.jsx
import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import notificationService from '../../services/notificationService'
import { formatRelativeTime } from '../../utils/formatters'
import { 
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'

const SentNotificationsList = () => {
  const { user } = useSelector((state) => state.auth)
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const fetchSent = async () => {
      setIsLoading(true)
      try {
        const response = await notificationService.getSentNotifications(currentPage, 15)
        setNotifications(response.data)
        setPagination(response.pagination)
      } catch (error) {
        console.error('Error fetching sent notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSent()
  }, [currentPage])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification)
    setShowModal(true)
    setOpenMenuId(null)
  }

  const getNotificationIcon = (type) => {
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: '📌' }
    return icons[type] || '📌'
  }

  const getNotificationColor = (type) => {
    const colors = {
      success: 'border-l-2 border-emerald-500',
      warning: 'border-l-2 border-amber-500',
      error: 'border-l-2 border-rose-500',
      info: 'border-l-2 border-blue-500',
    }
    return colors[type] || 'border-l-2 border-gray-400'
  }

  const getTypeBadge = (type) => {
    const badges = {
      success: 'bg-emerald-100 text-emerald-700',
      warning: 'bg-amber-100 text-amber-700',
      error: 'bg-rose-100 text-rose-700',
      info: 'bg-blue-100 text-blue-700',
    }
    return badges[type] || 'bg-gray-100 text-gray-700'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (isLoading && notifications.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Sent</p>
              <p className="text-xl font-bold text-gray-900">{pagination?.total || 0}</p>
            </div>
            <PaperAirplaneIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pages</p>
              <p className="text-xl font-bold text-gray-900">{pagination?.pages || 1}</p>
            </div>
            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <PaperAirplaneIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No sent notifications found</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const notificationId = notification._id || notification.id
            return (
              <div
                key={notificationId}
                className={`bg-white rounded-lg border border-gray-200 p-4 transition-all hover:shadow-sm cursor-pointer ${!notification.isRead ? 'ring-1 ring-emerald-200 bg-emerald-50/20' : ''} ${getNotificationColor(notification.type)}`}
                onClick={() => handleViewDetails(notification)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">To: {notification.userId?.fullName || 'User'} - {notification.title}</h3>
                        <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getTypeBadge(notification.type)}`}>
                          {notification.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">{formatRelativeTime(notification.createdAt)}</span>
                        {notification.data?.from && <span className="text-xs text-gray-400">From: {notification.data.from}</span>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === notificationId ? null : notificationId)
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                    
                    {openMenuId === notificationId && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(notification)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span>View details</span>
                        </button>
                        
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination?.pages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="text-xs text-gray-500 text-center sm:text-left">
            Showing {(currentPage - 1) * 15 + 1} to {Math.min(currentPage * 15, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum = pagination.pages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= pagination.pages - 2 ? pagination.pages - 4 + i : currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[28px] h-7 px-1.5 text-xs rounded-lg transition-colors ${
                      currentPage === pageNum ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notification Details Modal */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex justify-between items-center ${getNotificationColor(selectedNotification.type)} border-t-0 border-r-0 border-b border-l-0`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getNotificationIcon(selectedNotification.type)}</span>
                <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <h4 className="text-base font-bold text-gray-900">{selectedNotification.title}</h4>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadge(selectedNotification.type)}`}>
                    {selectedNotification.type}
                  </span>
                </div>
                
              </div>

              {/* Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {selectedNotification.message}
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Sent: {formatDate(selectedNotification.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <UserIcon className="w-4 h-4" />
                  <span>To: {selectedNotification.userId?.fullName || 'User'} ({selectedNotification.userId?.role || 'Unknown role'})</span>
                </div>
              </div>

              {/* Link if present */}
              {selectedNotification.data?.link && (
                <div className="pt-2">
                  <a
                    href={selectedNotification.data.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>View attached link</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SentNotificationsList