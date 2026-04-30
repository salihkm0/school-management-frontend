import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import { fetchSubjects, deleteSubject } from '../../store/slices/subjectSlice'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmModal from '../common/Modal'

const SubjectList = () => {
  const dispatch = useDispatch()
  const { subjects, isLoading, pagination } = useSelector((state) => state.subjects)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)

  useEffect(() => {
    dispatch(fetchSubjects({ search, type: filterType }))
  }, [dispatch, search, filterType])

  const handleDelete = async () => {
    if (selectedSubject) {
      await dispatch(deleteSubject(selectedSubject._id))
      setShowDeleteModal(false)
      setSelectedSubject(null)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Subjects</h1><p className="text-gray-500 mt-1">Manage all subjects offered in the school</p></div>
        <div className="flex space-x-2"><Link to="/subjects/template" className="flex items-center space-x-2 px-4 py-2 border border-primary-500 text-primary-500 rounded-lg"><DocumentArrowUpIcon className="w-5 h-5" /><span>Templates</span></Link><Link to="/subjects/new" className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg"><PlusIcon className="w-5 h-5" /><span>Add Subject</span></Link></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2 border rounded-lg" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="">All Types</option><option value="core">Core</option><option value="elective">Elective</option><option value="optional">Optional</option></select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Subject Name</th><th className="px-6 py-3 text-left">Code</th><th className="px-6 py-3 text-left">Type</th><th className="px-6 py-3 text-left">Department</th><th className="px-6 py-3 text-left">Credit Hours</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">{subjects.map((subject) => (<tr key={subject._id} className="hover:bg-gray-50"><td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{subject.name}</div></td><td className="px-6 py-4 text-sm text-gray-600">{subject.code}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${subject.type === 'core' ? 'bg-green-100 text-green-800' : subject.type === 'elective' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{subject.type}</span></td><td className="px-6 py-4 text-sm text-gray-600">{subject.department || '-'}</td><td className="px-6 py-4 text-sm text-gray-600">{subject.creditHours}</td><td className="px-6 py-4 text-right"><div className="flex justify-end space-x-2"><Link to={`/subjects/${subject._id}`} className="text-blue-600"><EyeIcon className="w-5 h-5" /></Link><Link to={`/subjects/${subject._id}/edit`} className="text-green-600"><PencilIcon className="w-5 h-5" /></Link><button onClick={() => { setSelectedSubject(subject); setShowDeleteModal(true) }} className="text-red-600"><TrashIcon className="w-5 h-5" /></button></div></td></tr>))}</tbody>
        </table>
      </div>

      <ConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedSubject(null) }} onConfirm={handleDelete} title="Deactivate Subject" message={`Deactivate ${selectedSubject?.name}? This will mark it as inactive.`} confirmText="Deactivate" confirmVariant="danger" />
    </div>
  )
}

export default SubjectList