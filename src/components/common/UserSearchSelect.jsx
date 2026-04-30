// src/components/common/UserSearchSelect.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import userService from '../../services/userService';
import useDebounce from '../../hooks/useDebounce';

const UserSearchSelect = ({ 
  onSelect, 
  selectedUser, 
  placeholder = "Search users...",
  role = null,
  classId = null,
  excludeRole = null,
  label = "Select User"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState(selectedUser || null);
  const dropdownRef = useRef(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchUsers = async (term) => {
    if (!term || term.length < 2) {
      setUsers([]);
      return;
    }
    
    setIsLoading(true);
    try {
      let response;
      
      if (classId) {
        // For class teacher - get parents of specific class
        response = await userService.getParentsByClass(classId, term);
        setUsers(response.data || []);
      } else if (role) {
        // Get users by specific role
        response = await userService.getUsersByRole(role, term);
        setUsers(response.data || []);
      } else {
        // Get all users (admin only)
        response = await userService.getAllUsers(term);
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchUsers(debouncedSearchTerm);
    } else {
      setUsers([]);
    }
  }, [debouncedSearchTerm, role, classId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUserInfo(user);
    setSearchTerm('');
    setIsOpen(false);
    if (onSelect) {
      onSelect(user);
    }
  };

  const handleClearSelection = () => {
    setSelectedUserInfo(null);
    setSearchTerm('');
    if (onSelect) {
      onSelect(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'parent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      {/* Selected User Display */}
      {selectedUserInfo ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedUserInfo.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{selectedUserInfo.email}</span>
                <span className={`px-2 py-0.5 rounded-full ${getRoleBadgeColor(selectedUserInfo.role)}`}>
                  {selectedUserInfo.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearSelection}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      ) : (
        // Search Input
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          
          {/* Dropdown Results */}
          {isOpen && (searchTerm || isLoading) && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-xs mt-1">Searching...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No users found</p>
                  <p className="text-xs mt-1">Try typing at least 2 characters</p>
                </div>
              ) : (
                users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.staffCode && (
                        <p className="text-xs text-gray-400">Code: {user.staffCode}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchSelect;