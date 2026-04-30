// src/services/socketService.js
import { io } from 'socket.io-client'
import { store } from '../store'
import { addNotification, updateUnreadCount } from '../store/slices/notificationSlice'
import toast from 'react-hot-toast'

let socket = null
let reconnectAttempts = 0
let heartbeatInterval = null
let reconnectTimeout = null
let isManualDisconnect = false
const MAX_RECONNECT_ATTEMPTS = 10
const HEARTBEAT_INTERVAL = 25000

// Toast helper - only for connection status (removed notification toasts)
const showToast = (message, type = 'info', duration = 3000) => {
  if (type === 'error') {
    toast.error(message, { duration })
  } else if (type === 'success') {
    toast.success(message, { duration })
  } else if (type === 'warning') {
    toast(message, {
      duration,
      icon: '⚠️',
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        borderLeft: '4px solid #F59E0B',
      },
    })
  } else {
    toast(message, {
      duration,
      icon: 'ℹ️',
      style: {
        background: '#EFF6FF',
        color: '#1E40AF',
        borderLeft: '4px solid #3B82F6',
      },
    })
  }
}

/**
 * Initialize Socket.IO connection
 * @param {string} userId - User ID
 * @param {string} userRole - User role (admin, staff, parent)
 * @returns {object} Socket instance
 */
