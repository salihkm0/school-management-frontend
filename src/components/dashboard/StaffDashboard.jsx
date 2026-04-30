import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpenIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import useSocket from '../../hooks/useSocket'
import { fetchDashboardStats, updateStats, addActivity } from '../../store/slices/dashboardSlice'

const StaffDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { stats, isLoading } = useSelector((state) => state.dashboard || { stats: {}, isLoading: false })
  const { user } = useSelector((state) => state.auth || {})
  const { socket, isConnected } = useSocket()
  
  const [todaySchedule, setTodaySchedule] = useState([
    { time: '9:00 AM', subject: 'Mathematics', class: '10-A', type: 'class' },
    { time: '10:00 AM', subject: 'Science', class: '9-B', type: 'class' },
    { time: '11:00 AM', subject: 'Staff Meeting', class: 'Staff Room', type: 'meeting' },
    { time: '12:00 PM', subject: 'Physics', class: '11-A', type: 'class' },
    { time: '2:00 PM', subject: 'Duty: Exam Invigilation', class: 'Hall 1', type: 'duty' },
  ])

  const [pendingTasks, setPendingTasks] = useState([
    { id: 1, title: 'Mark Attendance', deadline: 'Today 4:00 PM', priority: 'high', link: '/attendance' },
    { id: 2, title: 'Enter Exam Marks', deadline: 'Tomorrow', priority: 'medium', link: '/exams' },
    { id: 3, title: 'Submit Lesson Plans', deadline: 'This Week', priority: 'low', link: '/subjects' },
  ])

  const [upcomingDuties, setUpcomingDuties] = useState([
    { id: 1, date: 'Today', shift: 'Afternoon', type: 'Exam Invigilation', location: 'Hall 1' },
    { id: 2, date: 'Tomorrow', shift: 'Morning', type: 'Supervision', location: 'Playground' },
    { id: 3, date: 'Friday', shift: 'Full Day', type: 'Sports Event', location: 'Sports Complex' },
  ])

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  useEffect(() => {
    if (socket && isConnected) {
      const handleDashboardUpdate = (data) => {
        dispatch(updateStats(data))
      }

      socket.on('dashboard:updated', handleDashboardUpdate)
      socket.emit('subscribe:dashboard')

      return () => {
        socket.off('dashboard:updated', handleDashboardUpdate)
      }
    }
  }, [socket, isConnected, dispatch])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'class': return <BookOpenIcon className="w-4 h-4" />
      case 'meeting': return <UserGroupIcon className="w-4 h-4" />
      case 'duty': return <ClockIcon className="w-4 h-4" />
      default: return <CalendarIcon className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          {greeting()}, {user?.name?.split(' ')[0] || 'Teacher'}!
        </h1>
        <p className="text-blue-100 mt-1">
          Welcome to your staff dashboard. Here's your schedule and tasks for today.
        </p>
        {!isConnected && (
          <p className="text-xs text-blue-200 mt-2">
            ⚠️ Real-time connection lost. Some updates may be delayed.
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Classes Today</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
            <BookOpenIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Students</p>
              <p className="text-2xl font-bold text-gray-900">120</p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
            </div>
            <ClipboardDocumentListIcon className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance Today</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            <button 
              onClick={() => navigate('/attendance/timetable')}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              View Full Schedule →
            </button>
          </div>
          <div className="space-y-3">
            {todaySchedule.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${
                  item.type === 'class' ? 'bg-blue-100 text-blue-600' :
                  item.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.subject}</p>
                  <p className="text-xs text-gray-500">{item.class} • {item.time}</p>
                </div>
                {item.type === 'class' && (
                  <button className="text-xs text-primary-600">Take Attendance</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
            <span className="text-xs text-gray-500">{pendingTasks.length} tasks</span>
          </div>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(task.link)}>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">Deadline: {task.deadline}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Duties */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Duties</h2>
            <button 
              onClick={() => navigate('/duties')}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              View All Duties →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingDuties.map((duty) => (
              <div key={duty.id} className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-orange-700">{duty.type}</span>
                  <span className="text-xs text-gray-500">{duty.shift}</span>
                </div>
                <p className="text-xs text-gray-600">{duty.location}</p>
                <p className="text-xs text-orange-600 mt-2">📅 {duty.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard