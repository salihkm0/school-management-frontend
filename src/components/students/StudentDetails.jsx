import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  PencilIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  IdentificationIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import {
  fetchStudentById,
  clearCurrentStudent,
} from "../../store/slices/studentSlice";
import { fetchAcademicYears } from "../../store/slices/academicYearSlice";
import studentService from "../../services/studentService";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  formatDate,
  calculateAge,
  getInitials,
  getRandomColor,
} from "../../utils/helpers";

const getGradeColor = (grade) => {
  const colors = {
    "A+": "bg-green-100 text-green-800",
    A: "bg-emerald-100 text-emerald-800",
    "B+": "bg-blue-100 text-blue-800",
    B: "bg-cyan-100 text-cyan-800",
    "C+": "bg-yellow-100 text-yellow-800",
    C: "bg-orange-100 text-orange-800",
    D: "bg-red-100 text-red-800",
    F: "bg-gray-100 text-gray-800",
  };
  return colors[grade] || "bg-gray-100 text-gray-800";
};

const StudentDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentStudent, isLoading } = useSelector((state) => state.students);
  const { academicYears } = useSelector((state) => state.academicYears);

  // Separate state for each tab
  const [marksData, setMarksData] = useState(null);
  const [academicInfo, setAcademicInfo] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [loadingAcademic, setLoadingAcademic] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");

  useEffect(() => {
    dispatch(fetchStudentById(id));
    dispatch(fetchAcademicYears({ limit: 100 }));
    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [dispatch, id]);

  // Set default academic year when student loads
  useEffect(() => {
    if (currentStudent?.academicYearId?._id) {
      setSelectedAcademicYearId(currentStudent.academicYearId._id);
    } else if (currentStudent?.academicYearId) {
      setSelectedAcademicYearId(currentStudent.academicYearId);
    } else if (academicYears.length > 0) {
      const currentYear = academicYears.find(y => y.isCurrent);
      if (currentYear) {
        setSelectedAcademicYearId(currentYear._id);
      }
    }
  }, [currentStudent, academicYears]);

  // Load marks when Marks tab is opened
  useEffect(() => {
    if (activeTab === "marks" && !marksData) {
      loadMarks();
    }
  }, [activeTab]);

  // Load academic info when Academic tab is opened
  useEffect(() => {
    if (activeTab === "academic" && !academicInfo) {
      loadAcademicInfo();
    }
  }, [activeTab]);

  // Load attendance when Attendance tab is opened or academic year changes
  useEffect(() => {
    if (activeTab === "attendance" && selectedAcademicYearId) {
      loadAttendance();
    }
  }, [activeTab, selectedAcademicYearId]);

  const loadMarks = async () => {
    setLoadingMarks(true);
    try {
      const data = await studentService.getStudentMarks(id);
      setMarksData(data);
    } catch (error) {
      console.error("Failed to load marks:", error);
    } finally {
      setLoadingMarks(false);
    }
  };

  const loadAcademicInfo = async () => {
    setLoadingAcademic(true);
    try {
      const data = await studentService.getStudentAcademicInfo(id);
      setAcademicInfo(data?.data || data);
    } catch (error) {
      console.error("Failed to load academic info:", error);
    } finally {
      setLoadingAcademic(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedAcademicYearId) return;
    setLoadingAttendance(true);
    try {
      const data = await studentService.getStudentAttendance(id, selectedAcademicYearId);
      setAttendanceData(data);
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const refreshAttendance = async () => {
    setAttendanceData(null);
    await loadAttendance();
  };

  if (isLoading || !currentStudent) {
    return <LoadingSpinner />;
  }

  const InfoSection = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Icon className="w-5 h-5 text-primary-500" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || "-"}</span>
    </div>
  );

  // Get exam-wise marks from analytics
  const examWiseMarks = marksData?.analytics?.examWise || {};
  const overallStats = marksData?.summary || {
    overallPercentage: 0,
    totalExams: 0,
    totalSubjects: 0,
  };

  // Get academic year name
  const getAcademicYearName = (id) => {
    const year = academicYears.find(y => y._id === id);
    return year?.name || year?.year || "Select Academic Year";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/students")}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentStudent.fullName}
            </h1>
            <p className="text-gray-500">
              Student ID: {currentStudent.studentCode}
            </p>
          </div>
        </div>
        <Link
          to={`/students/${id}/edit`}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <PencilIcon className="w-5 h-5" />
          <span>Edit Student</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {["info", "academic", "marks", "attendance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Info Tab */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InfoSection icon={UserCircleIcon} title="Profile">
            <div className="flex items-center space-x-4 mb-4">
              <div
                className={`w-20 h-20 ${getRandomColor(currentStudent.fullName)} rounded-full flex items-center justify-center text-white text-2xl font-bold`}
              >
                {getInitials(currentStudent.fullName)}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {currentStudent.fullName}
                </p>
                <p className="text-sm text-gray-500">Student</p>
                <p className="text-xs text-gray-400">
                  Added: {formatDate(currentStudent.createdAt)}
                </p>
              </div>
            </div>
            <InfoRow
              label="Gender"
              value={
                currentStudent.gender === "M"
                  ? "Male"
                  : currentStudent.gender === "F"
                    ? "Female"
                    : "Other"
              }
            />
            <InfoRow
              label="Date of Birth"
              value={formatDate(currentStudent.dateOfBirth)}
            />
            <InfoRow
              label="Age"
              value={calculateAge(currentStudent.dateOfBirth)}
            />
            <InfoRow
              label="Blood Group"
              value={currentStudent.bloodGroup || "-"}
            />
            <InfoRow label="Religion" value={currentStudent.religion || "-"} />
            <InfoRow label="Caste" value={currentStudent.casteName || "-"} />
            <InfoRow label="Category" value={currentStudent.category || "-"} />
          </InfoSection>

          <InfoSection icon={PhoneIcon} title="Contact Information">
            <InfoRow label="Phone Number" value={currentStudent.phoneNumber} />
            <InfoRow
              label="Father's Name"
              value={currentStudent.fatherFullName}
            />
            <InfoRow
              label="Mother's Name"
              value={currentStudent.motherFullName}
            />
            <InfoRow label="Guardian" value={currentStudent.guardian} />
            <InfoRow
              label="Relation"
              value={currentStudent.relationOfGuardian}
            />
            <InfoRow
              label="Guardian Occupation"
              value={currentStudent.occupationOfGuardian}
            />
          </InfoSection>

          <InfoSection icon={MapPinIcon} title="Address">
            <InfoRow label="House Name" value={currentStudent.houseName} />
            <InfoRow label="Street" value={currentStudent.streetName} />
            <InfoRow label="Post Office" value={currentStudent.postOffice} />
            <InfoRow label="Pincode" value={currentStudent.pincode} />
          </InfoSection>
        </div>
      )}

      {/* Academic Tab */}
      {activeTab === "academic" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoSection icon={AcademicCapIcon} title="Academic Information">
            <InfoRow
              label="Admission Number"
              value={currentStudent.admissionNo}
            />
            <InfoRow
              label="Admission Date"
              value={formatDate(currentStudent.admissionDate)}
            />
            <InfoRow
              label="Class"
              value={`${currentStudent.className} ${currentStudent.division || ""}`.trim()}
            />
            <InfoRow label="Roll Number" value={currentStudent.rollNumber} />
            <InfoRow
              label="Academic Year"
              value={currentStudent.academicYearId?.name || currentStudent.academicYearId?.year || "-"}
            />
            <InfoRow
              label="Status"
              value={
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    currentStudent.status === "active"
                      ? "bg-green-100 text-green-800"
                      : currentStudent.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {currentStudent.status}
                </span>
              }
            />
          </InfoSection>

          <InfoSection icon={IdentificationIcon} title="Language Subjects">
            {loadingAcademic ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <>
                <InfoRow
                  label="First Language Paper 1"
                  value={academicInfo?.firstLanguagePaper1?.name || "-"}
                />
                <InfoRow
                  label="First Language Paper 2"
                  value={academicInfo?.firstLanguagePaper2?.name || "-"}
                />
                <InfoRow
                  label="Third Language"
                  value={academicInfo?.thirdLanguage?.name || "-"}
                />
                <InfoRow
                  label="Additional Language"
                  value={academicInfo?.additionalLanguage?.name || "-"}
                />
              </>
            )}
          </InfoSection>
        </div>
      )}

      {/* Marks Tab */}
      {activeTab === "marks" && (
        <div className="space-y-6">
          {loadingMarks ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : marksData ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
                  <div className="flex justify-between items-center">
                    <ChartBarIcon className="w-10 h-10 opacity-50" />
                    <span className="text-3xl font-bold">
                      {overallStats.overallPercentage || 0}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm">Overall Average</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <div className="flex justify-between items-center">
                    <AcademicCapIcon className="w-10 h-10 opacity-50" />
                    <span className="text-3xl font-bold">
                      {overallStats.totalExams || 0}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">Total Exams</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                  <div className="flex justify-between items-center">
                    <IdentificationIcon className="w-10 h-10 opacity-50" />
                    <span className="text-3xl font-bold">
                      {overallStats.totalSubjects || 0}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">Subjects Attempted</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {overallStats.totalMarksObtained || 0}
                    </span>
                    <span className="text-sm">
                      /{overallStats.totalMaxMarks || 0}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">Total Marks</p>
                </div>
              </div>

              {/* Exam-wise Marks */}
              {Object.keys(examWiseMarks).length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Exam Performance
                  </h2>
                  {Object.values(examWiseMarks).map((exam, idx) => {
                    const examPercentage =
                      exam.totalMaxMarks > 0
                        ? (
                            (exam.totalMarks / exam.totalMaxMarks) *
                            100
                          ).toFixed(1)
                        : 0;
                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {exam.examName}
                              </h3>
                              <div className="flex gap-3 mt-1">
                                <span className="text-xs text-gray-500 capitalize">
                                  {exam.examType}
                                </span>
                                <span className="text-xs text-gray-500 capitalize">
                                  {exam.term} Term
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary-600">
                                {examPercentage}%
                              </p>
                              <p className="text-xs text-gray-500">
                                {exam.totalMarks}/{exam.totalMaxMarks} marks
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Subject
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  Theory
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  Practical
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  Total
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  Max
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  %
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  Grade
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {exam.subjects.map((subject, subIdx) => (
                                <tr key={subIdx} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {subject.subjectName}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                                    {subject.theoryScore || 0}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                                    {subject.practicalScore || 0}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900">
                                    {subject.totalScore}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                                    {subject.maxMarks}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-center text-gray-600">
                                    {subject.percentage?.toFixed(1)}%
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${getGradeColor(subject.grade)}`}
                                    >
                                      {subject.grade}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No marks available for this student
                  </p>
                </div>
              )}

              {/* Subject-wise Performance Summary */}
              {marksData.analytics?.subjectWise &&
                Object.keys(marksData.analytics.subjectWise).length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Subject-wise Performance Summary
                    </h2>
                    <div className="space-y-4">
                      {Object.entries(marksData.analytics.subjectWise).map(
                        ([subject, data]) => (
                          <div key={subject}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">
                                {subject}
                              </span>
                              <span className="text-gray-500">
                                {data.averagePercentage?.toFixed(1)}% Avg (
                                {data.count} exams)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-500 rounded-full h-2"
                                style={{
                                  width: `${data.averagePercentage || 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No marks data available</p>
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {loadingAttendance ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : attendanceData && attendanceData.length > 0 ? (
            <>
              {/* Academic Year Filter */}
              <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedAcademicYearId}
                    onChange={(e) => {
                      setSelectedAcademicYearId(e.target.value);
                      setAttendanceData(null);
                    }}
                    className="px-3 py-1 border rounded-lg text-sm"
                  >
                    {academicYears.map((year) => (
                      <option key={year._id} value={year._id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={refreshAttendance}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  Refresh
                </button>
              </div>

              {/* Attendance Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Month
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Working Days
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Present
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Absent
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          %
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceData.map((record) => {
                        const percentage = record.percentage || 0;
                        let status = "";
                        let statusColor = "";
                        let statusIcon = null;

                        if (percentage >= 75) {
                          status = "Good";
                          statusColor = "bg-green-100 text-green-800";
                          statusIcon = <CheckCircleIcon className="w-4 h-4" />;
                        } else if (percentage >= 60) {
                          status = "Average";
                          statusColor = "bg-yellow-100 text-yellow-800";
                          statusIcon = null;
                        } else if (percentage > 0) {
                          status = "Poor";
                          statusColor = "bg-red-100 text-red-800";
                          statusIcon = <XCircleIcon className="w-4 h-4" />;
                        } else {
                          status = "Not Recorded";
                          statusColor = "bg-gray-100 text-gray-800";
                          statusIcon = null;
                        }

                        const monthNames = [
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ];

                        return (
                          <tr key={record._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {monthNames[record.month - 1]} {record.year}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-gray-600">
                              {record.totalWorkingDays || 25}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">
                              {record.presentDays || 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-red-600">
                              {record.absentDays || 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-center font-semibold">
                              {percentage.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusColor}`}
                              >
                                {statusIcon}
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Working Days</p>
                    <p className="text-xl font-bold text-gray-900">
                      {attendanceData.reduce((sum, r) => sum + (r.totalWorkingDays || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Present Days</p>
                    <p className="text-xl font-bold text-green-600">
                      {attendanceData.reduce((sum, r) => sum + (r.presentDays || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Overall Attendance</p>
                    <p className="text-xl font-bold text-primary-600">
                      {attendanceData.length > 0
                        ? (
                            (attendanceData.reduce((sum, r) => sum + (r.presentDays || 0), 0) /
                            attendanceData.reduce((sum, r) => sum + (r.totalWorkingDays || 0), 0)) *
                            100
                          ).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No attendance records found for this academic year
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDetails;