import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, DocumentArrowDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { historicalImportService } from '../../../services/historicalImportService'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const HistoricalMarksList = () => {
  const { year, standard, medium, division } = useParams()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingStudentId, setDownloadingStudentId] = useState(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await historicalImportService.getHierarchicalStudents(year, standard, medium, division)
        if (res.data?.success) {
          setStudents(res.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch students:', error)
        toast.error('Failed to load students')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStudents()
  }, [year, standard, medium, division])

  const handleDownloadClassPdf = async () => {
    if (students.length === 0) return
    setIsDownloading(true)
    try {
      await historicalImportService.downloadPdf(students[0].importId, {
        grade: standard,
        division: division
      })
      toast.success('Class PDF download started')
    } catch (error) {
      console.error(error)
      toast.error('Failed to download class PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadStudentPdf = async (student) => {
    setDownloadingStudentId(student._id)
    try {
      await historicalImportService.downloadStudentPdf(
        student._id,
        student.name,
        student.admissionNo || student.slNo
      )
      toast.success(`${student.name}'s marklist downloaded`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to download student PDF')
    } finally {
      setDownloadingStudentId(null)
    }
  }

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const uniqueSubjects = useMemo(() => {
    const subjectsMap = {}
    filteredStudents.forEach(student => {
      (student.subjects || []).forEach(sub => {
        if (!subjectsMap[sub.subjectCode]) {
          subjectsMap[sub.subjectCode] = {
            code: sub.subjectCode,
            label: sub.subjectLabel || sub.subjectCode,
            maxMarks: sub.maxMarks || 100
          }
        } else {
          if (sub.maxMarks > subjectsMap[sub.subjectCode].maxMarks) {
             subjectsMap[sub.subjectCode].maxMarks = sub.maxMarks
          }
        }
      })
    })
    return Object.values(subjectsMap).sort((a, b) => a.code.localeCompare(b.code))
  }, [filteredStudents])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate(`/historical-records/${year}/${standard}/${medium}`)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4 mr-1" />
        Back to Classes
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks for {standard} {division}</h1>
          <p className="text-gray-500 mt-1">{year} | {medium} Medium</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleDownloadClassPdf}
            disabled={isDownloading || students.length === 0}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Export Class PDF'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                {uniqueSubjects.map(subj => (
                  <th key={subj.code} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {subj.code}
                    <div className="text-[10px] text-gray-400 normal-case mt-0.5">/{subj.maxMarks}</div>
                  </th>
                ))}
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Marks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const percentage = student.maxTotal > 0 ? ((student.total / student.maxTotal) * 100).toFixed(2) : 0;
                  return (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {student.slNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.admissionNo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.gender === 'F' ? 'Female' : (student.gender === 'M' ? 'Male' : '')}</div>
                      </td>
                      {uniqueSubjects.map(subj => {
                        const found = student.subjects?.find(s => s.subjectCode === subj.code);
                        const val = found?.obtained ?? '-';
                        const pct = found ? (found.obtained / (subj.maxMarks || 100)) * 100 : -1;
                        return (
                          <td key={subj.code} className={`px-4 py-4 whitespace-nowrap text-center text-sm font-semibold ${
                              pct < 0 ? 'text-gray-300' :
                              pct >= 80 ? 'text-emerald-600' :
                              pct >= 60 ? 'text-blue-600' :
                              pct >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                            {val}
                          </td>
                        )
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900 font-medium">{student.total} <span className="text-gray-400 text-xs font-normal">/ {student.maxTotal}</span></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          percentage >= 90 ? 'bg-green-100 text-green-800' :
                          percentage >= 75 ? 'bg-emerald-100 text-emerald-800' :
                          percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownloadStudentPdf(student)}
                          disabled={downloadingStudentId === student._id}
                          className="text-emerald-600 hover:text-emerald-900 flex items-center justify-end gap-1 disabled:opacity-50"
                        >
                          {downloadingStudentId === student._id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </>
                          ) : (
                            <>
                              <DocumentArrowDownIcon className="w-4 h-4" />
                              Marklist
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default HistoricalMarksList
