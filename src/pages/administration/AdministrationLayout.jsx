import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { 
  LogOut, 
  Menu,
  X,
  Server,
  Users,
  Terminal,
  ShieldCheckIcon,
  BellRing,
  ClipboardList
} from 'lucide-react';

const AdministrationLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/administration/login');
  };

  const navItems = [
    { name: 'System Health', path: '/administration', icon: Server, exact: true },
    { name: 'System Logs', path: '/administration/logs', icon: Terminal, exact: false },
    { name: 'Audit Log', path: '/administration/audit', icon: ClipboardList, exact: false },
    { name: 'Broadcast Center', path: '/administration/broadcast', icon: BellRing, exact: false },
    { name: 'User Management', path: '/administration/users', icon: Users, exact: false },
  ];

  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-gray-100 flex font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold text-white tracking-wide">Administration</span>
          </div>
          <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`
                }
              >
                <Icon className={`w-5 h-5 mr-3 transition-colors ${
                  // Just use standard colors for inactive, handled by NavLink isActive
                  ''
                }`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Glow effect behind main content */}
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <header className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 h-16 flex items-center px-4 md:px-6 sticky top-0 z-40">
          <button
            className="md:hidden text-gray-400 hover:text-white mr-4"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 flex justify-between items-center">
            <h1 className="text-sm font-medium text-gray-400">System Control Panel - PPM HSS Kottukkara</h1>
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-emerald-500">SYSTEM ONLINE</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdministrationLayout;
