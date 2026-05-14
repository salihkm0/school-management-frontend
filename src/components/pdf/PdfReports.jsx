// src/components/reports/PdfReports.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CakeIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  UserIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { fetchClasses } from '../../store/slices/classSlice';
import { fetchAcademicYears } from '../../store/slices/academicYearSlice';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchStaff } from '../../store/slices/staffSlice';
import { fetchExams } from '../../store/slices/examSlice';
import pdfService, { openPDF, downloadPDF } from '../../services/pdfService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const PdfReports = () => {
  const dispatch = useDispatch();
  const { classes } = useSelector((state) => state.classes);
  const { academicYears } = useSelector((state) => state.academicYears);
  const { students } = useSelector((state) => state.students);
  const { staff } = useSelector((state) => state.staff);
  const { exams } = useSelector((state) => state.exams);
  
  const [activeCategory, setActiveCategory] = useState('noon-meal');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDistributionType, setSelectedDistributionType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStation, setReportStation] = useState('KOTTUKKARA');
  const [certificateDate, setCertificateDate] = useState(new Date().toLocaleDateString('en-IN'));
  const [certificatePlace, setCertificatePlace] = useState('Kottukkara');
  const [workingDays, setWorkingDays] = useState(25);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }));
    dispatch(fetchAcademicYears({ limit: 100 }));
    dispatch(fetchStudents({ limit: 100 }));
    dispatch(fetchStaff({ limit: 100 }));
    dispatch(fetchExams({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      const currentYear = academicYears.find(y => y.isCurrent);
      if (currentYear) setSelectedAcademicYear(currentYear._id);
    }
  }, [academicYears]);

  const getCurrentAcademicYear = () => {
    const year = academicYears.find(y => y._id === selectedAcademicYear);
    return year?.year || '2025-2026';
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleViewPDF = async (generator, params, errorMsg = 'Please fill all required fields') => {
    setIsLoading(true);
    try {
      const pdfBlob = await generator(params);
      openPDF(pdfBlob, `${activeCategory}_report_${Date.now()}.pdf`);
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(error.message || errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (generator, params, filename, errorMsg = 'Please fill all required fields') => {
    setIsLoading(true);
    try {
      const pdfBlob = await generator(params);
      downloadPDF(pdfBlob, filename);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error(error.message || errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'noon-meal', name: 'Noon Meals', icon: CakeIcon },
    { id: 'rice-distribution', name: 'Rice Distribution', icon: BuildingLibraryIcon },
    { id: 'student', name: 'Student Reports', icon: AcademicCapIcon },
    { id: 'exam', name: 'Exam Reports', icon: ClipboardDocumentListIcon },
    { id: 'financial', name: 'Financial', icon: BanknotesIcon },
    { id: 'staff', name: 'Staff Reports', icon: UserIcon },
    { id: 'admin', name: 'Administrative', icon: ChartBarIcon },
  ];

  const ReportCard = ({ title, description, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const ActionButtons = ({ onView, onDownload, viewDisabled, downloadDisabled }) => (
    <div className="flex gap-2">
      <button
        onClick={onView}
        disabled={viewDisabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <EyeIcon className="w-4 h-4" />
        <span className="hidden sm:inline">View</span>
      </button>
      <button
        onClick={onDownload}
        disabled={downloadDisabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
      </button>
    </div>
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">PDF Reports & Certificates</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate various reports, certificates, and official documents</p>
      </div>

      {/* Category Navigation - Horizontal scroll on mobile */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max pb-px">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================== NOON MEAL & FOOD REPORTS ==================== */}
      {activeCategory === 'noon-meal' && (
        <div className="space-y-4">
          {/* Noon Meal Register */}
          <ReportCard title="Noon Meal Register" description="Generate class-wise noon meal register">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="">Select Class</option>
                  {classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Current Month</option>
                  {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Working Days</label>
                <input type="number" value={workingDays} onChange={(e) => setWorkingDays(parseInt(e.target.value))} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getNoonMealPDF(selectedClass, selectedMonth, selectedYear, workingDays); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getNoonMealPDF(selectedClass, selectedMonth, selectedYear, workingDays); }, {}, `Noon_Meal_${selectedClass}_${selectedMonth}_${selectedYear}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>

          {/* Noon Feeding Register */}
          <ReportCard title="Noon Feeding Register" description="Generate noon feeding register">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>
                  {classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Current Month</option>
                  {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getNoonFeedingRegisterPDF(selectedClass, selectedMonth, selectedYear); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getNoonFeedingRegisterPDF(selectedClass, selectedMonth, selectedYear); }, {}, `Noon_Feeding_${selectedClass}_${selectedMonth}_${selectedYear}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>

          {/* Mid Day Meal */}
          <ReportCard title="Mid Day Meal Register" description="Generate mid day meal register">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>
                  {classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getMidDayMealPDF(selectedClass, selectedAcademicYear); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getMidDayMealPDF(selectedClass, selectedAcademicYear); }, {}, `Mid_Day_Meal_${selectedClass}_${getCurrentAcademicYear()}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>

          {/* Bhakshya Badratha */}
          <ReportCard title="Bhakshya Badratha (Food Security)" description="Generate food security allowance list">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>
                  {classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getBhakshyaBadrathaPDF(selectedClass, selectedAcademicYear); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getBhakshyaBadrathaPDF(selectedClass, selectedAcademicYear); }, {}, `Bhakshya_Badratha_${selectedClass}_${getCurrentAcademicYear()}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>
        </div>
      )}

      {/* ==================== RICE DISTRIBUTION REPORTS ==================== */}
      {activeCategory === 'rice-distribution' && (
        <div className="space-y-4">
          <ReportCard title="Rice Distribution List" description="Generate class-wise rice distribution list">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>
                  {classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Distribution Type</label>
                <select value={selectedDistributionType} onChange={(e) => setSelectedDistributionType(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">All Types</option><option value="monthly">Monthly</option><option value="special">Special</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getRiceDistributionPDF(selectedClass, selectedAcademicYear, selectedDistributionType); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getRiceDistributionPDF(selectedClass, selectedAcademicYear, selectedDistributionType); }, {}, `Rice_Distribution_${selectedClass}_${getCurrentAcademicYear()}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>

          <ReportCard title="Balance Rice Distribution" description="Generate balance rice distribution report">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Current Month</option>
                  {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getBalanceRiceDistributionPDF(selectedClass, selectedMonth, selectedYear); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getBalanceRiceDistributionPDF(selectedClass, selectedMonth, selectedYear); }, {}, `Balance_Rice_${selectedClass}_${selectedMonth}_${selectedYear}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>

          <ReportCard title="Special Rice Distribution" description="Generate special rice distribution report">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Current Month</option>
                  {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getSpecialRiceDistributionPDF(selectedClass, selectedMonth, selectedYear); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getSpecialRiceDistributionPDF(selectedClass, selectedMonth, selectedYear); }, {}, `Special_Rice_${selectedClass}_${selectedMonth}_${selectedYear}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>
        </div>
      )}

      {/* ==================== STUDENT REPORTS ==================== */}
      {activeCategory === 'student' && (
        <div className="space-y-4">
          <ReportCard title="Student List" description="Generate class-wise student list">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getStudentListPDF(selectedClass, selectedAcademicYear); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getStudentListPDF(selectedClass, selectedAcademicYear); }, {}, `Student_List_${selectedClass}_${getCurrentAcademicYear()}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>

          <ReportCard title="ID Card List" description="Generate class-wise ID card list">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getIDCardListPDF(selectedClass, selectedAcademicYear); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getIDCardListPDF(selectedClass, selectedAcademicYear); }, {}, `ID_Card_List_${selectedClass}_${getCurrentAcademicYear()}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>

          <ReportCard title="Student Certificate" description="Generate bonafide/study certificate">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1"><label className="block text-xs font-medium text-gray-700 mb-1">Student <span className="text-rose-500">*</span></label>
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Student</option>{students.map(s => (<option key={s._id} value={s._id}>{s.fullName} ({s.admissionNo})</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={certificateDate} onChange={(e) => setCertificateDate(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Place</label>
                <input type="text" value={certificatePlace} onChange={(e) => setCertificatePlace(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" placeholder="Kottukkara" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedStudent) throw new Error('Select student'); return await pdfService.getCertificatePDF(selectedStudent, { date: certificateDate, place: certificatePlace }); }, {}, 'Select student')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedStudent) throw new Error('Select student'); return await pdfService.getCertificatePDF(selectedStudent, { date: certificateDate, place: certificatePlace }); }, {}, `Certificate_${selectedStudent}.pdf`, 'Select student')}
                viewDisabled={!selectedStudent} downloadDisabled={!selectedStudent}
              />
            </div>
          </ReportCard>

          <ReportCard title="Abstract of Admission Register" description="Generate admission abstract for student">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Student <span className="text-rose-500">*</span></label>
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Student</option>{students.map(s => (<option key={s._id} value={s._id}>{s.fullName} ({s.admissionNo})</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Station</label>
                <input type="text" value={reportStation} onChange={(e) => setReportStation(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg" placeholder="KOTTUKKARA" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedStudent) throw new Error('Select student'); return await pdfService.getAbstractPDF(selectedStudent, { date: reportDate, station: reportStation }); }, {}, 'Select student')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedStudent) throw new Error('Select student'); return await pdfService.getAbstractPDF(selectedStudent, { date: reportDate, station: reportStation }); }, {}, `Abstract_${selectedStudent}.pdf`, 'Select student')}
                viewDisabled={!selectedStudent} downloadDisabled={!selectedStudent}
              />
            </div>
          </ReportCard>
        </div>
      )}

      {/* ==================== EXAM REPORTS ==================== */}
      {activeCategory === 'exam' && (
        <div className="space-y-4">
          <ReportCard title="Marklist" description="Generate student marklist for exams">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Student <span className="text-rose-500">*</span></label>
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Student</option>{students.map(s => (<option key={s._id} value={s._id}>{s.fullName} ({s.admissionNo})</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Exam</label>
                <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Latest Exam</option>{exams.map(e => (<option key={e._id} value={e._id}>{e.displayName || e.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedStudent) throw new Error('Select student'); return await pdfService.getMarklistPDF(selectedStudent, selectedExam); }, {}, 'Select student')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedStudent) throw new Error('Select student'); return await pdfService.getMarklistPDF(selectedStudent, selectedExam); }, {}, `Marklist_${selectedStudent}.pdf`, 'Select student')}
                viewDisabled={!selectedStudent} downloadDisabled={!selectedStudent}
              />
            </div>
          </ReportCard>

          <ReportCard title="Promotion List" description="Generate class promotion list">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">All Classes</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Exam</label>
                <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">All Exams</option>{exams.map(e => (<option key={e._id} value={e._id}>{e.displayName || e.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { return await pdfService.getPromotionListPDF(selectedClass, selectedExam); }, {}, '')}
                onDownload={() => handleDownloadPDF(async () => { return await pdfService.getPromotionListPDF(selectedClass, selectedExam); }, {}, `Promotion_List_${getCurrentAcademicYear()}.pdf`, '')}
                viewDisabled={false} downloadDisabled={false}
              />
            </div>
          </ReportCard>
        </div>
      )}

      {/* ==================== FINANCIAL REPORTS ==================== */}
      {activeCategory === 'financial' && (
        <div className="space-y-4">
          <ReportCard title="Fee Collection List" description="Generate class-wise fee collection list">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">All Classes</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { return await pdfService.getFeeCollectionPDF(selectedClass, selectedAcademicYear); }, {}, '')}
                onDownload={() => handleDownloadPDF(async () => { return await pdfService.getFeeCollectionPDF(selectedClass, selectedAcademicYear); }, {}, `Fee_Collection_${getCurrentAcademicYear()}.pdf`, '')}
                viewDisabled={false} downloadDisabled={false}
              />
            </div>
          </ReportCard>

          <ReportCard title="Bank Account Details" description="Generate student bank account details by category">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">All Classes</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="ALL">All Categories</option><option value="SC">SC</option><option value="ST">ST</option><option value="OBC">OBC</option><option value="GENERAL">General</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { return await pdfService.getBankAccountDetailsPDF(selectedClass, selectedCategory); }, {}, '')}
                onDownload={() => handleDownloadPDF(async () => { return await pdfService.getBankAccountDetailsPDF(selectedClass, selectedCategory); }, {}, `Bank_Details_${selectedCategory}_${getCurrentAcademicYear()}.pdf`, '')}
                viewDisabled={false} downloadDisabled={false}
              />
            </div>
          </ReportCard>
        </div>
      )}

      {/* ==================== STAFF REPORTS ==================== */}
      {activeCategory === 'staff' && (
        <div className="space-y-4">
          <ReportCard title="Staff List" description="Generate complete staff directory">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                <option value="">All Staff</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { return await pdfService.getStaffListPDF(selectedStatus || null); }, {}, '')}
                onDownload={() => handleDownloadPDF(async () => { return await pdfService.getStaffListPDF(selectedStatus || null); }, {}, `Staff_List_${getCurrentAcademicYear()}.pdf`, '')}
                viewDisabled={false} downloadDisabled={false}
              />
            </div>
          </ReportCard>

          <ReportCard title="Class Teacher List" description="Generate class teacher assignment list">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
              <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { return await pdfService.getClassTeacherListPDF(selectedAcademicYear); }, {}, '')}
                onDownload={() => handleDownloadPDF(async () => { return await pdfService.getClassTeacherListPDF(selectedAcademicYear); }, {}, `Class_Teacher_List_${getCurrentAcademicYear()}.pdf`, '')}
                viewDisabled={false} downloadDisabled={false}
              />
            </div>
          </ReportCard>
        </div>
      )}

      {/* ==================== ADMIN REPORTS ==================== */}
      {activeCategory === 'admin' && (
        <div className="space-y-4">
          <ReportCard title="Statistical Data Report" description="Generate class-wise statistical data">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class <span className="text-rose-500">*</span></label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select Class</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getStatisticalDataPDF(selectedClass, selectedAcademicYear); }, {}, 'Select class')}
                onDownload={() => handleDownloadPDF(async () => { if (!selectedClass) throw new Error('Select class'); return await pdfService.getStatisticalDataPDF(selectedClass, selectedAcademicYear); }, {}, `Statistical_Data_${selectedClass}_${getCurrentAcademicYear()}.pdf`, 'Select class')}
                viewDisabled={!selectedClass} downloadDisabled={!selectedClass}
              />
            </div>
          </ReportCard>

          <ReportCard title="Class PTA List" description="Generate class PTA member list">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">All Classes</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { return await pdfService.getClassPTAPDF(selectedClass, selectedAcademicYear); }, {}, '')}
                onDownload={() => handleDownloadPDF(async () => { return await pdfService.getClassPTAPDF(selectedClass, selectedAcademicYear); }, {}, `Class_PTA_${getCurrentAcademicYear()}.pdf`, '')}
                viewDisabled={false} downloadDisabled={false}
              />
            </div>
          </ReportCard>

          <ReportCard title="Textbook Distribution" description="Generate textbook distribution list">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option value="">All Classes</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.displayName || c.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  {academicYears.map(y => (<option key={y._id} value={y._id}>{y.name}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <ActionButtons
                onView={() => handleViewPDF(async () => { return await pdfService.getTextBookDistributionPDF(selectedClass, selectedAcademicYear); }, {}, '')}
                onDownload={() => handleDownloadPDF(async () => { return await pdfService.getTextBookDistributionPDF(selectedClass, selectedAcademicYear); }, {}, `Textbook_Distribution_${getCurrentAcademicYear()}.pdf`, '')}
                viewDisabled={false} downloadDisabled={false}
              />
            </div>
          </ReportCard>
        </div>
      )}
    </div>
  );
};

export default PdfReports;