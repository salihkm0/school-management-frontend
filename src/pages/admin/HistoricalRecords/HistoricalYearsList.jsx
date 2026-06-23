import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FolderIcon, DocumentArrowUpIcon, ServerStackIcon,
  TrashIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon
} from '@heroicons/react/24/outline'
import { historicalImportService } from '../../../services/historicalImportService'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import AddHistoricalDataModal from './AddHistoricalDataModal'

const HistoricalYearsList = () => {
  const navigate = useNavigate()
  const [years, setYears] = useState([])
  const [imports, setImports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(null)

  const statusIcon = (status) => {
    if (status === 'done') return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />;
    if (status === 'error') return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
    return <ClockIcon className="h-4 w-4 text-amber-500 animate-pulse" />;
  };

  const statusBadge = (status) => {
    const map = {
      done: 'bg-emerald-100 text-emerald-700',
      error: 'bg-red-100 text-red-700',
      processing: 'bg-amber-100 text-amber-700',
    };
    const labels = { done: 'Ready', error: 'Error', processing: 'Processing…' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || map.processing}`}>
        {labels[status] || 'Processing…'}
      </span>
    );
  };

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [yearsRes, importsRes] = await Promise.all([
        historicalImportService.getHierarchicalYears(),
        historicalImportService.getAll()
      ])
      if (yearsRes.data?.success) setYears(yearsRes.data.data)
      if (importsRes.data?.success) setImports(importsRes.data.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load historical records')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this import and ALL student data? This cannot be undone.')) return;
    setDeleteLoading(id);
    try {
      await historicalImportService.deleteImport(id);
      toast.success('Deleted successfully');
      fetchData();
    } catch { 
      toast.error('Failed to delete import'); 
    } finally { 
      setDeleteLoading(null); 
    }
  };

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historical Mark Records</h1>
          <p className="text-gray-500 mt-1">Select an academic year to view past performance records</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
        >
          <DocumentArrowUpIcon className="w-5 h-5" />
          Add Historical Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {years.map((yearObj) => (
          <div
            key={yearObj.academicYear}
            onClick={() => navigate(`/historical-records/${yearObj.academicYear}`)}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FolderIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
              {yearObj.academicYear}
            </h3>
            <div className="mt-1 text-sm text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 inline-block font-medium">
              {yearObj.totalStudents || 0} Records
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              {yearObj.source === 'DB_GENERATION' ? (
                <span className="inline-flex items-center gap-1"><ServerStackIcon className="w-4 h-4" /> Generated</span>
              ) : (
                <span className="inline-flex items-center gap-1"><DocumentArrowUpIcon className="w-4 h-4" /> Imported</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {years.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No records found</h3>
          <p className="mt-1 text-sm text-gray-500">Add historical data using the button above.</p>
        </div>
      )}

      {/* Import History Section */}
      <h2 className="text-xl font-bold text-gray-900 mt-12 mb-6">Import History</h2>
      {imports.length === 0 ? (
        <p className="text-gray-500 text-sm">No import batches found.</p>
      ) : (
        <div className="space-y-3">
          {imports.map((batch) => (
            <div
              key={batch._id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {statusIcon(batch.status)}
                  <span className="font-semibold text-gray-900 truncate">{batch.fileName}</span>
                  {statusBadge(batch.status)}
                </div>
                <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>📅 {batch.academicYear}</span>
                  <span>👥 {batch.totalStudents?.toLocaleString() || 0} students</span>
                  {batch.sheets?.length > 0 && <span>📋 {batch.sheets.length} sheets</span>}
                  <span>🕒 {new Date(batch.createdAt).toLocaleDateString('en-IN')}</span>
                  <span>{batch.source === 'DB_GENERATION' ? '💾 DB Generation' : '📄 XLS Import'}</span>
                </div>
                {batch.status === 'error' && (
                  <p className="text-red-500 text-xs mt-1">{batch.errorMessage}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap shrink-0">
                <button
                  onClick={() => handleDelete(batch._id)}
                  disabled={deleteLoading === batch._id}
                  className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  {deleteLoading === batch._id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddHistoricalDataModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false)
            fetchData()
          }} 
        />
      )}
    </div>
  )
}

export default HistoricalYearsList
