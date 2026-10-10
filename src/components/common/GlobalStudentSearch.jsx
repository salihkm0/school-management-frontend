import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AcademicCapIcon,
  IdentificationIcon,
  UserCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import api from '../../services/api'

const GlobalStudentSearch = ({
  variant = 'card', // 'card' | 'compact'
  placeholder = 'Search student by name, register no, admission no, roll no...',
  className = '',
  onSelectStudent = null
}) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([])
      setIsOpen(false)
      setIsLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await api.get('/students/search', {
          params: { q: searchTerm.trim(), limit: 15 }
        })
        const data = res.data?.data || []
        setResults(data)
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch (err) {
        console.error('Global student search error:', err)
        // Fallback to /search?q=...&type=student if /students/search has issues
        try {
          const fallback = await api.get('/search', {
            params: { q: searchTerm.trim(), type: 'student', limit: 15 }
          })
          setResults(fallback.data?.data?.students || [])
          setIsOpen(true)
        } catch (_) {
          setResults([])
        }
      } finally {
        setIsLoading(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = selectedIndex >= 0 ? results[selectedIndex] : results[0]
      if (target) handleStudentClick(target)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleStudentClick = (student) => {
    setIsOpen(false)
    if (onSelectStudent) {
      onSelectStudent(student)
    } else {
      navigate(`/students/${student._id || student.id}`)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'S'
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <div className="relative flex items-center">
          <MagnifyingGlassIcon className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-9 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                setResults([])
                setIsOpen(false)
                inputRef.current?.focus()
              }}
              className="absolute right-2.5 p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {isLoading && (
            <div className="absolute right-3">
              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto divide-y divide-gray-50">
            {results.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                {isLoading ? 'Searching students...' : `No students found matching "${searchTerm}"`}
              </div>
            ) : (
              results.map((student, idx) => (
                <div
                  key={student._id || student.id}
                  onClick={() => handleStudentClick(student)}
                  className={`p-2.5 flex items-center justify-between hover:bg-emerald-50/60 cursor-pointer transition-colors ${
                    selectedIndex === idx ? 'bg-emerald-50/90' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {getInitials(student.fullName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-gray-900 truncate">
                        {student.fullName}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                        {student.className && (
                          <span className="font-medium text-emerald-700">
                            Class {student.className} {student.division ? `- ${student.division}` : ''}
                          </span>
                        )}
                        {student.admissionNo && (
                          <span>• Adm: {student.admissionNo}</span>
                        )}
                        {student.rollNumber && (
                          <span>• Roll: {student.rollNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  // Default: Card Variant for Dashboards
  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 relative ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
              Global Student Search
            </h3>
            <p className="text-xs text-gray-500">
              Instant search by Name, Register No, Admission No, or Roll No
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <span className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Name</span>
          <span className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Register No</span>
          <span className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Admission No</span>
          <span className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">Roll No</span>
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent transition-all shadow-inner"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('')
              setResults([])
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/60 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute left-4 right-4 sm:left-5 sm:right-5 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>
              {results.length > 0
                ? `Found ${results.length} student${results.length !== 1 ? 's' : ''}`
                : 'No results'}
            </span>
            <span className="text-[11px] text-gray-400">Press ↑↓ to navigate, Enter to select</span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <MagnifyingGlassIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700">No students found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching with partial name, admission number, or register number
              </p>
            </div>
          ) : (
            results.map((student, idx) => {
              const cls = student.classId?.displayName || student.classId?.name || student.className || 'N/A'
              const sec = student.classId?.section || student.division || ''
              const classStr = sec ? `${cls} - ${sec}` : cls

              return (
                <div
                  key={student._id || student.id}
                  onClick={() => handleStudentClick(student)}
                  className={`p-3.5 flex items-center justify-between hover:bg-emerald-50/70 cursor-pointer transition-colors group ${
                    selectedIndex === idx ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                        {getInitials(student.fullName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                          {student.fullName}
                        </span>
                        {student.fullNameMalayalam && (
                          <span className="text-xs text-gray-500 hidden md:inline truncate">
                            ({student.fullNameMalayalam})
                          </span>
                        )}
                        {student.status === 'active' ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 capitalize">
                            {student.status || 'Inactive'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                          <AcademicCapIcon className="w-3.5 h-3.5 text-emerald-600" />
                          Class: {classStr}
                        </span>
                        {student.rollNumber && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">
                            Roll: #{student.rollNumber}
                          </span>
                        )}
                        {student.admissionNo && (
                          <span className="text-gray-600">
                            Adm: <strong className="text-gray-900">{student.admissionNo}</strong>
                          </span>
                        )}
                        {student.studentCode && student.studentCode !== student.admissionNo && (
                          <span className="text-gray-500">
                            Reg: {student.studentCode}
                          </span>
                        )}
                        {student.phoneNumber && (
                          <span className="text-gray-400 hidden lg:inline">
                            📞 {student.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View Profile
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalStudentSearch
