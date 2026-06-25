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
    </div>
  );
};

export default AdministrationDashboard;
