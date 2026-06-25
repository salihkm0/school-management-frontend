import React, { useState } from 'react';
import administrationService from '../../services/administrationService';
import { Send, Bell, Shield, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const BroadcastCenter = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetRole: 'all'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      return toast.error("Title and body are required");
    }

    try {
      setLoading(true);
      const res = await administrationService.testFcmNotification(formData);
      toast.success(res.message || "Broadcast sent successfully");
      setFormData(prev => ({ ...prev, title: '', body: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Broadcast Center</h1>
          <p className="text-sm text-gray-400 mt-1">Send test Push Notifications (FCM) to active devices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleBroadcast} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Target Audience</label>
              <select
                name="targetRole"
                value={formData.targetRole}
                onChange={handleChange}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="all">All Users (Everyone)</option>
                <option value="admin">Administrators</option>
                <option value="teacher">Teachers / Staff</option>
                <option value="parent">Parents</option>
                <option value="student">Students</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Notification Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. System Update"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Notification Body</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Enter the notification message..."
                rows={4}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                required
              />
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Send className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                {loading ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-max">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            How it works
          </h3>
          <ul className="space-y-4 text-sm text-gray-400">
            <li className="flex gap-3">
              <Smartphone className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span>This tool uses Firebase Cloud Messaging to send native push notifications to registered devices.</span>
            </li>
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-gray-300">1</div>
              <span>Select the role you want to target.</span>
            </li>
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-gray-300">2</div>
              <span>The system will automatically find all users matching that role and collect their active FCM tokens.</span>
            </li>
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-gray-300">3</div>
              <span>It sends them out in batches to prevent server overload.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BroadcastCenter;
