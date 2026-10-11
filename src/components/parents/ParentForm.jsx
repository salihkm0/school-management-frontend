// src/components/parents/ParentForm.jsx
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  ArrowLeftIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BriefcaseIcon, 
  MapPinIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { registerParent, updateParent, fetchParentById, clearCurrentParent } from '../../store/slices/parentSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const ParentForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { currentParent, isLoading } = useSelector((state) => state.parents)
  
  const [showPassword, setShowPassword] = useState(false)
  const [studentsList, setStudentsList] = useState([])
  const [newAdmissionNo, setNewAdmissionNo] = useState('')
  const [newDOB, setNewDOB] = useState('')
  const [newRelation, setNewRelation] = useState('father')

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      isActive: true
    }
  })
  const password = watch('password')

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchParentById(id))
    }
    return () => {
      dispatch(clearCurrentParent())
    }
  }, [dispatch, id, isEditing])

  useEffect(() => {
    if (isEditing && currentParent) {
      const addr = currentParent.address || {}
      const streetVal = typeof currentParent.address === 'string' 
        ? currentParent.address 
        : (addr.street || '')

      reset({
        fullName: currentParent.fullName || '',
        email: currentParent.email || '',
        phone: currentParent.phone || '',
        alternatePhone: currentParent.alternatePhone || '',
        occupation: currentParent.occupation || '',
        isActive: currentParent.isActive !== undefined ? currentParent.isActive : true,
        street: streetVal,
        city: addr.city || '',
        district: addr.district || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        password: ''
      })

      // Populate students list from connections or students array
      const rawStudents = currentParent.connections || currentParent.students || []
      const formattedStudents = rawStudents.map(s => ({
        studentCode: s.studentCode,
        admissionNo: s.admissionNo || s.studentCode,
        studentFullName: s.studentFullName || '',
        className: s.className || '',
        relation: s.relation || 'father',
        dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
        isVerified: !!s.studentFullName
      }))
      setStudentsList(formattedStudents)
    }
  }, [isEditing, currentParent, reset])

  const handleUpdateStudentRelation = (index, relation) => {
    setStudentsList(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], relation }
      return updated
    })
  }

  const handleRemoveStudentFromList = (index) => {
    setStudentsList(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddStudentToList = () => {
    const trimmedNo = newAdmissionNo.trim()
    if (!trimmedNo) {
      toast.error('Please enter admission number')
      return
    }
    if (!newDOB) {
      toast.error('Please enter date of birth')
      return
    }
    if (studentsList.some(s => s.studentCode === trimmedNo || s.admissionNo === trimmedNo)) {
      toast.error('This student is already in the list')
      return
    }

    setStudentsList(prev => [
      ...prev,
      {
        studentCode: trimmedNo,
        admissionNo: trimmedNo,
        studentFullName: '',
        className: '',
        relation: newRelation,
        dateOfBirth: newDOB,
        isVerified: false
      }
    ])
    setNewAdmissionNo('')
    setNewDOB('')
    setNewRelation('father')
    toast.success(`Admission No ${trimmedNo} added to list`)
  }

  const onSubmit = async (data) => {
    try {
      const payload = {
        fullName: data.fullName.trim(),
        email: data.email ? data.email.trim() : undefined,
        phone: data.phone.trim(),
        alternatePhone: data.alternatePhone ? data.alternatePhone.trim() : '',
        occupation: data.occupation ? data.occupation.trim() : '',
        isActive: data.isActive === 'true' || data.isActive === true,
        address: {
          street: data.street ? data.street.trim() : '',
          city: data.city ? data.city.trim() : '',
          district: data.district ? data.district.trim() : '',
          state: data.state ? data.state.trim() : '',
          pincode: data.pincode ? data.pincode.trim() : ''
        },
        students: studentsList.map(s => ({
          studentCode: s.studentCode,
          relation: s.relation,
          dateOfBirth: s.dateOfBirth,
          studentFullName: s.studentFullName,
          className: s.className
        }))
      }

      if (data.password && data.password.trim().length >= 6) {
        payload.password = data.password.trim()
      }

      if (isEditing) {
        await dispatch(updateParent({ id, data: payload })).unwrap()
        toast.success('Parent details updated successfully')
      } else {
        if (!data.password) {
          toast.error('Password is required for registration')
          return
        }
        payload.password = data.password
        await dispatch(registerParent(payload)).unwrap()
        toast.success('Parent registered successfully')
      }
      navigate(`/parents/${id || ''}`)
    } catch (error) { 
      console.error('Error saving parent:', error)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button 
          onClick={() => navigate(isEditing ? `/parents/${id}` : '/parents')} 
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{isEditing ? 'Edit Parent' : 'Register Parent'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEditing ? 'Update parent profile details, address, and student relationships' : 'Create a new parent account for the school'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Parent Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Parent Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">Personal details and contact credentials</p>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                <input 
                  {...register('fullName', { required: 'Full name is required' })} 
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.fullName ? 'border-rose-500' : 'border-gray-200'}`} 
                  placeholder="Enter parent's full name" 
                />
                {errors.fullName && <p className="mt-1 text-xs text-rose-500">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    {...register('email', {
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Invalid email format'
                      },
                      setValueAs: v => v === '' ? undefined : v
                    })}
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.email ? 'border-rose-500' : 'border-gray-200'}`}
                    placeholder="parent@example.com (optional)"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    {...register('phone', { required: 'Phone number is required' })} 
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.phone ? 'border-rose-500' : 'border-gray-200'}`} 
                    placeholder="9876543210" 
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>}
              </div>

              {/* Alternate Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    {...register('alternatePhone')} 
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    placeholder="Optional phone number" 
                  />
                </div>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                <div className="relative">
                  <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    {...register('occupation')} 
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    placeholder="e.g., Engineer, Teacher, Merchant" 
                  />
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <select 
                  {...register('isActive')} 
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>

              {/* Password */}
              {!isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })} 
                        className={`w-full pl-9 pr-9 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.password ? 'border-rose-500' : 'border-gray-200'}`} 
                        placeholder="••••••••" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        {...register('confirmPassword', { required: 'Confirm password', validate: value => value === password || 'Passwords do not match' })} 
                        className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg ${errors.confirmPassword ? 'border-rose-500' : 'border-gray-200'} focus:outline-none focus:ring-1 focus:ring-emerald-500`} 
                        placeholder="••••••••" 
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>}
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change Password <span className="text-gray-400 text-xs font-normal">(Leave blank to keep existing password)</span>
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      {...register('password', {
                        minLength: { value: 6, message: 'Minimum 6 characters required' }
                      })} 
                      className={`w-full pl-9 pr-9 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.password ? 'border-rose-500' : 'border-gray-200'}`} 
                      placeholder="New password (optional)" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Address Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">Parent's residential location details</p>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <textarea 
                  {...register('street')} 
                  rows={2} 
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none" 
                  placeholder="House name, street, locality" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City / Town</label>
                <input 
                  {...register('city')} 
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                  placeholder="e.g. Kottakkara" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                <input 
                  {...register('district')} 
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                  placeholder="e.g. Malappuram" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input 
                  {...register('state')} 
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                  placeholder="e.g. Kerala" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                <input 
                  {...register('pincode')} 
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                  placeholder="e.g. 676505" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Connected Students & Relationship Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Connected Students & Relationship</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Manage student connections and set relationship (Father, Mother, Guardian)</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
              {studentsList.length} Connected
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* List of currently connected students */}
            {studentsList.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                <UserGroupIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No students connected to this parent yet.</p>
                <p className="text-xs text-gray-400 mt-0.5">Use the form below to connect a student by Admission No.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-700">Connected Students List:</p>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {studentsList.map((student, idx) => (
                    <div key={idx} className="p-3.5 bg-white hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Adm No: {student.admissionNo || student.studentCode}
                          </span>
                          {student.studentFullName ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full font-medium">
                              <CheckCircleIcon className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
                              <ClockIcon className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.studentFullName || 'Student details pending verification'}
                          {student.className && <span className="text-xs font-normal text-gray-500 ml-2">({student.className})</span>}
                        </div>
                        {student.dateOfBirth && (
                          <div className="text-xs text-gray-500">
                            DOB: {student.dateOfBirth}
                          </div>
                        )}
                      </div>

                      {/* Relationship Selector & Delete */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-gray-600 font-medium whitespace-nowrap">Relation:</label>
                          <select
                            value={student.relation || 'father'}
                            onChange={(e) => handleUpdateStudentRelation(idx, e.target.value)}
                            className="text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none capitalize"
                          >
                            <option value="father">Father</option>
                            <option value="mother">Mother</option>
                            <option value="guardian">Guardian</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudentFromList(idx)}
                          title="Remove connection"
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Student Connection Section */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-800 mb-2">Connect Another Student to Parent:</p>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Admission No</label>
                  <input
                    type="text"
                    value={newAdmissionNo}
                    onChange={(e) => setNewAdmissionNo(e.target.value)}
                    placeholder="e.g. 43640"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newDOB}
                    onChange={(e) => setNewDOB(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Relation</label>
                  <select
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize"
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddStudentToList}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <button 
            type="button" 
            onClick={() => navigate(isEditing ? `/parents/${id}` : '/parents')} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckIcon className="w-4 h-4" />}
            <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Parent' : 'Register Parent'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ParentForm