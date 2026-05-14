// src/components/dashboard/QuickActions.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlusIcon,
  DocumentPlusIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  UserGroupIcon,
  AcademicCapIcon,
  EyeIcon,
  BellIcon,
} from '@heroicons/react/24/outline'

const actionsByRole = {
  admin: [
    { label: 'Add Student', icon: UserPlusIcon, path: '/students/new', color: 'bg-blue-500' },
    { label: 'Add Staff', icon: UserGroupIcon, path: '/staff/new', color: 'bg-emerald-500' },
    { label: 'Create Exam', icon: DocumentPlusIcon, path: '/exams/new', color: 'bg-purple-500' },
    { label: 'Mark Attendance', icon: CalendarDaysIcon, path: '/attendance/bulk', color: 'bg-amber-500' },
    { label: 'Generate Report', icon: ChartBarIcon, path: '/reports', color: 'bg-rose-500' },
    { label: 'Send Notification', icon: MegaphoneIcon, path: '/notifications/send', color: 'bg-indigo-500' },
  ],
  staff: [
    { label: 'Mark Attendance', icon: CalendarDaysIcon, path: '/attendance', color: 'bg-amber-500' },
    { label: 'Enter Marks', icon: ClipboardDocumentListIcon, path: '/exams/marks', color: 'bg-purple-500' },
    { label: 'View Schedule', icon: CalendarDaysIcon, path: '/classes/timetable', color: 'bg-blue-500' },
    { label: 'Generate Report', icon: ChartBarIcon, path: '/reports', color: 'bg-rose-500' },
  ],
  parent: [
    { label: 'View Progress', icon: ChartBarIcon, path: '/reports/child', color: 'bg-emerald-500' },
    { label: 'Check Attendance', icon: CalendarDaysIcon, path: '/attendance', color: 'bg-amber-500' },
    { label: 'Exam Schedule', icon: CalendarDaysIcon, path: '/exams/schedule', color: 'bg-purple-500' },
  ],
}

const QuickActions = ({ userRole }) => {
  const navigate = useNavigate()
  const actions = actionsByRole[userRole] || actionsByRole.parent

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
        <p className="text-xs text-gray-500 mt-0.5">Common tasks at your fingertips</p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-all group"
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} bg-opacity-10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-5 h-5 ${action.color.replace('bg', 'text')}`} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center line-clamp-1">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuickActions