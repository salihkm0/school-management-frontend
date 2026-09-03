// src/components/common/SchoolContactsWidget.jsx
import React, { useState, useEffect } from 'react';
import { PhoneIcon, UserGroupIcon, AcademicCapIcon, ComputerDesktopIcon, UserIcon } from '@heroicons/react/24/outline';
import administrationService from '../../services/administrationService';

const SchoolContactsWidget = () => {
  const [contacts, setContacts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const data = await administrationService.getSchoolContacts();
      setContacts(data);
    } catch (error) {
      console.error('Failed to fetch school key contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-16 bg-gray-100 rounded-lg"></div>
          <div className="h-16 bg-gray-100 rounded-lg"></div>
          <div className="h-16 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!contacts) return null;

  const hasAnyContact = contacts.headmasterName || contacts.sitcName || contacts.ptaPresidentName;
  if (!hasAnyContact) return null;

  const contactItems = [
    {
      role: 'Headmaster',
      name: contacts.headmasterName,
      phone: contacts.headmasterPhone,
      icon: AcademicCapIcon,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      textColor: 'text-emerald-900',
      badgeColor: 'bg-emerald-600 text-white',
      iconColor: 'text-emerald-600'
    },
    {
      role: 'SITC',
      subtitle: 'System In-Charge',
      name: contacts.sitcName,
      phone: contacts.sitcPhone,
      icon: ComputerDesktopIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      textColor: 'text-blue-900',
      badgeColor: 'bg-blue-600 text-white',
      iconColor: 'text-blue-600'
    },
    {
      role: 'PTA President',
      name: contacts.ptaPresidentName,
      phone: contacts.ptaPresidentPhone,
      icon: UserGroupIcon,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      textColor: 'text-purple-900',
      badgeColor: 'bg-purple-600 text-white',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <UserGroupIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">School Key Contacts</h3>
            <p className="text-xs text-gray-500">Quick contact information for school administration</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {contactItems.map((item) => {
          if (!item.name && !item.phone) return null;
          const Icon = item.icon;

          return (
            <div
              key={item.role}
              className={`p-3 rounded-lg border ${item.bgColor} ${item.borderColor} flex items-start justify-between gap-2 transition-all hover:shadow-sm`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${item.badgeColor}`}>
                    {item.role}
                  </span>
                  {item.subtitle && (
                    <span className="text-[10px] text-gray-500 hidden xl:inline">({item.subtitle})</span>
                  )}
                </div>
                <p className={`text-sm font-bold truncate ${item.textColor}`}>
                  {item.name || 'Not Specified'}
                </p>
                {item.phone && (
                  <a
                    href={`tel:${item.phone}`}
                    className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    <PhoneIcon className="w-3 h-3 text-emerald-600" />
                    <span>{item.phone}</span>
                  </a>
                )}
              </div>
              <div className={`p-2 bg-white/80 rounded-lg shadow-2xs ${item.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SchoolContactsWidget;
