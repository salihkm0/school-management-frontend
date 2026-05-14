// src/components/dashboard/AdminCharts.jsx
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

const AdminCharts = () => {
  const { stats } = useSelector((state) => state.dashboard || { stats: {} })
  const [activeChart, setActiveChart] = useState('exam')

  // Exam Performance Data
  const examPerformanceData = [
    { subject: 'Mathematics', score: 85, target: 80, color: '#3b82f6' },
    { subject: 'Science', score: 82, target: 80, color: '#22c55e' },
    { subject: 'English', score: 88, target: 80, color: '#f97316' },
    { subject: 'Malayalam', score: 90, target: 80, color: '#a855f7' },
    { subject: 'Hindi', score: 78, target: 80, color: '#ec4899' },
    { subject: 'Social Science', score: 85, target: 80, color: '#06b6d4' },
  ]

  // Class Distribution
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

  const totalStudents = classDistribution.reduce((sum, c) => sum + c.students, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Chart Tabs - Horizontal scroll on mobile */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 p-1 min-w-max">
          <button
            onClick={() => setActiveChart('exam')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              activeChart === 'exam'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Exam Performance
          </button>
          <button
            onClick={() => setActiveChart('class')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              activeChart === 'class'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Class Distribution
          </button>
          <button
            onClick={() => setActiveChart('grade')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              activeChart === 'grade'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Grade Distribution
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Exam Performance - Bar Chart */}
        {activeChart === 'exam' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Subject-wise Performance</h3>
            <div className="space-y-3">
              {examPerformanceData.map((subject, idx) => (
                <div key={idx}>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs mb-1 gap-1">
                    <span className="text-gray-600 font-medium">{subject.subject}</span>
                    <div className="flex gap-3">
                      <span className="text-gray-700">{subject.score}%</span>
                      <span className="text-gray-400">Target: {subject.target}%</span>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                      style={{ width: `${subject.score}%`, backgroundColor: subject.color }}
                    />
                  </div>
                  {subject.score < subject.target && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ Need improvement</p>
                  )}
                  {subject.score >= subject.target && (
                    <p className="text-xs text-emerald-600 mt-1">✓ Target achieved</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall Average</span>
                <span className="font-semibold text-gray-900">
                  {(examPerformanceData.reduce((sum, s) => sum + s.score, 0) / examPerformanceData.length).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Class Distribution - Horizontal Bar Chart */}
        {activeChart === 'class' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Class-wise Student Distribution</h3>
            <div className="space-y-3">
              {classDistribution.map((cls, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{cls.name}</span>
                    <div className="flex gap-3">
                      <span className="text-gray-700">{cls.students} students</span>
                      <span className="text-gray-400">({cls.percentage}%)</span>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
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
                <span className="font-semibold text-gray-900">{totalStudents}</span>
              </div>
            </div>
          </div>
        )}

        {/* Grade Distribution - Horizontal Bar Chart */}
        {activeChart === 'grade' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Grade Distribution</h3>
            <div className="space-y-3">
              {gradeDistribution.map((grade, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">Grade {grade.grade}</span>
                    <div className="flex gap-3">
                      <span className="text-gray-700">{grade.count} students</span>
                      <span className="text-gray-400">({grade.percentage}%)</span>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                      style={{ width: `${grade.percentage}%`, backgroundColor: grade.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Total Students Graded</p>
                  <p className="text-base font-bold text-gray-900">
                    {gradeDistribution.reduce((sum, g) => sum + g.count, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Average Grade</p>
                  <p className="text-base font-bold text-emerald-600">B+</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCharts