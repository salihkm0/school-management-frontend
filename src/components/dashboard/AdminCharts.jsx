// src/components/dashboard/AdminCharts.jsx
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

const AdminCharts = () => {
  const { stats } = useSelector((state) => state.dashboard || { stats: {} })
  const [activeChart, setActiveChart] = useState('exam')

  // Enrollment Trend Data - For Bar Chart
  // const enrollmentData = {
  //   months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  //   students: [450, 460, 470, 480, 490, 495, 500, 510, 520, 530, 540, 550],
  //   staff: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56]
  // }

  // Exam Performance Data
  const examPerformanceData = [
    { subject: 'Mathematics', score: 85, target: 80, color: '#3b82f6' },
    { subject: 'Science', score: 82, target: 80, color: '#22c55e' },
    { subject: 'English', score: 88, target: 80, color: '#f97316' },
    { subject: 'Malayalam', score: 90, target: 80, color: '#a855f7' },
    { subject: 'Hindi', score: 78, target: 80, color: '#ec4899' },
    { subject: 'Social Science', score: 85, target: 80, color: '#06b6d4' },
  ]

  // Class Distribution - Horizontal Bar Chart
  const classDistribution = [
    { name: 'Class 10', students: 120, percentage: 22, color: '#3b82f6' },
    { name: 'Class 9', students: 115, percentage: 21, color: '#22c55e' },
    { name: 'Class 8', students: 110, percentage: 20, color: '#f97316' },
    { name: 'Class 7', students: 108, percentage: 19, color: '#a855f7' },
    { name: 'Class 6', students: 97, percentage: 18, color: '#ec4899' }
  ]

  // Grade Distribution
  const gradeDistribution = [
    { grade: 'A+', count: 145, percentage: 28, color: '#22c55e' },
    { grade: 'A', count: 120, percentage: 23, color: '#3b82f6' },
    { grade: 'B+', count: 95, percentage: 18, color: '#a855f7' },
    { grade: 'B', count: 80, percentage: 15, color: '#f97316' },
    { grade: 'C', count: 50, percentage: 10, color: '#eab308' },
    { grade: 'D', count: 30, percentage: 6, color: '#ef4444' },
  ]

  // const maxStudentValue = Math.max(...enrollmentData.students)
  // const maxStaffValue = Math.max(...enrollmentData.staff)
  // const maxBarValue = Math.max(maxStudentValue, maxStaffValue)
  const totalStudents = classDistribution.reduce((sum, c) => sum + c.students, 0)

  return (
    <div className="space-y-6">
      {/* Chart Tabs */}
      <div className="flex gap-2 border-b border-gray-200 flex-wrap">
        {/* <button
          onClick={() => setActiveChart('enrollment')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeChart === 'enrollment'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Enrollment Trend
        </button> */}
        <button
          onClick={() => setActiveChart('exam')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeChart === 'exam'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Exam Performance
        </button>
        <button
          onClick={() => setActiveChart('class')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeChart === 'class'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Class Distribution
        </button>
        <button
          onClick={() => setActiveChart('grade')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeChart === 'grade'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Grade Distribution
        </button>
      </div>

      {/* Enrollment Trend - BAR CHART */}
      {/* {activeChart === 'enrollment' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student & Staff Enrollment Trend</h3>
          
          <div className="flex justify-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Students</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Staff</span>
            </div>
          </div>

          <div className="relative h-96">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2">
              <span>{maxBarValue}</span>
              <span>{Math.floor(maxBarValue * 0.75)}</span>
              <span>{Math.floor(maxBarValue * 0.5)}</span>
              <span>{Math.floor(maxBarValue * 0.25)}</span>
              <span>0</span>
            </div>
            
            <div className="ml-12 h-full">
              <div className="relative h-full">
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-gray-100 w-full"></div>
                  ))}
                </div>
                
                <div className="relative h-full flex items-end">
                  <div className="flex-1 flex justify-around items-end h-full">
                    {enrollmentData.months.map((month, idx) => (
                      <div key={idx} className="flex flex-col items-center w-12">
                        <div className="relative mb-1">
                          <div 
                            className="w-6 bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600 cursor-pointer group"
                            style={{ height: `${(enrollmentData.students[idx] / maxBarValue) * 100}%`, minHeight: '4px' }}
                          >

                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                              Students: {enrollmentData.students[idx]}
                            </div>
                          </div>
                        </div>
    
                        <div 
                          className="w-6 bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600 cursor-pointer group"
                          style={{ height: `${(enrollmentData.staff[idx] / maxBarValue) * 100}%`, minHeight: '4px' }}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            Staff: {enrollmentData.staff[idx]}
                          </div>
                        </div>
             
                        <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                          {month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Students (Yearly)</p>
                <p className="text-lg font-bold text-blue-600">
                  {enrollmentData.students.reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Staff (Yearly)</p>
                <p className="text-lg font-bold text-green-600">
                  {enrollmentData.staff.reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Exam Performance - Bar Chart */}
      {activeChart === 'exam' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
          <div className="space-y-4">
            {examPerformanceData.map((subject, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">{subject.subject}</span>
                  <div className="flex gap-4">
                    <span className="text-gray-700">{subject.score}%</span>
                    <span className="text-gray-400 text-xs">Target: {subject.target}%</span>
                  </div>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${subject.score}%`, backgroundColor: subject.color }}
                  />
                </div>
                {subject.score < subject.target && (
                  <p className="text-xs text-orange-500 mt-1">⚠️ Need improvement</p>
                )}
                {subject.score >= subject.target && (
                  <p className="text-xs text-green-500 mt-1">✓ Target achieved</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overall Average</span>
              <span className="font-bold text-gray-900">
                {(examPerformanceData.reduce((sum, s) => sum + s.score, 0) / examPerformanceData.length).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Class Distribution - Horizontal Bar Chart */}
      {activeChart === 'class' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class-wise Student Distribution</h3>
          <div className="space-y-4">
            {classDistribution.map((cls, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">{cls.name}</span>
                  <div className="flex gap-4">
                    <span className="text-gray-700">{cls.students} students</span>
                    <span className="text-gray-400 text-xs">({cls.percentage}%)</span>
                  </div>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${cls.percentage}%`, backgroundColor: cls.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Students</span>
              <span className="font-bold text-gray-900">{totalStudents}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grade Distribution - Horizontal Bar Chart */}
      {activeChart === 'grade' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
          <div className="space-y-4">
            {gradeDistribution.map((grade, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Grade {grade.grade}</span>
                  <div className="flex gap-4">
                    <span className="text-gray-700">{grade.count} students</span>
                    <span className="text-gray-400 text-xs">({grade.percentage}%)</span>
                  </div>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${grade.percentage}%`, backgroundColor: grade.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Students Graded</p>
                <p className="text-lg font-bold text-gray-900">
                  {gradeDistribution.reduce((sum, g) => sum + g.count, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Average Grade</p>
                <p className="text-lg font-bold text-primary-600">B+</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCharts