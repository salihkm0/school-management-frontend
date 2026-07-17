import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const BulkRollNumberUpdateModal = ({ isOpen, onClose, students, classObj, onUpdated }) => {
  const [updates, setUpdates] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && students) {
      const initial = {};
      students.forEach(s => {
        initial[s._id] = s.rollNumber || '';
      });
      setUpdates(initial);
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = Object.entries(updates).map(([studentId, rollNumber]) => ({
        studentId,
        rollNumber: rollNumber.trim()
      }));

      await api.put('/students/bulk-update-roll-numbers', { updates: payload });
      toast.success('Roll numbers updated successfully');
      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to update roll numbers');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Bulk Update Roll Numbers</h3>
            <p className="text-sm text-gray-500">
              {classObj?.name} {classObj?.section ? `- ${classObj.section}` : ''} ({students.length} students)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-4">
            Tip: Press Tab to quickly move between roll number inputs.
          </div>
          <table className="w-full text-left text-sm text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 border-b border-gray-200">Student Name</th>
                <th scope="col" className="px-4 py-3 border-b border-gray-200">Admission No</th>
                <th scope="col" className="px-4 py-3 border-b border-gray-200 w-40 text-center">Roll Number</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {student.fullName}
                  </td>
                  <td className="px-4 py-3">
                    {student.admissionNo || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-center font-medium"
                      value={updates[student._id] !== undefined ? updates[student._id] : (student.rollNumber || '')}
                      onChange={(e) => setUpdates({ ...updates, [student._id]: e.target.value })}
                      placeholder="Roll No"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkRollNumberUpdateModal;
