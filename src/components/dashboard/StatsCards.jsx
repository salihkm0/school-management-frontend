// src/components/dashboard/StatsCards.jsx
import React from 'react'
import {
  UsersIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  
} from '@heroicons/react/24/outline'

const statsConfig = [
  { key: 'totalStudents', label: 'Total Students', icon: UsersIcon, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
  { key: 'totalStaff', label: 'Total Staff', icon: UserGroupIcon, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
  { key: 'totalClasses', label: 'Total Classes', icon: AcademicCapIcon, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
  { key: 'currentExams', label: 'Active Exams', icon: BookOpenIcon, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
  { key: 'attendanceToday', label: 'Present Today', icon: CalendarIcon, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50' },
  { key: 'fullAPlusCount', label: 'A+ Students', icon: ChartBarIcon, color: 'from-red-500 to-red-600', bg: 'bg-red-50' },
]

const StatsCards = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
      {statsConfig.map((config) => (
        <div
          key={config.key}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <config.icon className={`w-5 h-5 text-${config.color.split('-')[1]}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.[config.key]?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">{config.label}</p>
          </div>
          <div className={`h-1 bg-gradient-to-r ${config.color} w-0 group-hover:w-full transition-all duration-300`}></div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards