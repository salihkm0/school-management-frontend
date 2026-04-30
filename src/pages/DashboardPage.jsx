import React from 'react'
import { useSelector } from 'react-redux'
import AdminDashboard from '../components/dashboard/AdminDashboard'
import StaffDashboard from '../components/dashboard/StaffDashboard'
import ParentDashboard from '../components/dashboard/ParentDashboard'

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth || {})
  const userRole = user?.role || 'parent'

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch(userRole) {
      case 'admin':
        return <AdminDashboard />
      case 'staff':
        return <StaffDashboard />
      case 'parent':
        return <ParentDashboard />
      default:
        return <ParentDashboard />
    }
  }

  return renderDashboard()
}

export default DashboardPage