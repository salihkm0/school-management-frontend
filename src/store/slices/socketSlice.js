// src/store/slices/socketSlice.js
import { createSlice } from '@reduxjs/toolkit'
import { initSocket, disconnectSocket, isSocketConnected, getSocket } from '../../services/socketService'

const initialState = {
  isConnected: false,
  socket: null,
  reconnectAttempts: 0,
}

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.isConnected = action.payload
    },
    setSocket: (state, action) => {
      state.socket = action.payload
    },
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1
    },
    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0
    },
  },
})

export const { setConnected, setSocket, incrementReconnectAttempts, resetReconnectAttempts } = socketSlice.actions
export default socketSlice.reducer