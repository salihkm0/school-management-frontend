import React from 'react'

const SystemSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure system-wide settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div><p className="font-medium text-gray-900">Maintenance Mode</p><p className="text-sm text-gray-500">Put the system in maintenance mode</p></div>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Enable</button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div><p className="font-medium text-gray-900">Backup Database</p><p className="text-sm text-gray-500">Create a backup of the database</p></div>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">Backup Now</button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div><p className="font-medium text-gray-900">Clear Cache</p><p className="text-sm text-gray-500">Clear application cache</p></div>
            <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg">Clear Cache</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grading System</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2"><span className="text-gray-700">A+</span><span className="text-gray-500">90% - 100%</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-gray-700">A</span><span className="text-gray-500">80% - 89%</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-gray-700">B+</span><span className="text-gray-500">70% - 79%</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-gray-700">B</span><span className="text-gray-500">60% - 69%</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-gray-700">C+</span><span className="text-gray-500">50% - 59%</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-gray-700">C</span><span className="text-gray-500">40% - 49%</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-gray-700">D</span><span className="text-gray-500">33% - 39%</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-gray-700">F</span><span className="text-gray-500">Below 33%</span></div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings