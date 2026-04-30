import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PencilIcon, ArrowLeftIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, AcademicCapIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
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

  const InfoRow = ({ label, value }) => (<div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-500">{label}</span><span className="text-sm font-medium text-gray-900">{value || '-'}</span></div>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div className="flex items-center space-x-4"><button onClick={() => navigate('/staff')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><ArrowLeftIcon className="w-5 h-5" /></button><div><h1 className="text-2xl font-bold text-gray-900">{currentStaff.name}</h1><p className="text-gray-500">Staff Code: {currentStaff.staffCode}</p></div></div><Link to={`/staff/${id}/edit`} className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg"><PencilIcon className="w-5 h-5" /><span>Edit Staff</span></Link></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="text-lg font-semibold mb-4 flex items-center"><AcademicCapIcon className="w-5 h-5 mr-2 text-primary-500" />Profile Information</h2><InfoRow label="Full Name" value={currentStaff.name} /><InfoRow label="Staff Code" value={currentStaff.staffCode} /><InfoRow label="Role" value={currentStaff.role?.toUpperCase()} /><InfoRow label="Qualification" value={currentStaff.qualification} /><InfoRow label="Gender" value={currentStaff.gender === 'M' ? 'Male' : currentStaff.gender === 'F' ? 'Female' : 'Other'} /><InfoRow label="Date of Birth" value={formatDate(currentStaff.dateOfBirth)} /><InfoRow label="Date of Joining" value={formatDate(currentStaff.dateOfJoining)} /></div>

        <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="text-lg font-semibold mb-4 flex items-center"><PhoneIcon className="w-5 h-5 mr-2 text-primary-500" />Contact Information</h2><InfoRow label="Email" value={currentStaff.email} /><InfoRow label="Phone" value={currentStaff.contact} /><InfoRow label="Emergency Contact" value={currentStaff.emergencyContact?.name ? `${currentStaff.emergencyContact.name} (${currentStaff.emergencyContact.phone})` : '-'} /><InfoRow label="Emergency Relation" value={currentStaff.emergencyContact?.relation || '-'} /></div>

        <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="text-lg font-semibold mb-4 flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2 text-primary-500" />Professional Information</h2><InfoRow label="Subject Expertise" value={currentStaff.subjectExpertise?.join(', ') || '-'} /><InfoRow label="Specialization" value={currentStaff.specialization?.join(', ') || '-'} /><InfoRow label="Previous Experience" value={currentStaff.previousExperience?.years ? `${currentStaff.previousExperience.years} years` : '-'} /><InfoRow label="Remarks" value={currentStaff.remarks || '-'} /></div>

        <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="text-lg font-semibold mb-4 flex items-center"><CalendarIcon className="w-5 h-5 mr-2 text-primary-500" />Bank Details</h2><InfoRow label="Account Holder" value={currentStaff.bankDetails?.accountHolderName || '-'} /><InfoRow label="Account Number" value={currentStaff.bankDetails?.accountNumber || '-'} /><InfoRow label="Bank Name" value={currentStaff.bankDetails?.bankName || '-'} /><InfoRow label="IFSC Code" value={currentStaff.bankDetails?.ifscCode || '-'} /></div>
      </div>
    </div>
  )
}

export default StaffDetails