export const initSocket = (userId, userRole) => {
  console.log('=== initSocket called ===')
  console.log('UserId:', userId, 'UserRole:', userRole)
  console.log('Timestamp:', new Date().toISOString())
  
  // Close existing socket if any
  if (socket) {
    console.log('Closing existing socket connection')
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    socket.disconnect()
    socket = null
  }
  
  const token = localStorage.getItem('token')
  console.log('Token present:', !!token)
  
  if (!token) {
    console.warn('No token found, socket connection will fail')
    showToast('Authentication failed. Please login again.', 'error', 5000)
    return null
  }
  
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5055'
  console.log('Connecting to Socket URL:', SOCKET_URL)
  
  isManualDisconnect = false
  reconnectAttempts = 0
  
  // Connect with the token in the query string (like Postman)
  socket = io(SOCKET_URL, {
    query: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    pingTimeout: 60000,
    pingInterval: 25000,
    forceNew: true,
    autoConnect: true,
    withCredentials: true
  })
  
  // ==================== CONNECTION EVENT HANDLERS ====================
  
  socket.on('connect', () => {
    console.log('✅ Socket.IO connected successfully!')
    console.log('Socket ID:', socket.id)
    console.log('Transport:', socket.io?.engine?.transport?.name)
    reconnectAttempts = 0
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
    
    heartbeatInterval = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('heartbeat', { 
          timestamp: new Date().toISOString(),
          userId: userId
        })
      }
    }, HEARTBEAT_INTERVAL)
    
    socket.emit('client:ready', {
      platform: 'web',
      version: '1.0.0',
      userId: userId,
      role: userRole,
      timestamp: new Date(),
    })
    
    socket.emit('subscribe:notifications')
    socket.emit('subscribe:updates')
    socket.emit('subscribe:activities')
    
    if (userRole === 'admin') {
      socket.emit('subscribe:dashboard')
      socket.emit('subscribe:staff')
      socket.emit('subscribe:students')
    } else if (userRole === 'staff') {
      socket.emit('subscribe:dashboard')
      socket.emit('subscribe:students')
      socket.emit('subscribe:exams')
    } else if (userRole === 'parent') {
      socket.emit('subscribe:students')
    }
    
    socket.emit('join:user', { userId, role: userRole })
    
    console.log('Subscribed to all channels for role:', userRole)
    showToast('Connected to real-time server', 'success', 2000)
  })
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO disconnected. Reason:', reason)
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    
    if (!isManualDisconnect && (reason === 'io server disconnect' || reason === 'transport close')) {
      console.log('Attempting to reconnect in 3 seconds...')
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      reconnectTimeout = setTimeout(() => {
        if (socket && !socket.connected && !isManualDisconnect) {
          console.log('Reconnecting socket...')
          socket.connect()
        }
      }, 3000)
    }
  })
  
  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error.message)
    reconnectAttempts++
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
      showToast('Unable to connect to real-time server. Some features may be limited.', 'warning', 5000)
    }
  })
  
  socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket.IO reconnected after ${attemptNumber} attempts`)
    reconnectAttempts = 0
    showToast('Reconnected to real-time server', 'success', 2000)
  })
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Socket.IO reconnection attempt ${attemptNumber}`)
  })
  
  socket.on('reconnect_error', (error) => {
    console.error('Socket.IO reconnection error:', error)
  })
  
  socket.on('reconnect_failed', () => {
    console.error('Socket.IO reconnection failed')
    showToast('Failed to reconnect to real-time server', 'error', 5000)
  })
  
  // ==================== NOTIFICATION EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('notification', (notification) => {
    console.log('📨 Received notification via socket:', notification)
    
    const formattedNotification = {
      id: notification._id || notification.id,
      _id: notification._id || notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      data: notification.data || {},
      createdAt: notification.timestamp || notification.createdAt || new Date().toISOString(),
      isRead: false,
      read: false,
    }
    
    store.dispatch(addNotification(formattedNotification))
    store.dispatch(updateUnreadCount())
    // NO TOAST FOR NOTIFICATIONS
  })
  
  socket.on('notification:read:confirmed', (data) => {
    console.log('Notification read confirmation:', data)
    // NO TOAST
  })
  
  // ==================== MARKS EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('marks:entered', (data) => {
    console.log('Marks entered:', data)
    // NO TOAST
  })
  
  socket.on('marks:updated', (data) => {
    console.log('Marks updated:', data)
    // NO TOAST
  })
  
  socket.on('marks:bulk-entered', (data) => {
    console.log('Bulk marks entered:', data)
    // NO TOAST
  })
  
  socket.on('marks:finalized', (data) => {
    console.log('Marks finalized:', data)
    // NO TOAST
  })
  
  socket.on('marks:reviewed', (data) => {
    console.log('Marks reviewed:', data)
    // NO TOAST
  })
  
  // ==================== ATTENDANCE EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('attendance:updated', (data) => {
    console.log('Attendance updated:', data)
    // NO TOAST
  })
  
  socket.on('attendance:warning', (data) => {
    console.log('Attendance warning:', data)
    // NO TOAST
  })
  
  socket.on('attendance:bulk-updated', (data) => {
    console.log('Bulk attendance updated:', data)
    // NO TOAST
  })
  
  // ==================== EXAM EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('exam:created', (data) => {
    console.log('Exam created:', data)
    // NO TOAST
  })
  
  socket.on('exam:updated', (data) => {
    console.log('Exam updated:', data)
    // NO TOAST
  })
  
  socket.on('exam:published', (data) => {
    console.log('Exam published:', data)
    // NO TOAST
  })
  
  socket.on('exam:started', (data) => {
    console.log('Exam started:', data)
    // NO TOAST
  })
  
  // ==================== DUTY EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('duty:assigned', (data) => {
    console.log('Duty assigned:', data)
    // NO TOAST
  })
  
  socket.on('duties:auto-assigned', (data) => {
    console.log('Duties auto-assigned:', data)
    // NO TOAST
  })
  
  // ==================== STUDENT EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('student:added', (data) => {
    console.log('Student added:', data)
    // NO TOAST
  })
  
  socket.on('student:updated', (data) => {
    console.log('Student updated:', data)
    // NO TOAST
  })
  
  socket.on('student:deleted', (data) => {
    console.log('Student deleted:', data)
    // NO TOAST
  })
  
  socket.on('student:promoted', (data) => {
    console.log('Student promoted:', data)
    // NO TOAST
  })
  
  // ==================== CLASS EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('class:created', (data) => {
    console.log('Class created:', data)
    // NO TOAST
  })
  
  socket.on('class:updated', (data) => {
    console.log('Class updated:', data)
    // NO TOAST
  })
  
  socket.on('class:deleted', (data) => {
    console.log('Class deleted:', data)
    // NO TOAST
  })
  
  socket.on('class:teacher:assigned', (data) => {
    console.log('Class teacher assigned:', data)
    // NO TOAST
  })
  
  socket.on('timetable:updated', (data) => {
    console.log('Timetable updated:', data)
    // NO TOAST
  })
  
  // ==================== SUBJECT TEACHER EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('subject:teacher:assigned', (data) => {
    console.log('Subject teacher assigned:', data)
    // NO TOAST
  })
  
  socket.on('subject:teacher:removed', (data) => {
    console.log('Subject teacher removed:', data)
    // NO TOAST
  })
  
  // ==================== ACADEMIC YEAR EVENT HANDLERS (NO TOASTS) ====================
  
  socket.on('academicYear:created', (data) => {
    console.log('Academic year created:', data)
    // NO TOAST
  })
  
  socket.on('academicYear:updated', (data) => {
    console.log('Academic year updated:', data)
    // NO TOAST
  })
  
  socket.on('academicYear:deleted', (data) => {
    console.log('Academic year deleted:', data)
    // NO TOAST
  })
  
  socket.on('academicYear:set:current', (data) => {
    console.log('Current academic year set:', data)
    // NO TOAST
  })
  
  // ==================== USER EVENT HANDLERS ====================
  
  socket.on('user:online', (data) => {
    console.log(`${data.name} is online`)
  })
  
  socket.on('user:offline', (data) => {
    console.log(`${data.name} went offline`)
  })
  
  socket.on('user:joined', (data) => {
    console.log(`${data.name} joined the system`)
  })
  
  // ==================== ACTIVITY EVENT HANDLERS ====================
  
  socket.on('activity:created', (data) => {
    console.log('New activity:', data)
  })
  
  socket.on('recent:activities', (data) => {
    console.log('Recent activities:', data)
  })
  
  // ==================== DASHBOARD EVENT HANDLERS ====================
  
  socket.on('dashboard:updated', (data) => {
    console.log('Dashboard updated:', data)
  })
  
  socket.on('dashboard:stats', (data) => {
    console.log('Dashboard stats:', data)
  })
  
  // ==================== CONNECTION CONFIRMATION ====================
  
  socket.on('connected', (data) => {
    console.log('Connected confirmation:', data)
  })
  
  socket.on('joined:class', (data) => {
    console.log('Joined class:', data)
  })
  
  socket.on('subscribed:notifications', (data) => {
    console.log('Subscribed to notifications:', data)
  })
  
  socket.on('subscribed:updates', (data) => {
    console.log('Subscribed to updates:', data)
  })
  
  socket.on('subscribed:dashboard', (data) => {
    console.log('Subscribed to dashboard:', data)
  })
  
  socket.on('subscribed:activities', (data) => {
    console.log('Subscribed to activities:', data)
  })
  
  socket.on('subscribed:exams', (data) => {
    console.log('Subscribed to exams:', data)
  })
  
  socket.on('subscribed:marks', (data) => {
    console.log('Subscribed to marks:', data)
  })
  
  // ==================== HEARTBEAT ====================
  
  socket.on('heartbeat:response', (data) => {
    console.log(`Heartbeat response - Latency: ${data.latency}ms`)
  })
  
  // ==================== ERROR HANDLING ====================
  
  socket.on('error', (error) => {
    console.error('Socket error:', error)
    if (error.message === 'Authentication error') {
      showToast('Session expired. Please login again.', 'error', 5000)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
  })
  
  // ==================== DEBUG LOGGING ====================
  
  if (import.meta.env.DEV) {
    socket.onAny((event, ...args) => {
      console.log('Socket event:', event, args)
    })
  }
  
  return socket
}

/**
 * Disconnect Socket.IO connection
 */
export const disconnectSocket = () => {
  console.log('Disconnecting socket...')
  isManualDisconnect = true
  
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  
  if (socket) {
    socket.disconnect()
    socket = null
  }
  
  reconnectAttempts = 0
}

/**
 * Get current socket instance
 * @returns {object|null} Socket instance
 */
export const getSocket = () => socket

/**
 * Check if socket is connected
 * @returns {boolean}
 */
export const isSocketConnected = () => {
  const connected = socket && socket.connected
  console.log('isSocketConnected check:', connected)
  return connected
}

/**
 * Emit event through socket
 * @param {string} event - Event name
 * @param {object} data - Event data
 * @returns {boolean}
 */
export const emitEvent = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data)
    console.log(`Emitted ${event}:`, data)
    return true
  }
  console.warn(`Cannot emit ${event}: socket not connected`)
  return false
}

/**
 * Subscribe to a channel
 * @param {string} channel - Channel name
 */
export const subscribeToChannel = (channel) => {
  if (socket && socket.connected) {
    socket.emit(`subscribe:${channel}`, {})
    console.log(`Subscribed to channel: ${channel}`)
  }
}

/**
 * Unsubscribe from a channel
 * @param {string} channel - Channel name
 */
export const unsubscribeFromChannel = (channel) => {
  if (socket && socket.connected) {
    socket.emit(`unsubscribe:${channel}`, {})
    console.log(`Unsubscribed from channel: ${channel}`)
  }
}

/**
 * Join a room
 * @param {string} room - Room name
 */
export const joinRoom = (room) => {
  if (socket && socket.connected) {
    socket.emit('join:room', { room })
    console.log(`Joined room: ${room}`)
  }
}

/**
 * Leave a room
 * @param {string} room - Room name
 */
export const leaveRoom = (room) => {
  if (socket && socket.connected) {
    socket.emit('leave:room', { room })
    console.log(`Left room: ${room}`)
  }
}

/**
 * Wait for socket connection
 * @param {function} callback - Callback function
 * @param {number} maxAttempts - Maximum attempts
 * @param {number} interval - Interval between attempts
 */
export const waitForSocketConnection = (callback, maxAttempts = 10, interval = 500) => {
  let attempts = 0
  
  const checkConnection = () => {
    attempts++
    if (isSocketConnected()) {
      callback(true)
    } else if (attempts < maxAttempts) {
      setTimeout(checkConnection, interval)
    } else {
      callback(false)
    }
  }
  
  checkConnection()
}

export default {
  initSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  emitEvent,
  subscribeToChannel,
  unsubscribeFromChannel,
  joinRoom,
  leaveRoom,
  waitForSocketConnection,
}