import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { historicalImportService } from '../../../services/historicalImportService'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const HistoricalMediumsList = () => {
  const { year, standard } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/open') ? '/open/marklist' : '/historical-records'
  const [mediums, setMediums] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMediums = async () => {
      try {
        const res = await historicalImportService.getHierarchicalMediums(year, standard)
        if (res.data?.success) {
          setMediums(res.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch mediums:', error)
        toast.error('Failed to load mediums')
      } finally {
        setIsLoading(false)
      }
    }
    fetchMediums()
  }, [year, standard])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate(`${basePath}/${year}`)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4 mr-1" />
        Back to Standards
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Standard {standard}</h1>
        <p className="text-gray-500 mt-1">Select an Instructional Medium</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {mediums.map((med) => (
          <div
            key={med.item || med}
            onClick={() => navigate(`${basePath}/${year}/${standard}/${med.item || med}`)}
            className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group relative"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <GlobeAltIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">{med.item || med}</span>
            {med.count !== undefined && (
              <span className="mt-2 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {med.count} Records
              </span>
            )}
          </div>
        ))}
      </div>

      {mediums.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
          <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No mediums found</h3>
          <p className="mt-1 text-sm text-gray-500">No records exist for this standard.</p>
        </div>
      )}
    </div>
  )
}

export default HistoricalMediumsList
