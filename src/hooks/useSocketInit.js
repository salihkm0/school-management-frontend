// src/hooks/useSocketInit.js
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initSocket, disconnectSocket, isSocketConnected, getSocket } from '../services/socketService'
import { setConnected, setSocket, incrementReconnectAttempts, resetReconnectAttempts } from '../store/slices/socketSlice'

export const useSocketInit = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth)
  const { isConnected } = useSelector((state) => state.socket)
  const initAttempted = useRef(false)
  const heartbeatInterval = useRef(null)

  useEffect(() => {
    const userId = user?.id || user?._id
    console.log('useSocketInit - isAuthenticated:', isAuthenticated, 'userId:', userId, 'isLoading:', isLoading)
    
    if (!isLoading && isAuthenticated && userId && !initAttempted.current) {
      initAttempted.current = true
      
      // Check if already connected
      if (isSocketConnected()) {
        console.log('Socket already connected')
        dispatch(setConnected(true))
        dispatch(setSocket(getSocket()))
        return
      }
      
      console.log('Initializing new socket connection')
      const socket = initSocket(userId, user.role)
      
      if (socket) {
        dispatch(setSocket(socket))
        dispatch(setConnected(socket.connected))
        
        // Setup heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current)
        }
        
        heartbeatInterval.current = setInterval(() => {
          if (socket && socket.connected) {
            socket.emit('heartbeat', { 
              timestamp: new Date().toISOString(),
              userId: userId
            })
          }
        }, 20000)
        
        // Socket event listeners
        const handleConnect = () => {
          console.log('✅ Socket connected in Redux')
          dispatch(setConnected(true))
          dispatch(resetReconnectAttempts())
        }
        
        const handleDisconnect = () => {
          console.log('❌ Socket disconnected in Redux')
          dispatch(setConnected(false))
        }
        
        const handleConnectError = () => {
          dispatch(incrementReconnectAttempts())
        }
        
        socket.on('connect', handleConnect)
        socket.on('disconnect', handleDisconnect)
        socket.on('connect_error', handleConnectError)
        
        return () => {
          socket.off('connect', handleConnect)
          socket.off('disconnect', handleDisconnect)
          socket.off('connect_error', handleConnectError)
          if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current)
          }
          disconnectSocket()
          dispatch(setConnected(false))
          dispatch(setSocket(null))
          initAttempted.current = false
        }
      }
    } else if (!isLoading && !isAuthenticated) {
      if (isSocketConnected()) {
        disconnectSocket()
      }
      dispatch(setConnected(false))
      dispatch(setSocket(null))
      initAttempted.current = false
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }
    }
  }, [isAuthenticated, user, isLoading, dispatch])

  return { isConnected }
}

export default useSocketInit