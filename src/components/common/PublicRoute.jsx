import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    if (user?.role === 'outsource') {
      return <Navigate to="/outsource" replace />
    }
    if (user?.role === 'open') {
      return <Navigate to="/open/outsourcing" replace />
    }
    if (user?.role === 'administration') {
      return <Navigate to="/administration" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicRoute