// src/components/settings/SystemSettings.jsx
import React, { useState } from 'react'
import { ShieldCheckIcon, ArrowPathIcon, CloudArrowDownIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const SystemSettings = () => {
  const [isBackupLoading, setIsBackupLoading] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)

  const handleBackup = async () => {
    setIsBackupLoading(true)
    try {
      // Simulate backup - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Database backup created successfully')
    } catch (error) {
      toast.error('Failed to create backup')
    } finally {
      setIsBackupLoading(false)
    }
  }

  const handleClearCache = async () => {
    setIsClearingCache(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Cache cleared successfully')
    } catch (error) {
      toast.error('Failed to clear cache')
    } finally {
      setIsClearingCache(false)
    }
  }

  const gradingScales = [
    { grade: 'A+', min: 90, max: 100, color: 'bg-emerald-100 text-emerald-700' },
    { grade: 'A', min: 80, max: 89, color: 'bg-green-100 text-green-700' },
    { grade: 'B+', min: 70, max: 79, color: 'bg-blue-100 text-blue-700' },
    { grade: 'B', min: 60, max: 69, color: 'bg-cyan-100 text-cyan-700' },
    { grade: 'C+', min: 50, max: 59, color: 'bg-amber-100 text-amber-700' },
    { grade: 'C', min: 40, max: 49, color: 'bg-orange-100 text-orange-700' },
    { grade: 'D', min: 33, max: 39, color: 'bg-rose-100 text-rose-700' },
    { grade: 'F', min: 0, max: 32, color: 'bg-gray-100 text-gray-600' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">System Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">Configure system-wide settings and preferences</p>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">System Actions</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Database Backup</p>
              <p className="text-xs text-gray-500">Create a backup of the entire database</p>
            </div>
            <button onClick={handleBackup} disabled={isBackupLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <CloudArrowDownIcon className="w-4 h-4" />
              <span>{isBackupLoading ? 'Backing up...' : 'Backup Now'}</span>
            </button>
          </div>
          
          <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Clear Cache</p>
              <p className="text-xs text-gray-500">Clear application cache for better performance</p>
            </div>
            <button onClick={handleClearCache} disabled={isClearingCache} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
              <ArrowPathIcon className="w-4 h-4" />
              <span>{isClearingCache ? 'Clearing...' : 'Clear Cache'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grading System */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-900">Grading System</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Standard grading scale used for evaluation</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gradingScales.map((scale) => (
              <div key={scale.grade} className="bg-gray-50 rounded-lg p-2 text-center">
                <span className={`inline-flex px-2 py-0.5 text-sm font-bold rounded ${scale.color}`}>
                  {scale.grade}
                </span>
                <p className="text-xs text-gray-500 mt-1">{scale.min}% - {scale.max}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-start gap-2">
          <CheckCircleIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">System Information</p>
            <p className="text-xs text-blue-700 mt-1">
              Version: 2.0.0 | Environment: Production | Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings