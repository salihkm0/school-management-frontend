import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect open user to their dashboard if they try to access admin routes
    if (user.role === 'open') {
      return <Navigate to="/open/marklist/2025-2026" replace />
    }
    // Redirect others to home
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute