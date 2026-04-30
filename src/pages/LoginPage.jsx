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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex min-h-screen">
        {/* Left Side - School Image and Info */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-200/30 to-primary-400/40 z-10"></div>
          <img 
            src="https://ppmhsskottukkara.com/wp-content/uploads/2018/06/WhatsApp-Image-2018-06-09-at-5.02.13-PM-768x363.jpeg"
            alt="School Building"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="relative z-20 flex flex-col justify-between h-full w-full p-12 text-white">
            <div className="flex items-center gap-3">
              <img 
                src="https://res.cloudinary.com/dmjqgjcut/image/upload/v1769946977/school-logo_uugskb.jpg"
                alt="School Logo"
                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm p-2 object-contain"
              />
              <div>
                <h2 className="text-2xl font-bold">P.P.M.H.S.S. KOTTUKKARA</h2>
                <p className="text-primary-100">ESTD. 1976</p>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-3xl font-arabic leading-relaxed">العلم نور</p>
              <p className="text-primary-100">Knowledge is Light</p>
              <p className="text-sm mt-4 max-w-md mx-auto">
                PANAKKAID POOKOYATHANGAL MEMORIAL HIGHER SECONDARY SCHOOL
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-primary-200">Empowering minds, shaping futures since 1976</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <img 
                src="https://res.cloudinary.com/dmjqgjcut/image/upload/v1769946977/school-logo_uugskb.jpg"
                alt="School Logo"
                className="w-20 h-20 rounded-full mx-auto mb-4 object-contain"
              />
              <h1 className="text-xl font-bold text-gray-900">P.P.M.H.S.S. KOTTUKKARA</h1>
              <p className="text-gray-500 text-sm">ESTD. 1976</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
                <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
              </div>

              {/* Login Method Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('email')
                    setEmailFormData({ email: '', password: '', rememberMe: false })
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                    loginMethod === 'email'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Email Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('phone')
                    setPhoneFormData({ phone: '', password: '', rememberMe: false })
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                    loginMethod === 'phone'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <PhoneIcon className="w-4 h-4" />
                  Mobile Login
                </button>
              </div>

              {/* Email Login Form */}
              {loginMethod === 'email' && (
                <form onSubmit={onSubmitEmail} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={emailFormData.email}
                        onChange={handleEmailChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                        placeholder="admin@school.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={emailFormData.password}
                        onChange={handleEmailChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={emailFormData.rememberMe}
                        onChange={handleEmailChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2.5 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              )}

              {/* Phone Login Form */}
              {loginMethod === 'phone' && (
                <form onSubmit={onSubmitPhone} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={phoneFormData.phone}
                        onChange={handlePhoneChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                        placeholder="9876543210"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={phoneFormData.password}
                        onChange={handlePhoneChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={phoneFormData.rememberMe}
                        onChange={handlePhoneChange}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2.5 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              )}

              {/* Register as Parent Link */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>New Parent? Register Here</span>
                </button>
              </div>
            </div>
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