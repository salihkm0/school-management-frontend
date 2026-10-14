import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { 
  FileSpreadsheet, 
  LogOut, 
  ShieldCheck
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
    <div className="h-screen w-screen bg-slate-900 flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shrink-0 z-30 shadow-md">
        <div className="w-full px-4 sm:px-6 h-13 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-extrabold tracking-tight text-white uppercase">
                PPM HSS KOTTUKKARA
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                OUTSOURCE PORTAL
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Operator: <span className="font-semibold text-white">{user?.email || 'outsource'}</span></span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/60 hover:bg-rose-900/80 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Content Area */}
      <main className="flex-1 w-full bg-slate-100 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default OutsourceLayout;
