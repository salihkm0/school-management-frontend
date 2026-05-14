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
  { key: 'totalStudents', label: 'Total Students', icon: UsersIcon, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', textColor: 'text-blue-600' },
  { key: 'totalStaff', label: 'Total Staff', icon: UserGroupIcon, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', textColor: 'text-emerald-600' },
  { key: 'totalClasses', label: 'Total Classes', icon: AcademicCapIcon, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', textColor: 'text-purple-600' },
  { key: 'currentExams', label: 'Active Exams', icon: BookOpenIcon, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', textColor: 'text-amber-600' },
  { key: 'attendanceToday', label: 'Attendance', icon: CalendarIcon, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', textColor: 'text-teal-600' },
  { key: 'fullAPlusCount', label: 'A+ Students', icon: ChartBarIcon, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', textColor: 'text-rose-600' },
]

const StatsCards = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-7 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsConfig.map((config) => (
        <div
          key={config.key}
          className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <config.icon className={`w-4 h-4 ${config.textColor}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {stats?.[config.key]?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{config.label}</p>
          </div>
          <div className={`h-0.5 bg-gradient-to-r ${config.color} w-0 group-hover:w-full transition-all duration-300`}></div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards