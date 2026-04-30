import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import StatsCards from './StatsCards'
import RecentActivities from './RecentActivities'
import Charts from './Charts'
import QuickActions from './QuickActions'
import { fetchDashboardStats } from '../../store/slices/dashboardSlice'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { stats, isLoading } = useSelector((state) => state.dashboard)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">{greeting()}, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-primary-100 mt-1">Welcome back to your dashboard. Here's what's happening with your school today.</p>
      </div>

      <StatsCards stats={stats} isLoading={isLoading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><Charts /></div>
        <div className="lg:col-span-1"><QuickActions userRole={user?.role} /></div>
      </div>
      
      <RecentActivities />
    </div>
  )
}

export default Dashboard