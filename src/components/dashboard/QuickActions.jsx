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
} from '@heroicons/react/24/outline'

const actionsByRole = {
  admin: [
    { label: 'Add Student', icon: UserPlusIcon, path: '/students/new', color: 'bg-emerald-500', bgHover: 'hover:bg-emerald-50' },
    { label: 'Add Staff', icon: UserGroupIcon, path: '/staff/new', color: 'bg-blue-500', bgHover: 'hover:bg-blue-50' },
    { label: 'Create Exam', icon: DocumentPlusIcon, path: '/exams/new', color: 'bg-purple-500', bgHover: 'hover:bg-purple-50' },
    { label: 'Mark Attendance', icon: CalendarDaysIcon, path: '/attendance/bulk', color: 'bg-amber-500', bgHover: 'hover:bg-amber-50' },
    { label: 'Generate Report', icon: ChartBarIcon, path: '/reports', color: 'bg-rose-500', bgHover: 'hover:bg-rose-50' },
    { label: 'Send Notification', icon: MegaphoneIcon, path: '/notifications/send', color: 'bg-indigo-500', bgHover: 'hover:bg-indigo-50' },
  ],
  staff: [
    { label: 'Mark Attendance', icon: CalendarDaysIcon, path: '/attendance', color: 'bg-amber-500', bgHover: 'hover:bg-amber-50' },
    { label: 'Enter Marks', icon: ClipboardDocumentListIcon, path: '/exams/marks', color: 'bg-purple-500', bgHover: 'hover:bg-purple-50' },
    { label: 'View Schedule', icon: CalendarDaysIcon, path: '/classes/timetable', color: 'bg-blue-500', bgHover: 'hover:bg-blue-50' },
    { label: 'Generate Report', icon: ChartBarIcon, path: '/reports', color: 'bg-rose-500', bgHover: 'hover:bg-rose-50' },
  ],
  parent: [
    { label: 'View Progress', icon: ChartBarIcon, path: '/reports/child', color: 'bg-emerald-500', bgHover: 'hover:bg-emerald-50' },
    { label: 'Check Attendance', icon: CalendarDaysIcon, path: '/attendance', color: 'bg-amber-500', bgHover: 'hover:bg-amber-50' },
    { label: 'Exam Schedule', icon: CalendarDaysIcon, path: '/exams/schedule', color: 'bg-purple-500', bgHover: 'hover:bg-purple-50' },
  ],
}

const QuickActions = ({ userRole }) => {
  const navigate = useNavigate()
  const actions = actionsByRole[userRole] || actionsByRole.parent

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="text-sm text-gray-500 mt-0.5">Common tasks at your fingertips</p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center p-4 rounded-xl ${action.bgHover} transition-all group hover:shadow-sm`}
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuickActions