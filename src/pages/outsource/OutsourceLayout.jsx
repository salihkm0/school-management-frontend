import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { 
  FileSpreadsheet, 
  LogOut, 
  UserCircle, 
  Building2, 
  ShieldCheck, 
  Download 
} from 'lucide-react';
import toast from 'react-hot-toast';

const OutsourceLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (_) {}
    toast.success('Logged out successfully');
    navigate('/outsource/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  PPM HSS KOTTUKKARA
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-primary-500/20 border border-primary-500/40 text-primary-300">
                  Outsource Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Master Student Records, Terminal Exam Marks & Consolidated Export
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Operator: <span className="font-semibold text-white">{user?.email || 'outsource'}</span></span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/60 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-[1700px] w-full mx-auto">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400">
        PPM Higher Secondary School, Kottukkara • Student Data Outsourcing & Master Reporting System
      </footer>
    </div>
  );
};

export default OutsourceLayout;
