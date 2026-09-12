// src/components/reports/AnalyticsDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchGradeAnalysis, fetchFullAPlusStudents, fetchNearFullAPlusStudents, fetchTopPerformingClasses } from '../../services/analyticsService'
import { fetchExams } from '../../store/slices/examSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import { 
  ChartBarIcon, 
  AcademicCapIcon, 
  UserGroupIcon, 
  TrophyIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import LoadingSpinner from '../common/LoadingSpinner'
import toast from 'react-hot-toast'
import { useAdminTeacherClasses } from '../../hooks/useAdminTeacherClasses'
import AttendanceAnalyticsView from './AttendanceAnalyticsView'

// Helper: compute grade from percentage (mirrors backend logic)
const getGradeFromPercentage = (percentage) => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  if (percentage >= 30) return 'D+'
  if (percentage >= 20) return 'D'
  return 'E'
}

const AnalyticsDashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const isStaff = user?.role === 'staff'
  const { exams } = useSelector((state) => state.exams)
  const { classes } = useSelector((state) => state.classes)
  const { myClasses } = useAdminTeacherClasses('all')
  
  const availableClasses = isStaff ? myClasses : classes

  const [analyticsType, setAnalyticsType] = useState('exam') // 'exam' | 'attendance'
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [gradeAnalysis, setGradeAnalysis] = useState(null)
  const [fullAPlus, setFullAPlus] = useState([])
  const [nearFullAPlus, setNearFullAPlus] = useState([])
  const [nearFullAPlusDetail, setNearFullAPlusDetail] = useState(null)
  const [topClasses, setTopClasses] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Rank-Wise Student List States
  const [rankMode, setRankMode] = useState('TE') // 'TE' (Default: Theory Only) | 'TE_CE' (Theory + CE)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentGradeFilter, setStudentGradeFilter] = useState('ALL')
  const [studentPage, setStudentPage] = useState(1)
  const [studentPageSize, setStudentPageSize] = useState(25)
  const [exportLimit, setExportLimit] = useState('100')
  const [isRankListExpanded, setIsRankListExpanded] = useState(true)

  const [expandedSections, setExpandedSections] = useState({
    fullAPlus: true,
    nearAPlus: true,
    withoutMaths: true,
    withoutEnglish: true,
    withoutMalayalam: true,
    withoutHindi: true,
    withoutArabic: true,
    withoutSocial: true,
    withoutIT: true
  })

  useEffect(() => {
    dispatch(fetchExams({ limit: 100 }))
    dispatch(fetchClasses({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (isStaff && myClasses.length > 0 && !selectedClass) {
      const firstClassId = myClasses[0]._id || myClasses[0].id
      if (firstClassId) setSelectedClass(firstClassId.toString())
    }
  }, [isStaff, myClasses])

  useEffect(() => {
    if (selectedExam) {
      loadAnalytics()
    }
  }, [selectedExam, selectedClass])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const [analysis, fullA, nearFullA, topC] = await Promise.all([
        fetchGradeAnalysis(selectedExam, selectedClass || undefined),
        fetchFullAPlusStudents(selectedExam, selectedClass || undefined),
        fetchNearFullAPlusStudents(selectedExam, selectedClass || undefined),
        fetchTopPerformingClasses(selectedExam, 5)
      ])
      
      // Extract data from response
      const analysisData = analysis?.data || analysis
      setGradeAnalysis(analysisData)
      setFullAPlus(fullA?.data || [])
      setNearFullAPlus(nearFullA?.data || [])
      setNearFullAPlusDetail(analysisData?.analysis || {})
      setTopClasses(topC || [])
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedClass('')
    if (selectedExam) loadAnalytics()
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(','))
    ]
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} records`)
  }

  // Reset pagination when filter criteria change
  useEffect(() => {
    setStudentPage(1)
  }, [selectedExam, selectedClass, rankMode, studentSearch, studentGradeFilter, studentPageSize])

  const rawStudentResults = gradeAnalysis?.studentResults || []

  // Rank-wise sorted student list
  const sortedStudents = useMemo(() => {
    if (!rawStudentResults || rawStudentResults.length === 0) return []
    const list = [...rawStudentResults]

    if (rankMode === 'TE') {
      // TE Only: Use rankTeTotal (which excludes PE/WE/Drawing), tie-break by TE%
      return list.sort((a, b) => {
        const teDiff = (b.rankTeTotal || 0) - (a.rankTeTotal || 0)
        if (teDiff !== 0) return teDiff
        const pctDiff = (b.rankTePercentage || 0) - (a.rankTePercentage || 0)
        if (pctDiff !== 0) return pctDiff
        return (b.rankTotalObtained || 0) - (a.rankTotalObtained || 0)
      })
    } else {
      // TE + CE: Use rankTotalObtained (which excludes PE/WE/Drawing), tie-break by Total%
      return list.sort((a, b) => {
        const totalDiff = (b.rankTotalObtained || 0) - (a.rankTotalObtained || 0)
        if (totalDiff !== 0) return totalDiff
        const pctDiff = (b.rankTotalPercentage || 0) - (a.rankTotalPercentage || 0)
        if (pctDiff !== 0) return pctDiff
        return (b.rankTeTotal || 0) - (a.rankTeTotal || 0)
      })
    }
  }, [rawStudentResults, rankMode])

  // Helper to get rank-specific values for a student
  const getStudentRankData = (student) => {
    const isTE = rankMode === 'TE'
    return {
      teMarks: student.rankTeTotal ?? student.totalTheoryMarks ?? 0,
      teMax: student.rankTeMax ?? 0,
      ceMarks: student.totalCeMarks ?? 0,
      totalMarks: student.rankTotalObtained ?? student.totalMarks ?? 0,
      totalMax: student.rankTotalMax ?? student.totalMaxMarks ?? 0,
      percentage: isTE
        ? (student.rankTePercentage ?? student.percentage ?? 0)
        : (student.rankTotalPercentage ?? student.percentage ?? 0),
      grade: getGradeFromPercentage(
        isTE
          ? (student.rankTePercentage ?? student.percentage ?? 0)
          : (student.rankTotalPercentage ?? student.percentage ?? 0)
      ),
    }
  }

  // Filtered students by search & grade (filter uses rank-based grade)
  const filteredStudents = useMemo(() => {
    return sortedStudents.filter(student => {
      const rankData = getStudentRankData(student)
      if (studentGradeFilter !== 'ALL' && rankData.grade !== studentGradeFilter) {
        return false
      }
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim()
        const nameMatch = (student.studentName || '').toLowerCase().includes(q)
        const rollMatch = String(student.rollNumber || '').toLowerCase().includes(q)
        const admMatch = String(student.admissionNumber || student.studentCode || '').toLowerCase().includes(q)
        const classMatch = (student.className || '').toLowerCase().includes(q)
        if (!nameMatch && !rollMatch && !admMatch && !classMatch) {
          return false
        }
      }
      return true
    })
  }, [sortedStudents, studentGradeFilter, studentSearch, rankMode])

  // Pagination calculations
  const totalStudentsCount = filteredStudents.length
  const effectivePageSize = studentPageSize === 'All' ? Math.max(1, totalStudentsCount) : Number(studentPageSize)
  const totalPages = Math.max(1, Math.ceil(totalStudentsCount / effectivePageSize))
  const currentPageSafe = Math.min(Math.max(1, studentPage), totalPages)
  const startIndex = (currentPageSafe - 1) * effectivePageSize
  const endIndex = Math.min(startIndex + effectivePageSize, totalStudentsCount)
  const paginatedStudents = studentPageSize === 'All'
    ? filteredStudents
    : filteredStudents.slice(startIndex, endIndex)

  const getExportCountNumber = () => {
    if (!exportLimit || exportLimit === 'all' || isNaN(Number(exportLimit))) {
      return filteredStudents.length
    }
    return Math.min(Math.max(1, parseInt(exportLimit, 10)), filteredStudents.length)
  }

  // Export Rank List to CSV
  const exportRankListCSV = (customCount = null) => {
    const targetCount = customCount !== null ? customCount : getExportCountNumber()
    const dataToExport = filteredStudents.slice(0, targetCount)

    if (dataToExport.length === 0) {
      toast.error('No student records to export')
      return
    }

    const isTE = rankMode === 'TE'
    const examObj = exams.find(e => e._id === selectedExam)
    const examName = examObj?.displayName || examObj?.name || 'Examination'

    const csvData = dataToExport.map((s, idx) => {
      const rd = getStudentRankData(s)
      return {
        'Rank': isTE ? (s.teRank || idx + 1) : (s.teCeRank || idx + 1),
        'Ranking Type': isTE ? 'TE Only (Excl. PE/WE/Drawing)' : 'TE + CE (Excl. PE/WE/Drawing)',
        'Roll No': s.rollNumber || '',
        'Student Name': s.studentName || '',
        'Admission No': s.admissionNumber || s.studentCode || '',
        'Class': s.className || '',
        'Theory Marks (TE)': rd.teMarks,
        'Theory Max': rd.teMax,
        'Continuous Evaluation (CE)': rd.ceMarks,
        'Total Marks': rd.totalMarks,
        'Total Max': rd.totalMax,
        'Percentage (%)': Number(rd.percentage.toFixed(2)),
        'Grade': rd.grade,
        'A+ Subjects': s.aplusCount ?? 0,
        'Total Subjects': s.totalSubjects ?? '',
        'Status': rd.percentage >= 40 ? 'Passed' : 'Failed'
      }
    })

    const filename = `Student_Rank_List_${examName.replace(/[^a-zA-Z0-9]/g, '_')}_${isTE ? 'TE' : 'TE_CE'}_Top_${dataToExport.length}`
    exportToCSV(csvData, filename)
  }

  // Export Rank List to PDF
  // Export Rank List to PDF matching standard school template
  const exportRankListPDF = async (customCount = null) => {
    try {
      const targetCount = customCount !== null ? customCount : getExportCountNumber()
      const dataToExport = filteredStudents.slice(0, targetCount)

      if (dataToExport.length === 0) {
        toast.error('No student records to export')
        return
      }

      const isTE = rankMode === 'TE'
      const examObj = exams.find(e => e._id === selectedExam)
      const examName = examObj?.displayName || examObj?.name || 'Examination'
      const classObj = availableClasses.find(c => (c._id || c.id) === selectedClass)
      const className = classObj?.displayName || classObj?.name || (selectedClass ? 'Class' : 'All Classes')

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const schoolLogoUrl = 'https://res.cloudinary.com/dmjqgjcut/image/upload/v1769946977/school-logo_uugskb.jpg'

      // Helper to load image as base64
      const loadImage = (url) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.crossOrigin = 'Anonymous'
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0)
              resolve(canvas.toDataURL('image/jpeg'))
            } catch {
              resolve(null)
            }
          }
          img.onerror = () => resolve(null)
          img.src = url
        })
      }

      const logoBase64 = await loadImage(schoolLogoUrl)

      // Function to draw formal school border and watermark on each page
      const drawSchoolPageDecorations = (data) => {
        // Double black border matching school reports
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(2)
        doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
        doc.setLineWidth(0.75)
        doc.rect(23, 23, pageWidth - 46, pageHeight - 46)

        // Watermark in the center
        if (logoBase64 && doc.GState) {
          try {
            doc.saveGraphicsState()
            doc.setGState(new doc.GState({ opacity: 0.05 }))
            const wmSize = 220
            doc.addImage(logoBase64, 'JPEG', (pageWidth - wmSize) / 2, (pageHeight - wmSize) / 2, wmSize, wmSize)
            doc.restoreGraphicsState()
          } catch (e) {
            // Ignore if graphics state is not supported
          }
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages()
        doc.setFont('times', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(80, 80, 80)
        doc.text(
          `P.P.M.H.S.S. KOTTUKKARA  •  OFFICIAL EXAMINATION REPORT  •  Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 28,
          { align: 'center' }
        )
      }

      // Draw Top Header on First Page
      let currentY = 36
      if (logoBase64) {
        const logoW = 38
        const logoH = 38
        doc.addImage(logoBase64, 'JPEG', pageWidth / 2 - logoW / 2, currentY, logoW, logoH)
        currentY += 44
      } else {
        currentY += 10
      }

      // School Name
      doc.setFont('times', 'bold')
      doc.setFontSize(15)
      doc.setTextColor(0, 0, 0)
      doc.text('P.P.M.H.S.S. KOTTUKKARA', pageWidth / 2, currentY, { align: 'center' })
      currentY += 13

      // Address
      doc.setFont('times', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(50, 50, 50)
      doc.text('KOTTUKKARA, KONDOTTY, MALAPPURAM, KERALA - 673638', pageWidth / 2, currentY, { align: 'center' })
      currentY += 15

      // Document Title
      doc.setFont('times', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      const titleMode = isTE
        ? 'STUDENT RANK LIST - THEORY EVALUATION ONLY (TE)'
        : 'STUDENT RANK LIST - COMBINED THEORY + CE'
      doc.text(titleMode, pageWidth / 2, currentY, { align: 'center' })
      currentY += 13

      // Meta information strip
      doc.setFont('times', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(60, 60, 60)
      doc.text(
        `Exam: ${examName}   |   Class: ${className}   |   Scope: Top ${dataToExport.length} Students   |   Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        pageWidth / 2,
        currentY,
        { align: 'center' }
      )
      currentY += 12

      // Thin separator line
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(1)
      doc.line(35, currentY, pageWidth - 35, currentY)
      currentY += 8

      const headers = [
        'Rank',
        'Roll No',
        'Student Name',
        'Adm No',
        'Class',
        isTE ? 'TE Marks (Score)' : 'TE Marks',
        'CE Marks',
        !isTE ? 'Total (Score)' : 'Total Marks',
        'Percentage',
        'Grade',
        'A+ Subjects',
        'Status'
      ]

      const rows = dataToExport.map((s, idx) => {
        const rd = getStudentRankData(s)
        return [
          isTE ? (s.teRank || idx + 1) : (s.teCeRank || idx + 1),
          s.rollNumber || '-',
          s.studentName || '-',
          s.admissionNumber || s.studentCode || '-',
          s.className || '-',
          rd.teMarks,
          rd.ceMarks,
          `${rd.totalMarks}${rd.totalMax ? `/${rd.totalMax}` : ''}`,
          `${rd.percentage ? rd.percentage.toFixed(1) + '%' : '0%'}`,
          rd.grade || '-',
          `${s.aplusCount || 0}/${s.totalSubjects || '-'}`,
          rd.percentage >= 40 ? 'Passed' : 'Failed'
        ]
      })

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: currentY,
        margin: { top: 35, bottom: 40, left: 35, right: 35 },
        theme: 'plain',
        styles: {
          font: 'times',
          fontSize: 8,
          cellPadding: 3.5,
          valign: 'middle',
          textColor: [0, 0, 0],
          lineColor: [180, 180, 180],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          lineColor: [0, 0, 0],
          lineWidth: 1
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
          1: { halign: 'center', cellWidth: 45 },
          2: { fontStyle: 'bold', cellWidth: 130 },
          3: { halign: 'center', cellWidth: 55 },
          4: { halign: 'center', cellWidth: 55 },
          5: { halign: 'center', fontStyle: isTE ? 'bold' : 'normal', cellWidth: 70 },
          6: { halign: 'center', cellWidth: 55 },
          7: { halign: 'center', fontStyle: !isTE ? 'bold' : 'normal', cellWidth: 70 },
          8: { halign: 'center', fontStyle: 'bold', cellWidth: 55 },
          9: { halign: 'center', fontStyle: 'bold', cellWidth: 40 },
          10: { halign: 'center', cellWidth: 55 },
          11: { halign: 'center', cellWidth: 50 }
        },
        didDrawPage: (data) => {
          drawSchoolPageDecorations(data)
        }
      })

      const filename = `PPMHSS_Rank_List_${examName.replace(/[^a-zA-Z0-9]/g, '_')}_${isTE ? 'TE' : 'TE_CE'}_Top_${dataToExport.length}.pdf`
      doc.save(filename)
      toast.success(`Official PDF exported successfully (${dataToExport.length} students)`)
    } catch (err) {
      console.error('PDF export error:', err)
      toast.error('Failed to generate PDF')
    }
  }

  const getGradeBadgeClass = (grade) => {
    switch (grade) {
      case 'A+':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      case 'A':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'B+':
        return 'bg-teal-100 text-teal-800 border border-teal-200'
      case 'B':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'C+':
        return 'bg-cyan-100 text-cyan-800 border border-cyan-200'
      case 'C':
        return 'bg-amber-100 text-amber-800 border border-amber-200'
      case 'D+':
        return 'bg-orange-100 text-orange-800 border border-orange-200'
      case 'D':
        return 'bg-rose-100 text-rose-800 border border-rose-200'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  if (isLoading) return <LoadingSpinner />

  const gradeDistribution = gradeAnalysis?.gradeDistribution || {}
  const analysis = gradeAnalysis?.analysis || nearFullAPlusDetail
  const summary = gradeAnalysis?.summary || {
    fullAPlus: 0,
    nineAPlus: 0,
    eightAPlus: 0,
    sevenAPlus: 0,
    fullAPlusPercentage: 0,
    passPercentage: 0
  }
  const totalStudents = gradeAnalysis?.totalStudents || 0

  // Extract data from analysis
  const fullAPlusList = analysis?.fullAPlus || fullAPlus || []
  const nineAPlusList = analysis?.nineAPlus || nearFullAPlus || []
  const nearFullAPlusList = nineAPlusList
  const eightAPlusList = analysis?.eightAPlus || []
  const sevenAPlusList = analysis?.sevenAPlus || []
  
  // Dynamic subject-wise near A+ map
  const missingAPlusBySubjectMap = analysis?.missingAPlusBySubject || {}
  const dynamicSubjectNames = Object.keys(missingAPlusBySubjectMap)
  const hasDynamicSubjectData = dynamicSubjectNames.length > 0

  // Subject-wise near A+ lists (legacy fallback)
  const withoutMathsList = analysis?.fullAPlusWithoutMaths || []
  const withoutEnglishList = analysis?.fullAPlusWithoutEnglish || []
  const withoutMalayalamList = analysis?.fullAPlusWithoutMalayalam || []
  const withoutMalayalamIIList = analysis?.fullAPlusWithoutMalayalamII || []
  const withoutHindiList = analysis?.fullAPlusWithoutHindi || []
  const withoutArabicList = analysis?.fullAPlusWithoutArabic || []
  const withoutSocialList = analysis?.fullAPlusWithoutSocialScience || []
  const withoutITList = analysis?.fullAPlusWithoutIT || []
  const withoutPhysicsList = analysis?.fullAPlusWithoutPhysics || []
  const withoutChemistryList = analysis?.fullAPlusWithoutChemistry || []
  const withoutBiologyList = analysis?.fullAPlusWithoutBiology || []
  const withoutFirstLanguageList = analysis?.fullAPlusWithoutFirstLanguage || []
  const withoutOtherList = analysis?.fullAPlusWithoutOther || []

  const hasNearFullData = withoutMathsList.length > 0 || 
    withoutEnglishList.length > 0 || 
    withoutMalayalamList.length > 0 || 
    withoutMalayalamIIList.length > 0 || 
    withoutHindiList.length > 0 || 
    withoutArabicList.length > 0 || 
    withoutSocialList.length > 0 || 
    withoutITList.length > 0 ||
    withoutPhysicsList.length > 0 ||
    withoutChemistryList.length > 0 ||
    withoutBiologyList.length > 0 ||
    withoutFirstLanguageList.length > 0 ||
    withoutOtherList.length > 0

  const renderStudentTable = (students, title, showMissingSubject = true) => {
    if (!students || students.length === 0) return null
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{students.length} students</p>
            </div>
            <button
              onClick={() => exportToCSV(students, title.replace(/\s/g, '_'))}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                {showMissingSubject && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Missing Subject</th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, i) => (
                <tr key={student.studentId || i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.studentName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-emerald-600">
                    {student.percentage?.toFixed(1)}%
                  </td>
                  {showMissingSubject && (
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                        {student.missingSubject || student.missingSubjectGrade || '-'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      {student.grade || 'A+'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderSubjectWiseSection = (title, students, subjectName, iconColor = 'bg-amber-500') => {
    if (!students || students.length === 0) return null
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => toggleSection(subjectName)}
          className="w-full px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${iconColor.replace('bg', 'bg-opacity-10')} rounded-lg flex items-center justify-center`}>
              <ChartBarIcon className={`w-4 h-4 ${iconColor.replace('bg', 'text')}`} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{students.length} students</p>
            </div>
          </div>
          {expandedSections[subjectName] ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections[subjectName] && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Missing Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, i) => (
                  <tr key={student.studentId || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-amber-600">
                      {student.percentage?.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        {student.missingSubjectGrade || 'Not A+'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Type Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/70">
          <button
            type="button"
            onClick={() => setAnalyticsType('exam')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              analyticsType === 'exam'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AcademicCapIcon className="w-4 h-4" />
            Exam Analytics
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsType('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              analyticsType === 'attendance'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarDaysIcon className="w-4 h-4" />
            Attendance Analytics
          </button>
        </div>
      </div>

      {analyticsType === 'attendance' ? (
        <AttendanceAnalyticsView availableClasses={availableClasses} isStaff={isStaff} />
      ) : (
        <>
          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Exam <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="">Choose an exam...</option>
              {exams.map(exam => (
                <option key={exam._id} value={exam._id}>
                  {exam.displayName || exam.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isStaff ? "Teaching Class" : "Filter by Class (Optional)"}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 hover:bg-white transition-colors"
            >
              {!isStaff && <option value="">All Classes</option>}
              {availableClasses.map(cls => {
                const baseName = cls.name || cls.className || '';
                const section = cls.section || '';
                let label = cls.displayName || baseName;
                if (section && !label.toLowerCase().includes(section.toLowerCase())) {
                  label = `${label}-${section}`;
                }
                return (
                  <option key={cls._id || cls.id} value={cls._id || cls.id}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>
          
          <div className="flex gap-2">
            {(selectedExam || selectedClass) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={loadAnalytics}
              disabled={!selectedExam}
              className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {!selectedExam ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Select an Exam</h3>
          <p className="text-gray-500">Choose an exam to view analytics and performance data</p>
        </div>
      ) : gradeAnalysis ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <TrophyIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{summary.fullAPlus || 0}</span>
              </div>
              <p className="text-sm opacity-90">Full A+ Students</p>
              <p className="text-xs opacity-75 mt-1">
                {summary.fullAPlusPercentage?.toFixed(1) || 0}% of total
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <AcademicCapIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{totalStudents || 0}</span>
              </div>
              <p className="text-sm opacity-90">Total Students</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <ChartBarIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{summary.passPercentage?.toFixed(1) || 0}%</span>
              </div>
              <p className="text-sm opacity-90">Pass Percentage</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <UserGroupIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{summary.nineAPlus || 0}</span>
              </div>
              <p className="text-sm opacity-90">Near Full A+</p>
            </div>
          </div>

          {/* Grade Distribution */}
          {Object.keys(gradeDistribution).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Grade Distribution</h2>
                <p className="text-sm text-gray-500 mt-0.5">Student performance breakdown by grade</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(gradeDistribution).map(([grade, count]) => {
                    const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0
                    let barColor = 'bg-emerald-500'
                    if (grade === 'A+') barColor = 'bg-emerald-500'
                    else if (grade === 'A') barColor = 'bg-green-500'
                    else if (grade === 'B+') barColor = 'bg-blue-500'
                    else if (grade === 'B') barColor = 'bg-cyan-500'
                    else if (grade === 'C+') barColor = 'bg-amber-500'
                    else if (grade === 'C') barColor = 'bg-orange-500'
                    else if (grade === 'D+') barColor = 'bg-amber-600'
                    else if (grade === 'D') barColor = 'bg-rose-500'
                    else if (grade === 'E') barColor = 'bg-gray-400'
                    
                    return (
                      <div key={grade}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">Grade {grade}</span>
                          <div className="flex gap-4">
                            <span className="text-gray-600">{count} students</span>
                            <span className="text-gray-400">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`${barColor} rounded-full h-2 transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Subject-wise Grade Distribution */}
          {gradeAnalysis?.subjectWiseGradeDistribution && Object.keys(gradeAnalysis.subjectWiseGradeDistribution).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Subject-wise Grade Distribution</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Student count by grade for each subject</p>
                </div>
                <button
                  onClick={() => {
                    const dist = gradeAnalysis.subjectWiseGradeDistribution
                    const gradesList = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E', 'AB']
                    const exportData = Object.entries(dist).map(([subj, counts]) => {
                      const row = { Subject: subj }
                      gradesList.forEach(g => {
                        row[`Grade ${g}`] = counts[g] || 0
                      })
                      row['Total Students'] = counts.total || 0
                      return row
                    })
                    exportToCSV(exportData, `Subject_Grade_Distribution_${selectedExam}`)
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              <div className="p-6 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="py-3 px-4 rounded-tl-lg">Subject</th>
                      <th className="py-3 px-2 text-center text-emerald-700 bg-emerald-50/60">A+</th>
                      <th className="py-3 px-2 text-center text-green-700 bg-green-50/60">A</th>
                      <th className="py-3 px-2 text-center text-blue-700 bg-blue-50/60">B+</th>
                      <th className="py-3 px-2 text-center text-cyan-700 bg-cyan-50/60">B</th>
                      <th className="py-3 px-2 text-center text-amber-700 bg-amber-50/60">C+</th>
                      <th className="py-3 px-2 text-center text-orange-700 bg-orange-50/60">C</th>
                      <th className="py-3 px-2 text-center text-amber-800 bg-amber-100/60">D+</th>
                      <th className="py-3 px-2 text-center text-rose-700 bg-rose-50/60">D</th>
                      <th className="py-3 px-2 text-center text-gray-700 bg-gray-100/60">E</th>
                      <th className="py-3 px-2 text-center text-red-700 bg-red-50/60">AB</th>
                      <th className="py-3 px-4 text-center rounded-tr-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {Object.entries(gradeAnalysis.subjectWiseGradeDistribution).map(([subjectName, counts], idx) => {
                      const total = counts.total || 0
                      return (
                        <tr key={subjectName} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50/80' : 'bg-gray-50/40 hover:bg-gray-50'}>
                          <td className="py-3 px-4 font-medium text-gray-900">{subjectName}</td>
                          
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold ${counts['A+'] > 0 ? 'bg-emerald-100 text-emerald-800' : 'text-gray-400'}`}>
                              {counts['A+'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['A'] > 0 ? 'bg-green-100 text-green-800' : 'text-gray-400'}`}>
                              {counts['A'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['B+'] > 0 ? 'bg-blue-100 text-blue-800' : 'text-gray-400'}`}>
                              {counts['B+'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['B'] > 0 ? 'bg-cyan-100 text-cyan-800' : 'text-gray-400'}`}>
                              {counts['B'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['C+'] > 0 ? 'bg-amber-100 text-amber-800' : 'text-gray-400'}`}>
                              {counts['C+'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['C'] > 0 ? 'bg-orange-100 text-orange-800' : 'text-gray-400'}`}>
                              {counts['C'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['D+'] > 0 ? 'bg-amber-200 text-amber-900' : 'text-gray-400'}`}>
                              {counts['D+'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['D'] > 0 ? 'bg-rose-100 text-rose-800' : 'text-gray-400'}`}>
                              {counts['D'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['E'] > 0 ? 'bg-gray-200 text-gray-800' : 'text-gray-400'}`}>
                              {counts['E'] || 0}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${counts['AB'] > 0 ? 'bg-red-100 text-red-800 font-semibold' : 'text-gray-400'}`}>
                              {counts['AB'] || 0}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center font-semibold text-gray-700">{total}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Two Column Layout for Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Classes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Top Performing Classes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Classes with highest average scores</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {topClasses.length > 0 && (
                      <button
                        onClick={() => exportToCSV(topClasses, 'Top_Performing_Classes')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200"
                      >
                        <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                        Export
                      </button>
                    )}
                    <AcademicCapIcon className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                {topClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AcademicCapIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500">No data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topClasses.map((cls, i) => (
                      <div key={cls.classId || i} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="text-gray-700 font-medium">{cls.className}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-100 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 rounded-full h-1.5 transition-all duration-500"
                              style={{ width: `${Math.min(cls.averagePercentage || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-blue-600 font-medium text-sm">
                            {cls.averagePercentage?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
                <p className="text-sm text-gray-500 mt-0.5">Key metrics at a glance</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-2xl font-bold text-emerald-600">{summary.fullAPlus || fullAPlusList.length || 0}</p>
                    <p className="text-xs text-gray-600 font-medium">Full A+</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-2xl font-bold text-amber-600">{summary.nineAPlus || nineAPlusList.length || 0}</p>
                    <p className="text-xs text-gray-600 font-medium">Near A+ (Missed 1 A+)</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">{summary.eightAPlus || eightAPlusList.length || 0}</p>
                    <p className="text-xs text-gray-600 font-medium">8 A+ Subjects</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-2xl font-bold text-purple-600">{summary.sevenAPlus || sevenAPlusList.length || 0}</p>
                    <p className="text-xs text-gray-600 font-medium">7 A+ Subjects</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== RANK-WISE STUDENTS LIST ==================== */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Card Header & Controls */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-b border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-all ${
                    rankMode === 'TE' ? 'bg-blue-600 text-white' : 'bg-teal-600 text-white'
                  }`}>
                    <TrophyIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">Student Rank List</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {totalStudentsCount} {totalStudentsCount === 1 ? 'Student' : 'Students'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {rankMode === 'TE' 
                        ? 'Sorted by Theory Examination (TE) score — excludes PE / WE / Drawing (Default Ranking)' 
                        : 'Sorted by Combined TE + CE Total Score — excludes PE / WE / Drawing'}
                    </p>
                  </div>
                </div>

                {/* Rank Mode Selector (TE Only [Default] vs TE + CE) */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-xl border border-gray-200 self-start lg:self-center">
                  <button
                    type="button"
                    onClick={() => setRankMode('TE')}
                    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                      rankMode === 'TE'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <span>🎯 TE Only Rank (Default)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRankMode('TE_CE')}
                    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                      rankMode === 'TE_CE'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <span>🏅 TE + CE Rank</span>
                  </button>
                </div>
              </div>

              {/* Search, Grade Filter & Export Bar */}
              <div className="mt-5 pt-4 border-t border-gray-200/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search & Filter */}
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search student name, roll no, admission no..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {studentSearch && (
                      <button
                        onClick={() => setStudentSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                    <FunnelIcon className="w-4 h-4 text-gray-400" />
                    <select
                      value={studentGradeFilter}
                      onChange={(e) => setStudentGradeFilter(e.target.value)}
                      className="text-xs sm:text-sm text-gray-700 bg-transparent border-none outline-none cursor-pointer pr-2"
                    >
                      <option value="ALL">All Grades</option>
                      <option value="A+">A+ Only</option>
                      <option value="A">A Only</option>
                      <option value="B+">B+ Only</option>
                      <option value="B">B Only</option>
                      <option value="C+">C+ Only</option>
                      <option value="C">C Only</option>
                      <option value="D+">D+ Only</option>
                      <option value="D">D Only</option>
                      <option value="E">E Only</option>
                    </select>
                  </div>
                </div>

                {/* Export Controls with Custom Limit */}
                <div className="flex flex-wrap items-center gap-2 bg-white/90 p-1.5 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-1.5 pl-1.5 pr-1">
                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Export Top:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalStudentsCount || 100}
                      value={exportLimit}
                      onChange={(e) => setExportLimit(e.target.value)}
                      placeholder="100"
                      className="w-16 px-2 py-1 text-xs sm:text-sm font-semibold text-gray-800 border border-gray-200 rounded-md text-center focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="hidden sm:flex items-center gap-1 border-l border-gray-200 pl-1.5 pr-1">
                    {[10, 50, 100].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setExportLimit(String(cnt))}
                        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                          String(exportLimit) === String(cnt)
                            ? 'bg-primary-100 text-primary-800 font-bold'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setExportLimit(String(totalStudentsCount || 'all'))}
                      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                        String(exportLimit) === String(totalStudentsCount) || exportLimit === 'all'
                          ? 'bg-primary-100 text-primary-800 font-bold'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      All
                    </button>
                  </div>

                  {/* Export CSV & PDF action buttons */}
                  <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
                    <button
                      type="button"
                      onClick={() => exportRankListCSV()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      title={`Export top ${getExportCountNumber()} students to CSV`}
                    >
                      <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportRankListPDF()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      title={`Export top ${getExportCountNumber()} students to PDF`}
                    >
                      <PrinterIcon className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50/90 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5 text-center">Rank</th>
                    <th className="px-3 py-3.5 text-center">Roll No</th>
                    <th className="px-4 py-3.5">Student</th>
                    <th className="px-3 py-3.5 text-center">Class</th>
                    <th className={`px-4 py-3.5 text-center ${rankMode === 'TE' ? 'bg-blue-100/60 text-blue-900 font-bold' : ''}`}>
                      TE Marks {rankMode === 'TE' && '(Rank Score)'}
                    </th>
                    <th className="px-3 py-3.5 text-center">CE Marks</th>
                    <th className={`px-4 py-3.5 text-center ${rankMode === 'TE_CE' ? 'bg-teal-100/60 text-teal-900 font-bold' : ''}`}>
                      Total (TE+CE) {rankMode === 'TE_CE' && '(Rank Score)'}
                    </th>
                    <th className="px-3 py-3.5 text-center">Percentage</th>
                    <th className="px-3 py-3.5 text-center">Grade</th>
                    <th className="px-3 py-3.5 text-center">A+ Count</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                          <UserGroupIcon className="w-6 h-6" />
                        </div>
                        <p className="text-gray-700 font-medium">No students match the criteria</p>
                        <p className="text-xs text-gray-500 mt-1">Try clearing your search query or grade filter</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const displayRank = rankMode === 'TE' 
                        ? (student.teRank || startIndex + idx + 1)
                        : (student.teCeRank || startIndex + idx + 1)

                      const rd = getStudentRankData(student)
                      const isNonTeExcluded = (student.rankTeMax || 0) > 0 && (student.rankTeMax || 0) < (student.totalMaxMarks || 0)

                      return (
                        <tr key={student.studentId || idx} className="hover:bg-blue-50/30 transition-colors">
                          {/* Rank column with Top 3 Medals */}
                          <td className="px-4 py-3 text-center">
                            {displayRank === 1 ? (
                              <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
                                🥇 #1
                              </span>
                            ) : displayRank === 2 ? (
                              <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300 shadow-sm">
                                🥈 #2
                              </span>
                            ) : displayRank === 3 ? (
                              <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300 shadow-sm">
                                🥉 #3
                              </span>
                            ) : displayRank <= 10 ? (
                              <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                #{displayRank}
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-full text-xs font-semibold text-gray-600 bg-gray-100">
                                #{displayRank}
                              </span>
                            )}
                          </td>

                          {/* Roll No */}
                          <td className="px-3 py-3 text-center text-xs font-mono font-medium text-gray-700">
                            {student.rollNumber || '-'}
                          </td>

                          {/* Student Details */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 leading-tight">
                              {student.studentName}
                            </div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                              {student.admissionNumber || student.studentCode || ''}
                            </div>
                          </td>

                          {/* Class */}
                          <td className="px-3 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {student.className || '-'}
                            </span>
                          </td>

                          {/* Theory Marks (TE) — rank-based (excludes PE/WE/Drawing) */}
                          <td className={`px-4 py-3 text-center ${rankMode === 'TE' ? 'bg-blue-50/70 font-bold text-blue-900' : 'text-gray-700 font-medium'}`}>
                            <span className={rankMode === 'TE' ? 'text-blue-700 font-bold text-base' : ''}>
                              {rd.teMarks}
                            </span>
                            {rd.teMax > 0 && (
                              <span className="text-xs text-gray-400 ml-1">/{rd.teMax}</span>
                            )}
                          </td>

                          {/* CE Marks */}
                          <td className="px-3 py-3 text-center text-gray-600 text-xs font-medium">
                            +{rd.ceMarks}
                          </td>

                          {/* Total Score (TE + CE) — rank-based (excludes PE/WE/Drawing) */}
                          <td className={`px-4 py-3 text-center ${rankMode === 'TE_CE' ? 'bg-teal-50/70 font-bold text-teal-900' : 'text-gray-800 font-semibold'}`}>
                            <span className={rankMode === 'TE_CE' ? 'text-teal-800 font-bold text-base' : ''}>
                              {rd.totalMarks}
                            </span>
                            {rd.totalMax > 0 && (
                              <span className="text-xs text-gray-400 ml-1">/{rd.totalMax}</span>
                            )}
                          </td>

                          {/* Percentage — rank-based */}
                          <td className="px-3 py-3 text-center">
                            <div className="font-semibold text-xs text-gray-900">
                              {rd.percentage?.toFixed(1) || 0}%
                            </div>
                            <div className="w-16 bg-gray-100 rounded-full h-1 mx-auto mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  rd.percentage >= 90 ? 'bg-emerald-500' : rd.percentage >= 60 ? 'bg-blue-500' : rd.percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(rd.percentage || 0, 100)}%` }}
                              />
                            </div>
                            {isNonTeExcluded && (
                              <div className="text-[10px] text-gray-400 mt-0.5" title="Percentage excludes PE / WE / Drawing">
                                excl. PE/WE/Draw
                              </div>
                            )}
                          </td>

                          {/* Grade — rank-based */}
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${getGradeBadgeClass(rd.grade)}`}>
                              {rd.grade || '-'}
                            </span>
                          </td>

                          {/* A+ Count */}
                          <td className="px-3 py-3 text-center">
                            {student.aplusCount > 0 ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                student.aplusCount === student.totalSubjects && student.totalSubjects > 0
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : student.aplusCount >= 8
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                ⭐ {student.aplusCount}/{student.totalSubjects || '-'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">0</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              rd.percentage >= 40
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {rd.percentage >= 40 ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalStudentsCount > 0 && (
              <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-500 text-center sm:text-left">
                  Showing <span className="font-semibold text-gray-800">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-gray-800">{endIndex}</span> of{' '}
                  <span className="font-semibold text-gray-800">{totalStudentsCount}</span> students
                  <span className="hidden md:inline ml-2 text-gray-400">
                    • Rank mode: {rankMode === 'TE' ? 'Theory Examination (TE Only, excl. PE/WE/Drawing)' : 'Combined TE + CE (excl. PE/WE/Drawing)'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Rows per page */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>Rows:</span>
                    <select
                      value={studentPageSize}
                      onChange={(e) => {
                        setStudentPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))
                        setStudentPage(1)
                      }}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value="All">All</option>
                    </select>
                  </div>

                  {/* Page Navigation */}
                  {studentPageSize !== 'All' && totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                        disabled={currentPageSafe <= 1}
                        className="p-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </button>

                      {/* Display up to 5 page number buttons */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPageSafe <= 3) {
                          pageNum = i + 1
                        } else if (currentPageSafe >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPageSafe - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setStudentPage(pageNum)}
                            className={`min-w-[28px] h-7 px-1.5 rounded text-xs font-semibold transition-colors ${
                              currentPageSafe === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}

                      <button
                        type="button"
                        onClick={() => setStudentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPageSafe >= totalPages}
                        className="p-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ==================== A+ STUDENTS ANALYSIS (BOTTOM) ==================== */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrophyIcon className="w-6 h-6 text-amber-500" />
                  A+ Students Detailed Analysis
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Full A+ achievers, near-miss students (9 A+, 8 A+, 7 A+), and subject opportunity breakdowns
                </p>
              </div>
            </div>

            {/* Full A+ Students Section */}
          {fullAPlusList && fullAPlusList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('fullAPlus')}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <TrophyIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Full A+ Students</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Students who scored A+ in all subjects • {fullAPlusList.length} students
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(fullAPlusList, 'Full_APlus_Students')}
                    className="text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => toggleSection('fullAPlus')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.fullAPlus ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedSections.fullAPlus && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admission No</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fullAPlusList.map((student, i) => (
                        <tr key={student.studentId || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.admissionNumber || student.studentCode || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-emerald-600 font-semibold">{student.percentage?.toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              {student.grade || 'A+'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 9 A+ (Near Full A+) Students Section */}
          {nineAPlusList && nineAPlusList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('nineAPlus')}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Near A+ Students (Missed 1 A+)</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Students who scored A+ in all subjects except 1 • {nineAPlusList.length} students
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(nineAPlusList, 'Near_APlus_9_Subjects')}
                    className="text-xs text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => toggleSection('nineAPlus')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.nineAPlus ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedSections.nineAPlus && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admission No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Missing Subject</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {nineAPlusList.map((student, i) => (
                        <tr key={student.studentId || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.admissionNumber || student.studentCode || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                              {student.missingSubject || student.missingSubjectGrade || '1 Subject'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-amber-600 font-semibold">{student.percentage?.toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 8 A+ Students Section */}
          {eightAPlusList && eightAPlusList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('eightAPlus')}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">8 A+ Students</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Students who scored 8 A+ subjects • {eightAPlusList.length} students
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(eightAPlusList, '8_APlus_Students')}
                    className="text-xs text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => toggleSection('eightAPlus')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.eightAPlus ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedSections.eightAPlus && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admission No</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {eightAPlusList.map((student, i) => (
                        <tr key={student.studentId || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.admissionNumber || student.studentCode || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-blue-600 font-semibold">{student.percentage?.toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 7 A+ Students Section */}
          {sevenAPlusList && sevenAPlusList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => toggleSection('sevenAPlus')}
                  className="flex items-center gap-3 text-left focus:outline-none"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">7 A+ Students</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Students who scored 7 A+ subjects • {sevenAPlusList.length} students
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(sevenAPlusList, '7_APlus_Students')}
                    className="text-xs text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => toggleSection('sevenAPlus')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.sevenAPlus ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedSections.sevenAPlus && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Admission No</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sevenAPlusList.map((student, i) => (
                        <tr key={student.studentId || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{student.className || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.admissionNumber || student.studentCode || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-purple-600 font-semibold">{student.percentage?.toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Near A+ Students Section with Subject-wise Breakdown */}
          {(hasNearFullData || hasDynamicSubjectData) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Near A+ Students Analysis</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Students who missed A+ in one or more subjects
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const allNearData = hasDynamicSubjectData
                        ? dynamicSubjectNames.flatMap(name => (missingAPlusBySubjectMap[name] || []).map(s => ({ ...s, missingSubject: name })))
                        : [
                            ...withoutMathsList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Mathematics' })),
                            ...withoutEnglishList.map(s => ({ ...s, missingSubject: s.missingSubject || 'English' })),
                            ...withoutPhysicsList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Physics' })),
                            ...withoutChemistryList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Chemistry' })),
                            ...withoutBiologyList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Biology' })),
                            ...withoutMalayalamList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Malayalam' })),
                            ...withoutMalayalamIIList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Malayalam II' })),
                            ...withoutHindiList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Hindi' })),
                            ...withoutArabicList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Arabic' })),
                            ...withoutSocialList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Social Science' })),
                            ...withoutITList.map(s => ({ ...s, missingSubject: s.missingSubject || 'IT/Computer' })),
                            ...withoutFirstLanguageList.map(s => ({ ...s, missingSubject: s.missingSubject || 'First Language' })),
                            ...withoutOtherList.map(s => ({ ...s, missingSubject: s.missingSubject || 'Other' }))
                          ]
                      exportToCSV(allNearData, 'Near_A+_Students_All')
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg text-emerald-700"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Export All
                  </button>
                </div>
              </div>

              {/* Subject-wise breakdown grid */}
              <div className="grid grid-cols-1 gap-4">
                {hasDynamicSubjectData ? (
                  dynamicSubjectNames.map((subjName, idx) => {
                    const colorClasses = [
                      'bg-sky-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500',
                      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-rose-500',
                      'bg-orange-500', 'bg-cyan-500'
                    ]
                    const themeColor = colorClasses[idx % colorClasses.length]
                    return renderSubjectWiseSection(
                      `📋 Missing A+ in ${subjName}`,
                      missingAPlusBySubjectMap[subjName],
                      `without_${subjName.replace(/\s+/g, '_')}`,
                      themeColor
                    )
                  })
                ) : (
                  <>
                    {renderSubjectWiseSection(
                      '⚡ Missing A+ in Physics',
                      withoutPhysicsList,
                      'withoutPhysics',
                      'bg-sky-500'
                    )}

                    {renderSubjectWiseSection(
                      '🧪 Missing A+ in Chemistry',
                      withoutChemistryList,
                      'withoutChemistry',
                      'bg-teal-500'
                    )}

                    {renderSubjectWiseSection(
                      '🧬 Missing A+ in Biology',
                      withoutBiologyList,
                      'withoutBiology',
                      'bg-emerald-500'
                    )}

                    {renderSubjectWiseSection(
                      '📐 Missing A+ in Mathematics',
                      withoutMathsList,
                      'withoutMaths',
                      'bg-amber-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '📖 Missing A+ in English',
                      withoutEnglishList,
                      'withoutEnglish',
                      'bg-blue-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '📚 Missing A+ in Malayalam',
                      withoutMalayalamList,
                      'withoutMalayalam',
                      'bg-green-500'
                    )}

                    {renderSubjectWiseSection(
                      '📜 Missing A+ in Malayalam II',
                      withoutMalayalamIIList,
                      'withoutMalayalamII',
                      'bg-lime-500'
                    )}

                    {renderSubjectWiseSection(
                      '🔖 Missing A+ in First Language',
                      withoutFirstLanguageList,
                      'withoutFirstLanguage',
                      'bg-cyan-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '🔤 Missing A+ in Hindi',
                      withoutHindiList,
                      'withoutHindi',
                      'bg-orange-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '🕌 Missing A+ in Arabic',
                      withoutArabicList,
                      'withoutArabic',
                      'bg-purple-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '🌍 Missing A+ in Social Science',
                      withoutSocialList,
                      'withoutSocial',
                      'bg-red-500'
                    )}
                    
                    {renderSubjectWiseSection(
                      '💻 Missing A+ in IT/Computer Science',
                      withoutITList,
                      'withoutIT',
                      'bg-indigo-500'
                    )}

                    {renderSubjectWiseSection(
                      '📋 Missing A+ in Other Subjects',
                      withoutOtherList,
                      'withoutOther',
                      'bg-slate-500'
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Simple Near A+ List (if no subject-wise data) */}
          {!hasNearFullData && nearFullAPlusList && nearFullAPlusList.length > 0 && (
            renderStudentTable(nearFullAPlusList, 'Near A+ Students (9 A+ out of 10 subjects)', true)
          )}
          </div>
        </>
      ) : null}
        </>
      )}
    </div>
  )
}

export default AnalyticsDashboard