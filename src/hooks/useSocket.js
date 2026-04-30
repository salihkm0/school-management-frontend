// src/hooks/useSocket.js
import { useSelector } from 'react-redux'

const useSocket = () => {
  const { isConnected, socket } = useSelector((state) => state.socket)
  
  return { 
    socket, 
    isConnected,
    isSocketReady: () => isConnected
  }
}

export default useSocket