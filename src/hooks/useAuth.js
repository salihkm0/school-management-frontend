import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, logout, getMe, changePassword } from '../store/authSlice'

const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth)

  const handleLogin = async (email, password, rememberMe) => {
    const result = await dispatch(login({ email, password, rememberMe }))
    if (result.payload?.success) {
      navigate('/dashboard')
      return true
    }
    return false
  }

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const handleGetMe = async () => {
    await dispatch(getMe())
  }

  const handleChangePassword = async (currentPassword, newPassword) => {
    const result = await dispatch(changePassword({ currentPassword, newPassword }))
    return result.payload?.success
  }

  const hasRole = (roles) => {
    if (!user) return false
    if (typeof roles === 'string') return user.role === roles
    return roles.includes(user.role)
  }

  const hasPermission = (permission) => {
    const permissions = {
      admin: ['*'],
      staff: ['view_students', 'view_attendance', 'enter_marks', 'view_classes'],
      parent: ['view_child_details', 'view_attendance', 'view_results'],
    }
    return permissions[user?.role]?.includes('*') || permissions[user?.role]?.includes(permission)
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    getMe: handleGetMe,
    changePassword: handleChangePassword,
    hasRole,
    hasPermission,
  }
}

export default useAuth