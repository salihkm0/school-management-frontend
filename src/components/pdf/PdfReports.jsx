import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DocumentTextIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  CreditCardIcon,
  IdentificationIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  EyeIcon,
  CakeIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  UserIcon
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

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }));
    dispatch(fetchAcademicYears({ limit: 100 }));
    dispatch(fetchStudents({ limit: 100 }));
    dispatch(fetchStaff({ limit: 100 }));
    dispatch(fetchExams({ limit: 100 }));
    
    const currentYear = academicYears.find(y => y.isCurrent);
    if (currentYear) setSelectedAcademicYear(currentYear._id);
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

  const handleViewPDF = async (generator, params, errorMsg = 'Please fill all required fields') => {
    setIsLoading(true);
    try {
      const pdfBlob = await generator(params);
      const filename = `${activeCategory}_report_${Date.now()}.pdf`;
      openPDF(pdfBlob, filename);
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
    { id: 'noon-meal', name: 'Noon Meals & Food', icon: CakeIcon },
    { id: 'rice-distribution', name: 'Rice Distribution', icon: BuildingLibraryIcon },
    { id: 'student', name: 'Student Reports', icon: AcademicCapIcon },
    { id: 'exam', name: 'Exam Reports', icon: ClipboardDocumentListIcon },
    { id: 'financial', name: 'Financial Reports', icon: BanknotesIcon },
    { id: 'staff', name: 'Staff Reports', icon: UserIcon },
    { id: 'admin', name: 'Administrative', icon: ChartBarIcon },
  ];

  // ==================== NOON MEAL & FOOD REPORTS ====================
  const renderNoonMealReports = () => (
    <div className="space-y-6">
      {/* Noon Meal Register */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Noon Meal Register</h3>
            <p className="text-sm text-gray-500">Generate class-wise noon meal register</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getNoonMealPDF(selectedClass, selectedMonth, selectedYear, workingDays);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getNoonMealPDF(selectedClass, selectedMonth, selectedYear, workingDays);
                },
                {},
                `Noon_Meal_${selectedClass}_${selectedMonth}_${selectedYear}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Current Month</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
            <input
              type="number"
              value={workingDays}
              onChange={(e) => setWorkingDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Working days"
            />
          </div>
        </div>
      </div>

      {/* Noon Feeding Register */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Noon Feeding Register</h3>
            <p className="text-sm text-gray-500">Generate noon feeding register</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getNoonFeedingRegisterPDF(selectedClass, selectedMonth, selectedYear);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getNoonFeedingRegisterPDF(selectedClass, selectedMonth, selectedYear);
                },
                {},
                `Noon_Feeding_${selectedClass}_${selectedMonth}_${selectedYear}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Current Month</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Mid Day Meal */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mid Day Meal Register</h3>
            <p className="text-sm text-gray-500">Generate mid day meal register</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getMidDayMealPDF(selectedClass, selectedAcademicYear);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getMidDayMealPDF(selectedClass, selectedAcademicYear);
                },
                {},
                `Mid_Day_Meal_${selectedClass}_${getCurrentAcademicYear()}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bhakshya Badratha (Food Security) */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bhakshya Badratha (Food Security)</h3>
            <p className="text-sm text-gray-500">Generate food security allowance list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getBhakshyaBadrathaPDF(selectedClass, selectedAcademicYear);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getBhakshyaBadrathaPDF(selectedClass, selectedAcademicYear);
                },
                {},
                `Bhakshya_Badratha_${selectedClass}_${getCurrentAcademicYear()}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== RICE DISTRIBUTION REPORTS ====================
  const renderRiceDistributionReports = () => (
    <div className="space-y-6">
      {/* Rice Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Rice Distribution List</h3>
            <p className="text-sm text-gray-500">Generate class-wise rice distribution list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getRiceDistributionPDF(selectedClass, selectedAcademicYear, selectedDistributionType);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getRiceDistributionPDF(selectedClass, selectedAcademicYear, selectedDistributionType);
                },
                {},
                `Rice_Distribution_${selectedClass}_${getCurrentAcademicYear()}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Type</label>
            <select
              value={selectedDistributionType}
              onChange={(e) => setSelectedDistributionType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="monthly">Monthly</option>
              <option value="special">Special</option>
            </select>
          </div>
        </div>
      </div>

      {/* Balance Rice Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Balance Rice Distribution</h3>
            <p className="text-sm text-gray-500">Generate balance rice distribution report</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getBalanceRiceDistributionPDF(selectedClass, selectedMonth, selectedYear);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getBalanceRiceDistributionPDF(selectedClass, selectedMonth, selectedYear);
                },
                {},
                `Balance_Rice_${selectedClass}_${selectedMonth}_${selectedYear}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Current Month</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Special Rice Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Special Rice Distribution</h3>
            <p className="text-sm text-gray-500">Generate special rice distribution report</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getSpecialRiceDistributionPDF(selectedClass, selectedMonth, selectedYear);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getSpecialRiceDistributionPDF(selectedClass, selectedMonth, selectedYear);
                },
                {},
                `Special_Rice_${selectedClass}_${selectedMonth}_${selectedYear}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Current Month</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Student Reports (keep existing)
  const renderStudentReports = () => (
    // ... existing student reports code ...
    <div className="space-y-6">
      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Student List</h3>
            <p className="text-sm text-gray-500">Generate class-wise student list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getStudentListPDF(selectedClass, selectedAcademicYear);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getStudentListPDF(selectedClass, selectedAcademicYear);
                },
                {},
                `Student_List_${selectedClass}_${getCurrentAcademicYear()}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ID Card List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">ID Card List</h3>
            <p className="text-sm text-gray-500">Generate class-wise ID card list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getIDCardListPDF(selectedClass, selectedAcademicYear);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getIDCardListPDF(selectedClass, selectedAcademicYear);
                },
                {},
                `ID_Card_List_${selectedClass}_${getCurrentAcademicYear()}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Certificate */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Student Certificate</h3>
            <p className="text-sm text-gray-500">Generate bonafide/study certificate</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedStudent) throw new Error('Please select a student');
                  return await pdfService.getCertificatePDF(selectedStudent, { date: certificateDate, place: certificatePlace });
                },
                {},
                'Please select a student'
              )}
              disabled={!selectedStudent}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedStudent) throw new Error('Please select a student');
                  return await pdfService.getCertificatePDF(selectedStudent, { date: certificateDate, place: certificatePlace });
                },
                {},
                `Certificate_${selectedStudent}.pdf`,
                'Please select a student'
              )}
              disabled={!selectedStudent}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.fullName} ({s.admissionNo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={certificateDate}
              onChange={(e) => setCertificateDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
            <input
              type="text"
              value={certificatePlace}
              onChange={(e) => setCertificatePlace(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Kottukkara"
            />
          </div>
        </div>
      </div>

      {/* Abstract of Admission Register */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Abstract of Admission Register</h3>
            <p className="text-sm text-gray-500">Generate admission abstract for student</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedStudent) throw new Error('Please select a student');
                  return await pdfService.getAbstractPDF(selectedStudent, { date: reportDate, station: reportStation });
                },
                {},
                'Please select a student'
              )}
              disabled={!selectedStudent}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedStudent) throw new Error('Please select a student');
                  return await pdfService.getAbstractPDF(selectedStudent, { date: reportDate, station: reportStation });
                },
                {},
                `Abstract_${selectedStudent}.pdf`,
                'Please select a student'
              )}
              disabled={!selectedStudent}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.fullName} ({s.admissionNo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
            <input
              type="text"
              value={reportStation}
              onChange={(e) => setReportStation(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="KOTTUKKARA"
            />
          </div>
        </div>
      </div>

      {/* Marklist */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Marklist</h3>
            <p className="text-sm text-gray-500">Generate student marklist for exams</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedStudent) throw new Error('Please select a student');
                  return await pdfService.getMarklistPDF(selectedStudent, selectedExam);
                },
                {},
                'Please select a student'
              )}
              disabled={!selectedStudent}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedStudent) throw new Error('Please select a student');
                  return await pdfService.getMarklistPDF(selectedStudent, selectedExam);
                },
                {},
                `Marklist_${selectedStudent}.pdf`,
                'Please select a student'
              )}
              disabled={!selectedStudent}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.fullName} ({s.admissionNo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam (Optional)</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Latest Exam</option>
              {exams.map(e => (
                <option key={e._id} value={e._id}>{e.displayName || e.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Promotion List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Promotion List</h3>
            <p className="text-sm text-gray-500">Generate class promotion list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  return await pdfService.getPromotionListPDF(selectedClass, selectedExam);
                },
                {}
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  return await pdfService.getPromotionListPDF(selectedClass, selectedExam);
                },
                {},
                `Promotion_List_${getCurrentAcademicYear()}.pdf`
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam (Optional)</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Exams</option>
              {exams.map(e => (
                <option key={e._id} value={e._id}>{e.displayName || e.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Financial Reports (keep existing)
  const renderFinancialReports = () => (
    <div className="space-y-6">
      {/* Fee Collection */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Fee Collection List</h3>
            <p className="text-sm text-gray-500">Generate class-wise fee collection list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  return await pdfService.getFeeCollectionPDF(selectedClass, selectedAcademicYear);
                },
                {}
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  return await pdfService.getFeeCollectionPDF(selectedClass, selectedAcademicYear);
                },
                {},
                `Fee_Collection_${getCurrentAcademicYear()}.pdf`
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
            <p className="text-sm text-gray-500">Generate student bank account details by category</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  return await pdfService.getBankAccountDetailsPDF(selectedClass, selectedCategory);
                },
                {}
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  return await pdfService.getBankAccountDetailsPDF(selectedClass, selectedCategory);
                },
                {},
                `Bank_Details_${selectedCategory}_${getCurrentAcademicYear()}.pdf`
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="ALL">All Categories</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OBC">OBC</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Staff Reports (keep existing)
  const renderStaffReports = () => (
    <div className="space-y-6">
      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Staff List</h3>
            <p className="text-sm text-gray-500">Generate complete staff directory</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  return await pdfService.getStaffListPDF(selectedStatus || null);
                },
                {}
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  return await pdfService.getStaffListPDF(selectedStatus || null);
                },
                {},
                `Staff_List_${getCurrentAcademicYear()}.pdf`
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status (Optional)</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">All Staff</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Class Teacher List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Class Teacher List</h3>
            <p className="text-sm text-gray-500">Generate class teacher assignment list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  return await pdfService.getClassTeacherListPDF(selectedAcademicYear);
                },
                {}
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  return await pdfService.getClassTeacherListPDF(selectedAcademicYear);
                },
                {},
                `Class_Teacher_List_${getCurrentAcademicYear()}.pdf`
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {academicYears.map(y => (
              <option key={y._id} value={y._id}>{y.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // Admin Reports (keep existing)
  const renderAdminReports = () => (
    <div className="space-y-6">
      {/* Statistical Data */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Statistical Data Report</h3>
            <p className="text-sm text-gray-500">Generate class-wise statistical data</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getStatisticalDataPDF(selectedClass, selectedAcademicYear);
                },
                {},
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  if (!selectedClass) throw new Error('Please select a class');
                  return await pdfService.getStatisticalDataPDF(selectedClass, selectedAcademicYear);
                },
                {},
                `Statistical_Data_${selectedClass}_${getCurrentAcademicYear()}.pdf`,
                'Please select a class'
              )}
              disabled={!selectedClass}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Class PTA */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Class PTA List</h3>
            <p className="text-sm text-gray-500">Generate class PTA member list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  return await pdfService.getClassPTAPDF(selectedClass, selectedAcademicYear);
                },
                {}
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  return await pdfService.getClassPTAPDF(selectedClass, selectedAcademicYear);
                },
                {},
                `Class_PTA_${getCurrentAcademicYear()}.pdf`
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Textbook Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Textbook Distribution</h3>
            <p className="text-sm text-gray-500">Generate textbook distribution list</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewPDF(
                async () => {
                  return await pdfService.getTextBookDistributionPDF(selectedClass, selectedAcademicYear);
                },
                {}
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <EyeIcon className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => handleDownloadPDF(
                async () => {
                  return await pdfService.getTextBookDistributionPDF(selectedClass, selectedAcademicYear);
                },
                {},
                `Textbook_Distribution_${getCurrentAcademicYear()}.pdf`
              )}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            PDF Reports & Certificates
          </h1>
          <p className="text-gray-500 mt-1">Generate various reports, certificates, and official documents</p>
        </div>

        {/* Category Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <cat.icon className="w-5 h-5" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Report Content */}
        {activeCategory === 'noon-meal' && renderNoonMealReports()}
        {activeCategory === 'rice-distribution' && renderRiceDistributionReports()}
        {activeCategory === 'student' && renderStudentReports()}
        {activeCategory === 'exam' && renderStudentReports()} {/* Exam uses same as student for now */}
        {activeCategory === 'financial' && renderFinancialReports()}
        {activeCategory === 'staff' && renderStaffReports()}
        {activeCategory === 'admin' && renderAdminReports()}
      </div>
    </div>
  );
};

export default PdfReports;