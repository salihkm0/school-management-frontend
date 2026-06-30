import React, { useEffect, useState } from 'react';
import administrationService from '../../services/administrationService';
import { Clock, ShieldCheckIcon, UserCircleIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ActiveUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveUsers = async () => {
    try {
      setLoading(true);
      const response = await administrationService.getActiveUsers();
      // API returns { success, count, data: [...users] }
      setUsers(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch active users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role) => {
    const badges = {
      administration: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      staff: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      parent: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
    return badges[role] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Users</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time view of currently connected users</p>
        </div>
        <button
          onClick={fetchActiveUsers}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Refresh Now
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Connected At</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-900">
              {loading && users.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading active users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No users currently active</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                          {user.role === 'administration' ? (
                            <ShieldCheckIcon className="w-5 h-5 text-purple-400" />
                          ) : (
                            <UserCircleIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200">{user.email || 'Unknown User'}</div>
                          <div className="text-xs text-gray-500">{user.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {new Date(user.connectedAt).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(user.connectedAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {new Date(user.lastActivity).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })}
                      </div>
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

export default ActiveUsers;
