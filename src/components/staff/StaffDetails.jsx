// src/components/staff/StaffDetails.jsx
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PencilIcon, ArrowLeftIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, AcademicCapIcon, BriefcaseIcon, BuildingLibraryIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { fetchStaffById, clearCurrentStaff } from '../../store/slices/staffSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import { formatDate } from '../../utils/helpers'

const StaffDetails = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentStaff, isLoading } = useSelector((state) => state.staff)

  useEffect(() => {
    dispatch(fetchStaffById(id))
    return () => { dispatch(clearCurrentStaff()) }
  }, [dispatch, id])

  if (isLoading || !currentStaff) return <LoadingSpinner />

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-100 last:border-0 gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  )

  const SectionCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/staff')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{currentStaff.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500">Staff Code: {currentStaff.staffCode}</p>
          </div>
        </div>
        <Link to={`/staff/${id}/edit`} className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all">
          <PencilIcon className="w-4 h-4" />
          <span>Edit</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Profile" icon={UserCircleIcon}>
          <InfoRow label="Full Name" value={currentStaff.name} />
          <InfoRow label="Short Name" value={currentStaff.shortName || '-'} />
          <InfoRow label="Staff Code" value={currentStaff.staffCode} />
          <InfoRow label="Role" value={currentStaff.role?.toUpperCase()} />
          <InfoRow label="Qualification" value={currentStaff.qualification} />
          <InfoRow label="Gender" value={currentStaff.gender === 'M' ? 'Male' : currentStaff.gender === 'F' ? 'Female' : 'Other'} />
          <InfoRow label="Date of Birth" value={formatDate(currentStaff.dateOfBirth)} />
          <InfoRow label="Date of Joining" value={formatDate(currentStaff.dateOfJoining)} />
        </SectionCard>

        <SectionCard title="Contact" icon={PhoneIcon}>
          <InfoRow label="Email" value={currentStaff.email} />
          <InfoRow label="Phone" value={currentStaff.contact} />
          <InfoRow label="Emergency Contact" value={currentStaff.emergencyContact?.name ? `${currentStaff.emergencyContact.name} (${currentStaff.emergencyContact.phone})` : '-'} />
          <InfoRow label="Emergency Relation" value={currentStaff.emergencyContact?.relation || '-'} />
        </SectionCard>

        <SectionCard title="Professional" icon={BriefcaseIcon}>
          <InfoRow label="Subject Expertise" value={currentStaff.subjectExpertise?.join(', ') || '-'} />
          <InfoRow label="Specialization" value={currentStaff.specialization?.join(', ') || '-'} />
          <InfoRow label="Previous Experience" value={currentStaff.previousExperience?.years ? `${currentStaff.previousExperience.years} years` : '-'} />
          <InfoRow label="Remarks" value={currentStaff.remarks || '-'} />
        </SectionCard>

        <SectionCard title="Bank Details" icon={BuildingLibraryIcon}>
          <InfoRow label="Account Holder" value={currentStaff.bankDetails?.accountHolderName || '-'} />
          <InfoRow label="Account Number" value={currentStaff.bankDetails?.accountNumber || '-'} />
          <InfoRow label="Bank Name" value={currentStaff.bankDetails?.bankName || '-'} />
          <InfoRow label="IFSC Code" value={currentStaff.bankDetails?.ifscCode || '-'} />
        </SectionCard>
      </div>
    </div>
  )
}

export default StaffDetails