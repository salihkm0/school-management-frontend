// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, UserPlusIcon, XMarkIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { login } from '../store/slices/authSlice'
import { registerParent } from '../store/slices/parentSlice'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading } = useSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [loginMethod, setLoginMethod] = useState('email')
  
  // Separate forms for email and phone
  const [emailFormData, setEmailFormData] = useState({ email: '', password: '', rememberMe: false })
  const [phoneFormData, setPhoneFormData] = useState({ phone: '', password: '', rememberMe: false })

  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
    watch: watchRegister
  } = useForm({
    defaultValues: {
      fullName: '',
      phone: '',
      alternatePhone: '',
      email: '',
      password: '',
      confirmPassword: '',
      occupation: '',
      address: ''
    }
  })

  const handleEmailChange = (e) => {
    setEmailFormData({
      ...emailFormData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const handlePhoneChange = (e) => {
    setPhoneFormData({
      ...phoneFormData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const onSubmitEmail = async (e) => {
    e.preventDefault()
    console.log('Email form submitted with data:', emailFormData)
    
    if (!emailFormData.email) {
      toast.error('Email is required')
      return
    }
    
    const loginData = {
      email: emailFormData.email,
      password: emailFormData.password,
      rememberMe: emailFormData.rememberMe
    }
    
    console.log('Sending login payload:', loginData)
    
    const result = await dispatch(login(loginData))
    if (result.payload?.success) {
      navigate('/dashboard')
    }
  }

  const onSubmitPhone = async (e) => {
    e.preventDefault()
    console.log('Phone form submitted with data:', phoneFormData)
    
    if (!phoneFormData.phone) {
      toast.error('Mobile number is required')
      return
    }
    
    const loginData = {
      phone: phoneFormData.phone,
      password: phoneFormData.password,
      rememberMe: phoneFormData.rememberMe
    }
    
    console.log('Sending login payload:', loginData)
    
    const result = await dispatch(login(loginData))
    if (result.payload?.success) {
      navigate('/dashboard')
    }
  }

  const onRegisterSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsRegistering(true)
    try {
      const result = await dispatch(registerParent({
        fullName: data.fullName,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        email: data.email,
        password: data.password,
        occupation: data.occupation,
        address: data.address
      })).unwrap()

      if (result.success) {
        toast.success('Registration successful! Please login with your mobile number.')
        setShowRegisterModal(false)
        resetRegisterForm()
        setLoginMethod('phone')
        setPhoneFormData({ phone: data.phone, password: data.password, rememberMe: false })
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsRegistering(false)
    }
  }

  const watchRegisterPassword = watchRegister('password')

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#fdfdfd]">
      {/* Left/Top Side - Image */}
      <div className="relative w-full h-64 lg:h-screen lg:w-1/2 flex-shrink-0">
        <div className="absolute inset-0 bg-[#1e3a5f]/80 z-10 mix-blend-multiply"></div>
        <img 
          src="https://ppmhsskottukkara.com/wp-content/uploads/2018/06/WhatsApp-Image-2018-06-09-at-5.02.13-PM-768x363.jpeg"
          alt="School Building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Desktop Text Overlay */}
        <div className="hidden lg:flex absolute bottom-0 left-0 p-16 z-20 flex-col">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Empowering the<br/>Leaders of Tomorrow
          </h1>
          <p className="text-blue-100/90 text-lg max-w-md font-medium leading-relaxed">
            Welcome to the central portal for students, educators, and administrators of PPMHSS Kottukkara.
          </p>
        </div>
        
        {/* Mobile Logo Overlay */}
        <div className="lg:hidden absolute inset-0 z-20 flex items-center justify-center px-4">
           <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl flex items-center gap-4 shadow-lg absolute bottom-[-20px]">
             <img 
               src="https://res.cloudinary.com/dmjqgjcut/image/upload/v1769946977/school-logo_uugskb.jpg"
               alt="School Logo"
               className="w-14 h-14 object-contain"
             />
             <div>
               <h2 className="text-xl font-bold text-[#1a2b4b] leading-tight">PPMHSS</h2>
               <p className="text-sm text-gray-500 font-medium">Kottukkara</p>
             </div>
           </div>
        </div>
      </div>

      {/* Right/Bottom Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 pt-16 lg:pt-12 relative bg-white lg:bg-[#f8f9fc]">
        <div className="w-full max-w-md flex flex-col h-full lg:h-auto lg:block">
          
          <div className="lg:bg-white lg:border lg:border-gray-100 lg:rounded-2xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:p-10 mb-auto lg:mb-0">
            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-8">
              <img 
                src="https://res.cloudinary.com/dmjqgjcut/image/upload/v1769946977/school-logo_uugskb.jpg"
                alt="School Logo"
                className="w-20 h-20 mx-auto mb-6 object-contain"
              />
              <h2 className="text-[#1a2b4b] text-[22px] font-bold">Sign in to your account</h2>
              <p className="text-gray-500 mt-2 text-[13px]">Enter your academic credentials to proceed.</p>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8 mt-4">
              <h2 className="text-[#1a2b4b] text-[24px] font-bold">Welcome Back</h2>
              <p className="text-gray-600 mt-2 text-[14px]">Please log in to access your academic portal.</p>
            </div>

            {/* Login Method Toggle - styled minimally to fit the new aesthetic */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-lg border border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email')
                  setEmailFormData({ email: '', password: '', rememberMe: false })
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                  loginMethod === 'email'
                    ? 'bg-white text-[#1a2b4b] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <EnvelopeIcon className="w-4 h-4" />
                Staff / Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('phone')
                  setPhoneFormData({ phone: '', password: '', rememberMe: false })
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                  loginMethod === 'phone'
                    ? 'bg-white text-[#1a2b4b] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <PhoneIcon className="w-4 h-4" />
                Parent
              </button>
            </div>

            {/* Email Login Form */}
            {loginMethod === 'email' && (
              <form onSubmit={onSubmitEmail} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1a2b4b] mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={emailFormData.email}
                      onChange={handleEmailChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                      placeholder="e.g. admin@ppmhss.edu"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[13px] font-semibold text-[#1a2b4b]">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[13px] text-emerald-700 hover:text-emerald-800 font-medium lg:hidden"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={emailFormData.password}
                      onChange={handleEmailChange}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={emailFormData.rememberMe}
                      onChange={handleEmailChange}
                      className="w-4 h-4 text-emerald-700 border-gray-300 rounded focus:ring-emerald-600"
                    />
                    <span className="ml-2 text-[12px] font-medium text-gray-500">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[12px] font-bold text-[#1a2b4b] hover:text-emerald-700 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0d7d56] hover:bg-[#0a6646] text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Sign In
                      <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Phone Login Form */}
            {loginMethod === 'phone' && (
              <form onSubmit={onSubmitPhone} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1a2b4b] mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={phoneFormData.phone}
                      onChange={handlePhoneChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[13px] font-semibold text-[#1a2b4b]">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[13px] text-emerald-700 hover:text-emerald-800 font-medium lg:hidden"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={phoneFormData.password}
                      onChange={handlePhoneChange}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors placeholder:text-gray-400"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={phoneFormData.rememberMe}
                      onChange={handlePhoneChange}
                      className="w-4 h-4 text-emerald-700 border-gray-300 rounded focus:ring-emerald-600"
                    />
                    <span className="ml-2 text-[12px] font-medium text-gray-500">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[12px] font-bold text-[#1a2b4b] hover:text-emerald-700 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0d7d56] hover:bg-[#0a6646] text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Sign In
                      <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Parent Registration Link - integrated neatly */}
            {loginMethod === 'phone' && (
              <div className="mt-5 text-center border-t border-gray-100 pt-5">
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="text-[#1a2b4b] hover:text-emerald-700 text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 mx-auto"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>New Parent? Register Here</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile Footer Links */}
          <div className="lg:hidden mt-8 text-center text-[13px]">
            <p className="text-gray-500">
              Having trouble logging in? <a href="#" className="font-bold text-[#1a2b4b]">Contact Support</a>
            </p>
            <p className="text-gray-400 mt-6 mb-4">© 2024 PPMHSS Kottukkara</p>
          </div>

          {/* Desktop Footer text */}
          <div className="hidden lg:block text-center mt-6">
            <p className="text-[11px] text-gray-400 font-medium">
              Protected by institutional security. <a href="#" className="font-semibold text-[#1a2b4b] hover:text-gray-700">Privacy Policy</a>.
            </p>
          </div>
          
        </div>
      </div>

      {/* Parent Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-white">
              <div className="flex items-center gap-3">
                <img 
                  src="https://res.cloudinary.com/dmjqgjcut/image/upload/v1769946977/school-logo_uugskb.jpg"
                  alt="School Logo"
                  className="w-10 h-10 rounded-full object-contain"
                />
                <h2 className="text-2xl font-bold text-gray-900">Parent Registration</h2>
              </div>
              <button
                onClick={() => {
                  setShowRegisterModal(false)
                  resetRegisterForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-2">
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-6 h-6 text-primary-500" />
                  <div>
                    <p className="font-medium text-gray-800">Mobile number will be used for login</p>
                    <p className="text-sm text-gray-600">You will use your mobile number and password to login after registration.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...registerForm('fullName', { required: 'Full name is required' })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                      registerErrors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {registerErrors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{registerErrors.fullName.message}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      {...registerForm('phone', {
                        required: 'Mobile number is required',
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Enter a valid 10-digit mobile number',
                        }
                      })}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                        registerErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="9876543210"
                    />
                  </div>
                  {registerErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{registerErrors.phone.message}</p>
                  )}
                </div>

                {/* Alternate Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternate Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    {...registerForm('alternatePhone', {
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Enter a valid 10-digit phone number',
                      }
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="9876543210"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    {...registerForm('email', {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      }
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="parent@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    {...registerForm('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      }
                    })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                      registerErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {registerErrors.password && (
                    <p className="mt-1 text-xs text-red-500">{registerErrors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    {...registerForm('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === watchRegisterPassword || 'Passwords do not match'
                    })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                      registerErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {registerErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{registerErrors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation (Optional)
                  </label>
                  <input
                    type="text"
                    {...registerForm('occupation')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="e.g., Business, Service, etc."
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address (Optional)
                  </label>
                  <textarea
                    {...registerForm('address')}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-medium mb-2">Benefits of Parent Registration:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <li>✓ View children's academic progress</li>
                  <li>✓ Track daily attendance records</li>
                  <li>✓ Receive instant notifications</li>
                  <li>✓ Pay school fees online</li>
                  <li>✓ Communicate with teachers</li>
                  <li>✓ Download report cards</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false)
                    resetRegisterForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4" />
                      <span>Register</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage