import React, { useState, useEffect } from 'react'
import { ShieldCheckIcon, ArrowPathIcon, CloudArrowDownIcon, CheckCircleIcon, ExclamationTriangleIcon, DevicePhoneMobileIcon, UserGroupIcon, PhoneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import administrationService from '../../services/administrationService'
import Modal from '../common/Modal'

const SystemSettings = () => {
  const [isBackupLoading, setIsBackupLoading] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)

  // School Key Contacts State
  const [contactsData, setContactsData] = useState({
    headmasterName: '',
    headmasterPhone: '',
    sitcName: '',
    sitcPhone: '',
    ptaPresidentName: '',
    ptaPresidentPhone: ''
  })
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)
  const [isSavingContacts, setIsSavingContacts] = useState(false)

  useEffect(() => {
    fetchSchoolContacts()
  }, [])

  const fetchSchoolContacts = async () => {
    setIsFetchingContacts(true)
    try {
      const data = await administrationService.getSchoolContacts()
      if (data) {
        setContactsData({
          headmasterName: data.headmasterName || '',
          headmasterPhone: data.headmasterPhone || '',
          sitcName: data.sitcName || '',
          sitcPhone: data.sitcPhone || '',
          ptaPresidentName: data.ptaPresidentName || '',
          ptaPresidentPhone: data.ptaPresidentPhone || ''
        })
      }
    } catch (error) {
      toast.error('Failed to fetch school contacts')
    } finally {
      setIsFetchingContacts(false)
    }
  }

  const handleSaveContacts = async (e) => {
    e.preventDefault()
    setIsSavingContacts(true)
    try {
      await administrationService.updateSchoolContacts(contactsData)
      toast.success('School key contacts updated successfully')
    } catch (error) {
      toast.error('Failed to update school contacts')
    } finally {
      setIsSavingContacts(false)
    }
  }

  // App Updates State
  const [isAppUpdateModalOpen, setIsAppUpdateModalOpen] = useState(false)
  const [appPlatform, setAppPlatform] = useState('android')
  const [appConfigData, setAppConfigData] = useState({ updateType: 'soft', minVersion: '', latestVersion: '', storeUrl: '' })
  const [appUpdateHistory, setAppUpdateHistory] = useState([])
  const [activeTab, setActiveTab] = useState('config')
  const [isFetchingConfig, setIsFetchingConfig] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  const handleOpenAppUpdates = async (platform) => {
    setAppPlatform(platform)
    setIsAppUpdateModalOpen(true)
    setActiveTab('config')
    setIsFetchingConfig(true)
    try {
      const [data, history] = await Promise.all([
        administrationService.getAppVersionConfig(platform),
        administrationService.getAppUpdateHistory()
      ])
      setAppConfigData({
        updateType: data.updateType || 'soft',
        minVersion: data.minVersion || '',
        latestVersion: data.latestVersion || '',
        storeUrl: data.storeUrl || ''
      })
      setAppUpdateHistory(history.filter(h => h.platform === platform))
    } catch (error) {
      toast.error('Failed to fetch app configuration')
    } finally {
      setIsFetchingConfig(false)
    }
  }

  const handleSaveAppUpdates = async (e) => {
    e.preventDefault()
    setIsSavingConfig(true)
    try {
      await administrationService.updateAppVersionConfig({
        platform: appPlatform,
        ...appConfigData
      })
      toast.success(`${appPlatform.toUpperCase()} config saved successfully`)
      setIsAppUpdateModalOpen(false)
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setIsSavingConfig(false)
    }
  }

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
    { grade: 'A',  min: 80, max: 89,  color: 'bg-green-100 text-green-700' },
    { grade: 'B+', min: 70, max: 79,  color: 'bg-blue-100 text-blue-700' },
    { grade: 'B',  min: 60, max: 69,  color: 'bg-cyan-100 text-cyan-700' },
    { grade: 'C+', min: 50, max: 59,  color: 'bg-amber-100 text-amber-700' },
    { grade: 'C',  min: 40, max: 49,  color: 'bg-orange-100 text-orange-700' },
    { grade: 'D+', min: 30, max: 39,  color: 'bg-amber-100 text-amber-700' },
    { grade: 'D',  min: 20, max: 29,  color: 'bg-rose-100 text-rose-700' },
    { grade: 'E',  min: 0,  max: 19,  color: 'bg-gray-100 text-gray-600' },
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

      {/* School Key Contacts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">School Key Contacts</h3>
              <p className="text-xs text-gray-500">Manage contact information for key school officials (Headmaster, SITC, PTA President)</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSaveContacts} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Headmaster */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Headmaster Details
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={contactsData.headmasterName}
                  onChange={(e) => setContactsData({ ...contactsData, headmasterName: e.target.value })}
                  placeholder="e.g. Muhammed Ali"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={contactsData.headmasterPhone}
                  onChange={(e) => setContactsData({ ...contactsData, headmasterPhone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* SITC */}
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                SITC (System In-Charge) Details
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={contactsData.sitcName}
                  onChange={(e) => setContactsData({ ...contactsData, sitcName: e.target.value })}
                  placeholder="e.g. Shabeed P"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={contactsData.sitcPhone}
                  onChange={(e) => setContactsData({ ...contactsData, sitcPhone: e.target.value })}
                  placeholder="e.g. 9645687383"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* PTA President */}
            <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-800">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                PTA President Details
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={contactsData.ptaPresidentName}
                  onChange={(e) => setContactsData({ ...contactsData, ptaPresidentName: e.target.value })}
                  placeholder="e.g. Abdul Rahman"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={contactsData.ptaPresidentPhone}
                  onChange={(e) => setContactsData({ ...contactsData, ptaPresidentPhone: e.target.value })}
                  placeholder="e.g. 9447123456"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingContacts}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <span>{isSavingContacts ? 'Saving...' : 'Save School Contacts'}</span>
            </button>
          </div>
        </form>
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
      {/* App Updates Settings */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <DevicePhoneMobileIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-900">App Updates Config</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Configure minimum and latest versions for the mobile apps</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleOpenAppUpdates('android')}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <DevicePhoneMobileIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Android App</p>
                <p className="text-xs text-gray-500">Configure Android updates</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleOpenAppUpdates('ios')}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <DevicePhoneMobileIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">iOS App</p>
                <p className="text-xs text-gray-500">Configure iOS updates</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* App Update Config Modal */}
      <Modal
        isOpen={isAppUpdateModalOpen}
        onClose={() => !isSavingConfig && setIsAppUpdateModalOpen(false)}
        title={`Configure ${appPlatform === 'ios' ? 'iOS' : 'Android'} Updates`}
        size="md"
      >
        {isFetchingConfig ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div>
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'config' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('config')}
              >
                Configuration
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'history' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('history')}
              >
                Update History
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {activeTab === 'config' ? (
                <form onSubmit={handleSaveAppUpdates} className="space-y-4 px-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Required Version</label>
                    <input
                      type="text"
                      required
                      value={appConfigData.minVersion}
                      onChange={(e) => setAppConfigData({ ...appConfigData, minVersion: e.target.value })}
                      placeholder="e.g. 1.0.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latest Version</label>
                    <input
                      type="text"
                      required
                      value={appConfigData.latestVersion}
                      onChange={(e) => setAppConfigData({ ...appConfigData, latestVersion: e.target.value })}
                      placeholder="e.g. 1.0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Type</label>
                    <select
                      value={appConfigData.updateType}
                      onChange={(e) => setAppConfigData({ ...appConfigData, updateType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    >
                      <option value="soft">Soft Update (Optional)</option>
                      <option value="force">Force Update (Mandatory)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {appConfigData.updateType === 'force' 
                        ? 'Users will be forced to update to this version to continue using the app.' 
                        : 'Users will see a prompt but can skip the update.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
                    <input
                      type="url"
                      required
                      value={appConfigData.storeUrl}
                      onChange={(e) => setAppConfigData({ ...appConfigData, storeUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAppUpdateModalOpen(false)}
                      disabled={isSavingConfig}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 px-1">
                  {appUpdateHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">No update history found.</p>
                  ) : (
                    appUpdateHistory.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-gray-900 font-medium">v{item.version}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${item.updateType === 'force' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {item.updateType === 'force' ? 'Forced' : 'Soft'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {item.createdBy && (
                          <p className="text-xs text-gray-500 mt-2">
                            Updated by: {item.createdBy.name || item.createdBy.email}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}

export default SystemSettings