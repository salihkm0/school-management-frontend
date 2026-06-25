import React, { useEffect, useState } from 'react';
import administrationService from '../../services/administrationService';
import { ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const data = await administrationService.getAuditLogs({ page, limit: pagination.limit });
      setLogs(data.data);
      setPagination(prev => ({ ...prev, page: data.currentPage, totalPages: data.pages }));
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(pagination.page);
  }, [pagination.page]);

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination(p => ({ ...p, page: p.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(p => ({ ...p, page: p.page + 1 }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Global Audit Log</h1>
          <p className="text-sm text-gray-400 mt-1">Track all sensitive operations across the system</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search logs... (mocked)" 
              disabled
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-colors opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex items-center gap-1 ml-2">
              <button 
                onClick={handlePrevPage}
                disabled={pagination.page === 1 || loading}
                className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextPage}
                disabled={pagination.page === pagination.totalPages || loading}
                className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-950/80 text-xs uppercase font-medium text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User ID / Reference</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center italic text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {log.userId?.name || log.userId?.email || log.userId || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        log.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        log.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        log.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {log.activityType || 'system_event'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-300">
                      {log.title || 'System Activity'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={log.description}>
                      {log.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
