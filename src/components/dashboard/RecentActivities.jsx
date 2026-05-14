// src/components/dashboard/RecentActivities.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { formatDistanceToNow } from 'date-fns'
import { fetchRecentActivities } from '../../services/analyticsService'
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
  SparklesIcon,
} from '@heroicons/react/24/outline'

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

const getIcon = (type) => {
  const Icon = activityIcons[type]
  if (Icon) return Icon
  return ClipboardDocumentCheckIcon
}

const getActivityDotColor = (type) => {
  const colors = {
    student_added: 'bg-emerald-500',
    student_updated: 'bg-blue-500',
    student_deleted: 'bg-rose-500',
    student_promoted: 'bg-purple-500',
    staff_added: 'bg-teal-500',
    staff_updated: 'bg-blue-500',
    exam_created: 'bg-indigo-500',
    exam_published: 'bg-amber-500',
    exam_results_published: 'bg-emerald-500',
    attendance_marked: 'bg-yellow-500',
    duty_assigned: 'bg-cyan-500',
    marks_entered: 'bg-violet-500',
    default: 'bg-gray-400',
  }
  return colors[type] || colors.default
}

const getActivityLabel = (type) => {
  const labels = {
    student_added: 'Student Added',
    student_updated: 'Student Updated',
    student_deleted: 'Student Deleted',
    student_promoted: 'Student Promoted',
    staff_added: 'Staff Added',
    staff_updated: 'Staff Updated',
    exam_created: 'Exam Created',
    exam_published: 'Exam Published',
    exam_results_published: 'Results Published',
    attendance_marked: 'Attendance Marked',
    duty_assigned: 'Duty Assigned',
    marks_entered: 'Marks Entered',
    marks_reviewed: 'Marks Reviewed',
    class_created: 'Class Created',
    default: 'Activity',
  }
  return labels[type] || type?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Activity'
}

const RecentActivities = () => {
  const dispatch = useDispatch()
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { socket, isConnected } = useSocket()

  const loadActivities = async () => {
    setIsLoading(true)
    try {
      const response = await fetchRecentActivities(10)
      // Handle both array and object responses
      const activitiesData = Array.isArray(response?.data) ? response.data : 
                            Array.isArray(response) ? response : 
                            response?.data?.activities || []
      setActivities(activitiesData.slice(0, 10))
    } catch (error) {
      console.error('Failed to load activities:', error)
      setActivities([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [])

  useEffect(() => {
    if (socket && isConnected) {
      const handleNewActivity = (activity) => {
        const formattedActivity = {
          id: activity._id || activity.id,
          title: activity.title || activity.description,
          description: activity.description,
          type: activity.activityType || activity.type,
          timestamp: activity.createdAt || activity.timestamp,
          performedByRole: activity.performedByRole,
          performedByName: activity.performedByName,
        }
        
        setActivities(prev => [formattedActivity, ...prev].slice(0, 10))
        dispatch(addActivity(formattedActivity))
      }

      socket.on('activity:created', handleNewActivity)
      socket.on('recent_activity:created', handleNewActivity)

      return () => {
        socket.off('activity:created', handleNewActivity)
        socket.off('recent_activity:created', handleNewActivity)
      }
    }
  }, [socket, isConnected, dispatch])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-900">Recent Activities</h2>
          </div>
          {!isConnected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full">
              <SparklesIcon className="w-3 h-3" />
              Reconnecting...
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Latest updates from your school</p>
      </div>

      {/* Activities List */}
      <div className="divide-y divide-gray-100">
        {activities.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No recent activities</p>
            <p className="text-xs text-gray-400 mt-1">Activities will appear here as they happen</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getIcon(activity.type)
            const dotColor = getActivityDotColor(activity.type)
            const label = getActivityLabel(activity.type)
            
            return (
              <div 
                key={activity.id || index} 
                className="px-4 py-3 hover:bg-gray-50/50 transition-colors duration-150 group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon with dot indicator */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${dotColor} rounded-full ring-2 ring-white`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.title || activity.description}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">
                        {activity.performedByRole || 'System'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {activity.timestamp ? 
                          formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 
                          'Just now'}
                      </span>
                    </div>
                    {activity.description && activity.description !== activity.title && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer with refresh indicator */}
      {activities.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Showing {activities.length} recent activities
            </span>
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentActivities