import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../store/slices/authSlice';
import { 
  FileSpreadsheet, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';

const OutsourceLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: 'outsource@gmail.com',
    password: 'ppmhss@001',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to outsource dashboard
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'outsource' || user?.role === 'admin' || user?.role === 'administration' || user?.role === 'open')) {
      navigate('/outsource');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'outsource@gmail.com',
      password: 'ppmhss@001',
      rememberMe: true,
    });
    toast.success('Filled outsource demo credentials');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      const result = await dispatch(
        login({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        })
      ).unwrap();

      if (result.user?.role === 'outsource' || result.user?.role === 'open' || result.user?.role === 'admin' || result.user?.role === 'administration') {
        toast.success(`Welcome to Student Outsourcing Portal!`);
        navigate('/outsource');
      } else {
        toast.success('Login successful!');
        navigate('/outsource');
      }
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-7 sm:p-9 text-slate-800 animate-fadeIn">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/30 mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-bold tracking-wide uppercase mb-2">
              PPM HSS • KOTTUKKARA
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Student Outsourcing Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Sign in to access consolidated master student records, all-exam marks & Excel export
            </p>
          </div>

          {/* Quick Demo Credentials Pill */}
          <div className="mb-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Demo Account:</span>{' '}
                <span className="font-mono text-slate-600">outsource@gmail.com</span>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-[11px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors cursor-pointer"
            >
              Auto Fill
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="outsource@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rememberMe: e.target.checked }))
                  }
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 border-slate-300"
                />
                <span className="text-slate-600 font-medium">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-md shadow-primary-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Outsource Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-7 text-center border-t border-slate-100 pt-5">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Authorized Data Processing Portal • Read & Export Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutsourceLogin;
