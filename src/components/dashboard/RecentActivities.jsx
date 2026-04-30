// src/components/dashboard/RecentActivities.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { formatDistanceToNow } from 'date-fns'
import { fetchRecentActivities } from '../../services/analyticsService'  // ADD THIS IMPORT
import { addActivity } from '../../store/slices/dashboardSlice'
import useSocket from '../../hooks/useSocket'
import {
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  MegaphoneIcon,
  BookOpenIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  BellAlertIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  KeyIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../common/LoadingSpinner'

const activityIcons = {
  student_added: UserPlusIcon,
  student_updated: PencilSquareIcon,
  student_deleted: TrashIcon,
  student_promoted: AcademicCapIcon,
  student_transferred: UserPlusIcon,
  student_graduated: AcademicCapIcon,
  staff_added: UserGroupIcon,
  staff_updated: PencilSquareIcon,
  staff_deleted: TrashIcon,
  staff_role_changed: PencilSquareIcon,
  exam_created: BookOpenIcon,
  exam_updated: PencilSquareIcon,
  exam_deleted: TrashIcon,
  exam_published: MegaphoneIcon,
  exam_results_published: ChartBarIcon,
  marks_entered: ClipboardDocumentCheckIcon,
  marks_updated: PencilSquareIcon,
  marks_finalized: CheckCircleIcon,
  marks_reviewed: EyeIcon,
  attendance_marked: CalendarIcon,
  attendance_updated: PencilSquareIcon,
  attendance_warning_sent: BellAlertIcon,
  duty_assigned: ClipboardDocumentCheckIcon,
  duty_updated: PencilSquareIcon,
  duty_auto_assigned: ClockIcon,
  class_created: BuildingOfficeIcon,
  class_updated: PencilSquareIcon,
  class_deleted: TrashIcon,
  class_teacher_assigned: UserGroupIcon,
  subject_created: BookOpenIcon,
  subject_updated: PencilSquareIcon,
  subject_deleted: TrashIcon,
  subject_assigned: ClipboardDocumentCheckIcon,
  notification_sent: MegaphoneIcon,
  notification_bulk_sent: MegaphoneIcon,
  user_login: ArrowRightIcon,
  user_logout: ArrowLeftIcon,
  password_changed: KeyIcon,
  data_imported: DocumentArrowUpIcon,
  data_exported: DocumentArrowDownIcon,
  system_backup: CloudArrowUpIcon,
  system_restore: CloudArrowDownIcon,
}

const activityColors = {
  student_added: 'bg-green-100 text-green-600',
  student_updated: 'bg-blue-100 text-blue-600',
  student_deleted: 'bg-red-100 text-red-600',
  student_promoted: 'bg-purple-100 text-purple-600',
  staff_added: 'bg-teal-100 text-teal-600',
  staff_updated: 'bg-blue-100 text-blue-600',
  exam_created: 'bg-indigo-100 text-indigo-600',
  exam_published: 'bg-amber-100 text-amber-600',
  exam_results_published: 'bg-emerald-100 text-emerald-600',
  attendance_marked: 'bg-yellow-100 text-yellow-600',
  attendance_warning_sent: 'bg-orange-100 text-orange-600',
  duty_assigned: 'bg-cyan-100 text-cyan-600',
  duty_auto_assigned: 'bg-sky-100 text-sky-600',
  class_created: 'bg-lime-100 text-lime-600',
  marks_entered: 'bg-violet-100 text-violet-600',
  marks_reviewed: 'bg-fuchsia-100 text-fuchsia-600',
  default: 'bg-gray-100 text-gray-600',
}

const getIcon = (type) => {
  const Icon = activityIcons[type]
  if (Icon) return Icon
  return ClipboardDocumentCheckIcon
}

const RecentActivities = () => {
  const dispatch = useDispatch()
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { socket, isConnected } = useSocket()

  const loadActivities = async () => {
    setIsLoading(true)
    try {
      const data = await fetchRecentActivities(10)
      setActivities(data || [])
    } catch (error) {
      console.error('Failed to load activities:', error)
      setActivities([])
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadActivities()
  }, [])

  // Socket listener for real-time activities
  useEffect(() => {
    if (socket && isConnected) {
      console.log('Setting up activity socket listeners')

      const handleNewActivity = (activity) => {
        console.log('New activity via socket:', activity)
        
        const formattedActivity = {
          id: activity._id || activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.activityType || activity.type,
          timestamp: activity.createdAt || activity.timestamp,
          performedByRole: activity.performedByRole
        }
        
        // Add to local state
        setActivities(prev => [formattedActivity, ...prev].slice(0, 10))
        
        // Also dispatch to Redux for dashboard sync
        dispatch(addActivity(formattedActivity))
      }

      socket.on('activity:created', handleNewActivity)

      return () => {
        socket.off('activity:created', handleNewActivity)
      }
    }
  }, [socket, isConnected, dispatch])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <p className="text-sm text-gray-500 mt-1">Latest updates from your school</p>
          </div>
          {!isConnected && (
            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
              Reconnecting...
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ClockIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p>No recent activities</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getIcon(activity.type || activity.activityType)
            const colorClass = activityColors[activity.type || activity.activityType] || activityColors.default
            
            return (
              <div key={activity.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.title || activity.description}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp || activity.createdAt), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {activity.performedByRole || 'system'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default RecentActivities