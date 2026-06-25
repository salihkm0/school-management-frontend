import React, { useEffect, useState } from 'react';
import administrationService from '../../services/administrationService';
import { PencilIcon, TrashIcon, UserCircleIcon, ShieldCheckIcon, ShieldExclamationIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    isActive: true
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await administrationService.getUsers({ limit: 100 });
      setUsers(data.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'parent',
      isActive: user.isActive !== false
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to completely delete this user? This cannot be undone.')) {
      try {
        await administrationService.deleteUser(id);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await administrationService.updateUser(selectedUser._id, editForm);
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

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
          <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage system accounts and access</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-900">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-800/50 transition-colors">
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
                          <div className="text-sm font-medium text-gray-200">{user.name}</div>
                          <div className="text-xs text-gray-500">{user._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.email || '-'}</div>
                      <div className="text-xs text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user._id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
              <h3 className="text-lg font-bold text-white">Edit User</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="parent">Parent</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="administration">Administration</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                  Account is Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
