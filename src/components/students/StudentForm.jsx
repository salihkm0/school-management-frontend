import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  AcademicCapIcon,
  BookOpenIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { fetchClasses } from '../../store/slices/classSlice'
import { fetchSubjects } from '../../store/slices/subjectSlice'
import { fetchAcademicYears } from '../../store/slices/academicYearSlice'
import { createStudent, updateStudent, fetchStudentById, clearCurrentStudent } from '../../store/slices/studentSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'

const StudentForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  
  const { classes, isLoading: classesLoading } = useSelector((state) => state.classes)
  const { subjects } = useSelector((state) => state.subjects)
  const { academicYears } = useSelector((state) => state.academicYears)
  const { currentStudent, isLoading } = useSelector((state) => state.students)
  
  const [languageSubjects, setLanguageSubjects] = useState([])
  const [showAdditionalLanguage, setShowAdditionalLanguage] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    address: false,
    parent: false,
    academic: true,
    languages: true,
    bank: false,
    status: false,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const selectedFirstLanguage1 = watch('firstLanguagePaper1')
  const selectedFirstLanguage2 = watch('firstLanguagePaper2')
  const selectedThirdLanguage = watch('thirdLanguage')

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchSubjects({ limit: 100 }))
    dispatch(fetchAcademicYears({ limit: 100 }))
    
    if (isEditing && id) {
      dispatch(fetchStudentById(id))
    }
    
    return () => {
      dispatch(clearCurrentStudent())
    }
  }, [dispatch, id, isEditing])

  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const languages = subjects.filter(s => 
        s.department === 'Languages' || 
        s.type === 'language' ||
        s.name?.toLowerCase().includes('language')
      )
      setLanguageSubjects(languages)
    }
  }, [subjects])

  useEffect(() => {
    if (isEditing && currentStudent) {
      let formattedDateOfBirth = ''
      if (currentStudent.dateOfBirth) {
        const date = new Date(currentStudent.dateOfBirth)
        formattedDateOfBirth = date.toISOString().split('T')[0]
      }
      
      let formattedAdmissionDate = ''
      if (currentStudent.admissionDate) {
        const date = new Date(currentStudent.admissionDate)
        formattedAdmissionDate = date.toISOString().split('T')[0]
      }
      
      const getSubjectId = (subject) => {
        if (!subject) return ''
        if (typeof subject === 'object' && subject._id) return subject._id
        if (typeof subject === 'string') return subject
        return ''
      }
      
      const getClassId = (classInfo) => {
        if (!classInfo) return ''
        if (typeof classInfo === 'object' && classInfo._id) return classInfo._id
        if (typeof classInfo === 'string') return classInfo
        return ''
      }
      
      const getAcademicYearId = (year) => {
        if (!year) return ''
        if (typeof year === 'object' && year._id) return year._id
        if (typeof year === 'string') return year
        return ''
      }
      
      reset({
        fullName: currentStudent.fullName || '',
        studentCode: currentStudent.studentCode || '',
        admissionNo: currentStudent.admissionNo || '',
        gender: currentStudent.gender || '',
        dateOfBirth: formattedDateOfBirth,
        admissionDate: formattedAdmissionDate,
        religion: currentStudent.religion || '',
        casteName: currentStudent.casteName || '',
        category: currentStudent.category || '',
        bloodGroup: currentStudent.bloodGroup || '',
        nationality: currentStudent.nationality || 'Indian',
        birthPlace: currentStudent.birthPlace || '',
        identificationMark1: currentStudent.identificationMark1 || '',
        identificationMark2: currentStudent.identificationMark2 || '',
        eid: currentStudent.eid || '',
        houseName: currentStudent.houseName || '',
        streetName: currentStudent.streetName || '',
        postOffice: currentStudent.postOffice || '',
        pincode: currentStudent.pincode || '',
        localBody: currentStudent.localBody || '',
        municipality: currentStudent.municipality || '',
        gramaPanchayath: currentStudent.gramaPanchayath || '',
        districtPanchayath: currentStudent.districtPanchayath || '',
        corporation: currentStudent.corporation || '',
        taluk: currentStudent.taluk || '',
        blockPanchayath: currentStudent.blockPanchayath || '',
        revenueDistrict: currentStudent.revenueDistrict || '',
        phoneNumber: currentStudent.phoneNumber || '',
        fatherFullName: currentStudent.fatherFullName || '',
        motherFullName: currentStudent.motherFullName || '',
        guardian: currentStudent.guardian || '',
        relationOfGuardian: currentStudent.relationOfGuardian || '',
        occupationOfGuardian: currentStudent.occupationOfGuardian || '',
        classId: getClassId(currentStudent.classId),
        academicYearId: getAcademicYearId(currentStudent.academicYearId),
        firstLanguagePaper1: getSubjectId(currentStudent.firstLanguagePaper1),
        firstLanguagePaper2: getSubjectId(currentStudent.firstLanguagePaper2),
        thirdLanguage: getSubjectId(currentStudent.thirdLanguage),
        additionalLanguage: getSubjectId(currentStudent.additionalLanguage),
        status: currentStudent.status || 'active',
        classOnAdmission: currentStudent.classOnAdmission || '',
        instructionMedium: currentStudent.instructionMedium || '',
        annualIncome: currentStudent.annualIncome || '',
        apl: currentStudent.apl || false,
        bankName: currentStudent.bankName || '',
        branchName: currentStudent.branchName || '',
        ifscCode: currentStudent.ifscCode || '',
        accountNumber: currentStudent.accountNumber || '',
        hostelites: currentStudent.hostelites || '',
      })
      
      if (currentStudent.additionalLanguage) {
        setShowAdditionalLanguage(true)
      }
    }
  }, [isEditing, currentStudent, reset])

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
        annualIncome: data.annualIncome ? parseInt(data.annualIncome) : undefined,
        additionalLanguage: showAdditionalLanguage ? data.additionalLanguage : null,
      }
      
      if (isEditing) {
        await dispatch(updateStudent({ id, data: formattedData })).unwrap()
        toast.success('Student updated successfully')
      } else {
        await dispatch(createStudent(formattedData)).unwrap()
        toast.success('Student created successfully')
      }
      navigate('/students')
    } catch (error) {
      console.error('Failed to save student:', error)
      toast.error(error.response?.data?.message || 'Failed to save student')
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getAvailableLanguagesForPaper2 = () => {
    if (!selectedFirstLanguage1) return languageSubjects
    return languageSubjects.filter(sub => sub._id !== selectedFirstLanguage1)
  }

  const getAvailableLanguagesForThird = () => {
    let available = languageSubjects
    if (selectedFirstLanguage1) {
      available = available.filter(sub => sub._id !== selectedFirstLanguage1)
    }
    if (selectedFirstLanguage2) {
      available = available.filter(sub => sub._id !== selectedFirstLanguage2)
    }
    return available
  }

  const getAvailableLanguagesForAdditional = () => {
    let available = languageSubjects
    if (selectedFirstLanguage1) {
      available = available.filter(sub => sub._id !== selectedFirstLanguage1)
    }
    if (selectedFirstLanguage2) {
      available = available.filter(sub => sub._id !== selectedFirstLanguage2)
    }
    if (selectedThirdLanguage) {
      available = available.filter(sub => sub._id !== selectedThirdLanguage)
    }
    return available
  }

  const SectionHeader = ({ title, icon: Icon, section, isRequired = false }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-3 px-4 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-emerald-600" />
        <h2 className="text-sm font-semibold text-gray-900">
          {title}
          {isRequired && <span className="text-rose-500 ml-1">*</span>}
        </h2>
      </div>
      {expandedSections[section] ? (
        <ChevronUpIcon className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )

  const InputField = ({ label, name, required, type = "text", placeholder, options, register: registerField, error }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {options ? (
        <select
          {...registerField(name, { required: required ? `${label} is required` : false })}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all duration-200 ${
            error ? 'border-rose-500' : 'border-gray-200'
          }`}
        >
          <option value="">Select {label}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...registerField(name, { required: required ? `${label} is required` : false })}
          type={type}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all duration-200 ${
            error ? 'border-rose-500' : 'border-gray-200'
          }`}
        />
      )}
      {error && <p className="mt-1 text-xs text-rose-500">{error.message}</p>}
    </div>
  )

  if (isLoading || classesLoading) {
    return <LoadingSpinner />
  }

  const genderOptions = [
    { value: "M", label: "Male" },
    { value: "F", label: "Female" },
    { value: "Other", label: "Other" },
  ]

  const bloodGroupOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ]

  const categoryOptions = [
    { value: "General", label: "General" },
    { value: "OBC", label: "OBC" },
    { value: "SC", label: "SC" },
    { value: "ST", label: "ST" },
  ]

  const mediumOptions = [
    { value: "Malayalam", label: "Malayalam" },
    { value: "English", label: "English" },
    { value: "Kannada", label: "Kannada" },
    { value: "Tamil", label: "Tamil" },
  ]

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "discontinued", label: "Discontinued" },
    { value: "transferred", label: "Transferred" },
    { value: "completed", label: "Completed" },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {isEditing ? 'Edit Student' : 'Add New Student'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isEditing ? 'Update student information' : 'Enter student details to add to the system'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Basic Information" icon={UserIcon} section="basic" isRequired />
          {expandedSections.basic && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Full Name"
                  name="fullName"
                  required
                  register={register}
                  error={errors.fullName}
                />
                <InputField
                  label="Student Code"
                  name="studentCode"
                  required
                  register={register}
                  error={errors.studentCode}
                />
                <InputField
                  label="Admission Number"
                  name="admissionNo"
                  required
                  register={register}
                  error={errors.admissionNo}
                />
                <InputField
                  label="Admission Date"
                  name="admissionDate"
                  type="date"
                  register={register}
                  error={errors.admissionDate}
                />
                <InputField
                  label="Gender"
                  name="gender"
                  options={genderOptions}
                  register={register}
                  error={errors.gender}
                />
                <InputField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  register={register}
                  error={errors.dateOfBirth}
                />
                <InputField
                  label="Birth Place"
                  name="birthPlace"
                  register={register}
                  error={errors.birthPlace}
                />
                <InputField
                  label="Blood Group"
                  name="bloodGroup"
                  options={bloodGroupOptions}
                  register={register}
                  error={errors.bloodGroup}
                />
                <InputField
                  label="Nationality"
                  name="nationality"
                  register={register}
                  error={errors.nationality}
                />
                <InputField
                  label="Religion"
                  name="religion"
                  register={register}
                  error={errors.religion}
                />
                <InputField
                  label="Caste"
                  name="casteName"
                  register={register}
                  error={errors.casteName}
                />
                <InputField
                  label="Category"
                  name="category"
                  options={categoryOptions}
                  register={register}
                  error={errors.category}
                />
                <InputField
                  label="Identification Mark 1"
                  name="identificationMark1"
                  register={register}
                  error={errors.identificationMark1}
                />
                <InputField
                  label="Identification Mark 2"
                  name="identificationMark2"
                  register={register}
                  error={errors.identificationMark2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Address Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Address Information" icon={MapPinIcon} section="address" />
          {expandedSections.address && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="House Name" name="houseName" register={register} error={errors.houseName} />
                <InputField label="Street Name" name="streetName" register={register} error={errors.streetName} />
                <InputField label="Post Office" name="postOffice" register={register} error={errors.postOffice} />
                <InputField label="Pincode" name="pincode" register={register} error={errors.pincode} />
                <InputField label="Local Body" name="localBody" register={register} error={errors.localBody} />
                <InputField label="Municipality" name="municipality" register={register} error={errors.municipality} />
                <InputField label="Grama Panchayath" name="gramaPanchayath" register={register} error={errors.gramaPanchayath} />
                <InputField label="District Panchayath" name="districtPanchayath" register={register} error={errors.districtPanchayath} />
                <InputField label="Corporation" name="corporation" register={register} error={errors.corporation} />
                <InputField label="Taluk" name="taluk" register={register} error={errors.taluk} />
                <InputField label="Block Panchayath" name="blockPanchayath" register={register} error={errors.blockPanchayath} />
                <InputField label="Revenue District" name="revenueDistrict" register={register} error={errors.revenueDistrict} />
              </div>
            </div>
          )}
        </div>

        {/* Parent/Guardian Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Parent / Guardian Information" icon={PhoneIcon} section="parent" />
          {expandedSections.parent && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Father's Name" name="fatherFullName" register={register} error={errors.fatherFullName} />
                <InputField label="Mother's Name" name="motherFullName" register={register} error={errors.motherFullName} />
                <InputField label="Guardian Name" name="guardian" register={register} error={errors.guardian} />
                <InputField label="Relation with Guardian" name="relationOfGuardian" register={register} error={errors.relationOfGuardian} />
                <InputField label="Guardian Occupation" name="occupationOfGuardian" register={register} error={errors.occupationOfGuardian} />
                <InputField label="Phone Number" name="phoneNumber" type="tel" register={register} error={errors.phoneNumber} />
              </div>
            </div>
          )}
        </div>

        {/* Academic Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Academic Information" icon={AcademicCapIcon} section="academic" isRequired />
          {expandedSections.academic && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('academicYearId', { required: 'Academic year is required' })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white ${
                      errors.academicYearId ? 'border-rose-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year) => (
                      <option key={year._id} value={year._id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                  {errors.academicYearId && <p className="mt-1 text-xs text-rose-500">{errors.academicYearId.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('classId', { required: 'Class is required' })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white ${
                      errors.classId ? 'border-rose-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.displayName || cls.name}
                      </option>
                    ))}
                  </select>
                  {errors.classId && <p className="mt-1 text-xs text-rose-500">{errors.classId.message}</p>}
                </div>
                <InputField label="Class on Admission" name="classOnAdmission" register={register} error={errors.classOnAdmission} />
                <InputField label="Instruction Medium" name="instructionMedium" options={mediumOptions} register={register} error={errors.instructionMedium} />
              </div>
            </div>
          )}
        </div>

        {/* Language Subjects Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Language Subjects" icon={BookOpenIcon} section="languages" isRequired />
          {expandedSections.languages && (
            <div className="p-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Language Paper 1 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('firstLanguagePaper1', { required: 'First Language Paper 1 is required' })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="">Select First Language Paper 1</option>
                    {languageSubjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                  {errors.firstLanguagePaper1 && <p className="mt-1 text-xs text-rose-500">{errors.firstLanguagePaper1.message}</p>}
                  <p className="text-xs text-gray-500 mt-1">This is the main language subject (e.g., Malayalam, English)</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Language Paper 2
                  </label>
                  <select
                    {...register('firstLanguagePaper2')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    disabled={!selectedFirstLanguage1}
                  >
                    <option value="">{!selectedFirstLanguage1 ? 'Select Paper 1 first' : 'Select First Language Paper 2 (Optional)'}</option>
                    {getAvailableLanguagesForPaper2().map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Second part of the same language (if applicable)</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Third Language
                  </label>
                  <select
                    {...register('thirdLanguage')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="">Select Third Language (Optional)</option>
                    {getAvailableLanguagesForThird().map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Additional language subject (e.g., Hindi, Arabic, Sanskrit)</p>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAdditionalLanguage}
                      onChange={(e) => {
                        setShowAdditionalLanguage(e.target.checked)
                        if (!e.target.checked) {
                          reset({ ...watch(), additionalLanguage: '' })
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Additional Language</span>
                  </label>
                </div>

                {showAdditionalLanguage && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Additional Language
                    </label>
                    <select
                      {...register('additionalLanguage')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="">Select Additional Language</option>
                      {getAvailableLanguagesForAdditional().map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Extra language subject beyond the required ones</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bank Information Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Bank Information" icon={BanknotesIcon} section="bank" />
          {expandedSections.bank && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Bank Name" name="bankName" register={register} error={errors.bankName} />
                <InputField label="Branch Name" name="branchName" register={register} error={errors.branchName} />
                <InputField label="IFSC Code" name="ifscCode" register={register} error={errors.ifscCode} />
                <InputField label="Account Number" name="accountNumber" register={register} error={errors.accountNumber} />
              </div>
            </div>
          )}
        </div>

        {/* Status Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Status" icon={CheckCircleIcon} section="status" />
          {expandedSections.status && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Student Status" name="status" options={statusOptions} register={register} error={errors.status} />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Update Student' : 'Create Student'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default StudentForm