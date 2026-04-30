// src/hooks/useNotification.js
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  addNotification,
} from '../store/slices/notificationSlice'
import useSocket from './useSocket'
import toast from 'react-hot-toast'

const useNotification = () => {
  const dispatch = useDispatch()
  const { socket, isConnected } = useSocket()
  const { notifications, unreadCount, isLoading } = useSelector((state) => state.notifications)
  const { isAuthenticated, isLoading: authLoading } = useSelector((state) => state.auth)
  const listenersSetup = useRef(false)

  // Load notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadNotifications()
    }
  }, [isAuthenticated, authLoading])

  // Setup socket listeners
  useEffect(() => {
    if (socket && isConnected && !listenersSetup.current) {
      console.log('Setting up notification socket listeners, isConnected:', isConnected)
      listenersSetup.current = true

      const handleNewNotification = (notification) => {
        console.log('📨 Received notification via socket')
        const formattedNotification = {
          id: notification._id || notification.id,
          _id: notification._id || notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          data: notification.data,
          createdAt: notification.timestamp || notification.createdAt || new Date().toISOString(),
          isRead: false,
          read: false,
        }
        dispatch(addNotification(formattedNotification))
      }

      socket.on('notification', handleNewNotification)

      return () => {
        if (socket) {
          socket.off('notification', handleNewNotification)
        }
        listenersSetup.current = false
      }
    }
  }, [socket, isConnected, dispatch])

  const loadNotifications = (page = 1, unreadOnly = false) => {
    dispatch(fetchNotifications({ page, unreadOnly }))
  }

  const markAsReadHandler = async (notificationId) => {
    if (!notificationId) return
    await dispatch(markAsRead(notificationId))
    if (socket && isConnected) {
      socket.emit('notification:read', { notificationId })
    }
  }

  const markAllAsReadHandler = async () => {
    await dispatch(markAllAsRead())
    if (socket && isConnected) {
      socket.emit('notification:read:all', {})
    }
  }

  const deleteHandler = async (notificationId) => {
    await dispatch(deleteNotification(notificationId))
    toast.success('Notification deleted')
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    isSocketConnected: isConnected,
    loadNotifications,
    markAsRead: markAsReadHandler,
    markAllAsRead: markAllAsReadHandler,
    deleteNotification: deleteHandler,
  }
}

export default useNotification