import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import administrationService from '../../services/administrationService';
import { Terminal, RefreshCw, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemLogs = () => {
  const { socket, isConnected } = useSelector((state) => state.socket);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all'); // all, error, info
  const [limit, setLimit] = useState(200);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsEndRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (socket && isConnected) {
      const handleNewLog = (newLog) => {
        setLogs((prevLogs) => {
          // Add to end of array (terminal style)
          // Also respect current filter
          if (filter !== 'all' && newLog.level !== filter) {
            return prevLogs;
          }
          const updated = [...prevLogs, newLog];
          // Keep max 500 logs in state to prevent memory leaks
          if (updated.length > 500) return updated.slice(updated.length - 500);
          return updated;
        });
      };

      socket.on('new_system_log', handleNewLog);

      return () => {
        socket.off('new_system_log', handleNewLog);
      };
    }
  }, [socket, isConnected, filter]);

  const fetchLogs = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const data = await administrationService.getSystemLogs({
        limit,
        level: filter !== 'all' ? filter : undefined
      });
      
      setTotalLogs(data.total);
      
      // DB sorts descending (newest first). Let's reverse it to display like a terminal (newest at bottom)
      setLogs(data.data.reverse());
      
      // If we are just loading initially or changing filter, scroll to bottom
      if (!isLoadMore && logsEndRef.current) {
        setTimeout(() => {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      toast.error('Failed to fetch system logs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Reset limit when filter changes
    if (limit !== 200) {
      setLimit(200);
    } else {
      fetchLogs();
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs(limit > 200);
  }, [limit]);

  useEffect(() => {
    // Only auto-scroll on new socket logs (when at bottom)
    if (logsEndRef.current && !loading && !loadingMore) {
      const container = logContainerRef.current;
      if (container) {
        // If we are already near the bottom, scroll down for new log
        const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
        if (isNearBottom) {
          logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [logs]);

  const getLogColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      default: return <Terminal className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Logs</h1>
          <p className="text-sm text-gray-400 mt-1">Live application output</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1">
            {['all', 'info', 'error'].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  filter === level 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchLogs}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors border border-gray-700"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative font-mono text-sm flex flex-col">
        {/* Terminal Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-gray-500 text-xs ml-2">bash - system.log</span>
        </div>

        {/* Log Window */}
        <div ref={logContainerRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
          {logs.length === 0 && !loading ? (
            <div className="text-gray-500 italic">No logs found.</div>
          ) : (
            <div className="space-y-1">
              {logs.length < totalLogs && (
                <div className="flex justify-center pb-4">
                  <button
                    onClick={() => setLimit(l => l + 200)}
                    disabled={loadingMore}
                    className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full border border-gray-700 transition-colors flex items-center gap-2"
                  >
                    {loadingMore ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                    Load Older Logs ({logs.length} / {totalLogs})
                  </button>
                </div>
              )}
              {logs.map((log) => (
                <div key={log._id} className="flex gap-3 hover:bg-gray-900/50 py-1 rounded px-2 -mx-2 transition-colors">
                  <span className="text-gray-600 flex-shrink-0 w-44">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <div className="flex items-center flex-shrink-0 w-24 gap-1.5">
                    {getLogIcon(log.level)}
                    <span className={`font-semibold uppercase text-xs ${getLogColor(log.level)}`}>
                      {log.level}
                    </span>
                  </div>
                  <span className="text-gray-300 whitespace-pre-wrap break-all">
                    {log.message}
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <span className="block mt-1 text-gray-500 text-xs">
                        {JSON.stringify(log.meta)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
