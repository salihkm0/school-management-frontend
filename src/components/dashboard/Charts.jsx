import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  fetchAttendanceAnalytics,
  fetchPerformanceAnalytics,
  fetchGradeAnalysis,
} from "../../services/analyticsService";
import { fetchExams } from "../../store/slices/examSlice";
import { useDispatch } from "react-redux";

const COLORS = [
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

const Charts = () => {
  const dispatch = useDispatch();
  const [attendanceData, setAttendanceData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [subjectWiseData, setSubjectWiseData] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) loadGradeAnalysis();
  }, [selectedExam]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [attendance, performance] = await Promise.all([
        fetchAttendanceAnalytics(),
        fetchPerformanceAnalytics(),
      ]);
      
      // Attendance data
      const monthlyData = attendance.monthlyAttendance || [];
      setAttendanceData(monthlyData);

      // Performance data - subject wise
      const subjects = performance.subjectPerformance || {};
      const subjectChartData = Object.entries(subjects)
        .map(([subject, data]) => ({
          subject: subject.length > 15 ? subject.substring(0, 12) + "..." : subject,
          average: data.averagePercentage || 0,
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 8);
      setSubjectWiseData(subjectChartData);

      // Exam wise performance data
      const examWise = performance.examWisePerformance || [];
      const examChartData = examWise.slice(0, 6).map(exam => ({
        name: exam.examName?.length > 20 ? exam.examName.substring(0, 17) + "..." : exam.examName,
        percentage: exam.averagePercentage || 0,
      }));
      setPerformanceData(examChartData);
      
    } catch (error) {
      console.error("Failed to load chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExams = async () => {
    const res = await dispatch(fetchExams({ limit: 20 }));
    const examList = res.payload?.data || [];
    setExams(examList);
    if (examList.length > 0) setSelectedExam(examList[0]._id);
  };

  const loadGradeAnalysis = async () => {
    try {
      const analysis = await fetchGradeAnalysis(selectedExam);
      const grades = analysis.gradeDistribution || {};
      const gradeData = Object.entries(grades).map(([name, value]) => ({
        name,
        value,
      }));
      setGradeDistribution(gradeData);
    } catch (error) {
      console.error("Failed to load grade analysis:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Analytics Dashboard
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                activeTab === "attendance"
                  ? "bg-primary-500 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Attendance Trend
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                activeTab === "performance"
                  ? "bg-primary-500 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Exam Performance
            </button>
            <button
              onClick={() => setActiveTab("subjects")}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                activeTab === "subjects"
                  ? "bg-primary-500 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Subject-wise
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                activeTab === "grades"
                  ? "bg-primary-500 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Grade Distribution
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "grades" && exams.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.displayName || exam.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="h-80">
          {activeTab === "attendance" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  name="Attendance %"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === "performance" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar
                  dataKey="percentage"
                  name="Average Score %"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === "subjects" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectWiseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="subject" width={100} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar
                  dataKey="average"
                  name="Average Score %"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === "grades" && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {activeTab === "performance" && performanceData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No performance data available
          </div>
        )}
        {activeTab === "subjects" && subjectWiseData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No subject-wise data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;