import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  theme: 'light',
  isLoading: false,
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  toast: {
    show: false,
    type: 'info',
    message: '',
    duration: 5000,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    showModal: (state, action) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data,
      }
    },
    hideModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null,
      }
    },
    showToast: (state, action) => {
      state.toast = {
        show: true,
        type: action.payload.type || 'info',
        message: action.payload.message,
        duration: action.payload.duration || 5000,
      }
    },
    hideToast: (state) => {
      state.toast.show = false
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLoading,
  showModal,
  hideModal,
  showToast,
  hideToast,
} = uiSlice.actions

export default uiSlice.reducer