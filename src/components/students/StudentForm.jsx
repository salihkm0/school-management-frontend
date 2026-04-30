import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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

  // Filter language subjects (department = 'Languages' or type = 'language')
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

  // Populate form when student data is loaded
  useEffect(() => {
    if (isEditing && currentStudent) {
      // Handle date formatting
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
      
      // Get IDs from populated objects or direct values
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
      
      // Check if additional language is set
      if (currentStudent.additionalLanguage) {
        setShowAdditionalLanguage(true)
      }
    }
  }, [isEditing, currentStudent, reset])

  const onSubmit = async (data) => {
    try {
      // Format data before sending
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
        annualIncome: data.annualIncome ? parseInt(data.annualIncome) : undefined,
        // If additional language is not enabled, remove it
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

  // Get available languages for paper 2 (excluding the selected paper 1)
  const getAvailableLanguagesForPaper2 = () => {
    if (!selectedFirstLanguage1) return languageSubjects
    return languageSubjects.filter(sub => sub._id !== selectedFirstLanguage1)
  }

  // Get available languages for third language (excluding first language papers)
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

  // Get available languages for additional language (excluding all selected)
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

  if (isLoading || classesLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Student' : 'Add New Student'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEditing ? 'Update student information' : 'Enter student details to add to the system'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                {...register('fullName', { required: 'Full name is required' })}
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Code *
              </label>
              <input
                {...register('studentCode', { required: 'Student code is required' })}
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                  errors.studentCode ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.studentCode && (
                <p className="mt-1 text-xs text-red-500">{errors.studentCode.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admission Number *
              </label>
              <input
                {...register('admissionNo', { required: 'Admission number is required' })}
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                  errors.admissionNo ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.admissionNo && (
                <p className="mt-1 text-xs text-red-500">{errors.admissionNo.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admission Date
              </label>
              <input
                {...register('admissionDate')}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                {...register('gender')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                {...register('dateOfBirth')}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Place
              </label>
              <input
                {...register('birthPlace')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              <select
                {...register('bloodGroup')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationality
              </label>
              <input
                {...register('nationality')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Indian"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Religion
              </label>
              <input
                {...register('religion')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caste
              </label>
              <input
                {...register('casteName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identification Mark 1
              </label>
              <input
                {...register('identificationMark1')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., A black mole on right hand"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identification Mark 2
              </label>
              <input
                {...register('identificationMark2')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Name
              </label>
              <input
                {...register('houseName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Name
              </label>
              <input
                {...register('streetName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Post Office
              </label>
              <input
                {...register('postOffice')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode
              </label>
              <input
                {...register('pincode')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local Body
              </label>
              <input
                {...register('localBody')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipality
              </label>
              <input
                {...register('municipality')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grama Panchayath
              </label>
              <input
                {...register('gramaPanchayath')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District Panchayath
              </label>
              <input
                {...register('districtPanchayath')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Corporation
              </label>
              <input
                {...register('corporation')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taluk
              </label>
              <input
                {...register('taluk')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Block Panchayath
              </label>
              <input
                {...register('blockPanchayath')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revenue District
              </label>
              <input
                {...register('revenueDistrict')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Parent / Guardian Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father's Name
              </label>
              <input
                {...register('fatherFullName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mother's Name
              </label>
              <input
                {...register('motherFullName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guardian Name
              </label>
              <input
                {...register('guardian')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation with Guardian
              </label>
              <input
                {...register('relationOfGuardian')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guardian Occupation
              </label>
              <input
                {...register('occupationOfGuardian')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                {...register('phoneNumber')}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year *
              </label>
              <select
                {...register('academicYearId', { required: 'Academic year is required' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                  errors.academicYearId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year._id} value={year._id}>
                    {year.name}
                  </option>
                ))}
              </select>
              {errors.academicYearId && (
                <p className="mt-1 text-xs text-red-500">{errors.academicYearId.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                {...register('classId', { required: 'Class is required' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                  errors.classId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.displayName || cls.name}
                  </option>
                ))}
              </select>
              {errors.classId && (
                <p className="mt-1 text-xs text-red-500">{errors.classId.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class on Admission
              </label>
              <input
                {...register('classOnAdmission')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 1, 5, 8"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instruction Medium
              </label>
              <select
                {...register('instructionMedium')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Medium</option>
                <option value="Malayalam">Malayalam</option>
                <option value="English">English</option>
                <option value="Kannada">Kannada</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>
          </div>
        </div>

        {/* Language Subjects Section - DYNAMIC */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Subjects</h2>
          <div className="space-y-4">
            {/* First Language Paper 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Language Paper 1 *
              </label>
              <select
                {...register('firstLanguagePaper1', { required: 'First Language Paper 1 is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Select First Language Paper 1</option>
                {languageSubjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              {errors.firstLanguagePaper1 && (
                <p className="mt-1 text-xs text-red-500">{errors.firstLanguagePaper1.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">This is the main language subject (e.g., Malayalam, English)</p>
            </div>

            {/* First Language Paper 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Language Paper 2
              </label>
              <select
                {...register('firstLanguagePaper2')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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

            {/* Third Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Third Language
              </label>
              <select
                {...register('thirdLanguage')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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

            {/* Additional Language - Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAdditionalLanguage}
                  onChange={(e) => {
                    setShowAdditionalLanguage(e.target.checked)
                    if (!e.target.checked) {
                      reset({ ...watch(), additionalLanguage: '' })
                    }
                  }}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Additional Language</span>
              </label>
            </div>

            {/* Additional Language Dropdown */}
            {showAdditionalLanguage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Language
                </label>
                <select
                  {...register('additionalLanguage')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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

        {/* Bank Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                {...register('bankName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name
              </label>
              <input
                {...register('branchName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                {...register('ifscCode')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
                placeholder="e.g., SBIN0001234"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                {...register('accountNumber')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Status
            </label>
            <select
              {...register('status')}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
              <option value="transferred">Transferred</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              isEditing ? 'Update Student' : 'Create Student'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default StudentForm