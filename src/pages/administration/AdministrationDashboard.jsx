import React, { useEffect, useState } from 'react';
import administrationService from '../../services/administrationService';
import { ServerIcon, Cpu, HardDrive, Clock, Database, Activity, Users, Shield, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, glowing = false }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
    {glowing && (
      <div className={`absolute -inset-0.5 opacity-20 group-hover:opacity-40 blur transition duration-1000 group-hover:duration-200 ${colorClass.replace('text-', 'bg-')}`}></div>
    )}
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
        <div className={`p-2 rounded-lg bg-gray-800/50 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {subtitle && <span className="text-sm font-medium text-gray-500">{subtitle}</span>}
      </div>
    </div>
  </div>
);

const AdministrationDashboard = () => {
  const [health, setHealth] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false); // We don't fetch initially for simplicity, assume false until toggled or could fetch.

  // App Updates Config State
  const [isAppUpdateModalOpen, setIsAppUpdateModalOpen] = useState(false);
  const [appPlatform, setAppPlatform] = useState('android');
  const [appConfigData, setAppConfigData] = useState({ updateType: 'soft', minVersion: '', latestVersion: '', storeUrl: '' });
  const [appUpdateHistory, setAppUpdateHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('config');
  const [isFetchingConfig, setIsFetchingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const handleOpenAppUpdates = async (platform) => {
    setAppPlatform(platform);
    setIsAppUpdateModalOpen(true);
    setActiveTab('config');
    setIsFetchingConfig(true);
    try {
      const [data, history] = await Promise.all([
        administrationService.getAppVersionConfig(platform),
        administrationService.getAppUpdateHistory()
      ]);
      setAppConfigData({
        updateType: data.updateType || 'soft',
        minVersion: data.minVersion || '',
        latestVersion: data.latestVersion || '',
        storeUrl: data.storeUrl || ''
      });
      setAppUpdateHistory(history.filter(h => h.platform === platform));
    } catch (error) {
      toast.error('Failed to fetch app configuration');
    } finally {
      setIsFetchingConfig(false);
    }
  };

  const handleSaveAppUpdates = async (e) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await administrationService.updateAppVersionConfig({
        platform: appPlatform,
        ...appConfigData
      });
      toast.success(`${appPlatform.toUpperCase()} config saved successfully`);
      setIsAppUpdateModalOpen(false);
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [healthData, dbData, usersData] = await Promise.all([
        administrationService.getSystemHealth(),
        administrationService.getDbStats(),
        administrationService.getActiveUsers()
      ]);
      setHealth(healthData);
      setDbStats(dbData.data);
      setActiveUsers(usersData.count);
    } catch (error) {
      toast.error('Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    if (window.confirm("Are you sure you want to clear all system caches? This will temporarily increase database load.")) {
      try {
        setClearingCache(true);
        await administrationService.clearCache();
        toast.success("Cache cleared successfully");
      } catch (err) {
        toast.error("Failed to clear cache");
      } finally {
        setClearingCache(false);
      }
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const newState = !maintenanceMode;
      await administrationService.toggleMaintenanceMode(newState);
      setMaintenanceMode(newState);
      toast.success(`Maintenance mode turned ${newState ? 'ON' : 'OFF'}`);
    } catch (err) {
      toast.error("Failed to toggle maintenance mode");
    }
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Formatting helpers
  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const memUsageStr = health ? formatBytes(health.memoryUsage.heapUsed) : '0';
  const memTotalStr = health ? formatBytes(health.memoryUsage.heapTotal) : '0';
  const cpuLoadStr = health && health.cpuLoad ? health.cpuLoad[0].toFixed(2) : '0';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Health</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time monitoring metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClearCache}
            disabled={clearingCache}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-700 flex items-center gap-2"
          >
            <Trash2 className={`w-4 h-4 ${clearingCache ? 'animate-bounce' : ''}`} />
            Clear Cache
          </button>
          <button 
            onClick={handleToggleMaintenance}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2 ${
              maintenanceMode 
                ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' 
                : 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
            }`}
          >
            <Power className="w-4 h-4" />
            {maintenanceMode ? 'Maintenance ON' : 'Maintenance OFF'}
          </button>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Server Uptime"
          value={health ? formatUptime(health.uptime) : '0d 0h'}
          icon={Clock}
          colorClass="text-blue-400"
          glowing={true}
        />
        
        <StatCard
          title="CPU Load (1m)"
          value={`${cpuLoadStr}%`}
          subtitle="avg load"
          icon={Cpu}
          colorClass="text-emerald-400"
        />

        <StatCard
          title="Active Users"
          value={activeUsers}
          subtitle="online now"
          icon={Users}
          colorClass="text-pink-400"
          glowing={activeUsers > 0}
        />

        <StatCard
          title="Database"
          value={health?.dbStatus === 'connected' ? 'Online' : 'Offline'}
          icon={Database}
          colorClass={health?.dbStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}
          glowing={health?.dbStatus === 'connected'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Advanced Details Panel */}
        {health && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <ServerIcon className="w-5 h-5 text-gray-400" />
              Detailed Metrics
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm font-mono text-gray-400">
              <div className="space-y-2 p-4 bg-gray-950/50 rounded-xl border border-gray-800/50">
                <div className="flex justify-between"><span>Heap Mem Used:</span> <span className="text-gray-200">{memUsageStr} / {memTotalStr}</span></div>
                <div className="flex justify-between"><span>RSS Memory:</span> <span className="text-gray-200">{formatBytes(health.memoryUsage.rss)}</span></div>
                <div className="flex justify-between"><span>External Mem:</span> <span className="text-gray-200">{formatBytes(health.memoryUsage.external)}</span></div>
              </div>
              <div className="space-y-2 p-4 bg-gray-950/50 rounded-xl border border-gray-800/50">
                <div className="flex justify-between"><span>CPU Load (5m):</span> <span className="text-gray-200">{health.cpuLoad[1]?.toFixed(2) || '0'}%</span></div>
                <div className="flex justify-between"><span>CPU Load (15m):</span> <span className="text-gray-200">{health.cpuLoad[2]?.toFixed(2) || '0'}%</span></div>
                <div className="flex justify-between"><span>Redis Status:</span> <span className="text-gray-200">{health.redisStatus || 'N/A'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Database Stats Panel */}
        {dbStats && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-400" />
              Database Storage & Counts
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm font-mono text-gray-400">
              <div className="space-y-2 p-4 bg-gray-950/50 rounded-xl border border-gray-800/50">
                <div className="flex justify-between"><span>Total DB Size:</span> <span className="text-gray-200">{formatBytes(dbStats.storage.storageSize)}</span></div>
                <div className="flex justify-between"><span>Data Size:</span> <span className="text-gray-200">{formatBytes(dbStats.storage.dataSize)}</span></div>
                <div className="flex justify-between"><span>Total Collections:</span> <span className="text-gray-200">{dbStats.storage.collections}</span></div>
              </div>
              <div className="space-y-2 p-4 bg-gray-950/50 rounded-xl border border-gray-800/50">
                <div className="flex justify-between"><span>Students:</span> <span className="text-blue-400">{dbStats.counts.students}</span></div>
                <div className="flex justify-between"><span>Staff:</span> <span className="text-purple-400">{dbStats.counts.staff}</span></div>
                <div className="flex justify-between"><span>Parents:</span> <span className="text-pink-400">{dbStats.counts.parents}</span></div>
                <div className="flex justify-between"><span>Exams & Logs:</span> <span className="text-gray-200">{dbStats.counts.exams} / {dbStats.counts.logs}</span></div>
              </div>
            </div>
          </div>
        )}
        </div>
      {/* App Updates Configuration Panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-gray-400" />
          Mobile App Update Configuration
        </h3>
        <p className="text-sm text-gray-400 mb-6">Manage the minimum and latest app versions to enforce or suggest updates for users.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => handleOpenAppUpdates('android')}
            className="flex items-center justify-between p-4 bg-gray-950/50 border border-gray-800 rounded-xl hover:bg-gray-800 hover:border-emerald-500/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-200">Android App</p>
                <p className="text-xs text-gray-500 mt-1">Configure Android updates</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleOpenAppUpdates('ios')}
            className="flex items-center justify-between p-4 bg-gray-950/50 border border-gray-800 rounded-xl hover:bg-gray-800 hover:border-blue-500/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-200">iOS App</p>
                <p className="text-xs text-gray-500 mt-1">Configure iOS updates</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Dark Theme App Updates Modal */}
      {isAppUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
              <h2 className="text-lg font-semibold text-white">Configure {appPlatform === 'ios' ? 'iOS' : 'Android'} Updates</h2>
              <button 
                onClick={() => !isSavingConfig && setIsAppUpdateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="flex border-b border-gray-800">
              <button
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'config' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('config')}
              >
                Configuration
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('history')}
              >
                Update History
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isFetchingConfig ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : activeTab === 'config' ? (
                <form onSubmit={handleSaveAppUpdates} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Minimum Required Version</label>
                    <input
                      type="text"
                      required
                      value={appConfigData.minVersion}
                      onChange={(e) => setAppConfigData({ ...appConfigData, minVersion: e.target.value })}
                      placeholder="e.g. 1.0.0"
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Latest Version</label>
                    <input
                      type="text"
                      required
                      value={appConfigData.latestVersion}
                      onChange={(e) => setAppConfigData({ ...appConfigData, latestVersion: e.target.value })}
                      placeholder="e.g. 1.0.5"
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Update Type</label>
                    <select
                      value={appConfigData.updateType}
                      onChange={(e) => setAppConfigData({ ...appConfigData, updateType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="soft">Soft Update (Optional)</option>
                      <option value="force">Force Update (Mandatory)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {appConfigData.updateType === 'force' 
                        ? 'Users will be forced to update to this version to continue using the app.' 
                        : 'Users will see a prompt but can skip the update.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Store URL</label>
                    <input
                      type="url"
                      required
                      value={appConfigData.storeUrl}
                      onChange={(e) => setAppConfigData({ ...appConfigData, storeUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setIsAppUpdateModalOpen(false)}
                      disabled={isSavingConfig}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                    >
                      {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {appUpdateHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">No update history found.</p>
                  ) : (
                    appUpdateHistory.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-950 border border-gray-800 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-white font-medium">v{item.version}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${item.updateType === 'force' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
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
        </div>
      )}

    </div>
  );
};

export default AdministrationDashboard;
